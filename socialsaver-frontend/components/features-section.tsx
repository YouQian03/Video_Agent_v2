import { Radar, BarChart3, Wand2, ArrowRight, ImageIcon } from "lucide-react"

const features = [
  {
    icon: Radar,
    title: "Trending Radar",
    description: "Real-time monitoring of viral content across platforms. AI-powered filtering identifies high-potential posts so you catch trends first. Supports TikTok, Instagram, YouTube, and more.",
    stats: "Scans 1M+ posts daily",
    color: "accent",
    highlights: ["Multi-platform", "Smart Filtering", "Real-time Updates"],
    imagePlaceholder: "/images/feature-radar.png",
  },
  {
    icon: BarChart3,
    title: "Video Analytics",
    description: "Deep dive into video performance metrics. Completion rate, engagement, follower growth - all at a glance. Benchmark against competitors and find your content edge.",
    stats: "50M+ videos analyzed",
    color: "chart-2",
    highlights: ["Data Visualization", "Competitor Analysis", "Trend Prediction"],
    imagePlaceholder: "/images/feature-analytics.png",
  },
  {
    icon: Wand2,
    title: "Video Remix",
    description: "One-click generation of viral scripts, captions, and titles. AI learns from successful content to help you produce quality material fast. No more creative block.",
    stats: "Saves 3+ hours daily",
    color: "chart-4",
    highlights: ["AI Generation", "Template Library", "One-click Export"],
    imagePlaceholder: "/images/feature-remix.png",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 md:py-32 bg-secondary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
            Three Core Features to Solve Your Pain Points
          </h2>
          <p className="text-lg text-muted-foreground">
            From discovering trends to analyzing data to content creation - your all-in-one social media solution
          </p>
        </div>

        {/* Features */}
        <div className="space-y-16 md:space-y-24">
          {features.map((feature, index) => {
            const Icon = feature.icon
            const isReversed = index % 2 === 1

            return (
              <div
                key={feature.title}
                className={`grid lg:grid-cols-2 gap-8 lg:gap-16 items-center ${
                  isReversed ? "lg:flex-row-reverse" : ""
                }`}
              >
                {/* Text content */}
                <div className={`space-y-6 ${isReversed ? "lg:order-2" : ""}`}>
                  <div
                    className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-${feature.color}/20`}
                  >
                    <Icon className={`w-7 h-7 text-${feature.color}`} />
                  </div>

                  <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                    {feature.title}
                  </h3>

                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {feature.highlights.map((highlight) => (
                      <span
                        key={highlight}
                        className="px-3 py-1 rounded-full bg-secondary border border-border text-sm text-muted-foreground"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className={`text-${feature.color} font-medium`}>{feature.stats}</span>
                    <ArrowRight className={`w-4 h-4 text-${feature.color}`} />
                  </div>
                </div>

                {/* Visual card with image placeholder */}
                <div className={`${isReversed ? "lg:order-1" : ""}`}>
                  <div className="relative bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
                    {/* Decorative gradient */}
                    <div
                      className={`absolute top-0 right-0 w-64 h-64 bg-${feature.color}/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2`}
                    />

                    {/* Image placeholder */}
                    <div className="relative aspect-[4/3] flex items-center justify-center bg-secondary/30">
                      <div className="text-center space-y-3 p-6">
                        <div className={`w-12 h-12 mx-auto rounded-lg bg-${feature.color}/20 flex items-center justify-center`}>
                          <ImageIcon className={`w-6 h-6 text-${feature.color}`} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">{feature.title} Screenshot</p>
                          <p className="text-xs text-muted-foreground">Replace with {feature.imagePlaceholder}</p>
                          <p className="text-xs text-muted-foreground">Recommended: 600x450px</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
