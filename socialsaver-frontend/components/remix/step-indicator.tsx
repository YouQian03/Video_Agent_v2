"use client"

import { Check, Circle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step {
  id: string
  label: string
  description: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: string
  completedSteps: string[]
  onStepClick?: (stepId: string) => void
}

export function StepIndicator({ steps, currentStep, completedSteps, onStepClick }: StepIndicatorProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep)

  const handleStepClick = (stepId: string) => {
    // Allow clicking on completed steps or current step
    if (onStepClick && (completedSteps.includes(stepId) || stepId === currentStep)) {
      onStepClick(stepId)
    }
  }

  return (
    <div className="relative">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(step.id)
        const isCurrent = step.id === currentStep
        const isLast = index === steps.length - 1
        const isClickable = isCompleted || isCurrent

        return (
          <div key={step.id} className="relative flex gap-4">
            {/* Vertical Line */}
            {!isLast && (
              <div
                className={cn(
                  "absolute left-4 top-8 w-0.5 h-full -ml-px",
                  isCompleted ? "bg-accent" : "bg-border"
                )}
              />
            )}

            {/* Step Circle */}
            <div className="relative z-10 flex items-center justify-center">
              <button
                type="button"
                onClick={() => handleStepClick(step.id)}
                disabled={!isClickable}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
                  isCompleted
                    ? "bg-accent border-accent text-accent-foreground cursor-pointer hover:bg-accent/80"
                    : isCurrent
                    ? "bg-background border-accent text-accent cursor-pointer"
                    : "bg-background border-border text-muted-foreground cursor-not-allowed",
                  isClickable && "hover:scale-110"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Circle className="w-3 h-3 fill-current" />
                )}
              </button>
            </div>

            {/* Step Content */}
            <button
              type="button"
              onClick={() => handleStepClick(step.id)}
              disabled={!isClickable}
              className={cn(
                "pb-8 text-left",
                isLast && "pb-0",
                isClickable && "cursor-pointer hover:opacity-80",
                !isClickable && "cursor-not-allowed"
              )}
            >
              <p
                className={cn(
                  "font-medium",
                  isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
                {isCompleted && <span className="ml-2 text-xs text-accent">(click to edit)</span>}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
            </button>
          </div>
        )
      })}
    </div>
  )
}
