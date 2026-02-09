"use client"

import { useState, Fragment } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Users, MapPin, ChevronDown, ChevronUp, ImageIcon } from "lucide-react"

// Mock data for testing
const mockCharacters = [
  {
    entityId: "orig_char_01",
    entityType: "CHARACTER",
    importance: "PRIMARY" as const,
    displayName: "Father (Red Plaid Shirt)",
    visualSignature: "Adult male, wearing red plaid shirt, driving the car",
    detailedDescription: "The father figure in the family, appears stressed while driving through the snowstorm. He grips the steering wheel tightly and argues with the mother.",
    appearsInShots: ["shot_01", "shot_02", "shot_03", "shot_04", "shot_05"],
    shotCount: 5,
    visualCues: ["red plaid shirt", "adult male", "driver seat"],
  },
  {
    entityId: "orig_char_02",
    entityType: "CHARACTER",
    importance: "PRIMARY" as const,
    displayName: "Mother (Pink Sweater)",
    visualSignature: "Adult female, wearing pink sweater, passenger seat",
    detailedDescription: "The mother figure, seated in the front passenger seat. She gestures emphatically during the argument with the father.",
    appearsInShots: ["shot_01", "shot_02", "shot_03"],
    shotCount: 3,
    visualCues: ["pink sweater", "adult female", "passenger seat"],
  },
  {
    entityId: "orig_char_03",
    entityType: "CHARACTER",
    importance: "SECONDARY" as const,
    displayName: "Boy (Black Jacket)",
    visualSignature: "Young boy, wearing black jacket, back seat",
    detailedDescription: "A young boy sitting in the back seat between Christmas presents. He looks worried and uncomfortable during the parents' argument.",
    appearsInShots: ["shot_01", "shot_02"],
    shotCount: 2,
    visualCues: ["black jacket", "young boy", "back seat"],
  },
]

const mockEnvironments = [
  {
    entityId: "orig_env_01",
    entityType: "ENVIRONMENT",
    importance: "PRIMARY" as const,
    displayName: "Car Interior (Snowy Day)",
    visualSignature: "Inside a car during heavy snowfall, Christmas presents visible",
    detailedDescription: "The interior of a family car during a snowstorm. The windshield shows heavy snow falling, and the car is filled with wrapped Christmas presents.",
    appearsInShots: ["shot_01", "shot_02", "shot_03", "shot_04", "shot_05"],
    shotCount: 5,
  },
  {
    entityId: "orig_env_02",
    entityType: "ENVIRONMENT",
    importance: "SECONDARY" as const,
    displayName: "Snowy Road",
    visualSignature: "Snow-covered road with poor visibility",
    detailedDescription: "A snow-covered road with limited visibility due to the heavy snowfall. Trees line the sides of the road.",
    appearsInShots: ["shot_03", "shot_04"],
    shotCount: 2,
  },
]

