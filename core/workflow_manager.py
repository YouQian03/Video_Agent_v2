# core/workflow_manager.py
import json
import time
import os
import re
from pathlib import Path
from typing import Dict, List, Any, Optional, Union

from core.workflow_io import load_workflow, save_workflow
from core.changes import apply_global_style, replace_entity_reference
from core.runner import run_pipeline, run_stylize, run_video_generate

class WorkflowManager:
    def __init__(self, job_id: str, project_root: Optional[Path] = None):
        self.job_id = job_id
        self.project_dir = project_root or Path(__file__).parent.parent
        self.job_dir = self.project_dir / "jobs" / job_id
        self.workflow: Dict[str, Any] = {}
        if (self.job_dir / "workflow.json").exists():
            self.load()

    def load(self):
        self.workflow = load_workflow(self.job_dir)
        if "global_stages" not in self.workflow:
            self.workflow["global_stages"] = {"analyze": "SUCCESS", "extract": "SUCCESS", "stylize": "NOT_STARTED", "video_gen": "NOT_STARTED", "merge": "NOT_STARTED"}
        
        updated = False
        for shot in self.workflow.get("shots", []):
            sid = shot.get("shot_id")
            video_output_path = self.job_dir / "videos" / f"{sid}.mp4"
            status_node = shot.get("status", {})
            if status_node.get("video_generate") == "RUNNING" and video_output_path.exists():
                status_node["video_generate"] = "SUCCESS"
                shot.setdefault("assets", {})["video"] = f"videos/{sid}.mp4"
                updated = True
        if updated: self.save()
        return self.workflow

    def save(self):
        self.workflow.setdefault("meta", {})["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        save_workflow(self.job_dir, self.workflow)

    def apply_agent_action(self, action: Union[Dict, List]) -> Dict[str, Any]:
        actions = action if isinstance(action, list) else [action]
        total_affected = 0
        print(f"📦 正在处理 Agent 指令，共 {len(actions)} 条")

        for act in actions:
            op = act.get("op")
            print(f"⚙️ 执行操作: {op} | 参数: {act}")

            if op == "set_global_style":
                val = act.get("value")
                affected = apply_global_style(self.workflow, val, cascade=True)
                if affected > 0:
                    for s in self.workflow.get("shots", []): s.setdefault("assets", {})["video"] = None
                total_affected += affected
            
            elif op == "global_subject_swap":
                old_s = act.get("old_subject", "").lower()
                new_s = act.get("new_subject", "").lower()
                if old_s and new_s:
                    for s in self.workflow.get("shots", []):
                        if old_s in s["description"].lower():
                            s["description"] = re.sub(old_s, new_s, s["description"], flags=re.IGNORECASE)
                            s["status"]["video_generate"] = "NOT_STARTED"
                            s["assets"]["video"] = None
                            total_affected += 1
                print(f"🐱 替换完成：{old_s} -> {new_s}，影响 {total_affected} 处")

            elif op == "update_shot_params":
                # 兼容手动精修
                sid = act.get("shot_id")
                for s in self.workflow.get("shots", []):
                    if s["shot_id"] == sid:
                        if "description" in act: s["description"] = act["description"]
                        s["status"]["video_generate"] = "NOT_STARTED"
                        s["assets"]["video"] = None
                        total_affected += 1

        if total_affected > 0:
            self.save()
        return {"status": "success", "affected_shots": total_affected}

    def run_node(self, node_type: str, shot_id: Optional[str] = None):
        self.workflow["global_stages"]["video_gen"] = "RUNNING"
        self.save()
        if node_type == "video_generate":
            shots = [s for s in self.workflow.get("shots", []) if not shot_id or s["shot_id"] == shot_id]
            for s in shots:
                p = self.job_dir / "videos" / f"{s['shot_id']}.mp4"
                if p.exists(): os.remove(p)
                s["status"]["video_generate"] = "RUNNING"
                s["assets"]["video"] = None
        self.save()
        if node_type == "stylize": run_stylize(self.job_dir, self.workflow, target_shot=shot_id)
        elif node_type == "video_generate": run_video_generate(self.job_dir, self.workflow, target_shot=shot_id)
        self.load()