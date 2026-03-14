/** Send email via Resend API. Requires RESEND_API_KEY and verified domain. */
export async function sendDeadLinksAlert(
  to: string,
  options: {
    channels: string[]
    deadLinksCount: number
    totalRevenueLoss: number
    deadLinks: Array<{ url: string; videoCount: number }>
  }
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !to?.trim()) return false

  const from = process.env.RESEND_FROM || 'YT-Audit <onboarding@resend.dev>'
  const subject = `YT-Audit: ${options.deadLinksCount} dead link${options.deadLinksCount === 1 ? '' : 's'} found`

  const linksList = options.deadLinks
    .slice(0, 20)
    .map((l) => `- ${l.url} (${l.videoCount} video${l.videoCount === 1 ? '' : 's'})`)
    .join('\n')

  const html = `
    <h2>Dead links detected</h2>
    <p>Channels: ${options.channels.join(', ')}</p>
    <p><strong>${options.deadLinksCount}</strong> dead link${options.deadLinksCount === 1 ? '' : 's'} found.</p>
    <p>Estimated monthly revenue loss: <strong>~$${Math.round(options.totalRevenueLoss)}</strong></p>
    ${options.deadLinks.length > 0 ? `<h3>Links to fix:</h3><pre style="white-space:pre-wrap;font-size:12px">${linksList}</pre>` : ''}
    <p>Run an audit to get the full list and fix them in YouTube Studio.</p>
  `.trim()

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: [to.trim()],
        subject,
        html
      })
    })
    return res.ok
  } catch {
    return false
  }
}