// Use images from a real job (you can change this to an actual existing job_id)
const TEST_JOB_ID = "job_027c8621"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function TestInventoryPage() {
  const [expandedCharacter, setExpandedCharacter] = useState<string | null>(null)
  const [expandedEnvironment, setExpandedEnvironment] = useState<string | null>(null)

  const getImportanceBadge = (importance: string) => {
    switch (importance) {
      case "PRIMARY":
        return <Badge className="bg-accent text-accent-foreground">Primary</Badge>
      case "SECONDARY":
        return <Badge variant="secondary">Secondary</Badge>
      default:
        return <Badge variant="outline">Background</Badge>
    }
  }

  // Get reference frame image URL
  const getReferenceFrameUrl = (appearsInShots: string[]) => {
    if (!appearsInShots || appearsInShots.length === 0) return null
    const firstShot = appearsInShots[0]
    return `${API_BASE_URL}/api/job/${TEST_JOB_ID}/assets/frames/${firstShot}.png`
  }

  return (
    <div className="space-y-6 p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Test: Character Inventory with Reference Frames</h1>
        <p className="text-muted-foreground mt-2">
          预览效果：在表格中添加 Reference Frame 列，显示人物/场景出现的第一个镜头截帧
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          测试 Job ID: {TEST_JOB_ID}
        </p>
      </div>

      {/* Characters Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground flex items-center gap-2">
            <Users className="w-5 h-5" />
            Character Inventory
            <Badge variant="secondary" className="ml-2">
              {mockCharacters.length} detected
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead className="w-[140px]">Reference</TableHead>
                  <TableHead className="w-[120px]">Entity ID</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead className="w-[100px]">Importance</TableHead>
                  <TableHead className="w-[100px] text-right">Shots</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockCharacters.map((char) => (
                  <Fragment key={char.entityId}>
                    <TableRow
                      className="cursor-pointer hover:bg-secondary/30"
                      onClick={() => setExpandedCharacter(expandedCharacter === char.entityId ? null : char.entityId)}
                    >
                      {/* Reference Frame column */}
                      <TableCell className="py-2">
                        <Dialog>
                          <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <div className="w-[120px] h-[68px] bg-secondary rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                              {getReferenceFrameUrl(char.appearsInShots) ? (
                                <img
                                  src={getReferenceFrameUrl(char.appearsInShots)!}
                                  alt={`Reference: ${char.displayName}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none'
                                    ;(e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden')
                                  }}
                                />
                              ) : null}
                              <div className={`w-full h-full flex items-center justify-center text-muted-foreground ${getReferenceFrameUrl(char.appearsInShots) ? 'hidden' : ''}`}>
                                <ImageIcon className="w-6 h-6" />
                              </div>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <div className="aspect-video bg-black rounded overflow-hidden">
                              <img
                                src={getReferenceFrameUrl(char.appearsInShots)!}
                                alt={`Reference: ${char.displayName}`}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                              Reference frame from {char.appearsInShots[0]} for "{char.displayName}"
                            </p>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-accent">
                        {char.entityId}
                      </TableCell>
                      <TableCell className="font-medium">{char.displayName}</TableCell>
                      <TableCell>{getImportanceBadge(char.importance)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Badge variant="outline">{char.shotCount}</Badge>
                          {expandedCharacter === char.entityId ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedCharacter === char.entityId && (
                      <TableRow className="bg-secondary/20">
                        <TableCell colSpan={5} className="py-4">
                          <div className="space-y-4 px-4">
                            {/* Frame gallery for all appearing shots */}
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">All Appearances ({char.shotCount} shots)</p>
                              <div className="flex flex-wrap gap-2">
                                {char.appearsInShots.map((shotId) => (
                                  <Dialog key={shotId}>
                                    <DialogTrigger asChild>
                                      <div className="w-[100px] h-[56px] bg-secondary rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative group">
                                        <img
                                          src={`${API_BASE_URL}/api/job/${TEST_JOB_ID}/assets/frames/${shotId}.png`}
                                          alt={`${shotId}`}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = ''
                                          }}
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-1 py-0.5 text-center">
                                          {shotId}
                                        </div>
                                      </div>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-3xl">
                                      <div className="aspect-video bg-black rounded overflow-hidden">
                                        <img
                                          src={`${API_BASE_URL}/api/job/${TEST_JOB_ID}/assets/frames/${shotId}.png`}
                                          alt={`${shotId}`}
                                          className="w-full h-full object-contain"
                                        />
                                      </div>
                                      <p className="text-sm text-muted-foreground mt-2">
                                        {shotId} - {char.displayName}
                                      </p>
                                    </DialogContent>
                                  </Dialog>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Visual Signature</p>
                              <p className="text-sm">{char.visualSignature}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Detailed Description</p>
                              <p className="text-sm text-muted-foreground">{char.detailedDescription}</p>
                            </div>
                            {char.visualCues && char.visualCues.length > 0 && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Visual Cues</p>
                                <div className="flex flex-wrap gap-1">
                                  {char.visualCues.map((cue, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {cue}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Environments Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Environment Inventory
            <Badge variant="secondary" className="ml-2">
              {mockEnvironments.length} detected
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead className="w-[140px]">Reference</TableHead>
                  <TableHead className="w-[120px]">Entity ID</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead className="w-[100px]">Importance</TableHead>
                  <TableHead className="w-[100px] text-right">Shots</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockEnvironments.map((env) => (
                  <Fragment key={env.entityId}>
                    <TableRow
                      className="cursor-pointer hover:bg-secondary/30"
                      onClick={() => setExpandedEnvironment(expandedEnvironment === env.entityId ? null : env.entityId)}
                    >
                      {/* Reference Frame column */}
                      <TableCell className="py-2">
                        <Dialog>
                          <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <div className="w-[120px] h-[68px] bg-secondary rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                              {getReferenceFrameUrl(env.appearsInShots) ? (
                                <img
                                  src={getReferenceFrameUrl(env.appearsInShots)!}
                                  alt={`Reference: ${env.displayName}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none'
                                    ;(e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden')
                                  }}
                                />
                              ) : null}
                              <div className={`w-full h-full flex items-center justify-center text-muted-foreground ${getReferenceFrameUrl(env.appearsInShots) ? 'hidden' : ''}`}>
                                <ImageIcon className="w-6 h-6" />
                              </div>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <div className="aspect-video bg-black rounded overflow-hidden">
                              <img
                                src={getReferenceFrameUrl(env.appearsInShots)!}
                                alt={`Reference: ${env.displayName}`}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                              Reference frame from {env.appearsInShots[0]} for "{env.displayName}"
                            </p>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-blue-400">
                        {env.entityId}
                      </TableCell>
                      <TableCell className="font-medium">{env.displayName}</TableCell>
                      <TableCell>{getImportanceBadge(env.importance)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Badge variant="outline">{env.shotCount}</Badge>
                          {expandedEnvironment === env.entityId ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedEnvironment === env.entityId && (
                      <TableRow className="bg-secondary/20">
                        <TableCell colSpan={5} className="py-4">
                          <div className="space-y-4 px-4">
                            {/* Frame gallery for all appearing shots */}
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">All Appearances ({env.shotCount} shots)</p>
                              <div className="flex flex-wrap gap-2">
                                {env.appearsInShots.map((shotId) => (
                                  <Dialog key={shotId}>
                                    <DialogTrigger asChild>
                                      <div className="w-[100px] h-[56px] bg-secondary rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative group">
                                        <img
                                          src={`${API_BASE_URL}/api/job/${TEST_JOB_ID}/assets/frames/${shotId}.png`}
                                          alt={`${shotId}`}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = ''
                                          }}
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-1 py-0.5 text-center">
                                          {shotId}
                                        </div>
                                      </div>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-3xl">
                                      <div className="aspect-video bg-black rounded overflow-hidden">
                                        <img
                                          src={`${API_BASE_URL}/api/job/${TEST_JOB_ID}/assets/frames/${shotId}.png`}
                                          alt={`${shotId}`}
                                          className="w-full h-full object-contain"
                                        />
                                      </div>
                                      <p className="text-sm text-muted-foreground mt-2">
                                        {shotId} - {env.displayName}
                                      </p>
                                    </DialogContent>
                                  </Dialog>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Visual Signature</p>
                              <p className="text-sm">{env.visualSignature}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Detailed Description</p>
                              <p className="text-sm text-muted-foreground">{env.detailedDescription}</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
