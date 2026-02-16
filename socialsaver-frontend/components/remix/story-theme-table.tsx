"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FolderOpen } from "lucide-react"
import { SaveToLibraryDialog } from "@/components/save-to-library-dialog"
import { saveThemeToLibrary } from "@/lib/asset-storage"
import type { StoryThemeAnalysis } from "@/lib/types/remix"

interface StoryThemeTableProps {
  data: StoryThemeAnalysis
  showSaveButton?: boolean
}

export function StoryThemeTable({ data, showSaveButton = true }: StoryThemeTableProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)

  const handleSaveToLibrary = async (name: string, tags: string[]) => {
    await saveThemeToLibrary(name, tags, data)
  }

  // Safe accessor to handle missing nested properties and N/A values
  const get = (obj: any, path: string): string => {
    const value = path.split('.').reduce((acc, part) => acc?.[part], obj)
    if (!value || value === "N/A" || value === "n/a" || value === "NA") {
      return "-"
    }
    return value
  }

  const rows = [
    {
      category: "Basic Info",
      items: [
        { label: "Title / Type / Duration", value: `${get(data, "basicInfo.title")} / ${get(data, "basicInfo.type")} / ${get(data, "basicInfo.duration")}` },
        { label: "Creator / Director", value: get(data, "basicInfo.creator") },
        { label: "Creative Background", value: get(data, "basicInfo.background") },
      ],
    },
    {
      category: "Core Theme",
      items: [
        { label: "Theme Summary", value: get(data, "coreTheme.summary") },
        { label: "Theme Keywords", value: get(data, "coreTheme.keywords") },
      ],
    },
    {
      category: "Narrative Content",
      items: [
        { label: "Story Starting Point", value: get(data, "narrative.startingPoint") },
        { label: "Core Conflict", value: get(data, "narrative.coreConflict") },
        { label: "Climax Segment", value: get(data, "narrative.climax") },
        { label: "Ending Method", value: get(data, "narrative.ending") },
      ],
    },
    {
      category: "Narrative Structure",
      items: [
        { label: "Narrative Method", value: get(data, "narrativeStructure.narrativeMethod") },
        { label: "Time Structure", value: get(data, "narrativeStructure.timeStructure") },
      ],
    },
    {
      category: "Character Analysis",
      items: [
        { label: "Protagonist", value: get(data, "characterAnalysis.protagonist") },
        { label: "Character Change", value: get(data, "characterAnalysis.characterChange") },
        { label: "Character Relationships", value: get(data, "characterAnalysis.relationships") },
      ],
    },
    {
      category: "Audio-Visual Language",
      items: [
        { label: "Visual Style", value: get(data, "audioVisual.visualStyle") },
        { label: "Camera Language", value: get(data, "audioVisual.cameraLanguage") },
        { label: "Sound Design", value: get(data, "audioVisual.soundDesign") },
      ],
    },
    {
      category: "Symbolism & Metaphor",
      items: [
        { label: "Repeating Imagery", value: get(data, "symbolism.repeatingImagery") },
        { label: "Symbolic Meaning", value: get(data, "symbolism.symbolicMeaning") },
      ],
    },
    {
      category: "Thematic Stance",
      items: [
        { label: "Creator Attitude", value: get(data, "thematicStance.creatorAttitude") },
        { label: "Emotional Tone", value: get(data, "thematicStance.emotionalTone") },
      ],
    },
    {
      category: "Real-World Significance",
      items: [
        { label: "Social/Emotional Value", value: get(data, "realWorldSignificance.socialEmotionalValue") },
        { label: "Audience Interpretation", value: get(data, "realWorldSignificance.audienceInterpretation") },
      ],
    },
  ]

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-foreground">Video Story Theme Analysis (Film Perspective)</CardTitle>
          {showSaveButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSaveDialogOpen(true)}
              className="gap-2 border-border bg-transparent text-accent hover:text-accent hover:bg-accent/10"
            >
              <FolderOpen className="w-4 h-4" />
              Save to Library
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-hidden">
            <table className="w-full border-collapse text-sm table-fixed">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-muted-foreground text-left p-3 font-medium" style={{width: "140px"}}>Dimension</th>
                  <th className="text-muted-foreground text-left p-3 font-medium" style={{width: "160px"}}>Analysis Points</th>
                  <th className="text-muted-foreground text-left p-3 font-medium">Content</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((section) =>
                  section.items.map((item, itemIndex) => (
                    <tr key={`${section.category}-${itemIndex}`} className="border-b border-border hover:bg-secondary/20">
                      {itemIndex === 0 && (
                        <td
                          rowSpan={section.items.length}
                          className="font-medium text-foreground p-3 align-top bg-secondary/20 border-r border-border"
                        >
                          {section.category}
                        </td>
                      )}
                      <td className="text-muted-foreground p-3 align-top">{item.label}</td>
                      <td className="text-foreground p-3 align-top break-words whitespace-normal">{item.value}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <SaveToLibraryDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        assetType="theme"
        defaultName={data.basicInfo.title || "Untitled Theme"}
        onSave={handleSaveToLibrary}
      />
    </>
  )
}
