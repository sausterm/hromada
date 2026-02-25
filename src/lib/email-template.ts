/**
 * Branded email template system for Hromada.
 *
 * Pure functions — no external dependencies. Safe to import from any module
 * without worrying about circular deps or side-effect initialization.
 */

// ---------------------------------------------------------------------------
// Design tokens (matching the site's CSS variables)
// ---------------------------------------------------------------------------

const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
const FONT_BRAND = `'Outfit', ${FONT_BODY}`
const FONT_MONO = "'Geist Mono', 'SF Mono', 'Courier New', monospace"

const C = {
  navy: '#1a2744',
  navyLight: '#3d4f6f',
  cream: '#F5F1E8',
  creamDark: '#E0D7C9',
  blue: '#0057B8',
  white: '#ffffff',
  text: '#333333',
  textLight: '#666666',
  textMuted: '#999999',
  green: '#1a7a3a',
  greenLight: '#e8f5e9',
} as const

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

interface EmailLayoutOptions {
  /** Full URL to the unsubscribe endpoint (marketing emails only). */
  unsubscribeUrl?: string
  /** Hidden preview text shown in inbox list. */
  preheader?: string
}

/**
 * Wraps email body content in the full branded Hromada shell:
 *  - Navy header with bilingual "hromada ⬡ громада" wordmark
 *  - White content area
 *  - Cream footer with POCACITO logo, Candid Platinum seal, legal text
 */
export function emailLayout(content: string, options?: EmailLayoutOptions): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const preheaderBlock = options?.preheader
    ? `<div style="display:none;font-size:1px;color:${C.cream};line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${options.preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>`
    : ''

  const unsubscribeBlock = options?.unsubscribeUrl
    ? `<p style="margin:8px 0 0;font-size:11px;font-family:${FONT_BODY};"><a href="${options.unsubscribeUrl}" style="color:${C.textMuted};text-decoration:underline;">Unsubscribe</a></p>`
    : ''

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Hromada</title>
  <!--[if !mso]><!-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Outfit:wght@600&display=swap');
  </style>
  <!--<![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${C.cream};-webkit-font-smoothing:antialiased;">
  ${preheaderBlock}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.cream};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td><![endif]-->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:${C.white};border-radius:12px;overflow:hidden;">

          <!-- ============ HEADER ============ -->
          <tr>
            <td style="background:${C.navy};padding:32px 40px;text-align:center;">
              <!-- Bilingual logo: hromada [icon] громада -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td style="font-family:${FONT_BRAND};font-size:24px;font-weight:600;color:${C.cream};letter-spacing:-0.025em;padding-right:10px;" valign="middle">hromada</td>
                  <td valign="middle" style="padding:0 2px;">
                    <img src="${appUrl}/icon.png" alt="" width="28" height="28" style="width:28px;height:28px;display:block;" />
                  </td>
                  <td style="font-family:${FONT_BRAND};font-size:24px;font-weight:600;color:${C.cream};letter-spacing:-0.025em;padding-left:10px;" valign="middle">громада</td>
                </tr>
              </table>
              <!-- Blue accent line -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-top:14px;">
                <tr>
                  <td style="width:50px;height:2px;background-color:${C.blue};font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ============ BODY ============ -->
          <tr>
            <td style="padding:40px 40px 32px;font-family:${FONT_BODY};font-size:15px;line-height:1.65;color:${C.text};">
              ${content}
            </td>
          </tr>

          <!-- ============ FOOTER ============ -->
          <tr>
            <td style="background:${C.cream};padding:28px 40px;text-align:center;border-top:1px solid ${C.creamDark};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:16px;">
                <tr>
                  <td style="padding:0 12px;" valign="middle">
                    <img src="${appUrl}/partners/pocacitologo.png" alt="POCACITO Network" height="24" style="height:24px;display:block;" />
                  </td>
                  <td style="padding:0 12px;" valign="middle">
                    <img src="${appUrl}/partners/candidseal.png" alt="Candid Platinum Seal" height="32" style="height:32px;display:block;" />
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 4px;font-size:12px;color:${C.textLight};font-family:${FONT_BODY};">
                Hromada is a project of <strong>POCACITO Network</strong>, a 501(c)(3) nonprofit.
              </p>
              <p style="margin:0;font-size:11px;color:${C.textMuted};font-family:${FONT_BODY};">
                EIN 99-0392258 &middot; Charlottesville, VA
              </p>
              ${unsubscribeBlock}
            </td>
          </tr>

        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Reusable components
