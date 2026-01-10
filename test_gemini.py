import os
from google import genai

def main():
    # 从环境变量中读取 API Key
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("没有检测到 GEMINI_API_KEY 环境变量")

    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents="用一句话告诉我，你是谁？"
    )

    print("Gemini 回复：")
    print(response.text)

if __name__ == "__main__":
    main()
