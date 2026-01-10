import json
from pathlib import Path

PROJECT_DIR = Path(__file__).parent
JOB_DIR = PROJECT_DIR / "jobs" / "demo_job_001"

STORYBOARD_PATH = JOB_DIR / "storyboard.json"
FRAMES_DIR = JOB_DIR / "frames"
STYLIZED_DIR = JOB_DIR / "stylized_frames"
WORKFLOW_PATH = JOB_DIR / "workflow.json"

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
    storyboard = json.loads(STORYBOARD_PATH.read_text(encoding="utf-8"))

    shots = []
    for s in storyboard:
        shot_number = s.get("shot_number")
        if shot_number is None:
            continue
        sid = f"shot_{int(shot_number):02d}"

        start = to_seconds(s.get("start_time"))
        end = to_seconds(s.get("end_time"))
        desc = s.get("frame_description") or s.get("content_analysis") or ""

        frame_path = f"frames/{sid}.png"
        stylized_path = f"stylized_frames/{sid}.png"

        shots.append({
            "shot_id": sid,
            "start_time": start,
            "end_time": end,
            "description": desc,
            "voiceover": s.get("voiceover"),
            "assets": {
                "first_frame": frame_path if (JOB_DIR / frame_path).exists() else None,
                "stylized_frame": stylized_path if (JOB_DIR / stylized_path).exists() else None,
                "video": None
            },
            "status": {
                "analyze": "SUCCESS",
                "extract_frames": "SUCCESS",
                "stylize": "SUCCESS",
                "video_generate": "NOT_STARTED"
            }
        })

    workflow = {
        "job_id": "demo_job_001",
        "source_video": "input.mp4",
        "global": {
            "aspect_ratio": "16:9",
            "style_prompt": "de-replication stylization"
        },
        "entities": {},  # 先留空，后续我们加“人物/资产全局替换”
        "shots": shots
    }

    WORKFLOW_PATH.write_text(json.dumps(workflow, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✅ workflow.json 已生成：{WORKFLOW_PATH}")
    print(f"shots 数量：{len(shots)}")

if __name__ == "__main__":
    main()
