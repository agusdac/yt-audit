# URL Extractor

The URL utilities in `utils/url.ts` extract, normalize, and classify links from video descriptions.

## extractUrls(text)

Extracts URLs from plain text. Handles:

- **Markdown links:** `[text](https://example.com)` — captures the URL from the parentheses
- **Bare URLs:** `https://example.com/path` — matches `http`/`https` URLs with TLDs 2–63 characters
- **Trailing punctuation:** Strips trailing `.,!?;:)]}>'"` so `https://x.com).` becomes `https://x.com`

Returns a deduplicated array of URLs.

## normalizeUrl(url)

Normalizes a URL for comparison:

- Removes the hash fragment
- Removes trailing slash (when length > 8)
- Trims whitespace

Used when comparing URLs (e.g. redirect detection, deduplication).

## getHostname(url)

Extracts the hostname from a URL (e.g. `www.amazon.de` from `https://www.amazon.de/path`). Returns `null` on parse error. Used for domain-based matching.

## classifyLinks(text, userSponsorDomains?)

Categorizes extracted URLs using [config/link-domains.json](../config/link-domains.json):

| Category | Description |
|----------|--------------|
| `socials` | Pure social (Twitter, Instagram, etc.) — not checked for dead/redirect |
| `socialWithRevenue` | Patreon, Ko-fi, etc. — checked |
| `affiliates` | Affiliate links (domain or param match) |
| `sponsors` | Shorteners, known brands, user-defined sponsors |
| `merch` | Merch store links |
| `other` | Everything else |

Domain matching uses hostname-based logic so base domains (e.g. `amazon`, `nordvpn`) match any TLD (`amazon.de`, `nordvpn.com`, etc.). Path-specific entries (e.g. `amazon.com/shop`) use substring matching.

## getLinksToCheck(links)

Returns the subset of categorized links that are checked for dead/redirect status:

- sponsors
- affiliates
- merch
- other
- socialWithRevenue

Excludes pure social links (Twitch, Instagram, etc.).

## getLinkType(url, userSponsorDomains?)

Classifies a single URL into a link type for revenue calculation: `sponsor`, `affiliate`, `merch`, `socialWithRevenue`, or `other`.

## extractPromoCode(url)

Extracts promo/coupon codes from a URL:

- **Query params:** `code`, `promo`, `coupon`, `discount`, `ref`, `aff`
- **Path patterns:** `/discount/CODE`, `/p/CODE`

Returns the first match or `null`.