// ---------------------------------------------------------------------------

/**
 * Bulletproof CTA button — works in Outlook, Gmail, Apple Mail.
 */
export function emailButton(text: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:28px auto;">
  <tr>
    <td align="center" style="background:${C.navy};border-radius:8px;">
      <a href="${href}" target="_blank" style="display:inline-block;padding:14px 36px;color:${C.cream};text-decoration:none;font-weight:600;font-size:14px;font-family:${FONT_BODY};letter-spacing:0.3px;">
        ${text}
      </a>
    </td>
  </tr>
</table>`
}

/**
 * Cream-toned info box for secondary content.
 */
export function emailInfoBox(content: string): string {
  return `<div style="background:${C.cream};padding:20px 24px;border-radius:8px;margin:24px 0;font-size:14px;line-height:1.6;">
  ${content}
</div>`
}

/**
 * Blue-bordered highlight box for credentials or important data.
 */
export function emailHighlightBox(content: string): string {
  return `<div style="border:2px solid ${C.blue};padding:20px 24px;border-radius:8px;margin:24px 0;font-size:14px;line-height:1.6;">
  ${content}
</div>`
}

/**
 * Left-accent box for metrics or status callouts.
 */
export function emailAccentBox(content: string, color: string = C.green): string {
  return `<div style="background:#f9f9f9;padding:20px 24px;border-radius:8px;margin:24px 0;border-left:4px solid ${color};font-size:14px;line-height:1.6;">
  ${content}
</div>`
}

/**
 * Main heading (h2) — uses Outfit brand font.
 */
export function emailHeading(text: string): string {
  return `<h2 style="margin:0 0 16px;font-size:22px;font-weight:600;letter-spacing:-0.025em;color:${C.navy};font-family:${FONT_BRAND};">${text}</h2>`
}

/**
 * Sub-heading (h3) — uses Outfit brand font.
 */
export function emailSubheading(text: string): string {
  return `<h3 style="margin:24px 0 8px;font-size:16px;font-weight:600;letter-spacing:-0.025em;color:${C.navy};font-family:${FONT_BRAND};">${text}</h3>`
}

/**
 * Centered monospace code display (for verification codes, reference numbers).
 */
export function emailCode(code: string): string {
  return `<div style="background:${C.cream};padding:24px;border-radius:8px;margin:24px 0;text-align:center;">
  <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:${C.navy};font-family:${FONT_MONO};">${code}</span>
</div>`
}

/**
 * Thin horizontal divider.
 */
export function emailDivider(): string {
  return `<hr style="border:none;border-top:1px solid ${C.creamDark};margin:28px 0;" />`
}

/**
 * Muted small text.
 */
export function emailMuted(text: string): string {
  return `<p style="font-size:13px;color:${C.textMuted};line-height:1.5;margin:4px 0;">${text}</p>`
}

/**
 * Inline badge (e.g., NEW DONOR, status labels).
 */
export function emailBadge(text: string, color: string = C.blue): string {
  return `<span style="background:${color};color:${C.white};padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600;letter-spacing:0.5px;">${text}</span>`
}

/**
 * Key-value line for data display inside info/highlight boxes.
 */
export function emailField(label: string, value: string): string {
  return `<p style="margin:6px 0;"><strong style="color:${C.navy};">${label}:</strong> ${value}</p>`
}

// ---------------------------------------------------------------------------
// Project card — shows project photo + name + NGO partner
// ---------------------------------------------------------------------------

interface ProjectCardOptions {
  projectName: string
  /** Full URL to a project photo. */
  photoUrl?: string
  /** NGO partner name, e.g. "NGO Ecoaction". */
  partnerName?: string
  /** Full URL to the partner's logo image. */
  partnerLogoUrl?: string
  /** Municipality name. */
  municipality?: string
}

/**
 * Rich project card with photo, name, partner attribution, and municipality.
 * Falls back gracefully when photo or partner info isn't available.
 */
export function emailProjectCard(opts: ProjectCardOptions): string {
  const photoBlock = opts.photoUrl
    ? `<tr>
        <td style="padding:0;">
          <img src="${opts.photoUrl}" alt="${opts.projectName}" width="520" style="width:100%;max-width:520px;height:auto;display:block;border-radius:8px 8px 0 0;" />
        </td>
      </tr>`
    : ''

  const partnerBlock = opts.partnerName
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
        <tr>
          ${opts.partnerLogoUrl
            ? `<td valign="middle" style="padding-right:8px;">
                <img src="${opts.partnerLogoUrl}" alt="${opts.partnerName}" height="20" style="height:20px;display:block;" />
              </td>`
            : ''}
          <td valign="middle" style="font-size:13px;color:${C.textLight};font-family:${FONT_BODY};">
            Partner: <strong style="color:${C.navy};">${opts.partnerName}</strong>
          </td>
        </tr>
      </table>`
    : ''

  const municipalityText = opts.municipality
    ? `<p style="margin:4px 0 0;font-size:13px;color:${C.textLight};font-family:${FONT_BODY};">${opts.municipality}</p>`
    : ''

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:24px 0;border:1px solid ${C.creamDark};border-radius:8px;overflow:hidden;">
  ${photoBlock}
  <tr>
    <td style="padding:20px 24px;${!opts.photoUrl ? 'border-left:4px solid ' + C.blue + ';' : ''}">
      <p style="margin:0;font-size:18px;font-weight:600;letter-spacing:-0.025em;color:${C.navy};font-family:${FONT_BRAND};">${opts.projectName}</p>
      ${municipalityText}
      ${partnerBlock}
    </td>
  </tr>
</table>`
}

// ---------------------------------------------------------------------------
// Process flow — visual stepped timeline
// ---------------------------------------------------------------------------

interface ProcessStep {
  /** Step number (1-based). */
  number: number
  /** Step title (e.g., "Confirmation"). */
  title: string
  /** Step description. */
  description: string
  /** Optional full URL to a logo/icon to show (e.g., Prozorro logo). */
  logoUrl?: string
  /** Logo alt text. */
  logoAlt?: string
}

/**
 * Vertical process flow with numbered steps, connector lines, and optional logos.
 */
export function emailProcessFlow(title: string, steps: ProcessStep[]): string {
  const stepRows = steps.map((step, i) => {
    const isLast = i === steps.length - 1

    const logoBlock = step.logoUrl
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
          <tr>
            <td valign="middle">
              <img src="${step.logoUrl}" alt="${step.logoAlt || ''}" height="18" style="height:18px;display:block;" />
            </td>
          </tr>
        </table>`
      : ''

    return `<tr>
      <td width="40" valign="top" style="padding:0;">
        <!-- Number circle -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="width:32px;height:32px;background:${C.blue};border-radius:50%;text-align:center;vertical-align:middle;font-family:${FONT_BRAND};font-size:14px;font-weight:600;color:${C.white};">
              ${step.number}
            </td>
          </tr>
          ${!isLast ? `<tr>
            <td align="center" style="padding:0;">
              <div style="width:2px;height:24px;background:${C.creamDark};margin:0 auto;">&nbsp;</div>
            </td>
          </tr>` : ''}
        </table>
      </td>
      <td valign="top" style="padding:2px 0 ${isLast ? '0' : '16'}px 16px;">
        <p style="margin:0;font-size:15px;font-weight:600;letter-spacing:-0.025em;color:${C.navy};font-family:${FONT_BRAND};">${step.title}</p>
        <p style="margin:4px 0 0;font-size:13px;color:${C.textLight};line-height:1.5;font-family:${FONT_BODY};">${step.description}</p>
        ${logoBlock}
      </td>
    </tr>`
  }).join('\n')

  return `
    <h3 style="margin:28px 0 16px;font-size:18px;font-weight:600;letter-spacing:-0.025em;color:${C.navy};font-family:${FONT_BRAND};">${title}</h3>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#fafaf8;border-radius:8px;padding:24px;">
      <tr><td style="padding:24px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
          ${stepRows}
        </table>
      </td></tr>
    </table>`
}
