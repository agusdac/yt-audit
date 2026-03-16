/**
 * Video Metadata Score - reusable calculation for YouTube optimization.
 * Data sources documented in docs/score/VIDEO_SCORE_DATA_SOURCES.md
 */

import type { LinkCheckResult } from '~~/types/links'
import type { CategorizedLinks } from '~~/utils/url'
import { extractUrls, getLinksToCheck } from '~~/utils/url'

export interface VideoScoreInput {
  title: string
  description: string
  duration: number
  thumbnails?: { maxres?: { url: string } }
  definition?: 'hd' | 'sd'
  links: CategorizedLinks
  linkResults: LinkCheckResult[]
  channelVideoIds: string[]
}

export interface ScoreStep {
  id: string
  name: string
  points: number
  maxPoints: number
  passed: boolean
  explanation: string
  whyImportant: string
}

export interface ScorePenalty {
  id: string
  name: string
  points: number
  applied: boolean
  explanation: string
}

export interface VideoScoreResult {
  score: number
  maxPossible: number
  steps: ScoreStep[]
  penalties: ScorePenalty[]
}

const POWER_WORDS = [
  'how', 'why', 'secret', 'best', 'top', 'ultimate', 'complete', 'guide',
  'easy', 'simple', 'proven', 'free', 'new', 'amazing', 'incredible', 'must',
  'essential', 'critical', 'important', 'revealed', 'exposed', 'truth',
  'hack', 'trick', 'tip', 'mistake', 'avoid', 'never', 'always', 'vs'
]

const TIMESTAMP_REGEX = /(?:^|\n)\s*(\d{1,2}):(\d{2})(?:\s|$|\.|,)/gm

const parseTimestamps = (text: string): number[] => {
  const times: number[] = []
  let m: RegExpExecArray | null
  TIMESTAMP_REGEX.lastIndex = 0
  while ((m = TIMESTAMP_REGEX.exec(text)) !== null) {
    const mins = parseInt(m[1]!, 10)
    const secs = parseInt(m[2]!, 10)
    times.push(mins * 60 + secs)
  }
  const unique = [...new Set(times)].sort((a, b) => a - b)
  return unique
}

const hasChronologicalTimestamps = (times: number[], minCount: number): boolean => {
  if (times.length < minCount) return false
  for (let i = 1; i < times.length; i++) {
    if (times[i]! <= times[i - 1]!) return false
  }
  return true
}

const checkChapterMarkers = (description: string, duration: number): { passed: boolean; explanation: string } => {
  const times = parseTimestamps(description)
  const durationMins = duration / 60
  if (durationMins < 5) {
    return { passed: true, explanation: `Not required for short videos.` }
  }
  const hasZero = times.some(t => t === 0)
  if (!hasZero) {
    return { passed: false, explanation: 'No chapter markers found. Add timestamps (e.g. 0:00, 1:30) starting with 0:00.' }
  }
  const minRequired = durationMins <= 8 ? 2 : 3
  const ok = hasChronologicalTimestamps(times, minRequired)
  return {
    passed: ok,
    explanation: ok
      ? `Found ${times.length} chapter timestamps in chronological order.`
      : `Need at least ${minRequired} timestamps in chronological order. Found ${times.length}.`
  }
}

const checkTitleLength = (title: string): { passed: boolean; explanation: string } => {
  const len = title.length
  const passed = len <= 65
  return {
    passed,
    explanation: passed
      ? `Title is ${len} chars (under 65).`
      : `Title has ${len} chars. Mobile truncates at 65—shorten for better CTR.`
  }
}

const checkTitleBoostWords = (title: string): { passed: boolean; explanation: string } => {
  const hasPowerWord = POWER_WORDS.some(w => title.toLowerCase().includes(w))
  const hasNumber = /\d+/.test(title)
  const passed = hasPowerWord || hasNumber
  return {
    passed,
    explanation: passed
      ? 'Title uses power words or numbers to boost CTR.'
      : 'Add power words (How, Why, Secret, etc.) or numbers to improve click-through.'
  }
}

const checkAboveTheFold = (title: string, description: string): { passed: boolean; explanation: string } => {
  const aboveFold = description.slice(0, 150)
  const titleWords = new Set(title.toLowerCase().match(/\b\w+\b/g) ?? [])
  const aboveWords = aboveFold.toLowerCase().match(/\b\w+\b/g) ?? []
  const overlap = aboveWords.filter(w => w.length > 2 && titleWords.has(w)).length
  const wordCount = aboveWords.length
  const densityOk = wordCount >= 20
  const keywordOk = overlap >= 2
  const passed = densityOk && keywordOk
  return {
    passed,
    explanation: passed
      ? `First 150 chars have ${wordCount} words and ${overlap} keywords matching the title.`
      : `First 150 chars need more text (${wordCount} words) and keywords matching the title (${overlap} found).`
  }
}

