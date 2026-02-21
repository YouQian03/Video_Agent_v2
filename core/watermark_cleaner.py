# core/watermark_cleaner.py
"""
Cleaning Pass: Remove watermarks/logos from extracted frames BEFORE downstream consumers use them.

3-Tier Cleaning Decision:
  COPY       - hasWatermark == false → copy frame as-is
  SMART CROP - hasWatermark == true AND watermark in edge zone (≤5% border) → ffmpeg crop + upscale
  INPAINT    - hasWatermark == true AND watermark in interior / occludes subject → Gemini image editing
"""
import os
import io
import shutil
import subprocess
from pathlib import Path
from typing import Dict, List

from core.utils import get_ffmpeg_path


# ---------------------------------------------------------------------------
# Classification
# ---------------------------------------------------------------------------

_EDGE_KEYWORDS = {
    "top-right", "top-left", "bottom-right", "bottom-left",
    "top corner", "bottom corner", "top bar", "bottom bar",
    "top right", "top left", "bottom right", "bottom left",
    "upper-right", "upper-left", "lower-right", "lower-left",
    "upper right", "upper left", "lower right", "lower left",
}

_INTERIOR_KEYWORDS = {"center", "middle", "central"}


def _classify_watermark(watermark_info: dict) -> str:
    """Return 'none', 'edge', or 'interior'."""
    if not watermark_info:
        return "none"
    if not watermark_info.get("hasWatermark", False):
        return "none"

    # Occludes subject → always inpaint
    if watermark_info.get("occludesSubject", False):
        return "interior"

    desc = (watermark_info.get("description") or "").lower()

    # Check for interior keywords first
    for kw in _INTERIOR_KEYWORDS:
        if kw in desc:
            return "interior"

    # Check for edge keywords
    for kw in _EDGE_KEYWORDS:
        if kw in desc:
            return "edge"

    # No clear position keyword → default to inpaint (safer)
    if desc:
        return "interior"

    return "none"


# ---------------------------------------------------------------------------
# Smart Crop (ffmpeg)
# ---------------------------------------------------------------------------

def _parse_crop_direction(description: str) -> tuple:
    """
    Parse watermark position to determine directional crop offsets.

    Returns (crop_x_frac, crop_y_frac, crop_w_frac, crop_h_frac) as fractions.
    Default: center crop keeping 90% of both dimensions.
    """
    desc = description.lower()

    # Default: symmetric 5% crop on each side
    x_start = 0.05  # left offset fraction
    y_start = 0.05  # top offset fraction
    w_frac = 0.90   # width fraction
    h_frac = 0.90   # height fraction

    # Directional adjustments: crop more aggressively toward the watermark
    if "top" in desc and "left" in desc:
        x_start, y_start, w_frac, h_frac = 0.08, 0.08, 0.90, 0.90
    elif "top" in desc and "right" in desc:
        x_start, y_start, w_frac, h_frac = 0.02, 0.08, 0.90, 0.90
    elif "bottom" in desc and "left" in desc:
        x_start, y_start, w_frac, h_frac = 0.08, 0.02, 0.90, 0.90
    elif "bottom" in desc and "right" in desc:
        x_start, y_start, w_frac, h_frac = 0.02, 0.02, 0.90, 0.90
    elif "top" in desc:
        x_start, y_start, w_frac, h_frac = 0.05, 0.10, 0.90, 0.90
    elif "bottom" in desc:
        x_start, y_start, w_frac, h_frac = 0.05, 0.00, 0.90, 0.90
    elif "left" in desc:
        x_start, y_start, w_frac, h_frac = 0.10, 0.05, 0.90, 0.90
    elif "right" in desc:
        x_start, y_start, w_frac, h_frac = 0.00, 0.05, 0.90, 0.90

    return x_start, y_start, w_frac, h_frac


