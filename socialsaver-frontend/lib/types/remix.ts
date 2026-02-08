export interface StoryThemeAnalysis {
  basicInfo: {
    title: string
    type: string
    duration: string
    creator: string
    background: string
  }
  coreTheme: {
    summary: string
    keywords: string
  }
  narrative: {
    startingPoint: string
    coreConflict: string
    climax: string
    ending: string
  }
  narrativeStructure: {
    narrativeMethod: string
    timeStructure: string
  }
  characterAnalysis: {
    protagonist: string
    characterChange: string
    relationships: string
  }
  audioVisual: {
    visualStyle: string
    cameraLanguage: string
    soundDesign: string
  }
  symbolism: {
    repeatingImagery: string
    symbolicMeaning: string
  }
  thematicStance: {
    creatorAttitude: string
    emotionalTone: string
  }
  realWorldSignificance: {
    socialEmotionalValue: string
    audienceInterpretation: string
  }
}

export interface ScriptAnalysis {
  basicInfo: {
    scriptName: string
    typeStyle: string
    length: string
    creativeBackground: string
  }
  themeIntent: {
    coreTheme: string
    subTheme: string
    valueStance: string
  }
  storyStructure: {
    storyWorld: string
    threeActStructure: string
    plotPoints: string
    endingType: string
  }
  characterSystem: {
    protagonist: string
    antagonist: string
    supportingRoles: string
    relationships: string
  }
  characterArc: {
    initialState: string
    actionChanges: string
    finalState: string
  }
  conflictDesign: {
    externalConflict: string
    internalConflict: string
    conflictEscalation: string
  }
  plotRhythm: {
    sceneArrangement: string
    rhythmControl: string
    suspenseSetting: string
  }
  dialogueAction: {
    dialogueFunction: string
    subtext: string
    behaviorLogic: string
  }
  symbolMetaphor: {
    coreImagery: string
    symbolicMeaning: string
  }
  genreStyle: {
    genreRules: string
    narrativeStyle: string
  }
  visualPotential: {
    visualSense: string
    audioVisualSpace: string
  }
  overallEvaluation: {
    strengths: string
    weaknesses: string
    revisionDirection: string
  }
}

export interface StoryboardShot {
  // 基本信息
  shotNumber: number
  firstFrameImage: string
  // 描述字段
  visualDescription: string       // frame_description - 首帧描述
  contentDescription: string      // content_analysis - 内容分析
  // 时间信息
  startSeconds: number
  endSeconds: number
  durationSeconds: number
  // 摄影机参数
  shotType?: string               // shot_type - 镜头类型/景别
  shotSize: string                // 兼容旧字段
  cameraAngle: string             // camera_angle - 摄影机角度
  cameraMovement: string          // camera_movement - 摄影机运动
  focusAndDepth?: string          // focus_and_depth - 焦距与景深
  focalLengthDepth: string        // 兼容旧字段
  // 光线
  lighting: string
  // 音频
  musicAndSound?: string          // music_and_sound - 音乐与音效
  soundDesign?: string
  music: string
  // 对白/旁白
  voiceover?: string              // voiceover - 对白/旁白
  dialogueVoiceover: string       // 兼容旧字段
  dialogueText?: string
}

export interface RemixAnalysisResult {
  storyTheme: StoryThemeAnalysis
  scriptAnalysis: ScriptAnalysis
  storyboard: StoryboardShot[]
  suggestedModifications?: string[]
}

export interface GeneratedScript {
  content: string
  missingMaterials: string[]
}

export type AnalysisStep = "upload" | "analyzing" | "results" | "generating" | "script" | "views" | "generatingStoryboard" | "storyboard" | "video"

// Character and Scene Three-View Types
export interface CharacterView {
  id: string
  name: string
  frontView?: string
  sideView?: string
  backView?: string
  description: string
  confirmed: boolean
}

export interface SceneView {
  id: string
  name: string
  establishingShot?: string
  detailView?: string
  alternateAngle?: string
  description: string
  confirmed: boolean
}

// Asset Library Types
export type AssetType = "storyboard" | "character" | "script" | "theme" | "video"

export interface SourceVideoInfo {
  name: string
  size: number
  url?: string
}

export interface BaseAsset {
  id: string
  name: string
  type: AssetType
  createdAt: string
  updatedAt: string
  tags: string[]
  thumbnail?: string
  sourceVideo?: SourceVideoInfo
}

export interface StoryboardAsset extends BaseAsset {
  type: "storyboard"
  data: StoryboardShot
}

export interface CharacterAsset extends BaseAsset {
  type: "character"
  data: {
    name: string
    description: string
    traits: string[]
    relationships: string
    imageUrl?: string
  }
}

export interface ScriptAsset extends BaseAsset {
  type: "script"
  data: {
    content: string
    analysis?: ScriptAnalysis
  }
}

export interface ThemeAsset extends BaseAsset {
  type: "theme"
  data: StoryThemeAnalysis
}

export interface VideoAsset extends BaseAsset {
  type: "video"
  data: {
    url: string
    duration: number
    format: string
    resolution: string
  }
}

export type Asset = StoryboardAsset | CharacterAsset | ScriptAsset | ThemeAsset | VideoAsset

// Trending Radar Types
export type SocialPlatform = "x" | "youtube" | "instagram" | "tiktok"

export interface TrendingPost {
  id: string
  platform: SocialPlatform
  postUrl: string
  videoUrl: string
  thumbnailUrl: string
  title: string
  author: string
  authorAvatar?: string
  plays: number
  shares: number
  likes: number
  comments: number
  saves: number
  publishedAt: string
  crawledAt: string
  lastRemixPushedAt?: string
  selected: boolean
}

// Batch Remix Types
export type BatchJobStatus = "pending" | "analyzing" | "completed" | "failed"

export interface BatchRemixJob {
  id: string
  videoName: string
  videoUrl: string
  thumbnailUrl?: string
  status: BatchJobStatus
  progress: number
  startedAt?: string
  completedAt?: string
  error?: string
  analysisResult?: RemixAnalysisResult
  sourcePost?: TrendingPost
}
