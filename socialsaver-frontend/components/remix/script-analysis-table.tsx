"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FolderOpen } from "lucide-react"
import { SaveToLibraryDialog } from "@/components/save-to-library-dialog"
import { saveScriptToLibrary } from "@/lib/asset-storage"
import type { ScriptAnalysis } from "@/lib/types/remix"

interface ScriptAnalysisTableProps {
  data: ScriptAnalysis
  showSaveButton?: boolean
}

export function ScriptAnalysisTable({ data, showSaveButton = true }: ScriptAnalysisTableProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)

  const handleSaveToLibrary = (name: string, tags: string[]) => {
    saveScriptToLibrary(name, tags, data)
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
        { label: "Script Name", value: get(data, "basicInfo.scriptName") },
        { label: "Type / Style", value: get(data, "basicInfo.typeStyle") },
        { label: "Length / Duration", value: get(data, "basicInfo.length") },
        { label: "Creative Background", value: get(data, "basicInfo.creativeBackground") },
      ],
    },
    {
      category: "Theme & Intent",
      items: [
        { label: "Core Theme", value: get(data, "themeIntent.coreTheme") },
        { label: "Sub-theme", value: get(data, "themeIntent.subTheme") },
        { label: "Value Stance", value: get(data, "themeIntent.valueStance") },
      ],
    },
    {
      category: "Story Structure",
      items: [
        { label: "Story World", value: get(data, "storyStructure.storyWorld") },
        { label: "Three-Act Structure", value: get(data, "storyStructure.threeActStructure") },
        { label: "Plot Points", value: get(data, "storyStructure.plotPoints") },
        { label: "Ending Type", value: get(data, "storyStructure.endingType") },
      ],
    },
    {
      category: "Character System",
      items: [
        { label: "Protagonist", value: get(data, "characterSystem.protagonist") },
        { label: "Antagonist", value: get(data, "characterSystem.antagonist") },
        { label: "Supporting Roles", value: get(data, "characterSystem.supportingRoles") },
        { label: "Relationships", value: get(data, "characterSystem.relationships") },
      ],
    },
    {
      category: "Character Arc",
      items: [
        { label: "Initial State", value: get(data, "characterArc.initialState") },
        { label: "Action Changes", value: get(data, "characterArc.actionChanges") },
        { label: "Final State", value: get(data, "characterArc.finalState") },
      ],
    },
    {
      category: "Conflict Design",
      items: [
        { label: "External Conflict", value: get(data, "conflictDesign.externalConflict") },
        { label: "Internal Conflict", value: get(data, "conflictDesign.internalConflict") },
        { label: "Conflict Escalation", value: get(data, "conflictDesign.conflictEscalation") },
      ],
    },
    {
      category: "Plot & Rhythm",
      items: [
        { label: "Scene Arrangement", value: get(data, "plotRhythm.sceneArrangement") },
        { label: "Rhythm Control", value: get(data, "plotRhythm.rhythmControl") },
        { label: "Suspense Setting", value: get(data, "plotRhythm.suspenseSetting") },
      ],
    },
    {
      category: "Dialogue & Action",
      items: [
        { label: "Dialogue Function", value: get(data, "dialogueAction.dialogueFunction") },
        { label: "Subtext", value: get(data, "dialogueAction.subtext") },
        { label: "Behavior Logic", value: get(data, "dialogueAction.behaviorLogic") },
      ],
    },
    {
      category: "Symbol & Metaphor",
      items: [
        { label: "Core Imagery", value: get(data, "symbolMetaphor.coreImagery") },
        { label: "Symbolic Meaning", value: get(data, "symbolMetaphor.symbolicMeaning") },
      ],
    },
    {
      category: "Genre & Style",
      items: [
        { label: "Genre Rules", value: get(data, "genreStyle.genreRules") },
        { label: "Narrative Style", value: get(data, "genreStyle.narrativeStyle") },
      ],
    },
    {
      category: "Visual Potential",
      items: [
        { label: "Visual Sense", value: get(data, "visualPotential.visualSense") },
        { label: "Audio-Visual Space", value: get(data, "visualPotential.audioVisualSpace") },
      ],
    },
    {
      category: "Overall Evaluation",
      items: [
        { label: "Strengths", value: get(data, "overallEvaluation.strengths") },
        { label: "Weaknesses", value: get(data, "overallEvaluation.weaknesses") },
        { label: "Revision Direction", value: get(data, "overallEvaluation.revisionDirection") },
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
        <CardContent className="p-0">
          <div className="overflow-hidden">
            <table className="w-full border-collapse text-sm table-fixed">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-muted-foreground text-left p-3 font-medium" style={{width: "140px"}}>Module</th>
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
        assetType="script"
        defaultName={data.basicInfo.scriptName || "Untitled Script"}
        onSave={handleSaveToLibrary}
      />
    </>
  )
}
