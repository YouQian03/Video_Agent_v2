"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Send, Bot, User, Edit3, Check, Loader2, AlertCircle, RefreshCw, ImageIcon } from "lucide-react"
import type { StoryboardShot } from "@/lib/types/remix"
import { storyboardChat, regenerateStoryboardFrames, type RemixStoryboardShot } from "@/lib/api"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  affectedShots?: number[]
  action?: string
  timestamp: Date
}

interface StoryboardChatProps {
  jobId: string
  storyboard: StoryboardShot[]
  onUpdateStoryboard: (updatedShots: StoryboardShot[]) => void
  onConfirm: () => void
}

export function StoryboardChat({ jobId, storyboard, onUpdateStoryboard, onConfirm }: StoryboardChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "I'll help you refine the storyboard. Tell me which shot(s) you'd like to modify and what changes you want. For example:\n\n- '把镜头3的时长加倍'\n- 'Make shot 2 use warmer lighting'\n- '给主角加个墨镜'",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingRegenerationShots, setPendingRegenerationShots] = useState<number[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Convert StoryboardShot to RemixStoryboardShot for API
  const convertToRemixFormat = (shots: StoryboardShot[]): RemixStoryboardShot[] => {
    return shots.map((shot, idx) => ({
      shotNumber: shot.shotNumber,
      shotId: `shot_${String(shot.shotNumber).padStart(2, "0")}`,
      firstFrameImage: shot.firstFrameImage,
      visualDescription: shot.visualDescription,
      contentDescription: shot.contentDescription,
      startSeconds: shot.startSeconds,
      endSeconds: shot.endSeconds,
      durationSeconds: shot.durationSeconds,
      shotSize: shot.shotSize,
      cameraAngle: shot.cameraAngle,
      cameraMovement: shot.cameraMovement,
      focalLengthDepth: shot.focalLengthDepth,
      lighting: shot.lighting,
      music: shot.music,
      dialogueVoiceover: shot.dialogueVoiceover,
      i2vPrompt: shot.visualDescription, // Use visualDescription as fallback
      appliedAnchors: { characters: [], environments: [] },
    }))
  }

  // Convert RemixStoryboardShot back to StoryboardShot
  const convertFromRemixFormat = (shots: RemixStoryboardShot[]): StoryboardShot[] => {
    return shots.map((shot) => ({
      shotNumber: shot.shotNumber,
      firstFrameImage: shot.firstFrameImage,
      visualDescription: shot.visualDescription,
      contentDescription: shot.contentDescription,
      startSeconds: shot.startSeconds,
      endSeconds: shot.endSeconds,
      durationSeconds: shot.durationSeconds,
      shotSize: shot.shotSize,
      cameraAngle: shot.cameraAngle,
      cameraMovement: shot.cameraMovement,
      focalLengthDepth: shot.focalLengthDepth,
      lighting: shot.lighting,
      music: shot.music,
      dialogueVoiceover: shot.dialogueVoiceover,
    }))
  }

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsProcessing(true)
    setError(null)

    try {
      // 🔌 Real API Call
      console.log("🎬 Sending storyboard chat request...")
      const currentStoryboard = convertToRemixFormat(storyboard)
      const result = await storyboardChat(jobId, input, currentStoryboard)
      console.log("✅ Chat response received:", result.action, "affected:", result.affectedShots)

      // Create assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.response,
        affectedShots: result.affectedShots,
        action: result.action,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Update storyboard if there were changes
      if (result.affectedShots.length > 0 && result.updatedStoryboard) {
        const updatedShots = convertFromRemixFormat(result.updatedStoryboard)
        onUpdateStoryboard(updatedShots)
        // Track affected shots for potential regeneration
        setPendingRegenerationShots(result.affectedShots)
      }

    } catch (err) {
      console.error("❌ Storyboard chat error:", err)
      const errorMessage = err instanceof Error ? err.message : "Chat request failed"
      setError(errorMessage)

      // Fallback: Show error as assistant message
      const errorAssistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Sorry, I encountered an error processing your request: ${errorMessage}\n\nPlease try again or rephrase your request.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorAssistantMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Regenerate storyboard frames for affected shots
  const handleRegenerateFrames = async () => {
    if (pendingRegenerationShots.length === 0 || isRegenerating) return

    setIsRegenerating(true)
    setError(null)

    try {
      // Get shots that need regeneration
      const shotsToRegenerate = convertToRemixFormat(
        storyboard.filter(shot => pendingRegenerationShots.includes(shot.shotNumber))
      )

      console.log("🖼️ Regenerating frames for shots:", pendingRegenerationShots)
      const result = await regenerateStoryboardFrames(jobId, shotsToRegenerate)
      console.log("✅ Frames regenerated:", result.count)

      // Update storyboard with new frame images
      if (result.regeneratedShots && result.regeneratedShots.length > 0) {
        const updatedShots = storyboard.map(shot => {
          const regenerated = result.regeneratedShots.find(r => r.shotNumber === shot.shotNumber)
          if (regenerated) {
            return {
              ...shot,
              firstFrameImage: regenerated.firstFrameImage,
            }
          }
          return shot
        })
        onUpdateStoryboard(updatedShots)
      }

      // Clear pending regeneration shots
      setPendingRegenerationShots([])

      // Add success message
      const successMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `✅ Successfully regenerated ${result.count} storyboard frame(s). The preview images have been updated.`,
        affectedShots: pendingRegenerationShots,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, successMessage])

    } catch (err) {
      console.error("❌ Frame regeneration error:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to regenerate frames"
      setError(errorMessage)
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-accent" />
            <CardTitle className="text-foreground">Refine Storyboard</CardTitle>
          </div>
          <Badge variant="outline" className="border-accent text-accent">
            {storyboard.length} shots
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {/* Messages Area */}
        <div className="h-64 overflow-y-auto space-y-3 p-3 bg-secondary/50 rounded-lg">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-accent-foreground" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-foreground"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.affectedShots && message.affectedShots.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {message.affectedShots.map((shot) => (
                      <Badge
                        key={shot}
                        variant="secondary"
                        className="text-xs bg-accent/20 text-accent"
                      >
                        Shot {shot}
                      </Badge>
                    ))}
                    {message.action && (
                      <Badge
                        variant="outline"
                        className="text-xs border-accent/50 text-accent"
                      >
                        {message.action === "regenerate_prompt" ? "AI Regenerated" : "Updated"}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-foreground" />
                </div>
              )}
            </div>
          ))}
          {isProcessing && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-accent-foreground" />
              </div>
              <div className="bg-secondary rounded-lg p-3">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe what you want to change... (e.g., 'Change shot 2 to use close-up')"
            className="flex-1 bg-secondary border-border"
            disabled={isProcessing}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
      <CardFooter className="pt-4 border-t border-border flex flex-col gap-3">
        {/* Regenerate Frames Button - shows when there are pending modifications */}
        {pendingRegenerationShots.length > 0 && (
          <Button
            onClick={handleRegenerateFrames}
            variant="outline"
            className="w-full border-accent text-accent hover:bg-accent/10"
            size="lg"
            disabled={isProcessing || isRegenerating}
          >
            {isRegenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Regenerating {pendingRegenerationShots.length} Frame(s)...
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4 mr-2" />
                Regenerate Frames ({pendingRegenerationShots.length} shot{pendingRegenerationShots.length > 1 ? 's' : ''} modified)
              </>
            )}
          </Button>
        )}
        <Button
          onClick={onConfirm}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          size="lg"
          disabled={isProcessing || isRegenerating}
        >
          <Check className="w-4 h-4 mr-2" />
          Confirm Storyboard & Generate Video
        </Button>
      </CardFooter>
    </Card>
  )
}
