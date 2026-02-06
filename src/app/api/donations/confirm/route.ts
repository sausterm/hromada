import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { prisma } from '@/lib/prisma'
import { hashPassword, getUserByEmail } from '@/lib/auth'
import { sendDonorWelcomeEmail, sendDonationNotificationToAdmin } from '@/lib/email'
import { logAuditEvent, AuditAction, getClientIp, getUserAgent } from '@/lib/security'
import crypto from 'crypto'

// Generate a random temporary password
function generateTemporaryPassword(): string {
  // Generate a readable password: 3 words + 2 digits
  const words = ['Solar', 'Power', 'Hope', 'Build', 'Help', 'Light', 'Energy', 'Ukraine', 'Peace', 'Strong']
  const word1 = words[Math.floor(Math.random() * words.length)]
  const word2 = words[Math.floor(Math.random() * words.length)]
  const digits = Math.floor(Math.random() * 100).toString().padStart(2, '0')
  return `${word1}${word2}${digits}`
}

// POST /api/donations/confirm - Record that a donor has sent funds
export async function POST(request: NextRequest) {
  // Rate limit: 5 confirmations per minute per IP
  const rateLimitResponse = rateLimit(request, {
    limit: 5,
    windowSeconds: 60,
  })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const body = await request.json()
    const {
      projectId,
      projectName,
      paymentMethod,
      donorName,
      donorEmail,
      donorOrganization,
      amount,
      referenceNumber,
      message,
    } = body

    // Validate required fields
    if (!projectId || !donorName || !donorEmail || !paymentMethod) {
      return NextResponse.json(
        { error: 'Project ID, donor name, email, and payment method are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const normalizedEmail = donorEmail.toLowerCase().trim()
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate payment method
    const validMethods = ['wire', 'daf', 'check', 'ach']
    const normalizedMethod = paymentMethod.toLowerCase()
    if (!validMethods.includes(normalizedMethod)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      )
    }

    // Map payment method to enum
    const paymentMethodMap: Record<string, 'WIRE' | 'DAF' | 'CHECK' | 'ACH' | 'OTHER'> = {
      wire: 'WIRE',
      daf: 'DAF',
      check: 'CHECK',
      ach: 'ACH',
    }

    // Check if donor already has an account
    let donorUser = await getUserByEmail(normalizedEmail)
    let isNewDonor = false
    let temporaryPassword: string | null = null

    if (!donorUser) {
      // Create new donor account
      isNewDonor = true
      temporaryPassword = generateTemporaryPassword()
      const passwordHash = await hashPassword(temporaryPassword)

      donorUser = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          name: donorName.trim(),
          organization: donorOrganization?.trim() || null,
          role: 'DONOR',
          isActive: true,
        },
      })

      // Audit log
      await logAuditEvent(AuditAction.USER_CREATED, {
        userId: donorUser.id,
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
        details: `Donor account auto-created for ${normalizedEmail}`,
      })
    }

    // Create donation record
    const donation = await prisma.donation.create({
      data: {
        projectId: projectId === 'general' ? null : projectId,
        projectName: projectName || 'General Fund',
        donorUserId: donorUser.id,
        donorName: donorName.trim(),
        donorEmail: normalizedEmail,
        donorOrganization: donorOrganization?.trim() || null,
        amount: amount ? parseFloat(amount) : null,
        paymentMethod: paymentMethodMap[normalizedMethod] || 'OTHER',
        referenceNumber: referenceNumber?.trim() || null,
        status: 'PENDING_CONFIRMATION',
        donorMessage: message?.trim() || null,
      },
    })

    // Audit log
    await logAuditEvent('DONATION_CREATED' as any, {
      userId: donorUser.id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      details: `Donation confirmation submitted: ${amount ? `$${amount}` : 'amount TBD'} for ${projectName}`,
    })

    // Send emails (non-blocking)
    const emailPromises: Promise<any>[] = []

    // Send welcome email to new donors
    if (isNewDonor && temporaryPassword) {
      emailPromises.push(
        sendDonorWelcomeEmail({
          donorName: donorName.trim(),
          donorEmail: normalizedEmail,
          temporaryPassword,
          projectName: projectName || 'General Fund',
          amount: amount ? parseFloat(amount) : undefined,
          paymentMethod: normalizedMethod,
        }).catch(err => console.error('Failed to send donor welcome email:', err))
      )
    }

    // Send notification to admin/nonprofit manager
    emailPromises.push(
      sendDonationNotificationToAdmin({
        donorName: donorName.trim(),
        donorEmail: normalizedEmail,
        donorOrganization: donorOrganization?.trim(),
        projectName: projectName || 'General Fund',
        projectId,
        amount: amount ? parseFloat(amount) : undefined,
        paymentMethod: normalizedMethod,
        referenceNumber: referenceNumber?.trim(),
        isNewDonor,
      }).catch(err => console.error('Failed to send admin notification:', err))
    )

    // Don't await emails - let them send in background
    Promise.all(emailPromises)

    return NextResponse.json({
      success: true,
      message: isNewDonor
        ? 'Thank you! We\'ve created a donor account for you. Check your email for login details to track your donation.'
        : 'Thank you! We will confirm receipt of your funds shortly. Track your donation in your donor dashboard.',
      donationId: donation.id,
      isNewDonor,
    }, { status: 201 })

  } catch (error) {
    console.error('Failed to record donation confirmation:', error)
    return NextResponse.json(
      { error: 'Failed to record confirmation. Please try again.' },
      { status: 500 }
    )
  }
}