const checkCustomThumbnail = (thumbnails?: { maxres?: { url: string } }): { passed: boolean; explanation: string } => {
  const hasMaxres = !!(thumbnails?.maxres?.url)
  return {
    passed: hasMaxres,
    explanation: hasMaxres
      ? 'Custom high-resolution thumbnail detected.'
      : 'Upload a custom thumbnail (maxres) for better CTR.'
  }
}

const checkDescriptionSeoDepth = (description: string, duration: number): { passed: boolean; explanation: string } => {
  const words = description.trim().split(/\s+/).filter(Boolean).length
  const isLongVideo = duration >= 60 * 8
  const minWords = isLongVideo ? 400 : 200
  const passed = words >= minWords
  return {
    passed,
    explanation: passed
      ? `Description has ${words} words (target: ${minWords}+).`
      : `Description has ${words} words. Aim for ${minWords}+ for ${isLongVideo ? 'longer' : 'short'} videos.`
  }
}

const isYouTubeUrl = (url: string): boolean => {
  try {
    const host = new URL(url).hostname.toLowerCase()
    return host === 'youtube.com' || host === 'www.youtube.com' || host === 'youtu.be'
  } catch {
    return false
  }
}

const extractVideoIdFromYtUrl = (url: string): string | null => {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('/')[0] ?? null
    return u.searchParams.get('v')
  } catch {
    return null
  }
}

const checkBingeLoopLink = (description: string, channelVideoIds: string[]): { passed: boolean; explanation: string } => {
  const urls = extractUrls(description)
  const ytUrls = urls.filter(isYouTubeUrl)
  if (ytUrls.length === 0) {
    return { passed: false, explanation: 'Add a youtube.com or youtu.be link to another video or playlist.' }
  }
  const ownVideoIds = new Set(channelVideoIds)
  const hasOwnLink = ytUrls.some(url => {
    const vid = extractVideoIdFromYtUrl(url)
    return vid && ownVideoIds.has(vid)
  })
  return {
    passed: hasOwnLink,
    explanation: hasOwnLink
      ? 'Found internal link to your own video or playlist.'
      : 'Add a link to another of your videos or playlists to keep viewers on YouTube.'
  }
}

const checkHdQuality = (definition?: 'hd' | 'sd'): { passed: boolean; explanation: string } => {
  const passed = definition === 'hd'
  return {
    passed,
    explanation: passed ? 'Video is in HD.' : 'Upload in HD (720p+) for better reach.'
  }
}

const checkClickAwayPenalty = (description: string, links: CategorizedLinks): { applied: boolean; explanation: string } => {
  const aboveFold = description.slice(0, 150)
  const allUrls = getLinksToCheck(links)
  const externalInFold = allUrls.some(url => {
    if (isYouTubeUrl(url)) return false
    return aboveFold.includes(url)
  })
  return {
    applied: externalInFold,
    explanation: externalInFold
      ? 'External link in first 150 chars—move links below "Show more".'
      : 'No external links above the fold.'
  }
}

const checkBrokenLinkPenalty = (linkResults: LinkCheckResult[], videoId: string): { applied: boolean; explanation: string } => {
  const deadForVideo = linkResults.filter(r => r.category === 'dead' && r.videoIds.includes(videoId))
  return {
    applied: deadForVideo.length > 0,
    explanation: deadForVideo.length > 0
      ? `${deadForVideo.length} dead link(s) found. Fix or remove them.`
      : 'All links are working.'
  }
}

const checkLinkSpamPenalty = (links: CategorizedLinks): { applied: boolean; explanation: string } => {
  const externalCount = getLinksToCheck(links).length
  const applied = externalCount > 7
  return {
    applied,
    explanation: applied
      ? `${externalCount} external links—consider reducing to 7 or fewer.`
      : `${externalCount} external links (limit: 7).`
  }
}

