export type LinkCheckCategory = 'dead' | 'redirected' | 'ok'

export interface LinkCheckResult {
  url: string
  requestedUrl: string
  finalUrl: string
  status: number
  redirected: boolean
  videoIds: string[]
  category: LinkCheckCategory
  codeMayBeInvalid?: boolean
}
