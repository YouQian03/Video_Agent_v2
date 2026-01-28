"use client"

import React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Check, FolderOpen } from "lucide-react"
import type { AssetType } from "@/lib/types/remix"

interface SaveToLibraryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assetType: AssetType
  defaultName?: string
  onSave: (name: string, tags: string[]) => void
}

const assetTypeLabels: Record<AssetType, string> = {
  storyboard: "Storyboard Shot",
  character: "Character",
  script: "Script",
  theme: "Theme Analysis",
  video: "Video",
}

export function SaveToLibraryDialog({
  open,
  onOpenChange,
  assetType,
  defaultName = "",
  onSave,
}: SaveToLibraryDialogProps) {
  const [name, setName] = useState(defaultName)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [saved, setSaved] = useState(false)

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), tags)
      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        onOpenChange(false)
        setName(defaultName)
        setTags([])
      }, 1500)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName(defaultName)
      setTags([])
      setSaved(false)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Save to Asset Library
          </DialogTitle>
        </DialogHeader>

        {saved ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-accent" />
            </div>
            <p className="text-foreground font-medium">Saved Successfully!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your {assetTypeLabels[assetType].toLowerCase()} has been added to the library
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {/* Asset Type Badge */}
              <div>
                <Label className="text-muted-foreground text-xs">Asset Type</Label>
                <Badge variant="secondary" className="mt-1">
                  {assetTypeLabels[assetType]}
                </Badge>
              </div>

              {/* Name Input */}
              <div className="space-y-2">
                <Label htmlFor="asset-name">Name</Label>
                <Input
                  id="asset-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter a name for this asset..."
                  className="bg-card border-border"
                />
              </div>

              {/* Tags Input */}
              <div className="space-y-2">
                <Label htmlFor="asset-tags">Tags (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="asset-tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Add a tag..."
                    className="bg-card border-border"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAddTag}
                    className="shrink-0 border-border bg-transparent"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="border-border bg-transparent"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!name.trim()}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Save to Library
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