export const calculateVideoScore = (
  input: VideoScoreInput,
  videoId: string
): VideoScoreResult => {
  const steps: ScoreStep[] = []
  const penalties: ScorePenalty[] = []

  const chapter = checkChapterMarkers(input.description, input.duration)
  steps.push({
    id: 'chapters',
    name: 'Chapter markers',
    points: chapter.passed ? 15 : 0,
    maxPoints: 15,
    passed: chapter.passed,
    explanation: chapter.explanation,
    whyImportant: 'Google Search crawls timestamps for "Key Moments" in search results—opting out costs free traffic.'
  })

  const titleLen = checkTitleLength(input.title)
  steps.push({
    id: 'title-length',
    name: 'Title length',
    points: titleLen.passed ? 10 : 0,
    maxPoints: 10,
    passed: titleLen.passed,
    explanation: titleLen.explanation,
    whyImportant: 'Mobile truncates at 65 chars—longer titles get cut off and hurt CTR.'
  })

  const titleBoost = checkTitleBoostWords(input.title)
  steps.push({
    id: 'title-boost',
    name: 'Title boost words',
    points: titleBoost.passed ? 5 : 0,
    maxPoints: 5,
    passed: titleBoost.passed,
    explanation: titleBoost.explanation,
    whyImportant: 'Power words and numbers boost click-through rate.'
  })

  const aboveFold = checkAboveTheFold(input.title, input.description)
  steps.push({
    id: 'above-fold',
    name: 'Above-the-fold hook',
    points: aboveFold.passed ? 15 : 0,
    maxPoints: 15,
    passed: aboveFold.passed,
    explanation: aboveFold.explanation,
    whyImportant: 'YouTube uses first 150 chars to understand context and recommend to the right audience.'
  })

  const thumb = checkCustomThumbnail(input.thumbnails)
  steps.push({
    id: 'thumbnail',
    name: 'Custom thumbnail',
    points: thumb.passed ? 10 : 0,
    maxPoints: 10,
    passed: thumb.passed,
    explanation: thumb.explanation,
    whyImportant: 'Custom thumbnail is baseline for CTR; auto-generated frames rarely convert.'
  })

  const descSeo = checkDescriptionSeoDepth(input.description, input.duration)
  steps.push({
    id: 'description-seo',
    name: 'Description SEO depth',
    points: descSeo.passed ? 10 : 0,
    maxPoints: 10,
    passed: descSeo.passed,
    explanation: descSeo.explanation,
    whyImportant: 'Algorithm needs text to place your video in Suggested feed.'
  })

  steps.push({
    id: 'captions',
    name: 'Custom captions',
    points: 0,
    maxPoints: 10,
    passed: false,
    explanation: 'Requires captions API. Coming soon.',
    whyImportant: 'Custom captions improve indexing and mobile mute viewing.'
  })

  const binge = checkBingeLoopLink(input.description, input.channelVideoIds)
  steps.push({
    id: 'binge-loop',
    name: 'Binge-loop link',
    points: binge.passed ? 10 : 0,
    maxPoints: 10,
    passed: binge.passed,
    explanation: binge.explanation,
    whyImportant: 'YouTube rewards videos that keep viewers on-platform; internal links boost promotion.'
  })

  steps.push({
    id: 'pinned-comment',
    name: 'Pinned comment',
    points: 0,
    maxPoints: 10,
    passed: false,
    explanation: 'Requires commentThreads API. Coming soon.',
    whyImportant: 'Pinned comment drives engagement and conversions.'
  })

  const hd = checkHdQuality(input.definition)
  steps.push({
    id: 'hd',
    name: 'HD quality',
    points: hd.passed ? 5 : 0,
    maxPoints: 5,
    passed: hd.passed,
    explanation: hd.explanation,
    whyImportant: 'SD signals low production value; algorithm may restrict reach.'
  })

  const clickAway = checkClickAwayPenalty(input.description, input.links)
  penalties.push({
    id: 'click-away',
    name: 'Click-away penalty',
    points: -10,
    applied: clickAway.applied,
    explanation: clickAway.explanation
  })

  const broken = checkBrokenLinkPenalty(input.linkResults, videoId)
  penalties.push({
    id: 'broken-link',
    name: 'Broken link penalty',
    points: -10,
    applied: broken.applied,
    explanation: broken.explanation
  })

  const spam = checkLinkSpamPenalty(input.links)
  penalties.push({
    id: 'link-spam',
    name: 'Link spam penalty',
    points: -5,
    applied: spam.applied,
    explanation: spam.explanation
  })

  const maxPossible = 100
  const earned = steps.reduce((s, st) => s + st.points, 0)
  const penaltyTotal = penalties.filter(p => p.applied).reduce((s, p) => s + p.points, 0)
  const maxFromComputable = 80
  const rawScore = earned + penaltyTotal
  const score = Math.max(0, Math.min(100, Math.round(rawScore * (100 / maxFromComputable))))

  return {
    score,
    maxPossible,
    steps,
    penalties
  }
}