def _smart_crop(src: Path, dst: Path, description: str) -> bool:
    """
    Crop out edge watermark using ffmpeg and upscale back to original resolution.

    Returns True on success, False on failure.
    """
    try:
        ffmpeg_path = get_ffmpeg_path()

        # Probe original dimensions
        probe_cmd = [
            ffmpeg_path, "-i", str(src),
            "-v", "error",
            "-select_streams", "v:0",
            "-show_entries", "stream=width,height",
            "-of", "csv=p=0"
        ]
        # Use ffprobe if available, else parse ffmpeg stderr
        ffprobe_path = ffmpeg_path.replace("ffmpeg", "ffprobe") if "ffmpeg" in ffmpeg_path else "ffprobe"
        probe_result = subprocess.run(
            [ffprobe_path, "-v", "error", "-select_streams", "v:0",
             "-show_entries", "stream=width,height", "-of", "csv=p=0",
             str(src)],
            capture_output=True, text=True
        )
        if probe_result.returncode != 0:
            # Fallback: assume 1920x1080
            orig_w, orig_h = 1920, 1080
        else:
            parts = probe_result.stdout.strip().split(",")
            orig_w, orig_h = int(parts[0]), int(parts[1])

        x_frac, y_frac, w_frac, h_frac = _parse_crop_direction(description)

        crop_w = int(orig_w * w_frac)
        crop_h = int(orig_h * h_frac)
        crop_x = int(orig_w * x_frac)
        crop_y = int(orig_h * y_frac)

        # Ensure even dimensions (required by many codecs)
        crop_w = crop_w - (crop_w % 2)
        crop_h = crop_h - (crop_h % 2)
        orig_w_even = orig_w - (orig_w % 2)
        orig_h_even = orig_h - (orig_h % 2)

        vf = f"crop={crop_w}:{crop_h}:{crop_x}:{crop_y},scale={orig_w_even}:{orig_h_even}"

        cmd = [
            ffmpeg_path, "-y",
            "-i", str(src),
            "-vf", vf,
            "-frames:v", "1",
            "-q:v", "2",
            str(dst)
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"   ⚠️ [Smart Crop] ffmpeg error: {result.stderr[:200]}")
            return False

        return dst.exists() and dst.stat().st_size > 0

    except Exception as e:
        print(f"   ⚠️ [Smart Crop] Exception: {e}")
        return False


# ---------------------------------------------------------------------------
# Gemini Inpaint
# ---------------------------------------------------------------------------

def _gemini_inpaint(src: Path, dst: Path, description: str) -> bool:
    """
    Use Gemini image editing to remove watermark from frame.

    Returns True on success, False on failure.
    """
    try:
        from google import genai
        from google.genai import types

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("   ⚠️ [Inpaint] GEMINI_API_KEY not set")
            return False

        # Sanitize API key
        api_key = api_key.strip()
        api_key = ''.join(c for c in api_key if c.isascii() and c.isprintable())

        client = genai.Client(api_key=api_key)

        frame_bytes = src.read_bytes()

        contents = [
            types.Part.from_bytes(data=frame_bytes, mime_type="image/png"),
            (
                f"Remove the watermark/logo described as: {description}. "
                f"Keep the rest of the image exactly the same. "
                f"Fill the watermark area with natural content that matches the surrounding scene. "
                f"Do NOT add any new text, logos, or overlays."
            )
        ]

        config = types.GenerateContentConfig(
            response_modalities=['IMAGE'],
        )

        response = client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=contents,
            config=config
        )

        # Extract image from response
        for part in response.candidates[0].content.parts:
            if hasattr(part, 'inline_data') and part.inline_data is not None:
                image_data = part.inline_data.data
                with open(dst, 'wb') as f:
                    f.write(image_data)
                if dst.exists() and dst.stat().st_size > 0:
                    return True

        print("   ⚠️ [Inpaint] No image in Gemini response")
        return False

    except Exception as e:
        print(f"   ⚠️ [Inpaint] Gemini error: {e}")
        return False


# ---------------------------------------------------------------------------
# Main Entry Point
# ---------------------------------------------------------------------------

