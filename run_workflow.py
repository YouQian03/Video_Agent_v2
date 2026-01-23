import json
import argparse
from pathlib import Path
import shutil

from core.utils import get_ffmpeg_path

PROJECT_DIR = Path(__file__).parent
DEFAULT_JOB_ID = "demo_job_001"

def load_workflow(job_dir: Path) -> dict:
    wf_path = job_dir / "workflow.json"
    return json.loads(wf_path.read_text(encoding="utf-8"))

def save_workflow(job_dir: Path, wf: dict) -> None:
    wf_path = job_dir / "workflow.json"
    wf_path.write_text(json.dumps(wf, ensure_ascii=False, indent=2), encoding="utf-8")

def find_shot(wf: dict, shot_id: str) -> dict | None:
    for s in wf.get("shots", []):
        if s.get("shot_id") == shot_id:
            return s
    return None

def ensure_videos_dir(job_dir: Path) -> Path:
    videos_dir = job_dir / "videos"
    videos_dir.mkdir(parents=True, exist_ok=True)
    return videos_dir

def mock_generate_video(job_dir: Path, shot: dict) -> str:
    """
    Demo 版本：生成一个“占位视频文件”，用来验证 runner 的工作方式。
    后续接 Seedance/Veo 时，只需替换这个函数。
    """
    videos_dir = ensure_videos_dir(job_dir)
    out_path = videos_dir / f"{shot['shot_id']}.mp4"

    # 用 input.mp4 的前 1 秒复制成一个小文件（确保是可播放 mp4）
    src_video = job_dir / "input.mp4"
    if not src_video.exists():
        raise FileNotFoundError(f"找不到源视频：{src_video}")

    # 直接复制会很大；为了快，我们复制一个小片段（用 ffmpeg）
    # 使用跨平台 ffmpeg 路径获取
    ffmpeg = get_ffmpeg_path()

    import subprocess
    cmd = [
        ffmpeg, "-y",
        "-i", str(src_video),
        "-t", "1.0",
        "-c", "copy",
        str(out_path)
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    return f"videos/{out_path.name}"

def run_video_generate(job_dir: Path, wf: dict, target_shot: str | None = None) -> None:
    """
    执行 video_generate 节点：
    - target_shot=None：跑所有 NOT_STARTED 或 FAILED 的 shot
    - target_shot=shot_03：只跑指定 shot（单节点重跑）
    """
    shots = wf.get("shots", [])
    for shot in shots:
        sid = shot.get("shot_id")

        if target_shot and sid != target_shot:
            continue

        status = shot.get("status", {}).get("video_generate", "NOT_STARTED")
        if not target_shot and status not in ("NOT_STARTED", "FAILED"):
            continue

        # 标记运行中
        shot.setdefault("status", {})["video_generate"] = "RUNNING"
        shot.setdefault("errors", {})["video_generate"] = None
        save_workflow(job_dir, wf)

        try:
            rel_video_path = mock_generate_video(job_dir, shot)
            shot.setdefault("assets", {})["video"] = rel_video_path
            shot["status"]["video_generate"] = "SUCCESS"
            print(f"✅ video_generate SUCCESS: {sid} -> {rel_video_path}")
        except Exception as e:
            shot["status"]["video_generate"] = "FAILED"
            shot.setdefault("errors", {})["video_generate"] = str(e)
            print(f"❌ video_generate FAILED: {sid} -> {e}")

        save_workflow(job_dir, wf)

def mock_stylize_frame(job_dir: Path, shot: dict) -> str:
    """
    Demo 版风格化：把 first_frame 复制成新的 stylized_frame（覆盖写）。
    后续接 Nano Banana 时，只替换这里。
    """
    src = job_dir / shot["assets"]["first_frame"]
    if not src.exists():
        raise FileNotFoundError(f"找不到 first_frame：{src}")

    dst = job_dir / "stylized_frames" / f"{shot['shot_id']}.png"
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(src, dst)
    return f"stylized_frames/{dst.name}"

def run_stylize(job_dir: Path, wf: dict, target_shot: str | None = None) -> None:
    shots = wf.get("shots", [])
    for shot in shots:
        sid = shot.get("shot_id")

        if target_shot and sid != target_shot:
            continue

        status = shot.get("status", {}).get("stylize", "NOT_STARTED")
        if not target_shot and status not in ("NOT_STARTED", "FAILED"):
            continue

        shot.setdefault("status", {})["stylize"] = "RUNNING"
        shot.setdefault("errors", {})["stylize"] = None
        save_workflow(job_dir, wf)

        try:
            rel_path = mock_stylize_frame(job_dir, shot)
            shot.setdefault("assets", {})["stylized_frame"] = rel_path
            shot["status"]["stylize"] = "SUCCESS"
            print(f"✅ stylize SUCCESS: {sid} -> {rel_path}")
        except Exception as e:
            shot["status"]["stylize"] = "FAILED"
            shot.setdefault("errors", {})["stylize"] = str(e)
            print(f"❌ stylize FAILED: {sid} -> {e}")

        save_workflow(job_dir, wf)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--job_id", default=DEFAULT_JOB_ID)
    parser.add_argument("--node", choices=["video_generate"], default="video_generate")
    parser.add_argument("--shot", default=None, help="只运行某个 shot，例如 shot_03")
    args = parser.parse_args()

    job_dir = PROJECT_DIR / "jobs" / args.job_id
    if not job_dir.exists():
        raise FileNotFoundError(f"找不到 job 目录：{job_dir}")

    wf = load_workflow(job_dir)

    if args.node == "video_generate":
        # ① 先跑 stylize 节点
        run_stylize(job_dir, wf, target_shot=args.shot)

        # ② 重新加载 workflow（确保状态最新）
        wf = load_workflow(job_dir)

        # ③ 再跑 video_generate 节点
        run_video_generate(job_dir, wf, target_shot=args.shot)


    print("✅ runner 执行完成")

if __name__ == "__main__":
    main()
