function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Send email via Resend API. Requires RESEND_API_KEY and verified domain. */
export async function sendDeadLinksAlert(
  to: string,
  options: {
    channels: string[]
    deadLinksCount: number
    totalRevenueLoss: number
    deadLinks: Array<{ url: string; videoCount: number }>
    siteUrl?: string
  }
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !to?.trim()) return false

  const from = process.env.RESEND_FROM || 'YT-Audit <onboarding@resend.dev>'
  const subject = `YT-Audit: ${options.deadLinksCount} dead link${options.deadLinksCount === 1 ? '' : 's'} found`
  const siteUrl = (options.siteUrl || process.env.NUXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
  const dashboardUrl = siteUrl ? `${siteUrl}/dashboard` : ''

  const linksHtml = options.deadLinks
    .slice(0, 20)
    .map(
      (l) =>
        `<li style="margin:6px 0;font-size:13px;color:#374151;word-break:break-all">${escapeHtml(l.url)} <span style="color:#6b7280">(${l.videoCount} video${l.videoCount === 1 ? '' : 's'})</span></li>`
    )
    .join('')

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6">
  <div style="max-width:600px;margin:0 auto;padding:24px">
    <div style="margin-bottom:24px">
      <h1 style="margin:0;font-size:24px;font-weight:700;color:#18181b;background:linear-gradient(90deg,#f43f5e,#f59e0b);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent">YT-Audit</h1>
    </div>
    <div style="background:#fff;border-radius:12px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.08);border:1px solid #e5e7eb">
      <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#b91c1c">Dead links detected</h2>
      <p style="margin:0 0 8px;font-size:14px;color:#6b7280">Channels: ${escapeHtml(options.channels.join(', '))}</p>
      <p style="margin:0 0 8px;font-size:14px;color:#374151">
        <strong style="color:#b91c1c">${options.deadLinksCount}</strong> dead link${options.deadLinksCount === 1 ? '' : 's'} found.
      </p>
      <p style="margin:0 0 16px;font-size:14px;color:#374151">
        Estimated monthly revenue loss: <strong style="color:#b91c1c">~$${Math.round(options.totalRevenueLoss)}</strong>
      </p>
      ${options.deadLinks.length > 0 ? `<h3 style="margin:16px 0 8px;font-size:14px;font-weight:600;color:#374151">Links to fix:</h3><ul style="margin:0;padding-left:20px;list-style:disc">${linksHtml}</ul>` : ''}
      ${dashboardUrl ? `
      <div style="margin-top:24px">
        <a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;padding:12px 24px;background:linear-gradient(90deg,#f43f5e,#f59e0b);color:#fff;font-weight:600;font-size:14px;text-decoration:none;border-radius:8px">View dashboard</a>
      </div>
      <p style="margin:16px 0 0;font-size:12px;color:#9ca3af">Your dashboard has the full list and links to fix them in YouTube Studio.</p>
      ` : ''}
    </div>
    <p style="margin-top:16px;font-size:12px;color:#9ca3af">Your scheduled audit report · YT-Audit</p>
  </div>
</body>
</html>
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