def clean_frames(job_dir: Path, shots: list) -> dict:
    """
    Main entry point. Called after frame re-extraction.

    For each shot, reads watermarkInfo from Film IR concrete shots and applies
    the appropriate cleaning tier (copy / smart crop / inpaint).

    After cleaning, swaps directories:
      frames/ → frames_original/   (preserve originals)
      cleaned_frames/ → frames/    (downstream consumers get clean frames)

    Args:
        job_dir: Job directory (contains frames/)
        shots: List of concrete shot dicts from Film IR with watermarkInfo

    Returns:
        {"cleaned": N, "copied": N, "cropped": N, "inpainted": N, "failed": N}
    """
    frames_dir = job_dir / "frames"
    cleaned_dir = job_dir / "cleaned_frames"
    originals_dir = job_dir / "frames_original"

    if not frames_dir.exists():
        print("⚠️ [Cleaning Pass] frames/ directory not found, skipping")
        return {"cleaned": 0, "copied": 0, "cropped": 0, "inpainted": 0, "failed": 0}

    # Create cleaned_frames directory
    cleaned_dir.mkdir(parents=True, exist_ok=True)

    stats = {"cleaned": 0, "copied": 0, "cropped": 0, "inpainted": 0, "failed": 0}

    for shot in shots:
        shot_id = shot.get("shotId", "")
        frame_src = frames_dir / f"{shot_id}.png"

        if not frame_src.exists():
            print(f"   ⚠️ [Cleaning Pass] Frame not found: {frame_src.name}")
            continue

        frame_dst = cleaned_dir / f"{shot_id}.png"
        watermark_info = shot.get("watermarkInfo", {})
        tier = _classify_watermark(watermark_info)
        description = watermark_info.get("description", "") if watermark_info else ""

        if tier == "none":
            # Tier 1: COPY — no watermark
            shutil.copy2(str(frame_src), str(frame_dst))
            stats["copied"] += 1
            print(f"   ✅ [COPY] {shot_id}: no watermark detected")

        elif tier == "edge":
            # Tier 2: SMART CROP — edge watermark
            success = _smart_crop(frame_src, frame_dst, description)
            if success:
                stats["cropped"] += 1
                print(f"   ✅ [CROP] {shot_id}: edge watermark cropped ({description[:50]})")
            else:
                # Fallback: copy original
                shutil.copy2(str(frame_src), str(frame_dst))
                stats["failed"] += 1
                print(f"   ⚠️ [CROP→COPY] {shot_id}: crop failed, using original")

        elif tier == "interior":
            # Tier 3: INPAINT — interior/occluding watermark
            success = _gemini_inpaint(frame_src, frame_dst, description)
            if success:
                stats["inpainted"] += 1
                print(f"   ✅ [INPAINT] {shot_id}: watermark inpainted ({description[:50]})")
            else:
                # Fallback: try smart crop
                crop_success = _smart_crop(frame_src, frame_dst, description)
                if crop_success:
                    stats["cropped"] += 1
                    print(f"   ⚠️ [INPAINT→CROP] {shot_id}: inpaint failed, used smart crop")
                else:
                    # Final fallback: copy original
                    shutil.copy2(str(frame_src), str(frame_dst))
                    stats["failed"] += 1
                    print(f"   ⚠️ [INPAINT→COPY] {shot_id}: all methods failed, using original")

        stats["cleaned"] += 1

    # --- Directory Swap ---
    # Only swap if we actually cleaned something
    if stats["cleaned"] > 0:
        # Remove previous originals backup if it exists (from a previous run)
        if originals_dir.exists():
            shutil.rmtree(originals_dir)

        # frames/ → frames_original/
        frames_dir.rename(originals_dir)
        # cleaned_frames/ → frames/
        cleaned_dir.rename(frames_dir)

        print(f"🔄 [Cleaning Pass] Directory swap complete: frames_original/ (backup) ↔ frames/ (cleaned)")
    else:
        # Nothing to clean, remove the empty cleaned_frames dir
        if cleaned_dir.exists():
            shutil.rmtree(cleaned_dir)
        print(f"ℹ️ [Cleaning Pass] No frames to clean, skipping directory swap")

    return stats
