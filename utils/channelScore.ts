/**
 * Channel Metadata Score - reusable calculation for channel storefront health.
 * Data sources documented in docs/score/CHANNEL_SCORE_DATA_SOURCES.md
 */

import type { LinkCheckResult } from '~~/types/links'
import { extractUrls } from '~~/utils/url'

export interface ChannelScoreInput {
  description: string
  customUrl?: string
  thumbnails?: { default?: { url: string } }
  keywords?: string
  brandingSettings?: {
    channel?: { unsubscribedTrailer?: string; keywords?: string }
    watch?: { featuredPlaylistId?: string }
    image?: { bannerExternalUrl?: string }
  }
  linkResults: LinkCheckResult[]
  lastVideoPublishedAt?: string
  last10VideoScores: number[]
}

export interface ChannelScoreStep {
  id: string
  name: string
  points: number
  maxPoints: number
  passed: boolean
  explanation: string
  whyImportant: string
}

export interface ChannelScorePenalty {
  id: string
  name: string
  points: number
  applied: boolean
  explanation: string
}

export interface ChannelScoreResult {
  score: number
  maxPossible: number
  setupScore: number
  recentContentScore: number
  steps: ChannelScoreStep[]
  penalties: ChannelScorePenalty[]
}

const MAX_FROM_COMPUTABLE_SETUP = 70

const checkDescriptionSeo = (description: string): { passed: boolean; explanation: string } => {
  const len = (description || '').trim().length
  const passed = len >= 300
  return {
    passed,
    explanation: passed
      ? `Channel About has ${len} characters.`
      : `Channel About has ${len} characters. Aim for 300+ for Google indexing.`
  }
}

const checkTrailerFeatured = (brandingSettings?: ChannelScoreInput['brandingSettings']): { passed: boolean; explanation: string } => {
  const trailer = brandingSettings?.channel?.unsubscribedTrailer
  const featured = brandingSettings?.watch?.featuredPlaylistId
  const passed = !!(trailer || featured)
  return {
    passed,
    explanation: passed
      ? 'Channel trailer or featured video/playlist is set.'
      : 'Set a channel trailer for new visitors or featured video for subscribers.'
  }
}

const checkChannelHandle = (customUrl?: string): { passed: boolean; explanation: string } => {
  const passed = !!(customUrl && customUrl.trim().length > 0)
  return {
    passed,
    explanation: passed
      ? `Custom handle @${customUrl.replace(/^@/, '')} is set.`
      : 'Claim a custom @handle for tagging, Shorts discovery, and brand protection.'
  }
}

