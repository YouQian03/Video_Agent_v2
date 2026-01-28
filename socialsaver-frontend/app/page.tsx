"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { Footer } from "@/components/footer"
import { LoginDialog } from "@/components/login-dialog"

export default function Home() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"login" | "register">("login")
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

  // TODO: Replace with actual auth check
  const isLoggedIn = false

  const handleGetStarted = () => {
    if (isLoggedIn) {
      // TODO: Navigate to dashboard
      window.location.href = "/dashboard/remix"
    } else {
      // Open register dialog for new users
      setDialogMode("register")
      setPendingNavigation("/dashboard/remix")
      setLoginOpen(true)
    }
  }

  const handleSignIn = () => {
    setDialogMode("login")
    setPendingNavigation(null)
    setLoginOpen(true)
  }

  const handleFeatureClick = (featureHref: string) => {
    if (isLoggedIn) {
      window.location.href = featureHref
    } else {
      // Store the intended destination and prompt login
      setDialogMode("login")
      setPendingNavigation(featureHref)
      setLoginOpen(true)
    }
  }

  const handleLoginSuccess = (navigateTo?: string) => {
    // Navigate to pending destination or default dashboard
    const destination = navigateTo || pendingNavigation || "/dashboard/remix"
    window.location.href = destination
  }

  return (
    <main className="min-h-screen bg-background">
      <Header onSignInClick={handleSignIn} onFeatureClick={handleFeatureClick} />
      <HeroSection onLoginClick={handleGetStarted} />
      <FeaturesSection />
      <Footer />
      <LoginDialog 
        open={loginOpen} 
        onOpenChange={setLoginOpen} 
        defaultMode={dialogMode}
        onSuccess={handleLoginSuccess}
        pendingNavigation={pendingNavigation}
      />
    </main>
  )
}
