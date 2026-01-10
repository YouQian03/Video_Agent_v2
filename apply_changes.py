import json
import argparse
from pathlib import Path

PROJECT_DIR = Path(__file__).parent
DEFAULT_JOB_ID = "demo_job_001"

def load_workflow(job_dir: Path) -> dict:
    return json.loads((job_dir / "workflow.json").read_text(encoding="utf-8"))

def save_workflow(job_dir: Path, wf: dict) -> None:
    (job_dir / "workflow.json").write_text(json.dumps(wf, ensure_ascii=False, indent=2), encoding="utf-8")

def apply_global_style(wf: dict, new_style_prompt: str, cascade: bool = True) -> int:
    """
    修改全局风格，并级联使相关节点需要重跑。
    cascade=True：把所有 shots 的 stylize & video_generate 重置为 NOT_STARTED
    返回：受影响 shots 数量
    """
    wf.setdefault("global", {})["style_prompt"] = new_style_prompt

    affected = 0
    if cascade:
        for shot in wf.get("shots", []):
            # 风格改了，风格化图就应该重新生成（真实产品里可能有缓存策略，demo 先全重跑）
            shot.setdefault("status", {})["stylize"] = "NOT_STARTED"
            shot.setdefault("status", {})["video_generate"] = "NOT_STARTED"
            affected += 1
    return affected

def replace_entity_reference(wf: dict, entity_id: str, new_ref_image: str) -> int:
    """
    替换某个 entity 的 reference_image，并只影响引用它的 shots：
    - 标记 stylize / video_generate 为 NOT_STARTED
    返回：受影响 shots 数量
    """
    entities = wf.setdefault("entities", {})
    if entity_id not in entities:
        raise KeyError(f"entity 不存在：{entity_id}")

    entities[entity_id]["reference_image"] = new_ref_image

    affected = 0
    for shot in wf.get("shots", []):
        shot_entities = shot.get("entities", [])
        if entity_id in shot_entities:
            shot.setdefault("status", {})["stylize"] = "NOT_STARTED"
            shot.setdefault("status", {})["video_generate"] = "NOT_STARTED"
            affected += 1
    return affected


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--job_id", default=DEFAULT_JOB_ID)
    parser.add_argument("--set_global_style", default=None, help="设置新的 global.style_prompt")
    parser.add_argument("--no_cascade", action="store_true", help="不触发级联重跑（默认会触发）")
    parser.add_argument("--replace_entity", default=None, help="要替换的 entity_id，例如 entity_1")
    parser.add_argument("--new_ref", default=None, help="新的 reference_image 路径，例如 stylized_frames/shot_02.png")

    args = parser.parse_args()

    job_dir = PROJECT_DIR / "jobs" / args.job_id
    wf = load_workflow(job_dir)

    if args.set_global_style is not None:
        affected = apply_global_style(wf, args.set_global_style, cascade=(not args.no_cascade))
        save_workflow(job_dir, wf)
        print(f"✅ 已更新 global.style_prompt")
        print(f"✅ 受影响 shots：{affected}（stylize/video_generate 已标记为 NOT_STARTED）")
    else:
        print("没有指定任何修改参数。示例：")
        print('  python apply_changes.py --set_global_style "cinematic noir, high contrast"')
    
    if args.replace_entity and args.new_ref:
        affected = replace_entity_reference(wf, args.replace_entity, args.new_ref)
        save_workflow(job_dir, wf)
        print(f"✅ 已替换 {args.replace_entity} 的 reference_image -> {args.new_ref}")
        print(f"✅ 受影响 shots：{affected}（stylize/video_generate 已标记为 NOT_STARTED）")
        return

if __name__ == "__main__":
    main()
