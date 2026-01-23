import json
import subprocess
from pathlib import Path

from core.utils import get_ffmpeg_path

PROJECT_DIR = Path(__file__).parent
VIDEO_PATH = PROJECT_DIR / "downloads" / "input.mp4"
STORYBOARD_PATH = PROJECT_DIR / "outputs" / "storyboard.json"
FRAMES_DIR = PROJECT_DIR / "frames"

def to_seconds(t):
    if t is None:
        return None
    if isinstance(t, (int, float)):
        return float(t)

    s = str(t).strip()
    if not s:
        return None

    try:
        return float(s)
    except ValueError:
        pass

    parts = s.split(":")
    try:
        parts = [float(p) for p in parts]
    except ValueError:
        return None

    if len(parts) == 3:
        hh, mm, ss = parts
        return hh * 3600 + mm * 60 + ss
    if len(parts) == 2:
        mm, ss = parts
        return mm * 60 + ss
    if len(parts) == 1:
        return parts[0]
    return None

def main():
    if not VIDEO_PATH.exists():
        raise FileNotFoundError(f"找不到视频：{VIDEO_PATH}")
    if not STORYBOARD_PATH.exists():
        raise FileNotFoundError(f"找不到 storyboard：{STORYBOARD_PATH}")

    FRAMES_DIR.mkdir(parents=True, exist_ok=True)

    storyboard = json.loads(STORYBOARD_PATH.read_text(encoding="utf-8"))
    saved = 0

    for shot in storyboard:
        shot_num = shot.get("shot_number", saved + 1)
        start_time = shot.get("start_time", None)
        ts = to_seconds(start_time)

        if ts is None:
            continue

        out_path = FRAMES_DIR / f"shot_{int(shot_num):02d}.png"

        cmd = [
            get_ffmpeg_path(),
            "-y",
            "-ss", str(ts),
            "-i", str(VIDEO_PATH),
            "-frames:v", "1",
            "-q:v", "2",
            str(out_path)
        ]

        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if out_path.exists():
            saved += 1

    print(f"✅ 截帧完成：{saved} 张，保存在 {FRAMES_DIR}")

if __name__ == "__main__":
    main()
