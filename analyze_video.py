import os
import json
import time
from pathlib import Path
from google import genai

PROJECT_DIR = Path(__file__).parent
VIDEO_PATH = PROJECT_DIR / "downloads" / "input.mp4"
OUT_PATH = PROJECT_DIR / "outputs" / "storyboard.json"

DIRECTOR_METAPROMPT = r"""
请你扮演一位专业的影视分镜分析师，专注以「画面变化」为核心，
将刚才的视频拆解为详细的分镜表。
你必须严格按照JSON格式输出。
根元素为包含多个分镜对象的JSON数组。
每个对象包含：
shot_number, frame_description, content_analysis,
start_time, end_time, duration_seconds,
shot_type, camera_angle, camera_movement,
focus_and_depth, lighting, music_and_sound, voiceover。
无信息请填 null。
仅输出纯 JSON。
""".strip()


def ensure_api_key() -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "没有检测到 GEMINI_API_KEY 环境变量。\n"
            "请在当前终端执行：\n"
            '  export GEMINI_API_KEY="你的key"\n'
            "然后再运行本脚本。"
        )
    return api_key


def extract_json_array(text: str):
    if not text:
        raise ValueError("模型没有返回文本（response.text 为空）。")

    s = text.strip()
    if s.startswith("[") and s.endswith("]"):
        return json.loads(s)

    l = s.find("[")
    r = s.rfind("]")
    if l != -1 and r != -1 and r > l:
        return json.loads(s[l : r + 1])

    raise ValueError(
        "未能从模型输出中提取 JSON 数组。\n"
        "请把模型原始输出复制出来检查（它可能没有按要求输出 JSON）。"
    )


def wait_until_file_active(client: genai.Client, file_obj, timeout_s: int = 120, poll_s: int = 2):
    """
    Files API 上传后，文件可能处于 PROCESSING 状态，必须等到 ACTIVE 才能使用。
    """
    file_name = getattr(file_obj, "name", None)
    if not file_name:
        # 极少数情况下对象结构不同，直接返回试试
        return file_obj

    start = time.time()
    last_state = None

    while True:
        f = client.files.get(name=file_name)
        state = getattr(f, "state", None)

        if state != last_state:
            print(f"文件状态：{state}")
            last_state = state

        if state == "ACTIVE":
            return f

        if time.time() - start > timeout_s:
            raise TimeoutError(
                f"等待文件变为 ACTIVE 超时（>{timeout_s}s）。"
                "你可以重试一次，或者换更小/更常见编码的 mp4。"
            )

        time.sleep(poll_s)


def main():
    api_key = ensure_api_key()

    if not VIDEO_PATH.exists():
        raise FileNotFoundError(
            f"找不到视频文件：{VIDEO_PATH}\n"
            "请确认你已把视频放到 downloads/ 里，并命名为 input.mp4"
        )

    size_mb = VIDEO_PATH.stat().st_size / (1024 * 1024)
    print(f"准备处理视频：{VIDEO_PATH.name} ({size_mb:.1f} MB)")

    client = genai.Client(api_key=api_key)

    print("开始上传视频到 Files API…")
    uploaded = client.files.upload(file=str(VIDEO_PATH))
    print(f"✅ 上传完成：{uploaded.name}")

    print("等待文件变为 ACTIVE…")
    video_file = wait_until_file_active(client, uploaded, timeout_s=180, poll_s=2)
    print("✅ 文件已 ACTIVE，可以开始分析")

    print("开始分析视频（生成分镜 JSON）…")
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[DIRECTOR_METAPROMPT, video_file],
    )

    raw_text = getattr(response, "text", None) or ""
    storyboard = extract_json_array(raw_text)

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(
        json.dumps(storyboard, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"\n✅ 已生成分镜 JSON：{OUT_PATH}")
    print(f"分镜数量：{len(storyboard)}")


if __name__ == "__main__":
    main()


