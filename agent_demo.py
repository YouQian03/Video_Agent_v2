# agent_demo.py
import os
from core.workflow_manager import WorkflowManager
from core.agent_engine import AgentEngine

def main():
    # 1. 初始化
    manager = WorkflowManager("demo_job_001")
    agent = AgentEngine()
    
    print("--- AI 爆款二创 Agent 驱动模式 ---")
    print("当前风格:", manager.workflow.get("global", {}).get("style_prompt"))
    print("当前实体:", list(manager.workflow.get("entities", {}).keys()))
    print("-" * 30)
    
    while True:
        user_text = input("\n🤖 您想对视频做何修改？(输入 'exit' 退出): ")
        if user_text.lower() == 'exit':
            break
            
        # 准备工作流摘要（告诉 Gemini 当前有什么，它才能改）
        summary = f"Style: {manager.workflow.get('global', {}).get('style_prompt')}\n"
        summary += f"Entities: {json.dumps(manager.workflow.get('entities', {}), indent=2)}"
        
        print("🔍 Agent 正在思考...")
        action = agent.get_action_from_text(user_text, summary)
        
        print(f"🎯 解析指令: {action}")
        
        if action.get("op") != "none" and action.get("op") != "error":
            # 执行修改
            res = manager.apply_agent_action(action)
            print(f"✅ 执行成功！受影响分镜数: {res['affected_shots']}")
            print(f"🔄 所有受影响的分镜状态已重置，准备重新生成。")
        else:
            print(f"⚠️ 无法执行: {action.get('reason')}")

if __name__ == "__main__":
    import json
    main()