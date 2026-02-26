# core/watermark_cleaner.py
"""
Cleaning Pass: Remove watermarks/logos from extracted frames BEFORE downstream consumers use them.

2-Tier Cleaning Decision:
  COPY       - hasWatermark == false OR non-narrative shot → copy frame as-is
  SMART CROP - hasWatermark == true AND watermark in edge zone → ffmpeg crop + upscale

Non-narrative shots (BRAND_SPLASH / ENDCARD) are always COPY'd — the user will
replace them entirely via the graphic-scene UI.
"""
import os
import shutil
import subprocess
from pathlib import Path
from typing import Dict, List, Optional

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

    # Occludes subject → interior (will fall back to crop → copy)
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

    # No clear position keyword → default to interior (will try crop → copy)
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
# Main Entry Point
# ---------------------------------------------------------------------------

def clean_frames(job_dir: Path, shots: list) -> dict:
    """
    Main entry point. Called after frame re-extraction.

    For each shot, reads watermarkInfo from Film IR concrete shots and applies
    the appropriate cleaning tier (copy / smart crop).

    Cleaning is done in-place to avoid race conditions with the static file
    server (directory swap can cause brief 404s that the browser caches):
      1. Backup originals to frames_original/
      2. Clean (crop) directly into frames/, overwriting originals

    Args:
        job_dir: Job directory (contains frames/)
        shots: List of concrete shot dicts from Film IR with watermarkInfo

    Returns:
        {"cleaned": N, "copied": N, "cropped": N, "failed": N, "skipped": N, "shot_statuses": {...}}
    """
    frames_dir = job_dir / "frames"
    originals_dir = job_dir / "frames_original"

    total = len(shots)
    print(f"🧹 [Cleaner] Starting: {total} shots to process")

    if not frames_dir.exists():
        print("⚠️ [Cleaning Pass] frames/ directory not found, skipping")
        return {"cleaned": 0, "copied": 0, "cropped": 0, "failed": 0, "skipped": 0, "shot_statuses": {}}

    # Backup originals first (copy entire frames/ to frames_original/)
    if originals_dir.exists():
        shutil.rmtree(originals_dir)
    shutil.copytree(str(frames_dir), str(originals_dir))
    print(f"📦 [Cleaner] Backed up originals to frames_original/")

    stats = {"cleaned": 0, "copied": 0, "cropped": 0, "failed": 0, "skipped": 0}
    shot_statuses: Dict[str, str] = {}

    for idx, shot in enumerate(shots, 1):
        shot_id = shot.get("shotId", "")
        progress = f"[{idx}/{total}]"
        frame_path = frames_dir / f"{shot_id}.png"
        backup_path = originals_dir / f"{shot_id}.png"

        if not frame_path.exists():
            print(f"   ⚠️ {progress} Frame not found: {frame_path.name}")
            shot_statuses[shot_id] = "FAILED"
            continue

        # Fast-path: non-narrative content → keep as-is (user will replace via graphic-scene UI)
        is_narrative = shot.get("isNarrative", True)
        content_class = shot.get("contentClass", "")
        if not is_narrative or content_class in ("BRAND_SPLASH", "ENDCARD"):
            stats["copied"] += 1
            stats["cleaned"] += 1
            stats["skipped"] += 1
            shot_statuses[shot_id] = "SKIPPED"
            label = content_class.lower().replace("_", " ") if content_class else "non-narrative"
            print(f"   ⏭️ {progress} {shot_id}: {label} — skipped (user will replace)")
            continue

        watermark_info = shot.get("watermarkInfo", {})
        tier = _classify_watermark(watermark_info)
        description = watermark_info.get("description", "") if watermark_info else ""

        if tier == "none":
            # No watermark — frame stays as-is
            stats["copied"] += 1
            shot_statuses[shot_id] = "CLEANED"
            print(f"   ✅ {progress} {shot_id}: no watermark detected")

        elif tier == "edge":
            # Smart crop: read from backup, write directly to frames/
            success = _smart_crop(backup_path, frame_path, description)
            if success:
                stats["cropped"] += 1
                shot_statuses[shot_id] = "CLEANED"
                print(f"   ✅ {progress} {shot_id}: edge watermark cropped ({description[:50]})")
            else:
                # Crop failed — frame stays as original (already in place)
                stats["failed"] += 1
                shot_statuses[shot_id] = "FAILED"
                print(f"   ⚠️ {progress} {shot_id}: crop failed, keeping original")

        elif tier == "interior":
            # Interior watermark: try smart crop, fall back to keeping original
            crop_success = _smart_crop(backup_path, frame_path, description)
            if crop_success:
                stats["cropped"] += 1
                shot_statuses[shot_id] = "CLEANED"
                print(f"   ✅ {progress} {shot_id}: interior watermark cropped ({description[:50]})")
            else:
                # Crop failed — frame stays as original (already in place)
                stats["failed"] += 1
                shot_statuses[shot_id] = "FAILED"
                print(f"   ⚠️ {progress} {shot_id}: crop failed, keeping original")

        stats["cleaned"] += 1

    stats["shot_statuses"] = shot_statuses
    print(f"🧹 [Cleaner] Done: {stats['cleaned']} cleaned, {stats['skipped']} skipped, {stats['failed']} failed")
    return stats
