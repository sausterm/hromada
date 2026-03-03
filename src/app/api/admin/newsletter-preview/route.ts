import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth'
import { sanitizeInput } from '@/lib/security'
import {
  emailLayout,
  emailHeading,
  emailSubheading,
  emailProjectCard,
  emailButton,
  emailMuted,
} from '@/lib/email-template'
import { CATEGORY_CONFIG, PROJECT_TYPE_CONFIG } from '@/types'
import type { Category, ProjectType } from '@/types'

const s = sanitizeInput

interface PreviewProjectItem {
  id?: string
  name: string
  photoUrl?: string
  municipality?: string
  partnerName?: string
  partnerLogoUrl?: string
  category?: string
  projectType?: string
  estimatedCostUsd?: number
  statusLine?: string
}

/**
 * POST — Generate newsletter HTML preview from structured form data.
 * Returns the full HTML string that would be sent to subscribers.
 */
export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdminAuth(request)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    headline: string
    intro: string
    bannerUrl?: string
    projects?: PreviewProjectItem[]
    stats?: { label: string; value: string }[]
    closing?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.headline || !body.intro) {
    return NextResponse.json({ error: 'Headline and intro are required' }, { status: 400 })
  }

  console.log('[Newsletter Preview] bannerUrl:', body.bannerUrl || '(none)', '| projects:', body.projects?.length || 0)

  // Use the request origin so preview loads images from the current server (not production)
  const origin = new URL(request.url).origin
  const appUrl = origin

  // Build banner image block
  const bannerBlock = body.bannerUrl
    ? `<div style="margin:0 0 24px;border-radius:8px;overflow:hidden;">
        <img src="${body.bannerUrl}" alt="" width="520" style="width:100%;max-width:520px;height:auto;display:block;object-fit:cover;" />
      </div>`
    : ''

  // Build project cards
  const projectCards = body.projects?.length
    ? emailSubheading('Featured Projects') + body.projects.map((p) => {
        const categoryLabel = p.category && CATEGORY_CONFIG[p.category as Category]
          ? CATEGORY_CONFIG[p.category as Category].label
          : undefined
        const typeLabel = p.projectType && PROJECT_TYPE_CONFIG[p.projectType as ProjectType]
          ? PROJECT_TYPE_CONFIG[p.projectType as ProjectType].label
          : undefined
        const card = emailProjectCard({
          projectName: s(p.name),
          photoUrl: p.photoUrl,
          municipality: p.municipality ? s(p.municipality) : undefined,
          partnerName: p.partnerName ? s(p.partnerName) : undefined,
          partnerLogoUrl: p.partnerLogoUrl,
          category: categoryLabel,
          projectType: typeLabel,
          estimatedCostUsd: p.estimatedCostUsd,
          projectUrl: p.id ? `${appUrl}/projects/${p.id}` : undefined,
        })
        const statusLine = p.statusLine
          ? `<p style="margin:-16px 0 24px;font-size:13px;color:#666;font-style:italic;">${s(p.statusLine)}</p>`
          : ''
        return card + statusLine
      }).join('')
    : ''

  // Build stats block
  const statsBlock = body.stats?.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:24px 0;">
        <tr>
          ${body.stats.map((stat) => `
            <td align="center" style="padding:16px;background:#fafaf8;border-radius:8px;">
              <p style="margin:0;font-size:28px;font-weight:700;color:#0057B8;font-family:'Outfit','Inter',sans-serif;">${s(stat.value)}</p>
              <p style="margin:4px 0 0;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">${s(stat.label)}</p>
            </td>
          `).join('<td width="16"></td>')}
        </tr>
      </table>`
    : ''

  const closingBlock = body.closing
    ? `<p>${s(body.closing)}</p>`
    : '<p>Thank you for being part of this community.</p>'

  const emailBody = `
    ${emailHeading(s(body.headline))}

    ${bannerBlock}

    <p>${s(body.intro)}</p>

    ${projectCards}

    ${projectCards ? emailButton('See All Projects', `${appUrl}/projects`) : ''}

    ${statsBlock}

    ${closingBlock}

    <p style="color:#1a2744;font-weight:600;">Thomas<br>
    <span style="font-weight:400;color:#666;">Hromada</span></p>

    ${emailMuted('You\u2019re receiving this because you signed up at hromadaproject.org. <a href="#" style="color:#999;text-decoration:underline;">Unsubscribe</a>')}
  `

  const html = emailLayout(emailBody, {
    preheader: body.intro.substring(0, 120),
    baseUrl: origin,
  })

  return NextResponse.json({ html, subject: body.headline })
}
