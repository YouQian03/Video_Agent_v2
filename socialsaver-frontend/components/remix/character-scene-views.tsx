"use client"

import React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  User, 
  MapPin, 
  Upload, 
  Check, 
  X, 
  Plus, 
  Trash2,
  ImageIcon,
  CheckCircle,
  Edit3
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { CharacterView, SceneView } from "@/lib/types/remix"

interface CharacterSceneViewsProps {
  characters: CharacterView[]
  scenes: SceneView[]
  onCharactersChange: (characters: CharacterView[]) => void
  onScenesChange: (scenes: SceneView[]) => void
  onConfirm: () => void
  onBack: () => void
}

function ViewUploadSlot({ 
  label, 
  imageUrl, 
  onUpload 
}: { 
  label: string
  imageUrl?: string
  onUpload: (file: File) => void 
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onUpload(file)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "w-24 h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all",
          imageUrl 
            ? "border-accent bg-accent/10" 
            : "border-border hover:border-accent hover:bg-secondary/50"
        )}
      >
        {imageUrl ? (
          <img 
            src={imageUrl || "/placeholder.svg"} 
            alt={label} 
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <>
            <ImageIcon className="w-6 h-6 text-muted-foreground" />
            <Upload className="w-4 h-4 text-muted-foreground" />
          </>
        )}
      </button>
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}

