"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, Video, FileVideo, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface VideoUploadProps {
  onSubmit: (files: File[], prompt: string, referenceImages: File[]) => void
  isLoading?: boolean
}

export function VideoUpload({ onSubmit, isLoading }: VideoUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [prompt, setPrompt] = useState("")

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "video/*": [".mp4", ".mov", ".avi", ".mkv", ".webm"],
    },
    multiple: true,
  })

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (files.length > 0) {
      onSubmit(files, prompt, [])
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="border-dashed border-2 bg-card/50">
        <CardContent className="p-0">
          <div
            {...getRootProps()}
            className={cn(
              "flex flex-col items-center justify-center p-8 lg:p-12 cursor-pointer transition-colors",
              isDragActive && "bg-accent/10"
            )}
          >
            <input {...getInputProps()} />
            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Upload Videos
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Drag and drop your video files here, or click to browse.
              <br />
              Supports single or batch upload (MP4, MOV, AVI, MKV, WebM)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            Uploaded Files ({files.length})
          </p>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 p-3 bg-secondary rounded-lg"
              >
                <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center">
                  <FileVideo className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                  className="shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={files.length === 0 || isLoading}
        className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Video className="w-4 h-4 mr-2" />
            Analyze Video
          </>
        )}
      </Button>
    </div>
  )
}
