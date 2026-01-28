"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Zap, Menu, X, ChevronDown, Radar, Video, Film } from "lucide-react"

interface HeaderProps {
  onSignInClick?: () => void
  onFeatureClick?: (feature: string) => void
}

const features = [
  {
    name: "Trending Radar",
    description: "Discover viral content across platforms",
    href: "/dashboard/trending",
    icon: Radar,
  },
  {
    name: "Video Remix",
    description: "Analyze and remix videos with AI",
    href: "/dashboard/remix",
    icon: Video,
  },
  {
    name: "Storyboard Analysis",
    description: "Generate shot-by-shot breakdowns",
    href: "/dashboard/storyboard",
    icon: Film,
  },
]

export function Header({ onSignInClick, onFeatureClick }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [featuresOpen, setFeaturesOpen] = useState(false)

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
    setMobileMenuOpen(false)
  }

  const handleSignIn = () => {
    onSignInClick?.()
    setMobileMenuOpen(false)
  }

  const handleFeatureClick = (featureHref: string) => {
    // Trigger login first, then navigate
    if (onFeatureClick) {
      onFeatureClick(featureHref)
    } else if (onSignInClick) {
      onSignInClick()
    }
    setMobileMenuOpen(false)
    setFeaturesOpen(false)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <Zap className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="font-semibold text-foreground text-lg">SocialSaver</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Features
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-64 bg-card border-border">
                {features.map((feature) => (
                  <DropdownMenuItem
                    key={feature.name}
                    onClick={() => handleFeatureClick(feature.href)}
                    className="flex items-start gap-3 p-3 cursor-pointer focus:bg-secondary"
                  >
                    <div className="w-8 h-8 rounded-md bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <feature.icon className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{feature.name}</p>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignIn}
              className="border-border hover:bg-secondary bg-transparent"
            >
              Sign In
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              {/* Mobile Features Accordion */}
              <div>
                <button
                  onClick={() => setFeaturesOpen(!featuresOpen)}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                  Features
                  <ChevronDown className={`w-4 h-4 transition-transform ${featuresOpen ? "rotate-180" : ""}`} />
                </button>
                {featuresOpen && (
                  <div className="mt-3 ml-2 flex flex-col gap-2">
                    {features.map((feature) => (
                      <button
                        key={feature.name}
                        onClick={() => handleFeatureClick(feature.href)}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary text-left"
                      >
                        <feature.icon className="w-4 h-4 text-accent" />
                        <span className="text-sm text-foreground">{feature.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignIn}
                className="w-fit border-border hover:bg-secondary bg-transparent"
              >
                Sign In
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
