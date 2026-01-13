# core/agent_engine.py
import os
import json
import re
from google import genai
from google.genai import types # 💡 引入类型定义
from typing import Dict, Any, List, Union

class AgentEngine:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("未检测到 GEMINI_API_KEY")
        self.client = genai.Client(api_key=api_key)
        self.model_id = "gemini-2.0-flash" 

    def get_action_from_text(self, user_input: str, workflow_summary: str) -> Union[Dict, List]:
        system_prompt = f"""
你是一个专业的视频导演助理。你必须根据用户需求生成工作流修改指令。

[当前状态摘要]
{workflow_summary}

[指令规范]
1. 修改全局风格: {{"op": "set_global_style", "value": "英文风格词"}}
2. 替换主体名词: {{"op": "global_subject_swap", "old_subject": "英文原词", "new_subject": "英文新词"}}
   - 注意：你必须根据摘要识别描述中的英文原词（如: dog），并翻译用户的要求（如: 狗->dog, 猫->cat）。

[输出要求]
- 必须识别用户的所有意图。
- 必须返回一个包含指令对象的列表 []。
- 严禁输出任何解释性文字，只输出纯 JSON。
"""
        try:
            # 💡 核心升级：强迫模型输出符合 JSON 结构的格式
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=[system_prompt, f"用户指令: {user_input}"],
                config=types.GenerateContentConfig(
                    response_mime_type='application/json', # 👈 强制 JSON 模式
                )
            )
            
            # 直接解析，JSON 模式下模型返回的一定是合法的 JSON 字符串
            res_json = json.loads(response.text)
            print(f"🤖 Agent 决策结果: {res_json}")
            return res_json
            
        except Exception as e:
            # 增加更详细的错误打印
            print(f"❌ Agent 调用出现异常: {str(e)}")
            if 'response' in locals() and hasattr(response, 'candidates'):
                print(f"🔍 调试信息 - 停止原因: {response.candidates[0].finish_reason}")
            return {"op": "error", "reason": str(e)}