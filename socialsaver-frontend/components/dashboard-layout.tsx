"use client"

import React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Zap,
  Radar,
  Video,
  Film,
  LogOut,
  User,
  FolderOpen,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const navigation = [
  {
    name: "Trending Radar",
    href: "/dashboard/trending",
    icon: Radar,
  },
  {
    name: "Video Remix",
    href: "/dashboard/remix",
    icon: Video,
  },
  {
    name: "Storyboard Analysis",
    href: "/dashboard/storyboard",
    icon: Film,
  },
  {
    name: "Asset Library",
    href: "/dashboard/assets",
    icon: FolderOpen,
  },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [expanded, setExpanded] = useState(false)
  const pathname = usePathname()

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-background">
        {/* Floating Sidebar */}
        <aside
          className={cn(
            "fixed left-4 top-4 bottom-4 z-50 bg-card border border-border rounded-2xl shadow-xl transition-all duration-300 ease-in-out flex flex-col",
            expanded ? "w-56" : "w-16"
          )}
          onMouseEnter={() => setExpanded(true)}
          onMouseLeave={() => setExpanded(false)}
        >
          {/* Logo */}
          <div className="flex items-center h-14 px-3 border-b border-border">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-accent-foreground" />
              </div>
              <span
                className={cn(
                  "font-semibold text-foreground whitespace-nowrap transition-opacity duration-300",
                  expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                )}
              >
                SocialSaver
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span
                        className={cn(
                          "whitespace-nowrap transition-opacity duration-300",
                          expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                        )}
                      >
                        {item.name}
                      </span>
                    </Link>
                  </TooltipTrigger>
                  {!expanded && (
                    <TooltipContent side="right" className="font-medium">
                      {item.name}
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            })}
          </nav>

          {/* User section */}
          <div className="p-2 border-t border-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 px-3 py-2.5 h-auto rounded-xl"
                >
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage src="/images/avatar-placeholder.png" />
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      "flex-1 text-left transition-opacity duration-300",
                      expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                    )}
                  >
                    <p className="text-sm font-medium text-foreground whitespace-nowrap">User Name</p>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">user@example.com</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        {/* Main content */}
        <div className="pl-24">
          {/* Page content */}
          <main className="p-6 min-h-screen">{children}</main>

          {/* Footer */}
          <footer className="border-t border-border px-6 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
              <p>&copy; 2026 SocialSaver. All rights reserved.</p>
              <a href="mailto:contact@example.com" className="hover:text-foreground transition-colors">
                Contact Us
              </a>
            </div>
          </footer>
        </div>
      </div>
    </TooltipProvider>
  )
}
