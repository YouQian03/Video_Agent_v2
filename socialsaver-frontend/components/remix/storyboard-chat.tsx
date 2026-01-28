"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Send, Bot, User, Edit3, Check, Loader2 } from "lucide-react"
import type { StoryboardShot } from "@/lib/types/remix"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  affectedShots?: number[]
  timestamp: Date
}

interface StoryboardChatProps {
  storyboard: StoryboardShot[]
  onUpdateStoryboard: (updatedShots: StoryboardShot[]) => void
  onConfirm: () => void
}

export function StoryboardChat({ storyboard, onUpdateStoryboard, onConfirm }: StoryboardChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "I'll help you refine the storyboard. Tell me which shot(s) you'd like to modify and what changes you want. For example: 'Change shot 3 to use warmer lighting' or 'Make shots 2-4 faster paced'.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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

    // Simulate AI processing and storyboard update
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Parse which shots are affected (mock implementation)
    const shotMatches = input.match(/shot\s*(\d+)/gi)
    const affectedShots = shotMatches
      ? shotMatches.map((m) => Number.parseInt(m.replace(/shot\s*/i, "")))
      : []

    // Mock response based on input
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: affectedShots.length > 0
        ? `I've updated shot${affectedShots.length > 1 ? 's' : ''} ${affectedShots.join(', ')} based on your request. The changes include:\n\n- Modified visual description to match your requirements\n- Adjusted camera movement and lighting as needed\n- Updated timing if specified\n\nPlease review the updated storyboard below. Let me know if you'd like any further adjustments.`
        : "I understand you want to make changes. Could you please specify which shot number(s) you'd like to modify? For example: 'Change shot 2 to...' or 'Update shots 1-3 with...'",
      affectedShots: affectedShots.length > 0 ? affectedShots : undefined,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, assistantMessage])

    // If shots were affected, update the storyboard (mock update)
    if (affectedShots.length > 0) {
      const updatedStoryboard = storyboard.map((shot) => {
        if (affectedShots.includes(shot.shotNumber)) {
          return {
            ...shot,
            visualDescription: `[Updated] ${shot.visualDescription}`,
          }
        }
        return shot
      })
      onUpdateStoryboard(updatedStoryboard)
    }

    setIsProcessing(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
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
      <CardFooter className="pt-4 border-t border-border">
        <Button
          onClick={onConfirm}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          size="lg"
        >
          <Check className="w-4 h-4 mr-2" />
          Confirm Storyboard & Generate Video
        </Button>
      </CardFooter>
    </Card>
  )
}
