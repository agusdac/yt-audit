import type { VideoDetails } from '~~/types/youtube'
import type { LinkCheckResult } from '~~/types/links'

const DEFAULT_CPM = 20 // $20 per 1000 views

export function estimateMonthlyViews(totalViews: number, publishedAt: string): number {
  const published = new Date(publishedAt).getTime()
  const now = Date.now()
  const monthsSincePublish = Math.max(1, (now - published) / (30 * 24 * 60 * 60 * 1000))
  return totalViews / monthsSincePublish
}

export function estimateRevenueLoss(monthlyViews: number, cpm = DEFAULT_CPM): number {
  return (monthlyViews / 1000) * cpm
}

export function getRevenueLossForLink(
  linkResult: LinkCheckResult,
  videos: VideoDetails[],
  cpm = DEFAULT_CPM
): { monthlyViews: number; revenueLoss: number } {
  const videoIds = linkResult.videoIds ?? []
  let monthlyViews = 0
  for (const vid of videos) {
    if (videoIds.includes(vid.id)) {
      monthlyViews += estimateMonthlyViews(vid.viewCount, vid.publishedAt)
    }
  }
  const revenueLoss = estimateRevenueLoss(monthlyViews, cpm)
  return { monthlyViews, revenueLoss }
}
