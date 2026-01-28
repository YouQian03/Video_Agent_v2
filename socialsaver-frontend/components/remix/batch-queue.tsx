"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Play,
  Pause,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  ArrowRight,
  LayoutGrid,
  List,
} from "lucide-react"
import type { BatchRemixJob, BatchJobStatus } from "@/lib/types/remix"

interface BatchQueueProps {
  jobs: BatchRemixJob[]
  onJobSelect: (jobId: string) => void
  onJobRemove: (jobId: string) => void
  onStartAll: () => void
  onPauseAll: () => void
  isProcessing: boolean
}

const StatusBadge = ({ status }: { status: BatchJobStatus }) => {
  switch (status) {
    case "pending":
      return (
        <Badge variant="secondary" className="bg-secondary text-muted-foreground">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      )
    case "analyzing":
      return (
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Analyzing
        </Badge>
      )
    case "completed":
      return (
        <Badge className="bg-accent/20 text-accent border-accent/30">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      )
    case "failed":
      return (
        <Badge variant="destructive" className="bg-destructive/20 text-destructive">
          <AlertCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      )
  }
}

export function BatchQueue({
  jobs,
  onJobSelect,
  onJobRemove,
  onStartAll,
  onPauseAll,
  isProcessing,
}: BatchQueueProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const completedCount = jobs.filter(j => j.status === "completed").length
  const totalCount = jobs.length
  const overallProgress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const pendingJobs = jobs.filter(j => j.status === "pending")
  const analyzingJobs = jobs.filter(j => j.status === "analyzing")
  const completedJobs = jobs.filter(j => j.status === "completed")
  const failedJobs = jobs.filter(j => j.status === "failed")

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <Card className="bg-card border-border">
        <CardContent className="py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Total Jobs</p>
                <p className="text-2xl font-bold text-foreground">{totalCount}</p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-accent">{completedCount}</p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-blue-400">{analyzingJobs.length}</p>
              </div>
              {failedJobs.length > 0 && (
                <>
                  <div className="h-10 w-px bg-border" />
                  <div>
                    <p className="text-sm text-muted-foreground">Failed</p>
                    <p className="text-2xl font-bold text-destructive">{failedJobs.length}</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "bg-background" : ""}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "bg-background" : ""}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              {isProcessing ? (
                <Button
                  variant="outline"
                  onClick={onPauseAll}
                  className="border-border text-foreground hover:bg-secondary bg-transparent"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pause All
                </Button>
              ) : (
                <Button
                  onClick={onStartAll}
                  disabled={pendingJobs.length === 0}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start All ({pendingJobs.length})
                </Button>
              )}
            </div>
          </div>

          {/* Overall Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="text-foreground font-medium">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Job Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map(job => (
            <Card
              key={job.id}
              className={`bg-card border-border cursor-pointer transition-all hover:border-accent/50 ${
                job.status === "completed" ? "hover:shadow-accent/10" : ""
              }`}
              onClick={() => job.status === "completed" && onJobSelect(job.id)}
            >
              <CardContent className="p-4">
                {/* Thumbnail */}
                <div className="relative aspect-video bg-secondary rounded-lg mb-3 overflow-hidden">
                  {job.thumbnailUrl ? (
                    <img
                      src={job.thumbnailUrl || "/placeholder.svg"}
                      alt={job.videoName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Progress overlay for analyzing jobs */}
                  {job.status === "analyzing" && (
                    <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
                      <Loader2 className="w-8 h-8 text-accent animate-spin mb-2" />
                      <p className="text-sm text-foreground font-medium">{job.progress}%</p>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground truncate flex-1">
                      {job.videoName}
                    </p>
                    <StatusBadge status={job.status} />
                  </div>

                  {job.status === "analyzing" && (
                    <Progress value={job.progress} className="h-1" />
                  )}

                  <div className="flex items-center justify-between">
                    {job.status === "completed" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onJobSelect(job.id)
                        }}
                        className="text-accent hover:text-accent hover:bg-accent/10 p-0 h-auto"
                      >
                        View Analysis
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {job.startedAt ? `Started ${new Date(job.startedAt).toLocaleTimeString()}` : "Queued"}
                      </span>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onJobRemove(job.id)
                      }}
                      className="text-muted-foreground hover:text-destructive p-1 h-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {jobs.map(job => (
                <div
                  key={job.id}
                  className={`flex items-center gap-4 p-4 cursor-pointer transition-colors hover:bg-secondary/50 ${
                    job.status === "completed" ? "" : "cursor-default"
                  }`}
                  onClick={() => job.status === "completed" && onJobSelect(job.id)}
                >
                  {/* Thumbnail */}
                  <div className="relative w-24 h-14 bg-secondary rounded overflow-hidden flex-shrink-0">
                    {job.thumbnailUrl ? (
                      <img
                        src={job.thumbnailUrl || "/placeholder.svg"}
                        alt={job.videoName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    {job.status === "analyzing" && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-accent animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{job.videoName}</p>
                    {job.status === "analyzing" ? (
                      <div className="mt-1">
                        <Progress value={job.progress} className="h-1 w-32" />
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">
                        {job.completedAt
                          ? `Completed ${new Date(job.completedAt).toLocaleTimeString()}`
                          : job.startedAt
                          ? `Started ${new Date(job.startedAt).toLocaleTimeString()}`
                          : "Queued"}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <StatusBadge status={job.status} />

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {job.status === "completed" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onJobSelect(job.id)
                        }}
                        className="text-accent hover:text-accent hover:bg-accent/10"
                      >
                        View
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onJobRemove(job.id)
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {jobs.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground mb-2">No videos in queue</p>
            <p className="text-muted-foreground">
              Upload videos or push from Trending Radar to start batch processing
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
