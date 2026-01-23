# core/utils.py
import shutil

def get_ffmpeg_path() -> str:
    """
    跨平台获取 ffmpeg 路径
    - Railway/Linux: 使用 PATH 中的 ffmpeg
    - macOS 本地: 使用 Homebrew 路径
    """
    # 优先从 PATH 查找
    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg:
        return ffmpeg

    # macOS Homebrew 备用路径
    macos_path = "/opt/homebrew/bin/ffmpeg"
    import os
    if os.path.exists(macos_path):
        return macos_path

    # Intel Mac 备用路径
    intel_mac_path = "/usr/local/bin/ffmpeg"
    if os.path.exists(intel_mac_path):
        return intel_mac_path

    raise RuntimeError("ffmpeg not found. Please install ffmpeg.")
