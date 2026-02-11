import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPartnershipInquiryNotification } from '@/lib/email'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

const VALID_COMMUNITY_TYPES = [
  'rotary',
  'city_council',
  'faith',
  'school',
  'diaspora',
  'corporate',
  'other',
]

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// POST /api/partnership-inquiry - Submit partnership interest (public)
export async function POST(request: NextRequest) {
  const rateLimitResponse = rateLimit(request, RATE_LIMITS.partnershipInquiry)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()
    const { communityName, contactName, contactEmail, communityType, approximateSize, message } = body

    // Validate required fields
    if (!communityName?.trim()) {
      return NextResponse.json({ error: 'Community name is required' }, { status: 400 })
    }
    if (!contactName?.trim()) {
      return NextResponse.json({ error: 'Contact name is required' }, { status: 400 })
    }
    if (!contactEmail?.trim() || !EMAIL_REGEX.test(contactEmail.trim())) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }
    if (!communityType || !VALID_COMMUNITY_TYPES.includes(communityType)) {
      return NextResponse.json({ error: 'Valid community type is required' }, { status: 400 })
    }
    if (message && message.length > 2000) {
      return NextResponse.json({ error: 'Message must be 2000 characters or less' }, { status: 400 })
    }

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