function CharacterCard({ 
  character, 
  onUpdate, 
  onDelete 
}: { 
  character: CharacterView
  onUpdate: (updates: Partial<CharacterView>) => void
  onDelete: () => void
}) {
  const [isEditing, setIsEditing] = useState(!character.confirmed)

  const handleImageUpload = (view: 'frontView' | 'sideView' | 'backView', file: File) => {
    const url = URL.createObjectURL(file)
    onUpdate({ [view]: url })
  }

  const handleConfirm = () => {
    onUpdate({ confirmed: true })
    setIsEditing(false)
  }

  return (
    <Card className={cn(
      "bg-card border-border transition-all",
      character.confirmed && "border-accent/50"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-accent" />
            {isEditing ? (
              <Input
                value={character.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                placeholder="Character name"
                className="h-8 w-48 bg-secondary border-border text-foreground"
              />
            ) : (
              <CardTitle className="text-base text-foreground">{character.name}</CardTitle>
            )}
            {character.confirmed && (
              <CheckCircle className="w-4 h-4 text-accent" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Three View Slots */}
        <div className="flex justify-center gap-4">
          <ViewUploadSlot 
            label="Front View" 
            imageUrl={character.frontView}
            onUpload={(file) => handleImageUpload('frontView', file)}
          />
          <ViewUploadSlot 
            label="Side View" 
            imageUrl={character.sideView}
            onUpload={(file) => handleImageUpload('sideView', file)}
          />
          <ViewUploadSlot 
            label="Back View" 
            imageUrl={character.backView}
            onUpload={(file) => handleImageUpload('backView', file)}
          />
        </div>

        {/* Description */}
        {isEditing ? (
          <Textarea
            value={character.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Character description, traits, role in story..."
            className="bg-secondary border-border text-foreground min-h-[80px]"
          />
        ) : (
          <p className="text-sm text-muted-foreground">{character.description}</p>
        )}

        {/* Confirm Button */}
        {isEditing && (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
              className="border-border text-foreground hover:bg-secondary bg-transparent"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Check className="w-4 h-4 mr-1" />
              Confirm Character
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SceneCard({ 
  scene, 
  onUpdate, 
  onDelete 
}: { 
  scene: SceneView
  onUpdate: (updates: Partial<SceneView>) => void
  onDelete: () => void
}) {
  const [isEditing, setIsEditing] = useState(!scene.confirmed)

  const handleImageUpload = (view: 'establishingShot' | 'detailView' | 'alternateAngle', file: File) => {
    const url = URL.createObjectURL(file)
    onUpdate({ [view]: url })
  }

  const handleConfirm = () => {
    onUpdate({ confirmed: true })
    setIsEditing(false)
  }

  return (
    <Card className={cn(
      "bg-card border-border transition-all",
      scene.confirmed && "border-accent/50"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-accent" />
            {isEditing ? (
              <Input
                value={scene.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                placeholder="Scene name"
                className="h-8 w-48 bg-secondary border-border text-foreground"
              />
            ) : (
              <CardTitle className="text-base text-foreground">{scene.name}</CardTitle>
            )}
            {scene.confirmed && (
              <CheckCircle className="w-4 h-4 text-accent" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Three View Slots */}
        <div className="flex justify-center gap-4">
          <ViewUploadSlot 
            label="Wide Shot" 
            imageUrl={scene.establishingShot}
            onUpload={(file) => handleImageUpload('establishingShot', file)}
          />
          <ViewUploadSlot 
            label="Detail View" 
            imageUrl={scene.detailView}
            onUpload={(file) => handleImageUpload('detailView', file)}
          />
          <ViewUploadSlot 
            label="Alt Angle" 
            imageUrl={scene.alternateAngle}
            onUpload={(file) => handleImageUpload('alternateAngle', file)}
          />
        </div>

        {/* Description */}
        {isEditing ? (
          <Textarea
            value={scene.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Scene description, mood, key elements..."
            className="bg-secondary border-border text-foreground min-h-[80px]"
          />
        ) : (
          <p className="text-sm text-muted-foreground">{scene.description}</p>
        )}

        {/* Confirm Button */}
        {isEditing && (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
              className="border-border text-foreground hover:bg-secondary bg-transparent"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Check className="w-4 h-4 mr-1" />
              Confirm Scene
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function CharacterSceneViews({
  characters,
  scenes,
  onCharactersChange,
  onScenesChange,
  onConfirm,
  onBack,
}: CharacterSceneViewsProps) {
  const addCharacter = () => {
    const newChar: CharacterView = {
      id: `char-${Date.now()}`,
      name: "",
      description: "",
      confirmed: false,
    }
    onCharactersChange([...characters, newChar])
  }

  const updateCharacter = (id: string, updates: Partial<CharacterView>) => {
    onCharactersChange(
      characters.map((c) => (c.id === id ? { ...c, ...updates } : c))
    )
  }

  const deleteCharacter = (id: string) => {
    onCharactersChange(characters.filter((c) => c.id !== id))
  }

  const addScene = () => {
    const newScene: SceneView = {
      id: `scene-${Date.now()}`,
      name: "",
      description: "",
      confirmed: false,
    }
    onScenesChange([...scenes, newScene])
  }

  const updateScene = (id: string, updates: Partial<SceneView>) => {
    onScenesChange(
      scenes.map((s) => (s.id === id ? { ...s, ...updates } : s))
    )
  }

  const deleteScene = (id: string) => {
    onScenesChange(scenes.filter((s) => s.id !== id))
  }

  const allConfirmed = 
    characters.length > 0 && 
    scenes.length > 0 && 
    characters.every((c) => c.confirmed) && 
    scenes.every((s) => s.confirmed)

  const canProceedWithoutAll = characters.length > 0 || scenes.length > 0

  return (
    <div className="space-y-8">
      {/* Introduction */}
      <Card className="bg-accent/10 border-accent">
        <CardContent className="py-4">
          <p className="text-sm text-foreground">
            Before generating the storyboard, please confirm the character and scene reference views. 
            Upload three-view images for each character (front, side, back) and scene (wide shot, detail, alternate angle) 
            to ensure visual consistency in the final output.
          </p>
        </CardContent>
      </Card>

      {/* Characters Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <User className="w-5 h-5 text-accent" />
            Character Three-Views
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={addCharacter}
            className="border-border text-foreground hover:bg-secondary bg-transparent"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Character
          </Button>
        </div>

        {characters.length === 0 ? (
          <Card className="bg-card border-border border-dashed">
            <CardContent className="py-8 flex flex-col items-center justify-center text-center">
              <User className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No characters added yet</p>
              <Button
                variant="outline"
                size="sm"
                onClick={addCharacter}
                className="mt-3 border-border text-foreground hover:bg-secondary bg-transparent"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add First Character
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {characters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                onUpdate={(updates) => updateCharacter(character.id, updates)}
                onDelete={() => deleteCharacter(character.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Scenes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <MapPin className="w-5 h-5 text-accent" />
            Scene Three-Views
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={addScene}
            className="border-border text-foreground hover:bg-secondary bg-transparent"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Scene
          </Button>
        </div>

        {scenes.length === 0 ? (
          <Card className="bg-card border-border border-dashed">
            <CardContent className="py-8 flex flex-col items-center justify-center text-center">
              <MapPin className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No scenes added yet</p>
              <Button
                variant="outline"
                size="sm"
                onClick={addScene}
                className="mt-3 border-border text-foreground hover:bg-secondary bg-transparent"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add First Scene
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {scenes.map((scene) => (
              <SceneCard
                key={scene.id}
                scene={scene}
                onUpdate={(updates) => updateScene(scene.id, updates)}
                onDelete={() => deleteScene(scene.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-border text-foreground hover:bg-secondary bg-transparent"
        >
          Back to Script
        </Button>
        <div className="flex-1" />
        {!allConfirmed && canProceedWithoutAll && (
          <Button
            variant="outline"
            onClick={onConfirm}
            className="border-border text-foreground hover:bg-secondary bg-transparent"
          >
            Skip & Generate Storyboard
          </Button>
        )}
        <Button
          onClick={onConfirm}
          disabled={!canProceedWithoutAll}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Check className="w-4 h-4 mr-2" />
          {allConfirmed ? "Confirm & Generate Storyboard" : "Confirm Views"}
        </Button>
      </div>
    </div>
  )
}
