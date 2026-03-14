/**
 * Extracts URLs from text. Handles:
 * - Standard http/https URLs (including long TLDs like .technology, .youtube)
 * - Markdown links [text](url)
 * - Trailing punctuation cleanup
 */
/** Normalize URL for matching (trailing slash, hash, consistent comparison) */
export const normalizeUrl = (url: string): string => {
    try {
        const u = new URL(url.trim())
        u.hash = ''
        let s = u.toString()
        if (s.endsWith('/') && s.length > 8) s = s.slice(0, -1)
        return s
    } catch {
        return url.trim()
    }
}

export const extractUrls = (text: string): string[] => {
    const seen = new Set<string>();
    const normalize = (url: string) => url.replace(/[.,!?;:)\]}>'"]+$/, '').trim();

    // 1. Markdown links: [text](https://...)
    const markdownRegex = /\[[^\]]*\]\s*\(\s*(https?:\/\/[^)\s]+)\s*\)/gi;
    let match;
    while ((match = markdownRegex.exec(text)) !== null) {
        const url = match[1]
        if (url) seen.add(normalize(url))
    }

    // 2. Bare URLs - improved regex: longer TLDs (2-63 chars), better path handling
    const bareUrlRegex = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9]{2,63}(?:[-a-zA-Z0-9@:%_+.~#?&/=]*)/gi;
    const bareMatches = text.match(bareUrlRegex) || [];
    bareMatches.forEach(url => seen.add(normalize(url)));

    return [...seen];
};

export interface CategorizedLinks {
    socials: string[]
    socialWithRevenue: string[]
    affiliates: string[]
    sponsors: string[]
    merch: string[]
    other: string[]
}

import linkDomainsConfig from '../config/link-domains.json'

const AFFILIATE_DOMAINS = linkDomainsConfig.affiliateDomains as string[]
const AFFILIATE_PARAMS = linkDomainsConfig.affiliateParams as string[]
const SPONSOR_DOMAINS = linkDomainsConfig.sponsorDomains as string[]
const MERCH_DOMAINS = linkDomainsConfig.merchDomains as string[]
const SOCIAL_DOMAINS = linkDomainsConfig.socialDomains as string[]
const SOCIAL_WITH_REVENUE_DOMAINS = linkDomainsConfig.socialWithRevenueDomains as string[]

const hasDomain = (url: string, domains: string[]): boolean =>
    domains.some(d => url.toLowerCase().includes(d));

const hasParam = (url: string, params: string[]): boolean =>
    params.some(p => url.toLowerCase().includes(p + '='));

export const classifyLinks = (text: string, userSponsorDomains?: string[]): CategorizedLinks => {
    const rawLinks = extractUrls(text);

    const categories: CategorizedLinks = {
        socials: [],
        socialWithRevenue: [],
        affiliates: [],
        sponsors: [],
        merch: [],
        other: []
    };

    const allSponsorDomains = [...SPONSOR_DOMAINS, ...(userSponsorDomains ?? [])];

    rawLinks.forEach(link => {
        const l = link.toLowerCase();

        // 1. Social with revenue (Patreon, Ko-fi, etc.)—checked for dead/redirect
        if (hasDomain(l, SOCIAL_WITH_REVENUE_DOMAINS)) {
            categories.socialWithRevenue.push(link);
        }
        // 2. Pure social (Twitter, Twitch, Instagram, etc.)—not checked
        else if (hasDomain(l, SOCIAL_DOMAINS)) {
            categories.socials.push(link);
        }
        // 3. Affiliates
        else if (hasDomain(l, AFFILIATE_DOMAINS) || hasParam(l, AFFILIATE_PARAMS)) {
            categories.affiliates.push(link);
        }
        // 3. Merch (domain-based)
        else if (hasDomain(l, MERCH_DOMAINS) || /\/shop\b|\/store\b|\/merch\b/.test(l)) {
            categories.merch.push(link);
        }
        // 4. Sponsors (shorteners + known brands + user-defined)
        else if (hasDomain(l, allSponsorDomains)) {
            categories.sponsors.push(link);
        }
        else {
            categories.other.push(link);
        }
    });

    return categories;
};

const PROMO_PARAMS = ['code', 'promo', 'coupon', 'discount', 'ref', 'aff'];
const PROMO_PATH_REGEX = /\/discount\/([^/?#]+)|\/p\/([^/?#]+)/i;

/** Links included in the dead/redirect check (excludes pure social like Twitch, Instagram) */
export const getLinksToCheck = (links: CategorizedLinks): string[] => [
    ...links.sponsors,
    ...links.affiliates,
    ...links.merch,
    ...links.other,
    ...links.socialWithRevenue
];

export const extractPromoCode = (url: string): string | null => {
    try {
        const u = new URL(url);
        for (const p of PROMO_PARAMS) {
            const v = u.searchParams.get(p);
            if (v && v.length > 0 && v.length < 100) return v;
        }
        const pathMatch = url.match(PROMO_PATH_REGEX);
        if (pathMatch) return (pathMatch[1] ?? pathMatch[2]) || null;
        return null;
    } catch {
        return null;
    }
};
