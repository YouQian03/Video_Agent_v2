# vibe_check.py
from core.workflow_manager import WorkflowManager

# 1. 初始化（使用你已有的 demo_job_001）
manager = WorkflowManager("demo_job_001")

# 2. 模拟形态 3：直接改全局风格
print("正在尝试修改全局风格...")
res = manager.apply_agent_action({"op": "set_global_style", "value": "Cyberpunk Neon"})
print(f"受影响分镜数: {res['affected_shots']}")

# 3. 验证状态是否变回了 NOT_STARTED (这是我们 changes.py 里的级联逻辑)
manager.load() # 重新加载看磁盘上的结果
first_shot_status = manager.workflow["shots"][0]["status"]["video_generate"]
print(f"修改风格后，Shot 01 的生成状态是: {first_shot_status}")

if first_shot_status == "NOT_STARTED":
    print("✅ 底座逻辑验证成功！")
else:
    print("❌ 状态没有正确重置，请检查 core/changes.py")