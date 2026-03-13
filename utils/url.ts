/**
 * Extracts URLs from text. Handles:
 * - Standard http/https URLs (including long TLDs like .technology, .youtube)
 * - Markdown links [text](url)
 * - Trailing punctuation cleanup
 */
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
    affiliates: string[]
    sponsors: string[]
    merch: string[]
    other: string[]
}

export const classifyLinks = (text: string): CategorizedLinks => {
    const rawLinks = extractUrls(text);

    const categories: CategorizedLinks = {
        socials: [],
        affiliates: [],
        sponsors: [],
        merch: [],
        other: []
    };

    rawLinks.forEach(link => {
        const l = link.toLowerCase();

        // 1. Social Media (Grouping/Discarding)
        if (l.includes('twitter.com') || l.includes('x.com') || l.includes('instagram.com') || l.includes('tiktok.com') || l.includes('facebook.com') || l.includes('discord.gg') || l.includes('discord.com') || l.includes('youtube.com') || l.includes('youtu.be') || l.includes('twitch.tv')) {
            categories.socials.push(link);
        }
        // 2. Common Merch Platforms
        else if (l.includes('teespring.com') || l.includes('shop') || l.includes('merch') || l.includes('represent.com')) {
            categories.merch.push(link);
        }
        // 3. Known Affiliate/Sponsor Patterns
        // (Commonly used by YouTubers: amzn.to for Amazon, bit.ly/ggl for sponsors)
        else if (l.includes('amzn.to') || l.includes('amazon.com/shop') || l.includes('go.skimresources.com')) {
            categories.affiliates.push(link);
        }
        // 4. Sponsor/External (Usually unique domains or shortened links)
        else if (l.includes('bit.ly') || l.includes('t.ly') || l.includes('brand.link')) {
            categories.sponsors.push(link);
        }
        else {
            categories.other.push(link);
        }
    });

    return categories;
};