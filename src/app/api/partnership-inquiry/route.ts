import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPartnershipInquiryNotification } from '@/lib/email'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { parseBody, partnershipInquirySchema } from '@/lib/validations'
import { detectSuspiciousInput, logAuditEvent, AuditAction, getClientIp, getUserAgent } from '@/lib/security'

// POST /api/partnership-inquiry - Submit partnership interest (public)
export async function POST(request: NextRequest) {
  const rateLimitResponse = rateLimit(request, RATE_LIMITS.partnershipInquiry)
  if (rateLimitResponse) return rateLimitResponse

  const parsed = await parseBody(request, partnershipInquirySchema)
  if (parsed.error) return parsed.error

  const { communityName, contactName, contactEmail, communityType, approximateSize, message } = parsed.data

  // Check for suspicious input in free-text fields
  const freeText = [communityName, contactName, approximateSize, message].filter(Boolean).join(' ')
  if (detectSuspiciousInput(freeText)) {
    await logAuditEvent(AuditAction.SUSPICIOUS_ACTIVITY, {
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      details: 'Suspicious input in partnership inquiry form',
    })
    return NextResponse.json({ error: 'Invalid input detected' }, { status: 400 })
  }

  try {
    const inquiry = await prisma.partnershipInquiry.create({
      data: {
        communityName: communityName.trim(),
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        communityType,
        approximateSize: approximateSize?.trim() || null,
        message: message?.trim() || null,
      },
    })

    // Send email notification (non-blocking)
    sendPartnershipInquiryNotification({
      communityName: communityName.trim(),
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim().toLowerCase(),
      communityType,
      approximateSize: approximateSize?.trim(),
      message: message?.trim(),
    }).catch((err) => {
      console.error('Failed to send partnership inquiry notification:', err)
    })

    return NextResponse.json({ inquiry }, { status: 201 })
  } catch (error) {
    console.error('Error creating partnership inquiry:', error)
    return NextResponse.json(
      { error: 'Failed to submit partnership inquiry' },
      { status: 500 }
    )
  }
}
