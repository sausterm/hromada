import { NextRequest, NextResponse } from 'next/server'
import {
  emailLayout,
  emailHeading,
  emailProjectCard,
  emailProcessFlow,
  emailDivider,
  emailHighlightBox,
  emailField,
  emailMuted,
  emailButton,
} from '@/lib/email-template'

/**
 * GET /api/admin/email-preview?id=8 — Renders email HTML in browser for preview/capture.
 * Temporary endpoint. Delete after use.
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id') || '8'

  if (id === '8') {
    const origin = new URL(request.url).origin

    const body = `
      ${emailHeading('Your donation is on its way to Ukraine')}

      <p>Thomas, your <strong>$56,000</strong> contribution has been forwarded to the community. This project was requested by the municipality and verified by our NGO partner on the ground.</p>

      ${emailProjectCard({
        projectName: 'Horenka Central Hospital Heat Pump &amp; Solar Array',
        municipality: 'Horenka',
        partnerName: 'NGO Ecoaction',
      })}

      ${emailProcessFlow('Your Project\u2019s Journey', [
        {
          number: 1,
          title: 'Payment Received',
          description: 'Your Wire Transfer was received by POCACITO Network.',
          completed: true,
        },
        {
          number: 2,
          title: 'Funds Forwarded to Ukraine',
          description: 'Your donation has been wired to the implementing NGO partner.',
          completed: true,
        },
        {
          number: 3,
          title: 'Public Procurement',
          description: 'The municipality begins the formal procurement process through Prozorro.',
        },
        {
          number: 4,
          title: 'Construction & Updates',
          description: 'You\u2019ll receive progress photos as the community rebuilds.',
        },
        {
          number: 5,
          title: 'Project Complete',
          description: 'Final documentation and photos delivered to your donor dashboard.',
        },
      ])}

      ${emailDivider()}
      <p>We\u2019ve created a donor account so you can follow along. Here are your login credentials:</p>
      ${emailHighlightBox(`
        ${emailField('Email', 'thomasprotzman@proton.me')}
        ${emailField('Temporary Password', '<code style="background:#F5F1E8;padding:3px 8px;border-radius:4px;font-family:\'Geist Mono\',\'SF Mono\',\'Courier New\',monospace;font-size:13px;">TempPass123!</code>')}
        ${emailMuted('We recommend changing your password after your first login.')}
      `)}
      ${emailButton('View Your Donor Dashboard', `${origin}/login`)}

      ${emailDivider()}

      <p><strong style="color:#1a2744;">Your Tax Receipt</strong></p>
      <p>Your tax receipt (HR-2026-5ABCDEF0) is attached to this email and available for download below.</p>
      ${emailButton('Download Tax Receipt', '#')}
      <p style="font-size:13px;color:#666;">Your donation is tax-deductible through POCACITO Network, a registered 501(c)(3) nonprofit (EIN&nbsp;99-0392258). Reference: HRO-2026-0001</p>

      <p style="margin-top:24px;">Thank you for standing with this community. If you have any questions, just reply to this email.</p>

      <p style="color:#1a2744;font-weight:600;">Thomas<br>
      <span style="font-weight:400;color:#666;">Hromada</span></p>
    `

    let html = emailLayout(body, {
      preheader: 'Your tax receipt is attached.',
      baseUrl: origin,
    })

    // Inject Figma capture script if requested
    if (request.nextUrl.searchParams.get('figma') === '1') {
      html = html.replace('</head>', '<script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async></script></head>')
    }

    const headers: Record<string, string> = { 'Content-Type': 'text/html; charset=utf-8' }
    // Override CSP to allow Figma capture script
    if (request.nextUrl.searchParams.get('figma') === '1') {
      headers['Content-Security-Policy'] = "default-src 'self' https:; script-src 'self' 'unsafe-inline' https://mcp.figma.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data: https:; connect-src 'self' https:; frame-src 'self' blob:;"
    }

    return new NextResponse(html, { headers })
  }

  return NextResponse.json({ error: 'Unknown email id' }, { status: 400 })
}
