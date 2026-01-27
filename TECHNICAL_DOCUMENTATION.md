# ReTake - AI Director Workbench 技术文档

> 版本: 1.0 | 最后更新: 2026-01-25 | 部署状态: Railway Production

---

## 1. 项目概览

### 1.1 项目名称与定位
**ReTake** 是一款基于 Google Gemini 生态的 AI 视频重塑工作台，允许用户通过自然语言指令对视频进行**风格迁移**和**角色替换**，同时严格保持原片的摄影语言（Cinematography Fidelity）。

### 1.2 核心价值主张
- **一键风格迁移**: 将任意视频转换为赛博朋克、吉卜力动画、黑色电影等风格
- **角色无缝替换**: 支持细粒度属性描述（发色、服装、年龄等），自动传播到所有主角镜头
- **摄影参数保真**: AI 生成内容严格遵循源片的景别、构图、朝向、视线、运动轨迹
- **人机协作编辑**: Agent 全局指挥 + 手动微调单个分镜

### 1.3 目标用户与使用场景
| 用户类型 | 使用场景 |
|---------|---------|
| 影视创作者 | 快速生成概念预览片、风格测试 |
| 广告制作 | 批量生成多风格版本供客户选择 |
| 内容创作者 | 将真人视频转换为动画风格 |
| AI 研究者 | 探索多模态 AI 的视频理解与生成能力 |

### 1.4 当前开发阶段
- **阶段**: MVP 已完成，已部署至 Railway 生产环境
- **稳定性**: 核心流程稳定，部分边缘场景仍在优化
- **已验证功能**: 视频拆解、风格迁移、角色替换、视频生成、合并导出

### 1.5 主要依赖的外部服务
| 服务 | 用途 | 模型/版本 |
|-----|------|----------|
| Google Gemini | 视频分析、Agent 决策 | gemini-2.0-flash |
| Google Imagen | Style Frame 生成 | imagen-4.0-generate-001 |
| Google Veo | Image-to-Video 生成 | veo-3.1-generate-preview |
| FFmpeg | 视频切割、帧提取、合并 | 系统安装版本 |

---

## 2. 技术栈详解

### 2.1 编程语言
- **后端**: Python 3.12
- **前端**: JavaScript (React 18 via CDN)

### 2.2 框架与库

#### 后端依赖 (`requirements.txt`)
```
fastapi          # Web 框架，异步支持
uvicorn[standard] # ASGI 服务器
python-multipart # 文件上传支持
pillow           # 图像处理
requests         # HTTP 客户端（下载生成的资源）
google-genai     # Google Gemini/Imagen/Veo 统一 SDK
```

#### 前端依赖 (CDN)
```html
<script src="https://cdn.tailwindcss.com"></script>           <!-- CSS 框架 -->
<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script> <!-- JSX 编译 -->
```

### 2.3 构建与部署
| 工具 | 用途 |
|-----|------|
| Nixpacks | Railway 自动构建（`nixpacks.toml`）|
| Railway | 云端部署平台 |
| Git | 版本控制 |

### 2.4 环境配置

