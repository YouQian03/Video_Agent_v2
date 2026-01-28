import { Zap, Mail, Twitter, Github } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <Zap className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="font-semibold text-foreground text-lg">SocialSaver</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              Your social media lifesaver - Trending Radar, Video Analytics, and Video Remix. All-in-one solution for social media managers.
            </p>
          </div>

          {/* Contact */}
          <div className="md:text-right space-y-4">
            <h3 className="text-sm font-medium text-foreground">Contact Me</h3>
            <div className="flex md:justify-end gap-4">
              <a
                href="mailto:hello@example.com"
                className="w-10 h-10 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-accent transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-accent transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-accent transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} SocialSaver. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
