"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  User,
  MapPin,
  Upload,
  Check,
  X,
  ImageIcon,
  CheckCircle,
  Sparkles,
  Loader2,
  Music,
  Palette,
  Package
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CharacterView, SceneView, StoryThemeAnalysis } from "@/lib/types/remix"

// Sound Design State
interface SoundDesign {
  voiceStyle: string
  voiceTone: string
  backgroundMusic: string
  soundEffects: string
  voiceSampleUrl?: string
  musicSampleUrl?: string
}

// Visual Style State
interface VisualStyle {
  artStyle: string
  colorPalette: string
  lightingMood: string
  cameraStyle: string
  referenceImages: string[]
}

// Product View
interface ProductView {
  id: string
  name: string
  description: string
  frontView?: string
  sideView?: string
  backView?: string
  confirmed: boolean
}
import {
  uploadEntityView,
  updateEntityDescription,
  generateEntityViews,
  pollGenerateViewsStatus,
  getEntityState,
  type EntityState,
} from "@/lib/api"

// Character/Environment Entity from Character Ledger (Video Analysis)
interface LedgerEntity {
  entityId: string;
  entityType: string;
  importance: "PRIMARY" | "SECONDARY" | "BACKGROUND";
  displayName: string;
  visualSignature: string;
  detailedDescription: string;
  appearsInShots: string[];
  shotCount: number;
}

// Identity Anchor from Remix (overrides)
interface IdentityAnchor {
  anchorId: string;
  anchorName?: string;
  name?: string;
  detailedDescription?: string;
  originalPlaceholder?: string;  // Maps to original entityId
  styleAdaptation?: string;
  atmosphericConditions?: string;
}

interface CharacterSceneViewsProps {
  jobId: string
  // Data from Video Analysis (Character Ledger) - provides complete list
  characterLedger: LedgerEntity[]
  environmentLedger: LedgerEntity[]
  // Data from Remix (Identity Anchors) - provides overrides
  characterAnchors: IdentityAnchor[]
  environmentAnchors: IdentityAnchor[]
  characters: CharacterView[]
  scenes: SceneView[]
  onCharactersChange: (characters: CharacterView[]) => void
  onScenesChange: (scenes: SceneView[]) => void
  onConfirm: () => void
  onBack: () => void
}

