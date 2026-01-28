"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ExternalLink,
  Play,
  RefreshCw,
  Send,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Clock,
  CheckCircle2,
} from "lucide-react"
import type { TrendingPost, SocialPlatform } from "@/lib/types/remix"

// Platform icons as simple text/icons
const PlatformIcon = ({ platform }: { platform: SocialPlatform }) => {
  switch (platform) {
    case "x":
      return <span className="font-bold">X</span>
    case "youtube":
      return <span className="text-red-500 font-bold">YT</span>
    case "instagram":
      return <span className="text-pink-500 font-bold">IG</span>
    case "tiktok":
      return <span className="font-bold">TT</span>
  }
}

// Mock data for each platform
const generateMockPosts = (platform: SocialPlatform): TrendingPost[] => {
  const baseData = {
    x: [
      { title: "Incredible sunrise timelapse over NYC", author: "@urbanphoto", plays: 2500000 },
      { title: "Street food tour in Tokyo", author: "@foodexplorer", plays: 1800000 },
      { title: "Behind the scenes: Movie production", author: "@filminsider", plays: 3200000 },
    ],
    youtube: [
      { title: "24 Hours in Paris - Travel Vlog", author: "TravelWithMe", plays: 5600000 },
      { title: "How to Edit Videos Like a Pro", author: "EditMaster", plays: 2100000 },
      { title: "Cooking Challenge: 5 Star Restaurant", author: "ChefLife", plays: 4300000 },
    ],
    instagram: [
      { title: "Aesthetic room transformation", author: "@homevibes", plays: 890000 },
      { title: "Workout routine that changed my life", author: "@fitjourney", plays: 1200000 },
      { title: "Coffee art compilation", author: "@baristaking", plays: 650000 },
    ],
    tiktok: [
      { title: "POV: You found the perfect song", author: "@musicvibes", plays: 8900000 },
      { title: "Life hack you need to know", author: "@hackmaster", plays: 12000000 },
      { title: "Dance trend tutorial", author: "@dancelife", plays: 6500000 },
    ],
  }

  return baseData[platform].map((item, index) => ({
    id: `${platform}-${index + 1}`,
    platform,
    postUrl: `https://${platform === "x" ? "twitter" : platform}.com/post/${index + 1}`,
    videoUrl: `https://example.com/videos/${platform}-${index + 1}.mp4`,
    thumbnailUrl: `/images/thumbnail-placeholder.jpg`,
    title: item.title,
    author: item.author,
    plays: item.plays,
    shares: Math.floor(item.plays * 0.05),
    likes: Math.floor(item.plays * 0.12),
    comments: Math.floor(item.plays * 0.02),
    saves: Math.floor(item.plays * 0.03),
    publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    crawledAt: new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000).toISOString(),
    lastRemixPushedAt: Math.random() > 0.7 ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString() : undefined,
    selected: false,
  }))
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function TrendingPage() {
  const router = useRouter()
  const [currentPlatform, setCurrentPlatform] = useState<SocialPlatform>("x")
  const [posts, setPosts] = useState<Record<SocialPlatform, TrendingPost[]>>({
    x: generateMockPosts("x"),
    youtube: generateMockPosts("youtube"),
    instagram: generateMockPosts("instagram"),
    tiktok: generateMockPosts("tiktok"),
  })
  const [isRefreshing, setIsRefreshing] = useState(false)

  const currentPosts = posts[currentPlatform]
  const selectedCount = currentPosts.filter(p => p.selected).length
  const totalSelected = Object.values(posts).flat().filter(p => p.selected).length

  const handleToggleSelect = (postId: string) => {
    setPosts(prev => ({
      ...prev,
      [currentPlatform]: prev[currentPlatform].map(post =>
        post.id === postId ? { ...post, selected: !post.selected } : post
      ),
    }))
  }

  const handleSelectAll = () => {
    const allSelected = currentPosts.every(p => p.selected)
    setPosts(prev => ({
      ...prev,
      [currentPlatform]: prev[currentPlatform].map(post => ({ ...post, selected: !allSelected })),
    }))
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setPosts(prev => ({
      ...prev,
      [currentPlatform]: generateMockPosts(currentPlatform),
    }))
    setIsRefreshing(false)
  }

  const handlePushToRemix = () => {
    // Get all selected posts across platforms
    const selectedPosts = Object.values(posts).flat().filter(p => p.selected)
    
    // Store in sessionStorage for the batch page to pick up
    sessionStorage.setItem("pendingRemixPosts", JSON.stringify(selectedPosts))
    
    // Navigate directly to batch remix workspace
    router.push("/dashboard/remix/batch")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Trending Radar</h1>
          <p className="text-muted-foreground">
            Discover viral content across social platforms and push to remix
          </p>
        </div>
        <div className="flex items-center gap-3">
          {totalSelected > 0 && (
            <Badge variant="secondary" className="bg-accent/20 text-accent">
              {totalSelected} selected
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-border text-foreground hover:bg-secondary bg-transparent"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={handlePushToRemix}
            disabled={totalSelected === 0}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Send className="w-4 h-4 mr-2" />
            Push to Remix ({totalSelected})
          </Button>
        </div>
      </div>

      {/* Platform Tabs */}
      <Tabs value={currentPlatform} onValueChange={(v) => setCurrentPlatform(v as SocialPlatform)}>
        <TabsList className="bg-secondary">
          <TabsTrigger value="x" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <span className="mr-2 font-bold">X</span>
            Twitter
          </TabsTrigger>
          <TabsTrigger value="youtube" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <span className="mr-2 text-red-500 font-bold">YT</span>
            YouTube
          </TabsTrigger>
          <TabsTrigger value="instagram" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <span className="mr-2 text-pink-500 font-bold">IG</span>
            Instagram
          </TabsTrigger>
          <TabsTrigger value="tiktok" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <span className="mr-2 font-bold">TT</span>
            TikTok
          </TabsTrigger>
        </TabsList>

        {/* Table Content - Same structure for all platforms */}
        {(["x", "youtube", "instagram", "tiktok"] as SocialPlatform[]).map(platform => (
          <TabsContent key={platform} value={platform} className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground">
                    {platform === "x" ? "Twitter/X" : platform.charAt(0).toUpperCase() + platform.slice(1)} Posts
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {currentPosts.every(p => p.selected) ? "Deselect All" : "Select All"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="w-16 text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={currentPosts.length > 0 && currentPosts.every(p => p.selected)}
                              onCheckedChange={handleSelectAll}
                            />
                            <span className="text-xs">Remix</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-muted-foreground min-w-[300px]">Post</TableHead>
                        <TableHead className="text-muted-foreground text-right">
                          <Eye className="w-4 h-4 inline mr-1" />
                          Plays
                        </TableHead>
                        <TableHead className="text-muted-foreground text-right">
                          <Share2 className="w-4 h-4 inline mr-1" />
                          Shares
                        </TableHead>
                        <TableHead className="text-muted-foreground text-right">
                          <Heart className="w-4 h-4 inline mr-1" />
                          Likes
                        </TableHead>
                        <TableHead className="text-muted-foreground text-right">
                          <MessageCircle className="w-4 h-4 inline mr-1" />
                          Comments
                        </TableHead>
                        <TableHead className="text-muted-foreground text-right">
                          <Bookmark className="w-4 h-4 inline mr-1" />
                          Saves
                        </TableHead>
                        <TableHead className="text-muted-foreground">Published</TableHead>
                        <TableHead className="text-muted-foreground">Crawled</TableHead>
                        <TableHead className="text-muted-foreground">Last Remix</TableHead>
                        <TableHead className="text-muted-foreground w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {posts[platform].map(post => (
                        <TableRow
                          key={post.id}
                          className={`border-border ${post.selected ? "bg-accent/5" : ""}`}
                        >
                          <TableCell>
                            <Checkbox
                              checked={post.selected}
                              onCheckedChange={() => handleToggleSelect(post.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {/* Thumbnail */}
                              <div className="relative w-20 h-12 bg-secondary rounded overflow-hidden flex-shrink-0 group cursor-pointer">
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Play className="w-6 h-6 text-muted-foreground group-hover:text-accent transition-colors" />
                                </div>
                              </div>
                              {/* Info */}
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                                  {post.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {post.author}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-foreground font-medium">
                            {formatNumber(post.plays)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatNumber(post.shares)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatNumber(post.likes)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatNumber(post.comments)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatNumber(post.saves)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(post.publishedAt)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(post.crawledAt)}
                          </TableCell>
                          <TableCell>
                            {post.lastRemixPushedAt ? (
                              <div className="flex items-center gap-1 text-accent text-sm">
                                <CheckCircle2 className="w-3 h-3" />
                                {formatDate(post.lastRemixPushedAt)}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <a href={post.postUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {formatNumber(currentPosts.reduce((sum, p) => sum + p.plays, 0))}
                </p>
                <p className="text-sm text-muted-foreground">Total Plays</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {formatNumber(currentPosts.reduce((sum, p) => sum + p.likes, 0))}
                </p>
                <p className="text-sm text-muted-foreground">Total Likes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                <Share2 className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {formatNumber(currentPosts.reduce((sum, p) => sum + p.shares, 0))}
                </p>
                <p className="text-sm text-muted-foreground">Total Shares</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{currentPosts.length}</p>
                <p className="text-sm text-muted-foreground">Posts Tracked</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
