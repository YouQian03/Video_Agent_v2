"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

  const handleSaveToLibrary = (name: string, tags: string[]) => {
    saveThemeToLibrary(name, tags, data)
  }

  const rows = [
    {
      category: "Basic Info",
      items: [
        { label: "Title / Type / Duration", value: `${data.basicInfo.title} / ${data.basicInfo.type} / ${data.basicInfo.duration}` },
        { label: "Creator / Director", value: data.basicInfo.creator },
        { label: "Creative Background (optional)", value: data.basicInfo.background },
      ],
    },
    {
      category: "Core Theme",
      items: [
        { label: "Theme Summary (one sentence)", value: data.coreTheme.summary },
        { label: "Theme Keywords", value: data.coreTheme.keywords },
      ],
    },
    {
      category: "Narrative Content",
      items: [
        { label: "Story Starting Point", value: data.narrative.startingPoint },
        { label: "Core Conflict", value: data.narrative.coreConflict },
        { label: "Climax Segment", value: data.narrative.climax },
        { label: "Ending Method", value: data.narrative.ending },
      ],
    },
    {
      category: "Narrative Structure",
      items: [
        { label: "Narrative Method", value: data.narrativeStructure.narrativeMethod },
        { label: "Time Structure", value: data.narrativeStructure.timeStructure },
      ],
    },
    {
      category: "Character Analysis",
      items: [
        { label: "Protagonist", value: data.characterAnalysis.protagonist },
        { label: "Character Change", value: data.characterAnalysis.characterChange },
        { label: "Character Relationships", value: data.characterAnalysis.relationships },
      ],
    },
    {
      category: "Audio-Visual Language",
      items: [
        { label: "Visual Style", value: data.audioVisual.visualStyle },
        { label: "Camera Language", value: data.audioVisual.cameraLanguage },
        { label: "Sound Design", value: data.audioVisual.soundDesign },
      ],
    },
    {
      category: "Symbolism & Metaphor",
      items: [
        { label: "Repeating Imagery", value: data.symbolism.repeatingImagery },
        { label: "Symbolic Meaning", value: data.symbolism.symbolicMeaning },
      ],
    },
    {
      category: "Thematic Stance",
      items: [
        { label: "Creator Attitude", value: data.thematicStance.creatorAttitude },
        { label: "Emotional Tone", value: data.thematicStance.emotionalTone },
      ],
    },
    {
      category: "Real-World Significance",
      items: [
        { label: "Social/Emotional Value", value: data.realWorldSignificance.socialEmotionalValue },
        { label: "Audience Interpretation (optional)", value: data.realWorldSignificance.audienceInterpretation },
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
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="w-[180px] text-muted-foreground">Analysis Dimension</TableHead>
                <TableHead className="w-[200px] text-muted-foreground">Analysis Points</TableHead>
                <TableHead className="text-muted-foreground">Content</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((section) =>
                section.items.map((item, itemIndex) => (
                  <TableRow key={`${section.category}-${itemIndex}`} className="border-border">
                    {itemIndex === 0 && (
                      <TableCell
                        rowSpan={section.items.length}
                        className="font-medium text-foreground align-top bg-secondary/30"
                      >
                        {section.category}
                      </TableCell>
                    )}
                    <TableCell className="text-muted-foreground">{item.label}</TableCell>
                    <TableCell className="text-foreground">{item.value || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
