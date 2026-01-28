"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { BatchQueue } from "@/components/remix/batch-queue"
import { SimpleVideoUpload } from "@/components/simple-video-upload"
import { StoryThemeTable } from "@/components/remix/story-theme-table"
import { ScriptAnalysisTable } from "@/components/remix/script-analysis-table"
import { StoryboardTable } from "@/components/remix/storyboard-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowLeft, 
  Upload, 
  List, 
  History, 
  Loader2,
  CheckCircle,
  Video,
  Play,
  ArrowRight,
  FolderOpen
} from "lucide-react"
import type { BatchRemixJob, TrendingPost, RemixAnalysisResult } from "@/lib/types/remix"

// Mock analysis result generator
const generateMockAnalysis = (): RemixAnalysisResult => ({
  storyTheme: {
    basicInfo: {
      title: "Urban Dreams",
      type: "Short Film / Drama",
      duration: "3:45",
      creator: "Content Creator",
      background: "Modern urban setting, exploring themes of connection",
    },
    coreTheme: { 
      summary: "Finding authentic connection in a disconnected world", 
      keywords: "Connection, Isolation, Urban life, Authenticity" 
    },
    narrative: {
      startingPoint: "Protagonist navigates daily routine in isolation",
      coreConflict: "Desire for connection vs. fear of vulnerability",
      climax: "Unexpected encounter leads to breakthrough moment",
      ending: "Open-ended, suggesting new possibilities",
    },
    narrativeStructure: { 
      narrativeMethod: "Linear with flashback elements", 
      timeStructure: "Present day with memory inserts" 
    },
    characterAnalysis: {
      protagonist: "Young professional, introspective, guarded",
      characterChange: "Gradual opening up, accepting vulnerability",
      relationships: "Stranger becomes catalyst for change",
    },
    audioVisual: {
      visualStyle: "Muted colors, strong contrast, intimate framing",
      cameraLanguage: "Close-ups, tracking shots, shallow depth",
      soundDesign: "Ambient urban sounds, minimal dialogue, emotional score",
    },
    symbolism: { 
      repeatingImagery: "Windows, reflections, parallel lines", 
      symbolicMeaning: "Barriers between self and world" 
    },
    thematicStance: { 
      creatorAttitude: "Empathetic, hopeful undertone", 
      emotionalTone: "Melancholic with moments of warmth" 
    },
    realWorldSignificance: {
      socialEmotionalValue: "Resonates with modern urban isolation",
      audienceInterpretation: "Universal theme of human connection",
    },
  },
  scriptAnalysis: {
    basicInfo: {
      scriptName: "Urban Dreams",
      typeStyle: "Drama / Slice of Life",
      length: "3-4 minutes",
      creativeBackground: "Inspired by urban loneliness phenomena",
    },
    themeIntent: { 
      coreTheme: "Human connection in isolation", 
      subTheme: "Self-discovery through others", 
      valueStance: "Authentic connection requires vulnerability" 
    },
    storyStructure: {
      storyWorld: "Contemporary city, coffee shops, apartments",
      threeActStructure: "Setup (isolation) - Confrontation (encounter) - Resolution (opening)",
      plotPoints: "Morning routine, chance meeting, shared moment, parting",
      endingType: "Open / Hopeful",
    },
    characterSystem: {
      protagonist: "Alex - 28, designer, recently relocated",
      antagonist: "Internal - fear of rejection",
      supportingRoles: "Jordan - stranger with similar energy",
      relationships: "Strangers to potential friends",
    },
    characterArc: { 
      initialState: "Closed off, routine-bound", 
      actionChanges: "Risk-taking, small talk, vulnerability", 
      finalState: "Open to possibilities" 
    },
    conflictDesign: {
      externalConflict: "Navigating social interaction",
      internalConflict: "Fear vs. desire for connection",
      conflictEscalation: "Each exchange raises emotional stakes",
    },
    plotRhythm: {
      sceneArrangement: "Quiet - tense - warm - open",
      rhythmControl: "Slow build, lingering moments",
      suspenseSetting: "Will they connect or retreat?",
    },
    dialogueAction: { 
      dialogueFunction: "Subtext-heavy, revealing character", 
      subtext: "What's unsaid matters more", 
      behaviorLogic: "Actions reveal true feelings" 
    },
    symbolMetaphor: { 
      coreImagery: "Coffee cups, empty chairs, city lights", 
      symbolicMeaning: "Potential for connection everywhere" 
    },
    genreStyle: { 
      genreRules: "Realistic, understated drama", 
      narrativeStyle: "Observational, intimate" 
    },
    visualPotential: { 
      visualSense: "Strong visual storytelling potential", 
      audioVisualSpace: "Room for ambient soundscape" 
    },
    overallEvaluation: { 
      strengths: "Relatable theme, strong visual concept", 
      weaknesses: "May feel slow to some audiences", 
      revisionDirection: "Consider adding more external stakes" 
    },
  },
  storyboard: [
    {
      shotNumber: 1,
      firstFrameImage: "",
      visualDescription: "Wide establishing shot of city skyline at dawn",
      contentDescription: "Introduction to the urban setting, sun rising between buildings",
      startSeconds: 0,
      endSeconds: 5,
      durationSeconds: 5,
      shotSize: "Wide Shot",
      cameraAngle: "Eye Level",
      cameraMovement: "Slow pan right",
      focalLengthDepth: "Deep focus",
      lighting: "Natural, golden hour",
      music: "Soft ambient intro",
      dialogueVoiceover: "None",
    },
    {
      shotNumber: 2,
      firstFrameImage: "",
      visualDescription: "Close-up of protagonist waking up",
      contentDescription: "Alex opens eyes, moment of stillness before day begins",
      startSeconds: 5,
      endSeconds: 10,
      durationSeconds: 5,
      shotSize: "Close-up",
      cameraAngle: "Slightly high angle",
      cameraMovement: "Static",
      focalLengthDepth: "Shallow, face in focus",
      lighting: "Soft window light",
      music: "Ambient continues",
      dialogueVoiceover: "None",
    },
    {
      shotNumber: 3,
      firstFrameImage: "",
      visualDescription: "Medium shot of morning routine",
      contentDescription: "Quick montage of getting ready - automated, detached",
      startSeconds: 10,
      endSeconds: 25,
      durationSeconds: 15,
      shotSize: "Medium Shot",
      cameraAngle: "Eye Level",
      cameraMovement: "Tracking",
      focalLengthDepth: "Normal",
      lighting: "Interior, neutral",
      music: "Rhythm builds slightly",
      dialogueVoiceover: "None",
    },
  ],
})