#### 开发环境
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export GEMINI_API_KEY="your-api-key"
python app.py  # 访问 http://localhost:8000
```

#### 生产环境 (Railway)
- 自动从 `nixpacks.toml` 构建
- 环境变量: `GEMINI_API_KEY` (在 Railway Dashboard 设置)
- 端口: 自动使用 `$PORT` 环境变量

---

## 3. 项目架构

### 3.1 整体架构模式
**单体应用 + 事件驱动**
- FastAPI 提供 REST API
- 后台任务异步执行（`BackgroundTasks`）
- 状态持久化到 JSON 文件
- 前端轮询获取状态更新

### 3.2 目录结构
```
G3_Video_Agent/
├── app.py                    # FastAPI 入口，定义所有 API 路由
├── index.html                # 单文件 React 前端 (800+ 行)
├── requirements.txt          # Python 依赖
├── railway.json              # Railway 部署配置
├── nixpacks.toml             # Nixpacks 构建配置
│
├── core/                     # 核心业务逻辑
│   ├── __init__.py
│   ├── workflow_manager.py   # 🎯 主控引擎：任务编排、状态管理
│   ├── agent_engine.py       # 🤖 AI Agent：自然语言 → 结构化指令
│   ├── runner.py             # 🚀 执行引擎：Imagen/Veo API 调用
│   ├── workflow_io.py        # 💾 持久化：JSON 读写
│   ├── changes.py            # 🔄 状态变更：风格/实体修改
│   └── utils.py              # 🔧 工具函数：跨平台 ffmpeg 路径
│
├── jobs/                     # 作业数据（运行时生成）
│   └── job_{uuid}/
│       ├── workflow.json     # 作业状态
│       ├── input.mp4         # 源视频
│       ├── storyboard.json   # 分镜数据
│       ├── frames/           # 提取的关键帧
│       ├── source_segments/  # 源视频片段
│       ├── stylized_frames/  # AI 生成的定妆图
│       └── videos/           # AI 生成的视频片段
│
├── analyze_video.py          # 视频分析脚本（含 DIRECTOR_METAPROMPT）
├── extract_frames.py         # FFmpeg 帧提取
└── [其他工具脚本...]
```

### 3.3 模块依赖关系
```
┌─────────────────────────────────────────────────────────────┐
│                        app.py (FastAPI)                     │
│  REST API 入口 + 静态资源服务 + 后台任务调度                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │WorkflowMgr  │ │AgentEngine  │ │   runner    │
    │  主控引擎   │ │  AI 决策    │ │  执行引擎   │
    └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
           │               │               │
           │               │               │
    ┌──────┴──────┐        │        ┌──────┴──────┐
    │ workflow_io │        │        │   utils     │
    │ changes     │        │        │   PIL       │
    │ analyze_*   │        │        │   requests  │
    └─────────────┘        │        └─────────────┘
                           │
                    ┌──────┴──────┐
                    │ google.genai│
                    │   SDK       │
                    └─────────────┘
```

### 3.4 数据流向图
```
[用户上传视频]
       │
       ▼
┌──────────────────┐    ┌──────────────────┐
│ Gemini 2.0 Flash │───▶│ Storyboard JSON  │
│   视频分析       │    │ (分镜+摄影参数)  │
└──────────────────┘    └────────┬─────────┘
                                 │
                                 ▼
┌──────────────────┐    ┌──────────────────┐
│     FFmpeg       │───▶│ frames/ + source │
│   帧/片段提取    │    │ _segments/       │
└──────────────────┘    └────────┬─────────┘
                                 │
       ┌─────────────────────────┼─────────────────────────┐
       │                         │                         │
       ▼                         ▼                         ▼
[用户发送指令]            [用户点击执行]            [用户点击合并]
       │                         │                         │
       ▼                         ▼                         ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ AgentEngine      │    │ Imagen 4.0       │    │     FFmpeg       │
│ 指令解析+应用    │    │ Style Frame 生成 │    │   concat 合并    │
└──────────────────┘    └────────┬─────────┘    └────────┬─────────┘
                                 │                       │
                                 ▼                       ▼
                        ┌──────────────────┐    ┌──────────────────┐
                        │ Veo 3.1          │    │ final_output.mp4 │
                        │ Video 生成       │    └──────────────────┘
                        └────────┬─────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │ videos/shot_XX   │
                        └──────────────────┘
