// lib/api.ts
// SocialSaver 前端 API 配置与调用函数

// 后端 API 基础 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://g3videoagent-production.up.railway.app";

// ============================================================
// 类型定义
// ============================================================

export interface UploadResponse {
  status: string;
  job_id: string;
}

export interface JobStatus {
  jobId: string;
  totalShots: number;
  stylizedCount: number;
  videoGeneratedCount: number;
  runningCount: number;
  canMerge: boolean;
  globalStages: Record<string, string>;
  globalStyle: string;
}

export interface SocialSaverStoryboard {
  jobId: string;
  sourceVideo: string;
  globalStyle: string;
  storyboard: SocialSaverShot[];
  status: {
    analyze: string;
    stylize: string;
    videoGen: string;
    merge: string;
  };
}

export interface SocialSaverShot {
  shotNumber: number;
  firstFrameImage: string;
  visualDescription: string;
  contentDescription: string;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  shotSize: string;
  cameraAngle: string;
  cameraMovement: string;
  focalLengthDepth: string;
  lighting: string;
  music: string;
  dialogueVoiceover: string;
}

export interface AgentChatResponse {
  action: any;
  result: {
    status: string;
    affected_shots?: number;
  };
}

// ============================================================
// API 调用函数
// ============================================================

/**
 * 上传视频并触发 AI 分析
 */
export async function uploadVideo(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(error.detail || "Upload failed");
  }

  return response.json();
}

/**
 * 获取 SocialSaver 格式的分镜表
 */
export async function getStoryboard(jobId: string): Promise<SocialSaverStoryboard> {
  const response = await fetch(`${API_BASE_URL}/api/job/${jobId}/storyboard`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to fetch storyboard" }));
    throw new Error(error.detail || "Failed to fetch storyboard");
  }

  return response.json();
}

/**
 * 获取作业状态
 */
export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const response = await fetch(`${API_BASE_URL}/api/job/${jobId}/status`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to fetch status" }));
    throw new Error(error.detail || "Failed to fetch status");
  }

  return response.json();
}

/**
 * 获取原始 workflow（ReTake 格式）
 */
export async function getWorkflow(jobId?: string): Promise<any> {
  const url = jobId
    ? `${API_BASE_URL}/api/workflow?job_id=${jobId}`
    : `${API_BASE_URL}/api/workflow`;

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to fetch workflow" }));
    throw new Error(error.detail || "Failed to fetch workflow");
  }

  return response.json();
}

/**
 * 发送 Agent 聊天消息（修改分镜、风格等）
 */
export async function sendAgentChat(message: string, jobId: string): Promise<AgentChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/agent/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      job_id: jobId,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Chat request failed" }));
    throw new Error(error.detail || "Chat request failed");
  }

  return response.json();
}

/**
 * 运行任务节点（stylize, video_generate, merge）
 */
export async function runTask(
  nodeType: "stylize" | "video_generate" | "merge",
  jobId: string,
  shotId?: string
): Promise<{ status: string; job_id: string; file?: string }> {
  const params = new URLSearchParams();
  params.append("job_id", jobId);
  if (shotId) {
    params.append("shot_id", shotId);
  }

  const response = await fetch(`${API_BASE_URL}/api/run/${nodeType}?${params.toString()}`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Task failed" }));
    throw new Error(error.detail || "Task failed");
  }

  return response.json();
}

/**
 * 更新单个分镜
 */
export async function updateShot(
  jobId: string,
  shotId: string,
  description: string
): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/shot/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      job_id: jobId,
      shot_id: shotId,
      description,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Update failed" }));
    throw new Error(error.detail || "Update failed");
  }

  return response.json();
}

/**
 * 获取资源完整 URL
 */
export function getAssetUrl(jobId: string, assetPath: string): string {
  if (!assetPath) return "";
  // 如果已经是完整 URL，直接返回
  if (assetPath.startsWith("http")) return assetPath;
  // 构建完整 URL
  return `${API_BASE_URL}/assets/${jobId}/${assetPath}`;
}

/**
 * 获取 Film IR Story Theme 分析结果
 */
export async function getStoryTheme(jobId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/job/${jobId}/film_ir/story_theme`);

  if (!response.ok) {
    if (response.status === 404) {
      return null; // Story theme not ready yet
    }
    const error = await response.json().catch(() => ({ detail: "Failed to fetch story theme" }));
    throw new Error(error.detail || "Failed to fetch story theme");
  }

  return response.json();
}

/**
 * 轮询作业状态直到完成
 */
export async function pollJobStatus(
  jobId: string,
  onUpdate: (status: JobStatus) => void,
  intervalMs: number = 3000,
  maxAttempts: number = 200
): Promise<JobStatus> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const status = await getJobStatus(jobId);
    onUpdate(status);

    // 检查是否所有任务都完成
    const allDone = status.runningCount === 0 &&
      (status.globalStages.analyze === "SUCCESS" || status.globalStages.analyze === "FAILED");

    if (allDone) {
      return status;
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
    attempts++;
  }

  throw new Error("Polling timeout");
}