// Sound Design Section Component
function SoundDesignSection({
  soundDesign,
  onSoundDesignChange,
  onConfirm,
  onCancel,
}: {
  soundDesign: SoundDesign
  onSoundDesignChange: (updates: Partial<SoundDesign>) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  const voiceSampleRef = useRef<HTMLInputElement>(null)
  const musicSampleRef = useRef<HTMLInputElement>(null)

  const handleVoiceSampleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // For now, just create a local URL - in production, this would upload to server
      const url = URL.createObjectURL(file)
      onSoundDesignChange({ voiceSampleUrl: url })
    }
  }

  const handleMusicSampleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      onSoundDesignChange({ musicSampleUrl: url })
    }
  }

  // Show buttons when any sample is uploaded
  const hasUploads = soundDesign.voiceSampleUrl || soundDesign.musicSampleUrl

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-accent" />
          <CardTitle className="text-base text-foreground">Sound Design</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Voice Style */}
          <div className="space-y-2">
            <Label htmlFor="voiceStyle" className="text-sm text-foreground">Voice Style</Label>
            <Input
              id="voiceStyle"
              value={soundDesign.voiceStyle}
              onChange={(e) => onSoundDesignChange({ voiceStyle: e.target.value })}
              placeholder="Natural"
              className="bg-secondary border-border"
            />
          </div>

          {/* Voice Tone */}
          <div className="space-y-2">
            <Label htmlFor="voiceTone" className="text-sm text-foreground">Voice Tone</Label>
            <Input
              id="voiceTone"
              value={soundDesign.voiceTone}
              onChange={(e) => onSoundDesignChange({ voiceTone: e.target.value })}
              placeholder="Warm and friendly"
              className="bg-secondary border-border"
            />
          </div>

          {/* Background Music */}
          <div className="space-y-2">
            <Label htmlFor="backgroundMusic" className="text-sm text-foreground">Background Music</Label>
            <Input
              id="backgroundMusic"
              value={soundDesign.backgroundMusic}
              onChange={(e) => onSoundDesignChange({ backgroundMusic: e.target.value })}
              placeholder="Upbeat, modern electronic"
              className="bg-secondary border-border"
            />
          </div>

          {/* Sound Effects */}
          <div className="space-y-2">
            <Label htmlFor="soundEffects" className="text-sm text-foreground">Sound Effects</Label>
            <Input
              id="soundEffects"
              value={soundDesign.soundEffects}
              onChange={(e) => onSoundDesignChange({ soundEffects: e.target.value })}
              placeholder="Subtle, ambient"
              className="bg-secondary border-border"
            />
          </div>
        </div>

        {/* Sample Uploads */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          {/* Voice Sample */}
          <div className="space-y-2">
            <Label className="text-sm text-foreground">Voice Sample</Label>
            <div
              onClick={() => voiceSampleRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all",
                soundDesign.voiceSampleUrl
                  ? "border-accent bg-accent/10"
                  : "border-border hover:border-accent hover:bg-secondary/50"
              )}
            >
              {soundDesign.voiceSampleUrl ? (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accent" />
                  <span className="text-sm text-foreground">Voice sample uploaded</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Upload voice sample</span>
                  <span className="text-xs text-muted-foreground">MP3 up to 10MB</span>
                </div>
              )}
              <input
                ref={voiceSampleRef}
                type="file"
                accept="audio/*"
                onChange={handleVoiceSampleUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Music Sample */}
          <div className="space-y-2">
            <Label className="text-sm text-foreground">Music Sample</Label>
            <div
              onClick={() => musicSampleRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all",
                soundDesign.musicSampleUrl
                  ? "border-accent bg-accent/10"
                  : "border-border hover:border-accent hover:bg-secondary/50"
              )}
            >
              {soundDesign.musicSampleUrl ? (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accent" />
                  <span className="text-sm text-foreground">Music sample uploaded</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Upload music sample</span>
                  <span className="text-xs text-muted-foreground">MP3 up to 10MB</span>
                </div>
              )}
              <input
                ref={musicSampleRef}
                type="file"
                accept="audio/*"
                onChange={handleMusicSampleUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Confirm / Cancel Buttons - shown when uploads exist */}
        {hasUploads && (
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onCancel}
              className="border-border text-foreground hover:bg-secondary bg-transparent"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Check className="w-4 h-4 mr-2" />
              Confirm Sound
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Visual Style Section Component
function VisualStyleSection({
  visualStyle,
  onVisualStyleChange,
  onConfirm,
  onCancel,
}: {
  visualStyle: VisualStyle
  onVisualStyleChange: (updates: Partial<VisualStyle>) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  const referenceInputRef = useRef<HTMLInputElement>(null)

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newUrls = Array.from(files).map((file) => URL.createObjectURL(file))
      onVisualStyleChange({
        referenceImages: [...visualStyle.referenceImages, ...newUrls]
      })
    }
    if (referenceInputRef.current) {
      referenceInputRef.current.value = ""
    }
  }

  const removeReferenceImage = (index: number) => {
    const newImages = visualStyle.referenceImages.filter((_, i) => i !== index)
    onVisualStyleChange({ referenceImages: newImages })
  }

  // Show buttons when reference images are uploaded
  const hasUploads = visualStyle.referenceImages.length > 0

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-accent" />
          <CardTitle className="text-base text-foreground">Visual Style</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Art Style */}
          <div className="space-y-2">
            <Label htmlFor="artStyle" className="text-sm text-foreground">Art Style</Label>
            <Input
              id="artStyle"
              value={visualStyle.artStyle}
              onChange={(e) => onVisualStyleChange({ artStyle: e.target.value })}
              placeholder="Realistic"
              className="bg-secondary border-border"
            />
          </div>

          {/* Color Palette */}
          <div className="space-y-2">
            <Label htmlFor="colorPalette" className="text-sm text-foreground">Color Palette</Label>
            <Input
              id="colorPalette"
              value={visualStyle.colorPalette}
              onChange={(e) => onVisualStyleChange({ colorPalette: e.target.value })}
              placeholder="Warm tones with high contrast"
              className="bg-secondary border-border"
            />
          </div>

          {/* Lighting Mood */}
          <div className="space-y-2">
            <Label htmlFor="lightingMood" className="text-sm text-foreground">Lighting Mood</Label>
            <Input
              id="lightingMood"
              value={visualStyle.lightingMood}
              onChange={(e) => onVisualStyleChange({ lightingMood: e.target.value })}
              placeholder="Natural daylight"
              className="bg-secondary border-border"
            />
          </div>

          {/* Camera Style */}
          <div className="space-y-2">
            <Label htmlFor="cameraStyle" className="text-sm text-foreground">Camera Style</Label>
            <Input
              id="cameraStyle"
              value={visualStyle.cameraStyle}
              onChange={(e) => onVisualStyleChange({ cameraStyle: e.target.value })}
              placeholder="Dynamic with smooth transitions"
              className="bg-secondary border-border"
            />
          </div>
        </div>

        {/* Reference Images */}
        <div className="space-y-2 pt-2">
          <Label className="text-sm text-foreground">Reference Images</Label>
          <div
            onClick={() => referenceInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-accent hover:bg-secondary/50 transition-all"
          >
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Click to upload reference images
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG up to 10MB each
            </p>
            <input
              ref={referenceInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleReferenceUpload}
              className="hidden"
            />
          </div>

          {/* Show uploaded reference images */}
          {visualStyle.referenceImages.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {visualStyle.referenceImages.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Reference ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => removeReferenceImage(index)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirm / Cancel Buttons - shown when reference images uploaded */}
        {hasUploads && (
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onCancel}
              className="border-border text-foreground hover:bg-secondary bg-transparent"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Check className="w-4 h-4 mr-2" />
              Confirm Style
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Product Card Component
function ProductCard({
  jobId,
  product,
  onUpdate,
  onDelete,
}: {
  jobId: string
  product: ProductView
  onUpdate: (updates: Partial<ProductView>) => void
  onDelete: () => void
}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [uploadingView, setUploadingView] = useState<string | null>(null)
  const [localDescription, setLocalDescription] = useState(product.description)

  useEffect(() => {
    setLocalDescription(product.description)
  }, [product.description])

  const handleImageUpload = async (view: 'front' | 'side' | 'back', file: File) => {
    setUploadingView(view)
    try {
      // For now, create local URL - in production would upload to server
      const url = URL.createObjectURL(file)
      const viewMap: Record<string, string> = {
        front: 'frontView',
        side: 'sideView',
        back: 'backView'
      }
      onUpdate({ [viewMap[view]]: url })
    } catch (error) {
      console.error("Upload failed:", error)
    } finally {
      setUploadingView(null)
    }
  }

  const handleAIGenerate = async () => {
    setIsGenerating(true)
    // Simulate AI generation - in production would call backend
    await new Promise(resolve => setTimeout(resolve, 2000))
    onUpdate({
      frontView: '/placeholder-product-front.png',
      sideView: '/placeholder-product-side.png',
      backView: '/placeholder-product-back.png',
      confirmed: true
    })
    setIsGenerating(false)
  }

  const handleConfirm = () => {
    onUpdate({ confirmed: true })
  }

  const allViewsFilled = product.frontView && product.sideView && product.backView

  return (
    <Card className={cn(
      "bg-card border-border transition-all",
      product.confirmed && "border-accent/50"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-accent" />
            <Input
              value={product.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="Product Name"
              className="bg-transparent border-none p-0 h-auto text-base font-semibold focus-visible:ring-0"
            />
            {product.confirmed && (
              <CheckCircle className="w-4 h-4 text-accent" />
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-muted-foreground hover:text-red-500"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Three View Slots */}
        <div className="flex justify-center gap-4">
          <ViewUploadSlot
            label="Front"
            imageUrl={product.frontView}
            isLoading={uploadingView === 'front'}
            disabled={isGenerating}
            onUpload={(file) => handleImageUpload('front', file)}
          />
          <ViewUploadSlot
            label="Side"
            imageUrl={product.sideView}
            isLoading={uploadingView === 'side'}
            disabled={isGenerating}
            onUpload={(file) => handleImageUpload('side', file)}
          />
          <ViewUploadSlot
            label="Back"
            imageUrl={product.backView}
            isLoading={uploadingView === 'back'}
            disabled={isGenerating}
            onUpload={(file) => handleImageUpload('back', file)}
          />
        </div>

        {/* Description */}
        <Textarea
          value={localDescription}
          onChange={(e) => {
            setLocalDescription(e.target.value)
            onUpdate({ description: e.target.value })
          }}
          placeholder="Product description for AI generation..."
          className="bg-secondary border-border text-foreground min-h-[80px] text-sm"
          disabled={isGenerating}
        />

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAIGenerate}
            disabled={isGenerating || !localDescription.trim()}
            className="border-accent text-accent hover:bg-accent/10 bg-transparent"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-1" />
                AI Generate
              </>
            )}
          </Button>
          {allViewsFilled && !product.confirmed && (
            <Button
              size="sm"
              onClick={handleConfirm}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Check className="w-4 h-4 mr-1" />
              Confirm
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Product Three-Views Section
function ProductThreeViewsSection({
  jobId,
  products,
  onProductsChange,
}: {
  jobId: string
  products: ProductView[]
  onProductsChange: (products: ProductView[]) => void
}) {
  const addProduct = () => {
    const newProduct: ProductView = {
      id: `product_${Date.now()}`,
      name: "",
      description: "",
      confirmed: false,
    }
    onProductsChange([...products, newProduct])
  }

  const updateProduct = (id: string, updates: Partial<ProductView>) => {
    onProductsChange(
      products.map((p) => (p.id === id ? { ...p, ...updates } : p))
    )
  }

  const deleteProduct = (id: string) => {
    onProductsChange(products.filter((p) => p.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Package className="w-5 h-5 text-accent" />
          Product Three-Views
          <span className="text-sm font-normal text-muted-foreground">
            ({products.filter(p => p.confirmed).length}/{products.length} confirmed)
          </span>
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={addProduct}
          className="border-accent text-accent hover:bg-accent/10 bg-transparent"
        >
          <Package className="w-4 h-4 mr-1" />
          Add Product
        </Button>
      </div>

      {products.length === 0 ? (
        <Card className="bg-card border-border border-dashed">
          <CardContent className="py-8 flex flex-col items-center justify-center text-center">
            <Package className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No products added yet</p>
            <Button
              variant="outline"
              size="sm"
              onClick={addProduct}
              className="mt-4 border-accent text-accent hover:bg-accent/10 bg-transparent"
            >
              Add First Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              jobId={jobId}
              product={product}
              onUpdate={(updates) => updateProduct(product.id, updates)}
              onDelete={() => deleteProduct(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ViewUploadSlot({
  label,
  imageUrl,
  isLoading,
  onUpload,
  disabled
}: {
  label: string
  imageUrl?: string | null
  isLoading?: boolean
  onUpload: (file: File) => void
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    if (!disabled && !isLoading) {
      inputRef.current?.click()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onUpload(file)
    }
    // Reset input
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={cn(
          "w-24 h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all",
          imageUrl
            ? "border-accent bg-accent/10"
            : "border-border hover:border-accent hover:bg-secondary/50",
          (disabled || isLoading) && "opacity-50 cursor-not-allowed"
        )}
      >
        {isLoading ? (
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
        ) : imageUrl ? (
          <img
            src={imageUrl}
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
  jobId,
  anchorId,
  character,
  onUpdate,
}: {
  jobId: string
  anchorId: string
  character: CharacterView
  onUpdate: (updates: Partial<CharacterView>) => void
}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [uploadingView, setUploadingView] = useState<string | null>(null)
  const [isSavingDescription, setIsSavingDescription] = useState(false)
  const [localDescription, setLocalDescription] = useState(character.description)

  // Sync local description when character changes
  useEffect(() => {
    setLocalDescription(character.description)
  }, [character.description])

  const handleImageUpload = async (view: 'front' | 'side' | 'back', file: File) => {
    setUploadingView(view)
    try {
      const result = await uploadEntityView(jobId, anchorId, view, file)
      // Map backend view names to frontend property names
      const viewMap: Record<string, string> = {
        front: 'frontView',
        side: 'sideView',
        back: 'backView'
      }
      onUpdate({ [viewMap[view]]: result.url })
    } catch (error) {
      console.error("Upload failed:", error)
    } finally {
      setUploadingView(null)
    }
  }

  const handleDescriptionBlur = async () => {
    if (localDescription !== character.description) {
      setIsSavingDescription(true)
      try {
        await updateEntityDescription(jobId, anchorId, localDescription)
        onUpdate({ description: localDescription })
      } catch (error) {
        console.error("Failed to save description:", error)
      } finally {
        setIsSavingDescription(false)
      }
    }
  }

  const handleAIGenerate = async (forceRegenerate: boolean = false) => {
    setIsGenerating(true)
    try {
      // Always save description first (ensures latest description is used)
      await updateEntityDescription(jobId, anchorId, localDescription)
      onUpdate({ description: localDescription })

      // Trigger AI generation (with force if regenerating)
      const result = await generateEntityViews(jobId, anchorId, forceRegenerate)

      if (result.status === "already_complete" && !forceRegenerate) {
        onUpdate({ confirmed: true })
        setIsGenerating(false)
        return
      }

      // Poll for completion
      await pollGenerateViewsStatus(
        jobId,
        anchorId,
        (status) => {
          console.log("Generation status:", status.status)
        },
        3000,
        40
      )

      // Fetch updated state (add cache buster to get fresh images)
      const updatedState = await getEntityState(jobId, anchorId)
      const cacheBuster = `?t=${Date.now()}`
      onUpdate({
        frontView: updatedState.threeViews.front?.url ? updatedState.threeViews.front.url + cacheBuster : undefined,
        sideView: updatedState.threeViews.side?.url ? updatedState.threeViews.side.url + cacheBuster : undefined,
        backView: updatedState.threeViews.back?.url ? updatedState.threeViews.back.url + cacheBuster : undefined,
        confirmed: true
      })
    } catch (error) {
      console.error("AI generation failed:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleConfirm = () => {
    onUpdate({ confirmed: true })
  }

  const allViewsFilled = character.frontView && character.sideView && character.backView

  return (
    <Card className={cn(
      "bg-card border-border transition-all",
      character.confirmed && "border-accent/50"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-accent" />
            <CardTitle className="text-base text-foreground">{character.name}</CardTitle>
            {character.confirmed && (
              <CheckCircle className="w-4 h-4 text-accent" />
            )}
          </div>
          <span className="text-xs text-muted-foreground font-mono">{anchorId}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Three View Slots */}
        <div className="flex justify-center gap-4">
          <ViewUploadSlot
            label="Front"
            imageUrl={character.frontView}
            isLoading={uploadingView === 'front'}
            disabled={isGenerating}
            onUpload={(file) => handleImageUpload('front', file)}
          />
          <ViewUploadSlot
            label="Side"
            imageUrl={character.sideView}
            isLoading={uploadingView === 'side'}
            disabled={isGenerating}
            onUpload={(file) => handleImageUpload('side', file)}
          />
          <ViewUploadSlot
            label="Back"
            imageUrl={character.backView}
            isLoading={uploadingView === 'back'}
            disabled={isGenerating}
            onUpload={(file) => handleImageUpload('back', file)}
          />
        </div>

        {/* Description */}
        <Textarea
          value={localDescription}
          onChange={(e) => setLocalDescription(e.target.value)}
          onBlur={handleDescriptionBlur}
          placeholder="Character description for AI generation..."
          className="bg-secondary border-border text-foreground min-h-[80px] text-sm"
          disabled={isGenerating}
        />

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAIGenerate(!!allViewsFilled)}
            disabled={isGenerating || !localDescription.trim()}
            className="border-accent text-accent hover:bg-accent/10 bg-transparent"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Generating...
              </>
            ) : allViewsFilled ? (
              <>
                <Sparkles className="w-4 h-4 mr-1" />
                Regenerate
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-1" />
                AI Generate
              </>
            )}
          </Button>
          {allViewsFilled && !character.confirmed && (
            <Button
              size="sm"
              onClick={handleConfirm}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Check className="w-4 h-4 mr-1" />
              Confirm
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function SceneCard({
  jobId,
  anchorId,
  scene,
  onUpdate,
}: {
  jobId: string
  anchorId: string
  scene: SceneView
  onUpdate: (updates: Partial<SceneView>) => void
}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [uploadingView, setUploadingView] = useState<string | null>(null)
  const [isSavingDescription, setIsSavingDescription] = useState(false)
  const [localDescription, setLocalDescription] = useState(scene.description)

  // Sync local description when scene changes
  useEffect(() => {
    setLocalDescription(scene.description)
  }, [scene.description])

  const handleImageUpload = async (view: 'wide' | 'detail' | 'alt', file: File) => {
    setUploadingView(view)
    try {
      const result = await uploadEntityView(jobId, anchorId, view, file)
      // Map backend view names to frontend property names
      const viewMap: Record<string, string> = {
        wide: 'establishingShot',
        detail: 'detailView',
        alt: 'alternateAngle'
      }
      onUpdate({ [viewMap[view]]: result.url })
    } catch (error) {
      console.error("Upload failed:", error)
    } finally {
      setUploadingView(null)
    }
  }

  const handleDescriptionBlur = async () => {
    if (localDescription !== scene.description) {
      setIsSavingDescription(true)
      try {
        await updateEntityDescription(jobId, anchorId, localDescription)
        onUpdate({ description: localDescription })
      } catch (error) {
        console.error("Failed to save description:", error)
      } finally {
        setIsSavingDescription(false)
      }
    }
  }

  const handleAIGenerate = async (forceRegenerate: boolean = false) => {
    setIsGenerating(true)
    try {
      // Always save description first (ensures latest description is used)
      await updateEntityDescription(jobId, anchorId, localDescription)
      onUpdate({ description: localDescription })

      // Trigger AI generation (with force if regenerating)
      const result = await generateEntityViews(jobId, anchorId, forceRegenerate)

      if (result.status === "already_complete" && !forceRegenerate) {
        onUpdate({ confirmed: true })
        setIsGenerating(false)
        return
      }

      // Poll for completion
      await pollGenerateViewsStatus(
        jobId,
        anchorId,
        (status) => {
          console.log("Generation status:", status.status)
        },
        3000,
        40
      )

      // Fetch updated state (add cache buster to get fresh images)
      const updatedState = await getEntityState(jobId, anchorId)
      const cacheBuster = `?t=${Date.now()}`
      onUpdate({
        establishingShot: updatedState.threeViews.wide?.url ? updatedState.threeViews.wide.url + cacheBuster : undefined,
        detailView: updatedState.threeViews.detail?.url ? updatedState.threeViews.detail.url + cacheBuster : undefined,
        alternateAngle: updatedState.threeViews.alt?.url ? updatedState.threeViews.alt.url + cacheBuster : undefined,
        confirmed: true
      })
    } catch (error) {
      console.error("AI generation failed:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleConfirm = () => {
    onUpdate({ confirmed: true })
  }

  const allViewsFilled = scene.establishingShot && scene.detailView && scene.alternateAngle

  return (
    <Card className={cn(
      "bg-card border-border transition-all",
      scene.confirmed && "border-accent/50"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-accent" />
            <CardTitle className="text-base text-foreground">{scene.name}</CardTitle>
            {scene.confirmed && (
              <CheckCircle className="w-4 h-4 text-accent" />
            )}
          </div>
          <span className="text-xs text-muted-foreground font-mono">{anchorId}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Three View Slots */}
        <div className="flex justify-center gap-4">
          <ViewUploadSlot
            label="Wide"
            imageUrl={scene.establishingShot}
            isLoading={uploadingView === 'wide'}
            disabled={isGenerating}
            onUpload={(file) => handleImageUpload('wide', file)}
          />
          <ViewUploadSlot
            label="Detail"
            imageUrl={scene.detailView}
            isLoading={uploadingView === 'detail'}
            disabled={isGenerating}
            onUpload={(file) => handleImageUpload('detail', file)}
          />
          <ViewUploadSlot
            label="Alt"
            imageUrl={scene.alternateAngle}
            isLoading={uploadingView === 'alt'}
            disabled={isGenerating}
            onUpload={(file) => handleImageUpload('alt', file)}
          />
        </div>

        {/* Description */}
        <Textarea
          value={localDescription}
          onChange={(e) => setLocalDescription(e.target.value)}
          onBlur={handleDescriptionBlur}
          placeholder="Scene description for AI generation..."
          className="bg-secondary border-border text-foreground min-h-[80px] text-sm"
          disabled={isGenerating}
        />

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAIGenerate(!!allViewsFilled)}
            disabled={isGenerating || !localDescription.trim()}
            className="border-accent text-accent hover:bg-accent/10 bg-transparent"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Generating...
              </>
            ) : allViewsFilled ? (
              <>
                <Sparkles className="w-4 h-4 mr-1" />
                Regenerate
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-1" />
                AI Generate
              </>
            )}
          </Button>
          {allViewsFilled && !scene.confirmed && (
            <Button
              size="sm"
              onClick={handleConfirm}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Check className="w-4 h-4 mr-1" />
              Confirm
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Helper function to find matching anchor for a ledger entity
function findMatchingAnchor(
  entity: LedgerEntity,
  anchors: IdentityAnchor[]
): IdentityAnchor | undefined {
  // First try to match by originalPlaceholder -> entityId
  const byPlaceholder = anchors.find(
    (anchor) => anchor.originalPlaceholder === entity.entityId
  )
  if (byPlaceholder) return byPlaceholder

  // Fallback: match by name similarity (case-insensitive contains)
  const entityNameLower = entity.displayName.toLowerCase()
  const byName = anchors.find((anchor) => {
    const anchorName = (anchor.anchorName || anchor.name || "").toLowerCase()
    return (
      anchorName.includes(entityNameLower) ||
      entityNameLower.includes(anchorName) ||
      anchorName === entityNameLower
    )
  })
  return byName
}

export function CharacterSceneViews({
  jobId,
  characterLedger,
  environmentLedger,
  characterAnchors,
  environmentAnchors,
  characters,
  scenes,
  onCharactersChange,
  onScenesChange,
  onConfirm,
  onBack,
}: CharacterSceneViewsProps) {
  // Sound Design State
  const [soundDesign, setSoundDesign] = useState<SoundDesign>({
    voiceStyle: "Natural",
    voiceTone: "Warm and friendly",
    backgroundMusic: "Upbeat, modern electronic",
    soundEffects: "Subtle, ambient",
  })
  const [soundDesignConfirmed, setSoundDesignConfirmed] = useState(false)

  // Visual Style State
  const [visualStyle, setVisualStyle] = useState<VisualStyle>({
    artStyle: "Realistic",
    colorPalette: "Warm tones with high contrast",
    lightingMood: "Natural daylight",
    cameraStyle: "Dynamic with smooth transitions",
    referenceImages: [],
  })
  const [visualStyleConfirmed, setVisualStyleConfirmed] = useState(false)

  // Products State
  const [products, setProducts] = useState<ProductView[]>([])

  const handleSoundDesignChange = (updates: Partial<SoundDesign>) => {
    setSoundDesign((prev) => ({ ...prev, ...updates }))
    // Reset confirmation when changes are made
    setSoundDesignConfirmed(false)
  }

  const handleVisualStyleChange = (updates: Partial<VisualStyle>) => {
    setVisualStyle((prev) => ({ ...prev, ...updates }))
    // Reset confirmation when changes are made
    setVisualStyleConfirmed(false)
  }

  // Sound Design confirm/cancel handlers
  const handleSoundDesignConfirm = () => {
    setSoundDesignConfirmed(true)
    console.log("Sound design confirmed:", soundDesign)
  }

  const handleSoundDesignCancel = () => {
    // Clear uploaded samples
    setSoundDesign((prev) => ({
      ...prev,
      voiceSampleUrl: undefined,
      musicSampleUrl: undefined,
    }))
  }

  // Visual Style confirm/cancel handlers
  const handleVisualStyleConfirm = () => {
    setVisualStyleConfirmed(true)
    console.log("Visual style confirmed:", visualStyle)
  }

  const handleVisualStyleCancel = () => {
    // Clear uploaded reference images
    setVisualStyle((prev) => ({
      ...prev,
      referenceImages: [],
    }))
  }

  // Initialize characters: Ledger (complete list) + Anchors (overrides)
  // Merge logic: All entities from ledger are shown, anchors provide description updates
  useEffect(() => {
    if (characters.length === 0 && characterLedger.length > 0) {
      const initialChars: CharacterView[] = characterLedger.map((entity) => {
        // Check if there's a matching anchor with updated description
        const matchingAnchor = findMatchingAnchor(entity, characterAnchors)

        // Use anchor's description if available (remix override), otherwise use ledger's
        const description = matchingAnchor?.detailedDescription
          || entity.detailedDescription
          || entity.visualSignature
          || ""

        // Use anchor's name if available (for renamed characters)
        const displayName = matchingAnchor?.anchorName
          || matchingAnchor?.name
          || entity.displayName

        // Use anchor ID if matched, otherwise use entity ID
        const id = matchingAnchor?.anchorId || entity.entityId

        return {
          id,
          name: displayName,
          description,
          frontView: undefined,
          sideView: undefined,
          backView: undefined,
          confirmed: false,
        }
      })
      onCharactersChange(initialChars)
    }
  }, [characterLedger, characterAnchors, characters.length, onCharactersChange])

  // Initialize scenes: Ledger (complete list) + Anchors (overrides)
  // Merge logic: All environments from ledger are shown, anchors provide style/description updates
  useEffect(() => {
    if (scenes.length === 0 && environmentLedger.length > 0) {
      const initialScenes: SceneView[] = environmentLedger.map((entity) => {
        // Check if there's a matching anchor with updated description
        const matchingAnchor = findMatchingAnchor(entity, environmentAnchors)

        // For environments, anchors may have styleAdaptation or atmosphericConditions
        // Combine these with the original description if present
        let description = entity.detailedDescription || entity.visualSignature || ""

        if (matchingAnchor) {
          // If anchor has a detailed description, use it as the primary description
          if (matchingAnchor.detailedDescription) {
            description = matchingAnchor.detailedDescription
          }
          // Append style adaptation if present
          if (matchingAnchor.styleAdaptation) {
            description = `${description}\n\nStyle: ${matchingAnchor.styleAdaptation}`
          }
          // Append atmospheric conditions if present
          if (matchingAnchor.atmosphericConditions) {
            description = `${description}\n\nAtmosphere: ${matchingAnchor.atmosphericConditions}`
          }
        }

        // Use anchor's name if available
        const displayName = matchingAnchor?.anchorName
          || matchingAnchor?.name
          || entity.displayName

        // Use anchor ID if matched, otherwise use entity ID
        const id = matchingAnchor?.anchorId || entity.entityId

        return {
          id,
          name: displayName,
          description: description.trim(),
          establishingShot: undefined,
          detailView: undefined,
          alternateAngle: undefined,
          confirmed: false,
        }
      })
      onScenesChange(initialScenes)
    }
  }, [environmentLedger, environmentAnchors, scenes.length, onScenesChange])

  const updateCharacter = (id: string, updates: Partial<CharacterView>) => {
    onCharactersChange(
      characters.map((c) => (c.id === id ? { ...c, ...updates } : c))
    )
  }

  const updateScene = (id: string, updates: Partial<SceneView>) => {
    onScenesChange(
      scenes.map((s) => (s.id === id ? { ...s, ...updates } : s))
    )
  }

  const allConfirmed =
    characters.length > 0 &&
    characters.every((c) => c.confirmed) &&
    (scenes.length === 0 || scenes.every((s) => s.confirmed))

  const hasAnyContent = characters.length > 0 || scenes.length > 0

  return (
    <div className="space-y-8">
      {/* Introduction */}
      <Card className="bg-accent/10 border-accent">
        <CardContent className="py-4">
          <p className="text-sm text-foreground">
            Configure sound design, visual style, and three-view reference images for your remix.
            Customize audio settings, visual aesthetics, and upload or AI-generate character, scene, and product assets.
          </p>
        </CardContent>
      </Card>

      {/* Sound Design Section */}
      <SoundDesignSection
        soundDesign={soundDesign}
        onSoundDesignChange={handleSoundDesignChange}
        onConfirm={handleSoundDesignConfirm}
        onCancel={handleSoundDesignCancel}
      />

      {/* Visual Style Section */}
      <VisualStyleSection
        visualStyle={visualStyle}
        onVisualStyleChange={handleVisualStyleChange}
        onConfirm={handleVisualStyleConfirm}
        onCancel={handleVisualStyleCancel}
      />

      {/* Characters Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <User className="w-5 h-5 text-accent" />
            Character Three-Views
            <span className="text-sm font-normal text-muted-foreground">
              ({characters.filter(c => c.confirmed).length}/{characters.length} confirmed)
            </span>
          </h3>
        </div>

        {characters.length === 0 ? (
          <Card className="bg-card border-border border-dashed">
            <CardContent className="py-8 flex flex-col items-center justify-center text-center">
              <User className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No characters from remix</p>
              <p className="text-xs text-muted-foreground mt-1">
                Characters will appear here after remix script generation
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {characters.map((character) => (
              <CharacterCard
                key={character.id}
                jobId={jobId}
                anchorId={character.id}
                character={character}
                onUpdate={(updates) => updateCharacter(character.id, updates)}
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
            <span className="text-sm font-normal text-muted-foreground">
              ({scenes.filter(s => s.confirmed).length}/{scenes.length} confirmed)
            </span>
          </h3>
        </div>

        {scenes.length === 0 ? (
          <Card className="bg-card border-border border-dashed">
            <CardContent className="py-8 flex flex-col items-center justify-center text-center">
              <MapPin className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No scenes from remix</p>
              <p className="text-xs text-muted-foreground mt-1">
                Scenes will appear here after remix script generation
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {scenes.map((scene) => (
              <SceneCard
                key={scene.id}
                jobId={jobId}
                anchorId={scene.id}
                scene={scene}
                onUpdate={(updates) => updateScene(scene.id, updates)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Three-Views Section */}
      <ProductThreeViewsSection
        jobId={jobId}
        products={products}
        onProductsChange={setProducts}
      />

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
        {!allConfirmed && hasAnyContent && (
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
          disabled={!hasAnyContent}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Check className="w-4 h-4 mr-2" />
          {allConfirmed ? "Confirm & Generate Storyboard" : "Confirm Views"}
        </Button>
      </div>
    </div>
  )
}
