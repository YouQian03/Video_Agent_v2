"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Video } from "lucide-react"
import Image from "next/image"

interface HeroSectionProps {
  onLoginClick: () => void
}

export function HeroSection({ onLoginClick }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen pt-16 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/30" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>Boost your social media efficiency 10x</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight text-balance">
              Your Social Media
              <span className="text-accent"> Lifesaver</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
              Struggling to keep up? Trending Radar finds viral content, Video Analytics decodes performance secrets, and Video Remix creates fresh content in seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                onClick={onLoginClick}
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-6"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border">
              <div>
                <div className="text-2xl md:text-3xl font-bold text-foreground">10K+</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-foreground">50M+</div>
                <div className="text-sm text-muted-foreground">Videos Analyzed</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-foreground">98%</div>
                <div className="text-sm text-muted-foreground">Satisfaction</div>
              </div>
            </div>
          </div>

          {/* Right: Visual - Image placeholder */}
          <div className="relative">
            <div className="relative bg-card border border-border rounded-2xl overflow-hidden shadow-2xl aspect-[4/3]">
              {/* Decorative glow */}
              <div className="absolute -inset-px bg-gradient-to-br from-accent/20 via-transparent to-transparent rounded-2xl blur-sm" />
              
              {/* Image placeholder */}
              <div className="relative w-full h-full flex items-center justify-center bg-secondary/50">
                <div className="text-center space-y-4 p-6">
                  <div className="w-16 h-16 mx-auto rounded-xl bg-accent/20 flex items-center justify-center">
                    <Video className="w-8 h-8 text-accent" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Hero Image Placeholder</p>
                    <p className="text-xs text-muted-foreground">Replace with /images/hero-dashboard.png</p>
                    <p className="text-xs text-muted-foreground">Recommended: 800x600px</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-4 bg-card border border-border rounded-xl p-3 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <div className="text-xs font-medium text-foreground">AI Powered</div>
                  <div className="text-[10px] text-muted-foreground">Smart Analysis</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