export default function BatchRemixWorkspace() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"queue" | "upload" | "history">("queue")
  const [jobs, setJobs] = useState<BatchRemixJob[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [historyJobs, setHistoryJobs] = useState<BatchRemixJob[]>([])
  
  // Upload state for showing analysis results
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadAnalysisResult, setUploadAnalysisResult] = useState<RemixAnalysisResult | null>(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)

  // Load pending posts from Trending Radar on mount
  useEffect(() => {
    const pendingPosts = sessionStorage.getItem("pendingRemixPosts")
    if (pendingPosts) {
      try {
        const posts: TrendingPost[] = JSON.parse(pendingPosts)
        const newJobs: BatchRemixJob[] = posts.map(post => ({
          id: `job-${post.id}`,
          videoName: post.title,
          videoUrl: post.videoUrl,
          thumbnailUrl: post.thumbnailUrl,
          status: "pending" as const,
          progress: 0,
          sourcePost: post,
        }))
        setJobs(prev => [...prev, ...newJobs])
        sessionStorage.removeItem("pendingRemixPosts")
      } catch (e) {
        console.error("Failed to parse pending posts:", e)
      }
    }
    
    // Load history from localStorage
    const savedHistory = localStorage.getItem("remixJobHistory")
    if (savedHistory) {
      try {
        setHistoryJobs(JSON.parse(savedHistory))
      } catch (e) {
        console.error("Failed to load history:", e)
      }
    }
  }, [])

  // Save completed jobs to history
  useEffect(() => {
    const completed = jobs.filter(j => j.status === "completed")
    if (completed.length > 0) {
      setHistoryJobs(prev => {
        const existing = new Set(prev.map(j => j.id))
        const newCompleted = completed.filter(j => !existing.has(j.id))
        const updated = [...newCompleted, ...prev].slice(0, 50) // Keep last 50
        localStorage.setItem("remixJobHistory", JSON.stringify(updated))
        return updated
      })
    }
  }, [jobs])

  // Process jobs sequentially
  const processJobs = useCallback(async () => {
    setIsProcessing(true)
    
    const pendingJobs = jobs.filter(j => j.status === "pending")
    
    for (const job of pendingJobs) {
      setJobs(prev =>
        prev.map(j =>
          j.id === job.id
            ? { ...j, status: "analyzing" as const, startedAt: new Date().toISOString(), progress: 0 }
            : j
        )
      )

      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 300))
        setJobs(prev =>
          prev.map(j => (j.id === job.id ? { ...j, progress } : j))
        )
      }

      setJobs(prev =>
        prev.map(j =>
          j.id === job.id
            ? {
                ...j,
                status: "completed" as const,
                progress: 100,
                completedAt: new Date().toISOString(),
                analysisResult: generateMockAnalysis(),
              }
            : j
        )
      )
    }

    setIsProcessing(false)
  }, [jobs])

  const handleStartAll = () => {
    processJobs()
  }

  const handlePauseAll = () => {
    setIsProcessing(false)
  }

  const handleJobSelect = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId) || historyJobs.find(j => j.id === jobId)
    if (job?.status === "completed" && job.analysisResult) {
      // Store the job data for the main remix page to pick up
      sessionStorage.setItem("continueRemixJob", JSON.stringify({
        jobId: job.id,
        videoName: job.videoName,
        videoUrl: job.videoUrl,
        thumbnailUrl: job.thumbnailUrl,
        analysisResult: job.analysisResult,
        sourcePost: job.sourcePost,
      }))
      // Navigate to main remix page to continue the full workflow
      router.push("/dashboard/remix?continue=true")
    }
  }

  const handleJobRemove = (jobId: string) => {
    setJobs(prev => prev.filter(j => j.id !== jobId))
  }

  const handleVideoUpload = async (files: File[]) => {
    if (files.length === 0) return
    
    setUploadedFiles(files)
    setIsAnalyzing(true)
    setUploadAnalysisResult(null)
    
    // Create preview URL
    if (files.length > 0) {
      const url = URL.createObjectURL(files[0])
      setVideoPreviewUrl(url)
    }
    
    // Simulate analysis
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    setUploadAnalysisResult(generateMockAnalysis())
    setIsAnalyzing(false)
  }

  const handleAddToQueue = () => {
    // Add analyzed videos to queue
    const newJobs: BatchRemixJob[] = uploadedFiles.map((file, index) => ({
      id: `job-upload-${Date.now()}-${index}`,
      videoName: file.name,
      videoUrl: URL.createObjectURL(file),
      status: "completed" as const,
      progress: 100,
      completedAt: new Date().toISOString(),
      analysisResult: uploadAnalysisResult || undefined,
    }))
    
    setJobs(prev => [...prev, ...newJobs])
    setActiveTab("queue")
    
    // Reset upload state
    setUploadedFiles([])
    setUploadAnalysisResult(null)
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl)
      setVideoPreviewUrl(null)
    }
  }

  const handleClearHistory = () => {
    setHistoryJobs([])
    localStorage.removeItem("remixJobHistory")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/remix")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Single Mode
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Remix Workspace</h1>
            <p className="text-muted-foreground">
              Process multiple videos and manage your remix history
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "queue" | "upload" | "history")}>
        <TabsList className="bg-secondary">
          <TabsTrigger
            value="queue"
            className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
          >
            <List className="w-4 h-4 mr-2" />
            Queue ({jobs.length})
          </TabsTrigger>
          <TabsTrigger
            value="upload"
            className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
          >
            <Upload className="w-4 h-4 mr-2" />
            Add Videos
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
          >
            <History className="w-4 h-4 mr-2" />
            History ({historyJobs.length})
          </TabsTrigger>
        </TabsList>

        {/* Queue Tab */}
        <TabsContent value="queue" className="mt-4">
          <BatchQueue
            jobs={jobs}
            onJobSelect={handleJobSelect}
            onJobRemove={handleJobRemove}
            onStartAll={handleStartAll}
            onPauseAll={handlePauseAll}
            isProcessing={isProcessing}
          />
        </TabsContent>

        {/* Upload Tab - Shows analysis results after upload */}
        <TabsContent value="upload" className="mt-4 space-y-6">
          {/* Upload Area */}
          {!uploadAnalysisResult && !isAnalyzing && (
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <SimpleVideoUpload onSubmit={handleVideoUpload} isLoading={false} />
              </CardContent>
            </Card>
          )}
          
          {/* Analyzing State */}
          {isAnalyzing && (
            <Card className="bg-card border-border">
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Analyzing Video...
                  </h3>
                  <p className="text-muted-foreground">
                    Extracting story themes, script analysis, and storyboard breakdown
                  </p>
                  <Progress value={66} className="w-64 mt-4" />
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Analysis Results */}
          {uploadAnalysisResult && !isAnalyzing && (
            <div className="space-y-6">
              {/* Video Preview Header */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-accent" />
                      Analysis Complete
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setUploadedFiles([])
                          setUploadAnalysisResult(null)
                          if (videoPreviewUrl) {
                            URL.revokeObjectURL(videoPreviewUrl)
                            setVideoPreviewUrl(null)
                          }
                        }}
                        className="border-border text-foreground hover:bg-secondary bg-transparent"
                      >
                        Upload Another
                      </Button>
                      <Button
                        onClick={handleAddToQueue}
                        className="bg-accent text-accent-foreground hover:bg-accent/90"
                      >
                        <FolderOpen className="w-4 h-4 mr-2" />
                        Add to Queue
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Video Preview */}
                    <div className="lg:w-1/3">
                      {videoPreviewUrl ? (
                        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                          <video
                            className="w-full h-full object-contain"
                            controls
                            preload="metadata"
                          >
                            <source src={videoPreviewUrl} type="video/mp4" />
                          </video>
                        </div>
                      ) : (
                        <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center">
                          <Play className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    {/* Video Info */}
                    <div className="lg:w-2/3 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">File Name</p>
                        <p className="text-foreground font-medium truncate">
                          {uploadedFiles[0]?.name || "Unknown"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">File Size</p>
                        <p className="text-foreground font-medium">
                          {uploadedFiles[0] ? `${(uploadedFiles[0].size / (1024 * 1024)).toFixed(2)} MB` : "Unknown"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Shots Found</p>
                        <p className="text-foreground font-medium">
                          {uploadAnalysisResult.storyboard.length}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge className="bg-accent/20 text-accent border-accent/30">
                          Ready
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Analysis Tables */}
              <StoryThemeTable data={uploadAnalysisResult.storyTheme} showSaveButton />
              <ScriptAnalysisTable data={uploadAnalysisResult.scriptAnalysis} showSaveButton />
              <StoryboardTable 
                data={uploadAnalysisResult.storyboard} 
                title="Storyboard Breakdown"
                showSaveButtons
              />
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground">Processing History</CardTitle>
                {historyJobs.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearHistory}
                    className="border-border text-muted-foreground hover:bg-secondary bg-transparent"
                  >
                    Clear History
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {historyJobs.length === 0 ? (
                <div className="py-12 text-center">
                  <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No processing history yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Completed jobs will appear here
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {historyJobs.map(job => (
                    <div
                      key={job.id}
                      className="flex items-center gap-4 py-4 cursor-pointer hover:bg-secondary/50 -mx-4 px-4 transition-colors"
                      onClick={() => handleJobSelect(job.id)}
                    >
                      {/* Thumbnail */}
                      <div className="relative w-20 h-12 bg-secondary rounded overflow-hidden flex-shrink-0">
                        {job.thumbnailUrl ? (
                          <img
                            src={job.thumbnailUrl || "/placeholder.svg"}
                            alt={job.videoName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Video className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {job.videoName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {job.completedAt
                            ? `Completed ${new Date(job.completedAt).toLocaleDateString()} at ${new Date(job.completedAt).toLocaleTimeString()}`
                            : "Unknown date"}
                        </p>
                      </div>

                      {/* Status */}
                      <Badge className="bg-accent/20 text-accent border-accent/30">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>

                      {/* Action */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-accent hover:text-accent hover:bg-accent/10"
                      >
                        View
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
