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
import type { ScriptAnalysis } from "@/lib/types/remix"

interface ScriptAnalysisTableProps {
  data: ScriptAnalysis
  showSaveButton?: boolean
}

export function ScriptAnalysisTable({ data, showSaveButton = true }: ScriptAnalysisTableProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)

  const handleSaveToLibrary = (name: string, tags: string[]) => {
    console.log("Saving script to library:", { name, tags, data })
    // TODO: Integrate with actual asset library storage
  }

  const rows = [
    {
      category: "Basic Info",
      items: [
        { label: "Script Name", value: data.basicInfo.scriptName },
        { label: "Type / Style", value: data.basicInfo.typeStyle },
        { label: "Length / Duration", value: data.basicInfo.length },
        { label: "Creative Background", value: data.basicInfo.creativeBackground },
      ],
    },
    {
      category: "Theme & Intent",
      items: [
        { label: "Core Theme", value: data.themeIntent.coreTheme },
        { label: "Sub-theme", value: data.themeIntent.subTheme },
        { label: "Value Stance", value: data.themeIntent.valueStance },
      ],
    },
    {
      category: "Story Structure",
      items: [
        { label: "Story World", value: data.storyStructure.storyWorld },
        { label: "Three-Act Structure", value: data.storyStructure.threeActStructure },
        { label: "Plot Points", value: data.storyStructure.plotPoints },
        { label: "Ending Type", value: data.storyStructure.endingType },
      ],
    },
    {
      category: "Character System",
      items: [
        { label: "Protagonist", value: data.characterSystem.protagonist },
        { label: "Antagonist", value: data.characterSystem.antagonist },
        { label: "Supporting Roles", value: data.characterSystem.supportingRoles },
        { label: "Relationships", value: data.characterSystem.relationships },
      ],
    },
    {
      category: "Character Arc",
      items: [
        { label: "Initial State", value: data.characterArc.initialState },
        { label: "Action Changes", value: data.characterArc.actionChanges },
        { label: "Final State", value: data.characterArc.finalState },
      ],
    },
    {
      category: "Conflict Design",
      items: [
        { label: "External Conflict", value: data.conflictDesign.externalConflict },
        { label: "Internal Conflict", value: data.conflictDesign.internalConflict },
        { label: "Conflict Escalation", value: data.conflictDesign.conflictEscalation },
      ],
    },
    {
      category: "Plot & Rhythm",
      items: [
        { label: "Scene Arrangement", value: data.plotRhythm.sceneArrangement },
        { label: "Rhythm Control", value: data.plotRhythm.rhythmControl },
        { label: "Suspense Setting", value: data.plotRhythm.suspenseSetting },
      ],
    },
    {
      category: "Dialogue & Action",
      items: [
        { label: "Dialogue Function", value: data.dialogueAction.dialogueFunction },
        { label: "Subtext", value: data.dialogueAction.subtext },
        { label: "Behavior Logic", value: data.dialogueAction.behaviorLogic },
      ],
    },
    {
      category: "Symbol & Metaphor",
      items: [
        { label: "Core Imagery", value: data.symbolMetaphor.coreImagery },
        { label: "Symbolic Meaning", value: data.symbolMetaphor.symbolicMeaning },
      ],
    },
    {
      category: "Genre & Style",
      items: [
        { label: "Genre Rules", value: data.genreStyle.genreRules },
        { label: "Narrative Style", value: data.genreStyle.narrativeStyle },
      ],
    },
    {
      category: "Visual Potential",
      items: [
        { label: "Visual Sense", value: data.visualPotential.visualSense },
        { label: "Audio-Visual Space", value: data.visualPotential.audioVisualSpace },
      ],
    },
    {
      category: "Overall Evaluation",
      items: [
        { label: "Strengths", value: data.overallEvaluation.strengths },
        { label: "Weaknesses", value: data.overallEvaluation.weaknesses },
        { label: "Revision Direction", value: data.overallEvaluation.revisionDirection },
      ],
    },
  ]

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-foreground">Script Analysis Elements (Film Perspective)</CardTitle>
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
                <TableHead className="w-[180px] text-muted-foreground">Analysis Module</TableHead>
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
        assetType="script"
        defaultName={data.basicInfo.scriptName || "Untitled Script"}
        onSave={handleSaveToLibrary}
      />
    </>
  )
}