```

### 3.5 前后端交互
- **通信方式**: REST API (JSON)
- **状态同步**: 前端每 3 秒轮询 `/api/workflow`
- **文件服务**: `/assets/{job_id}/...` 直接映射到 `jobs/{job_id}/`

---

## 4. 核心功能模块

### 4.1 WorkflowManager - 主控引擎

**功能**: 整个应用的核心调度器，负责任务编排、状态管理、Agent 指令执行

**入口文件**: `core/workflow_manager.py`

**关键类与方法**:
```python
class WorkflowManager:
    def __init__(job_id, project_root)     # 初始化/加载现有作业
    def initialize_from_file(video_path)   # 🎬 完整初始化流程（分析+提取）
    def load() -> dict                      # 加载 workflow.json
    def save()                              # 持久化到 workflow.json
    def apply_agent_action(action)         # 🤖 执行 Agent 生成的指令
    def run_node(node_type, shot_id)       # 🚀 执行管道节点（stylize/video）
    def merge_videos() -> str              # 📦 合并所有视频片段

    # 内部方法
    def _run_ffmpeg_extraction(video, storyboard)  # FFmpeg 帧/片段提取
    def _is_scenery_shot(description) -> bool      # 🏞️ 智能场景检测
    def _purge_conflicting_attributes(desc, attrs) # 🧹 属性冲突净化
    def _semantic_sanitize_gender(desc, old, new)  # ♀️♂️ 性别语义净化
```

**与其他模块的交互**:
- 调用 `AgentEngine` 解析用户指令
- 调用 `runner.py` 执行 AI 生成任务
- 调用 `workflow_io.py` 持久化状态
- 调用 `changes.py` 应用风格/实体变更

### 4.2 AgentEngine - AI 决策引擎

**功能**: 将用户自然语言指令转换为结构化 JSON 操作

**入口文件**: `core/agent_engine.py`

**关键类与方法**:
```python
class AgentEngine:
    def __init__()                                    # 初始化 Gemini 客户端
    def get_action_from_text(user_input, summary)    # 🧠 核心：指令解析
```

**输出的操作类型**:
| 操作 | 用途 | 示例 |
|-----|------|------|
| `set_global_style` | 全局风格迁移 | `{"op": "set_global_style", "value": "Cyberpunk Neon"}` |
| `global_subject_swap` | 简单主体替换 | `{"op": "global_subject_swap", "old_subject": "man", "new_subject": "woman"}` |
| `detailed_subject_swap` | 细粒度角色替换 | 包含 `attributes` 对象（hair_color, clothing 等）|
| `update_shot_params` | 更新单个分镜描述 | 指定 `shot_id` 和新 `description` |
| `enhance_shot_description` | 增强分镜描述 | 添加空间信息和风格强化 |
| `update_cinematography` | 修改摄影参数 | 仅当用户明确要求时使用 |

### 4.3 Runner - 执行引擎

**功能**: 调用 Google AI API 生成 Style Frame 和 Video

**入口文件**: `core/runner.py`

**关键函数**:
```python
def ai_stylize_frame(job_dir, wf, shot) -> str
    # 📸 生成 Style Frame
    # 优先级: Imagen 4.0 → Gemini 2.0 Image Gen → 复制原图

def veo_generate_video(job_dir, wf, shot) -> str
    # 🎬 生成视频
    # 使用 Veo 3.1，支持 Image-to-Video
    # 包含长轮询机制（最长 20 分钟）

