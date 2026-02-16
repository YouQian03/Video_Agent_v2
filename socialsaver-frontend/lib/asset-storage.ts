// lib/asset-storage.ts
// Asset Library — server-side persistence via backend API

import type { Asset, StoryThemeAnalysis, ScriptAnalysis, StoryboardShot } from "./types/remix"
import {
  fetchLibraryAssets,
  createLibraryAsset,
  updateLibraryAsset as apiUpdateAsset,
  deleteLibraryAsset,
} from "./api"

/**
 * Get all assets from backend
 */
export async function getAssets(): Promise<Asset[]> {
  try {
    return await fetchLibraryAssets()
  } catch (e) {
    console.error("Failed to load assets from backend:", e)
    return []
  }
}

/**
 * Add a new asset to the library (backend auto-generates id/timestamps)
 */
export async function addAsset(asset: Omit<Asset, "id" | "createdAt" | "updatedAt">): Promise<Asset> {
  return await createLibraryAsset(asset as Record<string, any>)
}

/**
 * Update an existing asset
 */
export async function updateAsset(id: string, updates: Partial<Asset>): Promise<Asset | null> {
  try {
    return await apiUpdateAsset(id, updates as Record<string, any>)
  } catch (e) {
    console.error("Failed to update asset:", e)
    return null
  }
}

/**
 * Delete an asset
 */
export async function deleteAsset(id: string): Promise<boolean> {
  try {
    return await deleteLibraryAsset(id)
  } catch (e) {
    console.error("Failed to delete asset:", e)
    return false
  }
}

/**
 * Helper: Save a storyboard analysis result to library
 */
export async function saveStoryboardToLibrary(
  name: string,
  tags: string[],
  data: {
    storyTheme?: StoryThemeAnalysis
    scriptAnalysis?: ScriptAnalysis
    storyboard?: StoryboardShot[]
  },
  sourceVideo?: { name: string; size: number; url?: string },
  thumbnail?: string
): Promise<Asset> {
  const finalThumbnail = thumbnail || (data.storyboard && data.storyboard[0]?.firstFrameImage) || undefined

  return addAsset({
    name,
    type: "storyboard",
    tags,
    data,
    sourceVideo,
    thumbnail: finalThumbnail,
  } as Omit<Asset, "id" | "createdAt" | "updatedAt">)
}

/**
 * Helper: Save a single storyboard shot to library
 */
export async function saveShotToLibrary(
  name: string,
  tags: string[],
  shot: StoryboardShot,
  sourceVideo?: { name: string; size: number; url?: string }
): Promise<Asset> {
  return addAsset({
    name,
    type: "storyboard",
    tags,
    data: shot,
    sourceVideo,
    thumbnail: shot.firstFrameImage,
  } as Omit<Asset, "id" | "createdAt" | "updatedAt">)
}

/**
 * Helper: Save a theme analysis to library
 */
export async function saveThemeToLibrary(
  name: string,
  tags: string[],
  data: StoryThemeAnalysis,
  sourceVideo?: { name: string; size: number; url?: string }
): Promise<Asset> {
  return addAsset({
    name,
    type: "theme",
    tags,
    data,
    sourceVideo,
  } as Omit<Asset, "id" | "createdAt" | "updatedAt">)
}

/**
 * Helper: Save a script analysis to library
 */
export async function saveScriptToLibrary(
  name: string,
  tags: string[],
  data: ScriptAnalysis,
  sourceVideo?: { name: string; size: number; url?: string }
): Promise<Asset> {
  return addAsset({
    name,
    type: "script",
    tags,
    data,
    sourceVideo,
  } as unknown as Omit<Asset, "id" | "createdAt" | "updatedAt">)
}

/**
 * Helper: Save a generated video to library
 */
export async function saveVideoToLibrary(
  name: string,
  tags: string[],
  videoData: { url: string; duration: number; format: string; resolution: string },
  sourceVideo?: { name: string; size: number; url?: string }
): Promise<Asset> {
  return addAsset({
    name,
    type: "video",
    tags,
    data: videoData,
    sourceVideo,
    thumbnail: undefined,
  } as Omit<Asset, "id" | "createdAt" | "updatedAt">)
}