const checkVisualBranding = (
  thumbnails?: { default?: { url: string } },
  bannerUrl?: string
): { passed: boolean; explanation: string } => {
  const hasAvatar = !!(thumbnails?.default?.url)
  const hasBanner = !!(bannerUrl && bannerUrl.trim().length > 0)
  const passed = hasAvatar && hasBanner
  return {
    passed,
    explanation: passed
      ? 'Custom avatar and banner are set.'
      : `Custom avatar: ${hasAvatar ? 'yes' : 'no'}. Banner: ${hasBanner ? 'yes' : 'no'}. Both improve credibility.`
  }
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i

const checkChannelKeywords = (keywords?: string): { passed: boolean; explanation: string } => {
  const trimmed = keywords?.trim() ?? ''
  const passed = trimmed.length > 0
  return {
    passed,
    explanation: passed
      ? 'Channel keywords are set—helps discovery in search and recommendations.'
      : 'Add channel keywords in YouTube Studio for better discoverability.'
  }
}

const checkBusinessLinks = (description: string): { passed: boolean; explanation: string } => {
  const urls = extractUrls(description)
  const hasEmail = EMAIL_REGEX.test(description)
  const hasExternalLink = urls.some((u) => {
    try {
      const host = new URL(u).hostname.toLowerCase()
      return host !== 'youtube.com' && host !== 'www.youtube.com' && host !== 'youtu.be'
    } catch {
      return false
    }
  })
  const passed = hasEmail || hasExternalLink
  return {
    passed,
    explanation: passed
      ? 'Business email or external links found in channel About.'
      : 'Add a business email or social/website links for sponsors and multi-platform growth.'
  }
}

const checkGhostTown = (lastVideoPublishedAt?: string): { applied: boolean; explanation: string } => {
  if (!lastVideoPublishedAt) {
    return { applied: false, explanation: 'No video data to check.' }
  }
  const last = new Date(lastVideoPublishedAt).getTime()
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000
  const applied = last < ninetyDaysAgo
  return {
    applied,
    explanation: applied
      ? 'No public video in the last 90 days—algorithm may throttle reach.'
      : 'Channel has recent activity.'
  }
}

const checkDeadLink = (linkResults: LinkCheckResult[]): { applied: boolean; explanation: string } => {
  const dead = linkResults.filter((r) => r.category === 'dead')
  const applied = dead.length > 0
  return {
    applied,
    explanation: applied
      ? `${dead.length} dead link(s) on channel profile—fix for sponsor credibility.`
      : 'All channel profile links are working.'
  }
}

const checkDefaultAvatar = (_thumbnails?: { default?: { url: string } }): { applied: boolean; explanation: string } => {
  return {
    applied: false,
    explanation: 'Default avatar detection requires further API research; not applied.'
  }
}

const checkMissingContact = (description: string): { applied: boolean; explanation: string } => {
  const hasEmail = EMAIL_REGEX.test(description)
  const applied = !hasEmail
  return {
    applied,
    explanation: applied
      ? 'No business email in channel About—sponsors cannot contact you.'
      : 'Business contact info found.'
  }
}

export const calculateChannelScore = (input: ChannelScoreInput): ChannelScoreResult => {
  const steps: ChannelScoreStep[] = []
  const penalties: ChannelScorePenalty[] = []

  const descSeo = checkDescriptionSeo(input.description)
  steps.push({
    id: 'description-seo',
    name: 'Description SEO',
    points: descSeo.passed ? 20 : 0,
    maxPoints: 20,
    passed: descSeo.passed,
    explanation: descSeo.explanation,
    whyImportant: 'Channel description gets indexed by Google; keyword-rich About helps your page rank.'
  })

  steps.push({
    id: 'homepage-layout',
    name: 'Homepage layout & shelves',
    points: 0,
    maxPoints: 20,
    passed: false,
    explanation: 'No API for shelves. Coming soon.',
    whyImportant: 'Curated playlists turn casual visitors into binge-watchers.'
  })

  const trailer = checkTrailerFeatured(input.brandingSettings)
  steps.push({
    id: 'trailer-featured',
    name: 'Trailer / Featured video',
    points: trailer.passed ? 20 : 0,
    maxPoints: 20,
    passed: trailer.passed,
    explanation: trailer.explanation,
    whyImportant: 'Auto-playing a video when someone visits is the highest-converting tool for new subscribers.'
  })

  const handle = checkChannelHandle(input.customUrl)
  steps.push({
    id: 'channel-handle',
    name: 'Channel handle',
    points: handle.passed ? 10 : 0,
    maxPoints: 10,
    passed: handle.passed,
    explanation: handle.explanation,
    whyImportant: 'Handles are essential for tagging, Shorts discovery, and brand identity.'
  })

  steps.push({
    id: 'video-watermark',
    name: 'Video watermark',
    points: 0,
    maxPoints: 10,
    passed: false,
    explanation: 'Requires watermarks API. Coming soon.',
    whyImportant: 'Subscribe button on every video drives passive subscriptions.'
  })

  const keywords = checkChannelKeywords(input.keywords ?? input.brandingSettings?.channel?.keywords)
  steps.push({
    id: 'channel-keywords',
    name: 'Channel keywords',
    points: keywords.passed ? 5 : 0,
    maxPoints: 5,
    passed: keywords.passed,
    explanation: keywords.explanation,
    whyImportant: 'Keywords help YouTube surface your channel in search and recommendations.'
  })

  const visual = checkVisualBranding(input.thumbnails, input.brandingSettings?.image?.bannerExternalUrl)
  steps.push({
    id: 'visual-branding',
    name: 'Visual branding',
    points: visual.passed ? 10 : 0,
    maxPoints: 10,
    passed: visual.passed,
    explanation: visual.explanation,
    whyImportant: 'Missing banner or avatar signals abandoned or amateur channel to viewers and sponsors.'
  })

  const business = checkBusinessLinks(input.description)
  steps.push({
    id: 'business-links',
    name: 'Business & social links',
    points: business.passed ? 10 : 0,
    maxPoints: 10,
    passed: business.passed,
    explanation: business.explanation,
    whyImportant: 'Missing contact means missing brand deals; missing social links traps audience on YouTube.'
  })

  const ghostTown = checkGhostTown(input.lastVideoPublishedAt)
  penalties.push({
    id: 'ghost-town',
    name: 'Ghost town penalty',
    points: -15,
    applied: ghostTown.applied,
    explanation: ghostTown.explanation
  })

  const deadLink = checkDeadLink(input.linkResults)
  penalties.push({
    id: 'dead-link',
    name: 'Dead link penalty',
    points: -10,
    applied: deadLink.applied,
    explanation: deadLink.explanation
  })

  const defaultAvatar = checkDefaultAvatar(input.thumbnails)
  penalties.push({
    id: 'default-avatar',
    name: 'Default avatar penalty',
    points: -10,
    applied: defaultAvatar.applied,
    explanation: defaultAvatar.explanation
  })

  const missingContact = checkMissingContact(input.description)
  penalties.push({
    id: 'missing-contact',
    name: 'Missing contact email',
    points: -5,
    applied: missingContact.applied,
    explanation: missingContact.explanation
  })

  const rawSetupScore = steps.reduce((s, st) => s + st.points, 0)
  const setupScore = Math.round(rawSetupScore * (100 / MAX_FROM_COMPUTABLE_SETUP))
  const recentContentScore =
    input.last10VideoScores.length > 0
      ? Math.round(
          input.last10VideoScores.reduce((a, b) => a + b, 0) / input.last10VideoScores.length
        )
      : 0
  const penaltyTotal = penalties.filter((p) => p.applied).reduce((s, p) => s + p.points, 0)
  const rawGlobal = setupScore / 2 + recentContentScore / 2 + penaltyTotal
  const score = Math.max(0, Math.min(100, Math.round(rawGlobal)))

  return {
    score,
    maxPossible: 100,
    setupScore: Math.min(100, setupScore),
    recentContentScore,
    steps,
    penalties
  }
}