def run_stylize(job_dir, wf, shot_id=None)     # 批量/单个定妆图生成
def run_video_generate(job_dir, wf, shot_id=None)  # 批量/单个视频生成
def run_pipeline(job_dir)                       # 完整管道执行
```

**Prompt 工程 - Style Frame**:
```
[STRUCTURE - DO NOT OUTPUT THESE HEADERS]
1. Subject: {who/what is the focus}
2. Action/Pose: {what they're doing, body language}
3. Environment: {setting, background, atmosphere}
4. Style: {artistic treatment from global style}
5. Lighting: {dramatic lighting description}
6. Camera & Tech: {shot scale, position, orientation from cinematography}

[CONSTRAINTS]
- 16:9 widescreen, full-bleed rendering
- Cinematography parameters hard-coded from source
```

**Prompt 工程 - Video**:
```
[IMAGE CONTINUATION PROMPT]
- Camera movement logic based on motion vector
- Specific action from description
- Physics details (hair, fabric, particles)
- Atmosphere continuity
```

### 4.4 Workflow 数据模型

**文件**: `jobs/{job_id}/workflow.json`

**Schema**:
```json
{
  "job_id": "job_xxxxxxxx",
  "source_video": "input.mp4",

  "global": {
    "style_prompt": "Cinematic Realistic",
    "video_model": "veo",
    "identity_anchor": {
      "base_subject": "woman",
      "full_description": "a young woman with golden short hair wearing a red dress",
      "attributes": {
        "hair_color": "golden",
        "hair_style": "short",
        "clothing": "red dress"
      },
      "replaced_from": "man"
    }
  },

  "global_stages": {
    "analyze": "SUCCESS",
    "extract": "SUCCESS",
    "stylize": "NOT_STARTED",
    "video_gen": "NOT_STARTED",
    "merge": "NOT_STARTED"
  },

  "shots": [
    {
      "shot_id": "shot_01",
      "start_time": 0.0,
      "end_time": 3.5,
      "description": "A woman walks along a sunlit beach...\n[SCALE: MEDIUM]\n[POSITION: center-right]\n[ORIENTATION: profile-left]\n[GAZE: looking-off-screen-left]\n[MOTION: walking-left]",

      "cinematography": {
        "shot_scale": "MEDIUM",
        "subject_frame_position": "center-right",
        "subject_orientation": "profile-left",
        "gaze_direction": "looking-off-screen-left",
        "motion_vector": "walking-left",
        "camera_type": "Dolly"
      },

      "assets": {
        "first_frame": "frames/shot_01.png",
        "source_video_segment": "source_segments/shot_01.mp4",
        "stylized_frame": "stylized_frames/shot_01.png",
        "video": "videos/shot_01.mp4"
      },

      "status": {
        "stylize": "SUCCESS",
        "video_generate": "RUNNING"
      },

      "errors": {}
    }
  ],

  "merge_info": {
    "can_merge": false,
    "failed_count": 0,
    "pending_count": 3,
    "message": "Still generating videos..."
  }
}
```

---

## 5. 关键技术路径

### 5.1 视频上传与分析流程
```python
# POST /api/upload
1. 接收文件 → 保存到 temp_uploads/
2. WorkflowManager.initialize_from_file(temp_path)
   ├─ 生成 job_id (uuid)
   ├─ 创建 job_dir 目录结构
   ├─ 复制视频到 job_dir/input.mp4
   ├─ 调用 Gemini Files API 上传视频
   ├─ 等待文件状态变为 ACTIVE
   ├─ 调用 Gemini generate_content 分析视频
   ├─ 解析 JSON → storyboard.json
   ├─ FFmpeg 提取关键帧（从分镜中点）
   ├─ FFmpeg 提取视频片段
   └─ 构建 workflow.json
3. 删除临时文件
4. 返回 { job_id }
```

### 5.2 Agent 指令执行流程
```python
# POST /api/agent/chat
1. 加载当前 workflow
2. 构建摘要（job_id + 全局风格 + 所有分镜描述）
3. AgentEngine.get_action_from_text(user_message, summary)
   └─ Gemini 生成 JSON 指令（强制 response_mime_type='application/json'）
4. WorkflowManager.apply_agent_action(action)
   ├─ set_global_style → 更新全局风格，重置所有分镜状态
   ├─ global_subject_swap → 替换描述中的主体词，保留摄影参数
   ├─ detailed_subject_swap → 注入角色属性，设置 identity_anchor
   └─ ...
5. 保存 workflow.json
6. 返回 { action, result }
```

### 5.3 Style Frame 生成流程
```python
# POST /api/run/stylize?shot_id=shot_01
1. 加载 workflow
2. 构建 structured prompt:
   - 注入全局风格
   - 注入分镜描述
   - 硬编码摄影参数约束
3. 尝试 Imagen 4.0:
   client.models.generate_images(
     model="models/imagen-4.0-generate-001",
     prompt=structured_prompt,
     config=GenerateImagesConfig(aspect_ratio="16:9")
   )
4. 如果失败，降级到 Gemini 2.0 Image Gen
5. 如果都失败，复制原始帧
6. 保存图片到 stylized_frames/shot_XX.png
7. 更新 workflow.json 状态
```

### 5.4 视频生成流程
```python
# POST /api/run/video_generate?shot_id=shot_01
1. 检查 stylized_frame 是否存在（否则先执行 stylize）
2. 读取 stylized_frame 图片
3. 构建 video prompt:
   - 相机运动逻辑（基于 motion_vector）
   - 动作描述
   - 物理细节（头发、织物、粒子）
   - 氛围连续性
4. 调用 Veo 3.1:
   operation = client.models.generate_videos(
     model="veo-3.1-generate-preview",
     prompt=prompt,
     image=Image(image_bytes=..., mime_type="image/png"),
     config=GenerateVideosConfig(aspect_ratio="16:9")
   )
5. 轮询操作状态（最长 20 分钟）
6. 下载生成的视频
7. 保存到 videos/shot_XX.mp4
8. 更新 workflow.json
```

### 5.5 错误处理与重试机制
```python
# Rate Limiting (429)
- 指数退避: 60s → 120s → 180s
- 最多 3 次重试

# API 超时
- Files API: 等待最长 120s
- Veo 生成: 轮询最长 20 分钟，每 10s 检查一次

# 降级策略
- Imagen 4.0 失败 → Gemini 2.0 Image Gen
- 所有图像生成失败 → 复制原始帧（不中断流程）
```

---

## 6. 数据模型详解

### 6.1 Cinematography 参数

| 参数 | 可选值 | 含义 |
|-----|-------|------|
| `shot_scale` | EXTREME_WIDE, WIDE, MEDIUM_WIDE, MEDIUM, MEDIUM_CLOSE, CLOSE_UP, EXTREME_CLOSE_UP | 景别 |
| `subject_frame_position` | top-left, top-center, top-right, center-left, center, center-right, bottom-left, bottom-center, bottom-right | 主体在画面中的位置 |
| `subject_orientation` | facing-camera, back-to-camera, profile-left, profile-right, three-quarter-left, three-quarter-right | 主体朝向 |
| `gaze_direction` | looking-at-camera, looking-left, looking-right, looking-up, looking-down, looking-off-screen-left, looking-off-screen-right | 视线方向 |
| `motion_vector` | static, walking-left, walking-right, walking-toward-camera, walking-away-from-camera, running-*, turning-*, gesturing-* | 运动轨迹 |
| `camera_type` | Static, Dolly, Pan, Tilt, Zoom, Handheld, Crane | 镜头类型 |

### 6.2 Shot 状态机
```
         ┌───────────────┐
         │  NOT_STARTED  │
         └───────┬───────┘
                 │ run_node()
                 ▼
         ┌───────────────┐
         │    RUNNING    │
         └───────┬───────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
┌───────────────┐ ┌───────────────┐
│    SUCCESS    │ │    FAILED     │
└───────────────┘ └───────────────┘
```

### 6.3 Identity Anchor 结构
```json
{
  "base_subject": "woman",           // 基础主体词
  "full_description": "a young woman with golden short hair wearing a red dress",
  "attributes": {
    "hair_color": "golden",
    "hair_style": "short",
    "clothing": "red dress",
    "age_descriptor": "young"
  },
  "replaced_from": "man"             // 原主体（用于性别净化）
}
```

---

## 7. 配置与环境

### 7.1 环境变量

| 变量名 | 必需 | 说明 |
|-------|-----|------|
| `GEMINI_API_KEY` | ✅ | Google AI API 密钥 |
| `PORT` | ❌ | 服务端口（Railway 自动设置）|

### 7.2 配置文件

#### `railway.json`
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn app:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### `nixpacks.toml`
```toml
[phases.setup]
nixPkgs = ["python312", "ffmpeg"]  # 关键：安装 ffmpeg

[phases.install]
cmds = ["python -m venv --copies /opt/venv", ". /opt/venv/bin/activate", "pip install -r requirements.txt"]

[start]
cmd = "uvicorn app:app --host 0.0.0.0 --port $PORT"
```

### 7.3 开发/生产环境差异

| 方面 | 开发环境 | 生产环境 (Railway) |
|-----|---------|-------------------|
| 端口 | 8000 (硬编码) | $PORT (环境变量) |
| FFmpeg 路径 | `/opt/homebrew/bin/ffmpeg` | `shutil.which("ffmpeg")` |
| 热重载 | 支持 | 不支持 |
| 调试日志 | 详细 | 精简 |

---

## 8. 代码规范与约定

### 8.1 命名约定
- **文件名**: snake_case (`workflow_manager.py`)
- **类名**: PascalCase (`WorkflowManager`)
- **函数名**: snake_case (`apply_agent_action`)
- **常量**: UPPER_SNAKE_CASE (`DIRECTOR_METAPROMPT`)
- **私有方法**: 前缀下划线 (`_is_scenery_shot`)

### 8.2 文件组织规则
- 核心业务逻辑放在 `core/` 目录
- 工具脚本放在项目根目录
- 每个 job 的数据隔离在 `jobs/{job_id}/` 目录

### 8.3 注释风格
- 使用中文注释（项目主要面向中文用户）
- 关键逻辑使用 emoji 标注:
  - 🎬 摄影相关
  - 🤖 AI 相关
  - 💡 重要提示
  - ⚠️ 警告
  - ✅ 正确示例
  - ❌ 错误示例

### 8.4 设计模式
- **状态机模式**: Shot 状态管理
- **策略模式**: 图像生成降级策略
- **工厂模式**: WorkflowManager 创建 job
- **观察者模式**: 前端轮询状态变更

### 8.5 项目特有的编码惯例

**摄影参数标签格式**:
```
[SCALE: MEDIUM]
[POSITION: center-right]
[ORIENTATION: profile-left]
[GAZE: looking-left]
[MOTION: walking-right]
```
这些标签嵌入在 `description` 字段中，用正则提取。

**SUBJECT_PLACEHOLDER**:
在 prompt 模板中使用 `{SUBJECT_PLACEHOLDER}` 作为角色描述的占位符。

---

## 9. 已知限制与技术债务

### 9.1 当前架构限制
| 限制 | 影响 | 可能的解决方案 |
|-----|------|---------------|
| 单进程执行 | 无法并行处理多个 shot | 引入 Celery 任务队列 |
| JSON 文件存储 | 不支持并发写入 | 迁移到 SQLite/PostgreSQL |
| 前端轮询 | 延迟 3 秒，带宽浪费 | 使用 WebSocket 推送 |
| 无认证机制 | 任何人可访问 | 添加密码保护/OAuth |

### 9.2 技术债务
- [ ] `workflow_manager.py` 文件过大（1000+ 行），需要拆分
- [ ] 部分函数缺少类型注解
- [ ] 错误消息硬编码，未国际化
- [ ] 测试覆盖率不足

### 9.3 待优化的性能瓶颈
- **Veo 生成时间**: 单个 shot 可能需要 5-10 分钟
- **串行执行**: 多个 shot 的 stylize/video 是串行的
- **大文件上传**: 没有分片上传支持

### 9.4 未完成的功能
- [ ] 密码保护访问
- [ ] 多用户支持
- [ ] 历史版本回滚
- [ ] 实时进度条（而非轮询）
- [ ] 批量导出多风格版本

---

## 10. 扩展指南

### 10.1 如何添加新的 Agent 操作

1. **定义操作 schema** (`core/agent_engine.py`):
```python
# 在 system_prompt 中添加新操作说明
"""
5. 新操作名: {{"op": "new_operation", "param1": "值1", "param2": "值2"}}
   - 功能说明
   - 参数要求
"""
```

2. **实现处理逻辑** (`core/workflow_manager.py`):
```python
def apply_agent_action(self, action):
    # ...
    elif op == "new_operation":
        return self._handle_new_operation(action)

def _handle_new_operation(self, action):
    param1 = action.get("param1")
    param2 = action.get("param2")
    # 实现逻辑
    self.save()
    return {"status": "success", "affected": count}
```

### 10.2 如何添加新的 API 端点

```python
# app.py
from pydantic import BaseModel

class NewRequest(BaseModel):
    field1: str
    field2: Optional[int] = None

@app.post("/api/new-endpoint")
async def new_endpoint(req: NewRequest):
    # 1. 验证请求
    # 2. 调用 manager 方法
    result = manager.some_method(req.field1, req.field2)
    # 3. 返回响应
    return {"status": "success", "data": result}
```

### 10.3 如何添加新的 AI 模型支持

1. **在 `runner.py` 中添加新函数**:
```python
def new_model_generate(job_dir: Path, wf: dict, shot: dict) -> str:
    from google import genai
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    # 构建 prompt
    # 调用新模型 API
    # 处理响应
    # 保存结果
    return relative_path
```

2. **在 `workflow_manager.py` 中集成**:
```python
def run_node(self, node_type, shot_id):
    if node_type == "new_model":
        from core.runner import new_model_generate
        result = new_model_generate(self.job_dir, self.workflow, shot)
```

### 10.4 测试策略

**手动测试流程**:
1. 上传测试视频（建议 < 30 秒）
2. 验证分镜拆解结果
3. 发送 Agent 指令（风格修改、角色替换）
4. 执行 stylize 和 video_generate
5. 检查生成质量

**自动化测试** (待实现):
```python
# smoke_test_core.py
def test_workflow_initialization():
    manager = WorkflowManager(job_id="test_job")
    assert manager.job_id == "test_job"

def test_agent_parsing():
    agent = AgentEngine()
    action = agent.get_action_from_text("改成赛博朋克风格", "Job: test")
    assert action[0]["op"] == "set_global_style"
```

### 10.5 部署流程

**Railway 部署**:
```bash
# 1. 提交代码
git add .
git commit -m "feat: new feature"
git push origin main

# 2. Railway 自动触发部署（已连接 GitHub）

# 3. 检查部署日志
# Railway Dashboard → Deployments → View Logs

# 4. 验证
curl https://your-app.up.railway.app/api/workflow
```

**本地验证生产配置**:
```bash
# 模拟 Railway 启动命令
PORT=8080 uvicorn app:app --host 0.0.0.0 --port $PORT
```

---

## 附录 A: API 完整参考

### A.1 POST /api/upload
**请求**: `multipart/form-data`
```
file: (binary) 视频文件
```
**响应**:
```json
{"status": "success", "job_id": "job_xxxxxxxx"}
```

### A.2 GET /api/workflow
**请求参数**: `?job_id=job_xxx` (可选)
**响应**: 完整 workflow.json

### A.3 POST /api/agent/chat
**请求**:
```json
{"message": "把风格改成赛博朋克", "job_id": "job_xxx"}
```
**响应**:
```json
{
  "action": [{"op": "set_global_style", "value": "Cyberpunk Neon"}],
  "result": {"status": "success", "affected_shots": 5}
}
```

### A.4 POST /api/run/{node_type}
**路径参数**: `stylize` | `video_generate` | `merge`
**查询参数**: `?shot_id=shot_01&job_id=job_xxx`
**响应**:
```json
{"status": "started", "job_id": "job_xxx"}
```

### A.5 POST /api/shot/update
**请求**:
```json
{
  "shot_id": "shot_01",
  "description": "新的描述内容",
  "job_id": "job_xxx"
}
```
**响应**:
```json
{"status": "success", "affected_shots": 1}
```

---

## 附录 B: 常见问题排查

### B.1 500 错误: ffmpeg not found
**原因**: Railway 环境未安装 ffmpeg
**解决**: 确保 `nixpacks.toml` 包含 `ffmpeg`:
```toml
[phases.setup]
nixPkgs = ["python312", "ffmpeg"]
```

### B.2 视频分析超时
**原因**: 视频文件过大或编码不兼容
**解决**:
- 压缩视频到 < 100MB
- 转码为 H.264 MP4 格式

### B.3 Imagen 生成失败
**原因**: Prompt 包含敏感内容或 API 配额用尽
**解决**:
- 检查 prompt 内容
- 等待配额重置
- 系统会自动降级到 Gemini 2.0 Image Gen

### B.4 Veo 生成卡住
**原因**: 生成时间可能很长（5-10 分钟）
**解决**:
- 耐心等待
- 检查 Railway 日志确认轮询状态
- 20 分钟后会自动超时

---

*文档结束*
