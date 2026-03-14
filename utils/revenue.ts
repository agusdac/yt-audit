import type { VideoDetails } from '~~/types/youtube'
import type { LinkCheckResult } from '~~/types/links'
import { getLinkType } from '~~/utils/url'

/** Days threshold: videos newer than this use total views; older use evergreen rate */
const NEW_VIDEO_DAYS = 30
/** Evergreen rate: ~4% of total views per month for older videos (research: 3-5% for evergreen content) */
const EVERGREEN_RATE = 0.04

/** CPM for sponsor links ($/1000 views) - brand deal value */
const CPM_SPONSOR = 25
/** Default CPM fallback */
const CPM_DEFAULT = 20

/** Affiliate: CTR 1.5%, conversion 5%, avg commission $5 per conversion */
const CTR_AFFILIATE = 0.015
const CONV_AFFILIATE = 0.05
const AVG_COMMISSION = 5
/** Revenue per 1000 views for affiliate: 1000 * 0.015 * 0.05 * 5 = 3.75 */
const AFFILIATE_PER_1000 = 1000 * CTR_AFFILIATE * CONV_AFFILIATE * AVG_COMMISSION

/** Merch: ~0.5x affiliate (lower CTR/conversion) */
const MERCH_MULTIPLIER = 0.5
/** SocialWithRevenue (Patreon, Ko-fi): ~0.8x affiliate */
const SOCIAL_REVENUE_MULTIPLIER = 0.8
/** Other: 0.2x sponsor CPM */
const OTHER_CPM_MULTIPLIER = 0.2

/**
 * Estimate monthly views for a video.
 * - New videos (< 30 days): use totalViews (fresh content gets most views early)
 * - Older videos: apply evergreen rate (small % of total views per month)
 */
export function estimateMonthlyViews(totalViews: number, publishedAt: string): number {
  const published = new Date(publishedAt).getTime()
  const now = Date.now()
  const daysSincePublish = (now - published) / (24 * 60 * 60 * 1000)

  if (daysSincePublish < NEW_VIDEO_DAYS) {
    return totalViews
  }
  return totalViews * EVERGREEN_RATE
}

/**
 * Revenue loss per 1000 monthly views by link type.
 * Sponsor: CPM model. Affiliate: CTR × conversion × commission. Others: scaled.
 */
function getRevenuePer1000Views(linkType: 'sponsor' | 'affiliate' | 'merch' | 'socialWithRevenue' | 'other'): number {
  switch (linkType) {
    case 'sponsor':
      return CPM_SPONSOR
    case 'affiliate':
      return AFFILIATE_PER_1000
    case 'merch':
      return AFFILIATE_PER_1000 * MERCH_MULTIPLIER
    case 'socialWithRevenue':
      return AFFILIATE_PER_1000 * SOCIAL_REVENUE_MULTIPLIER
    case 'other':
      return CPM_SPONSOR * OTHER_CPM_MULTIPLIER
    default:
      return CPM_DEFAULT
  }
}

export function estimateRevenueLoss(
  monthlyViews: number,
  linkType: 'sponsor' | 'affiliate' | 'merch' | 'socialWithRevenue' | 'other' = 'sponsor'
): number {
  const per1000 = getRevenuePer1000Views(linkType)
  return (monthlyViews / 1000) * per1000
}

export function getRevenueLossForLink(
  linkResult: LinkCheckResult,
  videos: VideoDetails[],
  options?: { userSponsors?: string[] }
): { monthlyViews: number; revenueLoss: number } {
  const videoIds = linkResult.videoIds ?? []
  const linkType = getLinkType(linkResult.url, options?.userSponsors)

  let monthlyViews = 0
  for (const vid of videos) {
    if (videoIds.includes(vid.id)) {
      monthlyViews += estimateMonthlyViews(vid.viewCount, vid.publishedAt)
    }
  }

  const revenueLoss = estimateRevenueLoss(monthlyViews, linkType)
  return { monthlyViews, revenueLoss }
}
