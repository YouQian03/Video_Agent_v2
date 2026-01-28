"use client"

import React from "react"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, X, FileVideo, Loader2 } from "lucide-react"

interface SimpleVideoUploadProps {
  onSubmit: (files: File[]) => void
  isLoading: boolean
}

export function SimpleVideoUpload({ onSubmit, isLoading }: SimpleVideoUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith("video/")
    )
    
    if (droppedFiles.length > 0) {
      setFiles(prev => [...prev, ...droppedFiles])
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).filter(
      file => file.type.startsWith("video/")
    )
    
    if (selectedFiles.length > 0) {
      setFiles(prev => [...prev, ...selectedFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (files.length > 0) {
      onSubmit(files)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card
        className={`bg-card border-2 border-dashed transition-colors cursor-pointer ${
          isDragging ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Upload Videos
          </h3>
          <p className="text-sm text-muted-foreground text-center mb-1">
            Drag and drop your video files here, or click to browse.
          </p>
          <p className="text-xs text-muted-foreground">
            Supports single or batch upload (MP4, MOV, AVI, MKV, WebM)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            Uploaded Files ({files.length})
          </p>
          {files.map((file, index) => (
            <Card key={index} className="bg-card border-border">
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <FileVideo className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground truncate max-w-[200px] sm:max-w-[400px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(index)
                  }}
                  className="text-muted-foreground hover:text-foreground hover:bg-secondary"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={files.length === 0 || isLoading}
        className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <FileVideo className="w-4 h-4 mr-2" />
            Analyze Video
          </>
        )}
      </Button>
    </div>
  )
}
