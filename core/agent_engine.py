# core/agent_engine.py
import os
import json
from google import genai
from typing import Dict, Any

class AgentEngine:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("未检测到 GEMINI_API_KEY")
        self.client = genai.Client(api_key=api_key)
        # 修改这里：改为你环境里测试通过的 2.0 版本，这样最稳
        self.model_id = "gemini-2.0-flash" 

    def get_action_from_text(self, user_input: str, workflow_summary: str) -> Dict[str, Any]:
        """
        将用户的自然语言转化为 WorkflowManager 的 Action JSON
        """
        system_prompt = f"""
你是一个专业的视频制作助理。你的任务是分析用户的需求，并将其转化为对工作流的操作指令。

当前工作流摘要:
{workflow_summary}

支持的操作指令 (Action JSON) 格式如下：
1. 修改全局风格: {{"op": "set_global_style", "value": "风格描述词"}}
2. 替换实体参考图: {{"op": "replace_entity_ref", "entity_id": "实体ID", "new_ref": "图片路径"}}

注意：
- 只输出纯 JSON 格式，不要有任何 Markdown 代码块标签（如 ```json ）。
- 如果用户说修改整体风格或画风，使用 set_global_style。
- 如果用户提到修改具体的人物、动物或主体，使用 replace_entity_ref。
- 如果无法匹配操作，请返回 {{"op": "none", "reason": "理由"}}。
"""
        
        try:
            # 这里的调用方式保持不变
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=[system_prompt, f"用户需求: {user_input}"]
            )
            
            text = response.text.strip()
            
            # 清洗 Gemini 偶尔会返回的 Markdown 标签
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
                
            return json.loads(text)
        except Exception as e:
            return {"op": "error", "reason": f"解析失败: {str(e)}", "raw": response.text if 'response' in locals() else "No response"}