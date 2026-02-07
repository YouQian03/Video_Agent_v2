"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FolderOpen } from "lucide-react"
import { SaveToLibraryDialog } from "@/components/save-to-library-dialog"
import { saveShotToLibrary } from "@/lib/asset-storage"
import type { StoryboardShot } from "@/lib/types/remix"

interface StoryboardTableProps {
  data: StoryboardShot[]
  title?: string
  showSaveButtons?: boolean
}

export function StoryboardTable({ data, title = "Storyboard Breakdown", showSaveButtons = true }: StoryboardTableProps) {
  // Format time to avoid floating point precision issues
  const formatTime = (seconds: number): string => {
    if (seconds === undefined || seconds === null) return "-"
    return `${Math.round(seconds * 10) / 10}s`
  }

  // Safe string accessor that handles N/A and empty values
  const safeStr = (val: any): string => {
    if (!val || val === "N/A" || val === "n/a" || val === "NA") return "-"
    return String(val)
  }

  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [selectedShot, setSelectedShot] = useState<StoryboardShot | null>(null)

  const handleSaveShot = (shot: StoryboardShot) => {
    setSelectedShot(shot)
    setSaveDialogOpen(true)
  }

  const handleSaveToLibrary = (name: string, tags: string[]) => {
    if (!selectedShot) return
    saveShotToLibrary(name, tags, selectedShot)
  }

  // Handle undefined or empty data
  if (!data || data.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No storyboard data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-card border-border w-full max-w-full">
        <CardHeader>
          <CardTitle className="text-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-hidden">
            <table className="w-full border-collapse text-sm table-fixed">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-muted-foreground text-left p-3 font-medium" style={{width: "50px"}}>#</th>
                  <th className="text-muted-foreground text-left p-3 font-medium" style={{width: "90px"}}>Frame</th>
                  <th className="text-muted-foreground text-left p-3 font-medium">Visual Description</th>
                  <th className="text-muted-foreground text-left p-3 font-medium">Content Description</th>
                  <th className="text-muted-foreground text-left p-3 font-medium" style={{width: "100px"}}>Time</th>
                  <th className="text-muted-foreground text-left p-3 font-medium" style={{width: "120px"}}>Camera</th>
                  {showSaveButtons && (
                    <th className="text-muted-foreground text-left p-3 font-medium" style={{width: "70px"}}>Save</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {data.map((shot) => (
                  <tr key={shot.shotNumber} className="border-b border-border hover:bg-secondary/20">
                    <td className="text-foreground font-medium p-3 align-top">{shot.shotNumber}</td>
                    <td className="p-3 align-top">
                      <div className="w-16 h-12 bg-secondary rounded flex items-center justify-center text-xs text-muted-foreground overflow-hidden">
                        {shot.firstFrameImage ? (
                          <img
                            src={shot.firstFrameImage || "/placeholder.svg"}
                            alt={`Shot ${shot.shotNumber}`}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          "-"
                        )}
                      </div>
                    </td>
                    <td className="text-foreground p-3 align-top">
                      <div className="break-words whitespace-normal">{safeStr(shot.visualDescription)}</div>
                    </td>
                    <td className="text-foreground p-3 align-top">
                      <div className="break-words whitespace-normal">{safeStr(shot.contentDescription)}</div>
                    </td>
                    <td className="text-foreground p-3 align-top">
                      <div>{formatTime(shot.startSeconds)} - {formatTime(shot.endSeconds)}</div>
                      <div className="text-muted-foreground text-xs">({formatTime(shot.durationSeconds)})</div>
                    </td>
                    <td className="text-foreground p-3 align-top">
                      <div className="break-words whitespace-normal">
                        {safeStr(shot.shotSize)}
                        {shot.cameraMovement && shot.cameraMovement !== "-" && shot.cameraMovement !== "N/A" && (
                          <span className="text-muted-foreground"> / {safeStr(shot.cameraMovement)}</span>
                        )}
                      </div>
                    </td>
                    {showSaveButtons && (
                      <td className="p-3 align-top">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSaveShot(shot)}
                          className="h-8 px-2 text-accent hover:text-accent hover:bg-accent/10"
                        >
                          <FolderOpen className="w-4 h-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedShot && (
        <SaveToLibraryDialog
          open={saveDialogOpen}
          onOpenChange={setSaveDialogOpen}
          assetType="storyboard"
          defaultName={`Shot ${selectedShot.shotNumber} - ${selectedShot.visualDescription?.slice(0, 30) || "Untitled"}...`}
          onSave={handleSaveToLibrary}
        />
      )}
    </>
  )
}
