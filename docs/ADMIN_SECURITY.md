# Admin Security

## Current Implementation

The admin area (`/admin`) uses a password stored in `.env` as `ADMIN_PASSWORD`. On successful login:

- An HMAC-signed cookie (`yt_audit_admin`) is set
- Cookie is `httpOnly`, `secure` in production, `sameSite: lax`, 7-day max age
- Signature uses `ADMIN_PASSWORD` (or a fallback) as the HMAC secret

## When the Current Approach Is Sufficient

For a single-tenant or small-team internal tool, the password-based admin login is acceptable if:

- The password is strong (e.g. 20+ characters, randomly generated)
- HTTPS is used in production
- `.env` is not committed to version control
- Access is limited to trusted team members

## Alternatives to Consider

| Option | Pros | Cons |
|--------|------|------|
| **OAuth (Google Workspace)** | No password to manage, audit trail, familiar UX | Requires allowed-emails list; more setup |
| **Magic link** | No password, email-based | Needs email config; extra endpoint |
| **2FA (TOTP)** | Stronger than password alone | More UX; needs library (e.g. otplib) |
| **API key only** | Simple for automation | No UI login; key management |
| **IP allowlist** | Extra layer | Brittle for dynamic IPs |

## Recommendations

- **Keep the current password approach** for small teams and internal tools.
- **Consider OAuth** if you need per-user audit trails or multiple admins with different identities.
- **Add 2FA** if the admin area handles sensitive data or is exposed to higher risk.
