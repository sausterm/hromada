import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { prisma } from '@/lib/prisma'
import { hashPassword, getUserByEmail } from '@/lib/auth'
import { sendDonorWelcomeEmail, sendDonationNotificationToAdmin } from '@/lib/email'
import { logAuditEvent, AuditAction, getClientIp, getUserAgent, detectSuspiciousInput } from '@/lib/security'
import { parseBody, donationConfirmSchema } from '@/lib/validations'
import crypto from 'crypto'

// Generate a random temporary password
function generateTemporaryPassword(): string {
  const words = ['Solar', 'Power', 'Hope', 'Build', 'Help', 'Light', 'Energy', 'Ukraine', 'Peace', 'Strong']
  const word1 = words[Math.floor(Math.random() * words.length)]
  const word2 = words[Math.floor(Math.random() * words.length)]
  const digits = Math.floor(Math.random() * 100).toString().padStart(2, '0')
  return `${word1}${word2}${digits}`
}

// POST /api/donations/confirm - Record that a donor has sent funds
export async function POST(request: NextRequest) {
  const rateLimitResponse = rateLimit(request, {
    limit: 5,
    windowSeconds: 60,
  })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const parsed = await parseBody(request, donationConfirmSchema)
  if (parsed.error) return parsed.error

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
  } = parsed.data

  // Check for suspicious input in free-text fields
  const freeText = [donorName, donorOrganization, message, referenceNumber].filter(Boolean).join(' ')
  if (detectSuspiciousInput(freeText)) {
    await logAuditEvent(AuditAction.SUSPICIOUS_ACTIVITY, {
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      details: 'Suspicious input in donation confirmation form',
    })
    return NextResponse.json({ error: 'Invalid input detected' }, { status: 400 })
  }

  try {
    const normalizedEmail = donorEmail.toLowerCase().trim()
    const normalizedMethod = paymentMethod.toLowerCase()

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
        amount: amount ? parseFloat(String(amount)) : null,
        paymentMethod: paymentMethodMap[normalizedMethod] || 'OTHER',
        referenceNumber: referenceNumber?.trim() || null,
        status: 'PENDING_CONFIRMATION',
        donorMessage: message?.trim() || null,
      },
    })

    await logAuditEvent('DONATION_CREATED' as any, {
      userId: donorUser.id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      details: `Donation confirmation submitted: ${amount ? `$${amount}` : 'amount TBD'} for ${projectName}`,
    })

    // Send emails (non-blocking)
    const emailPromises: Promise<any>[] = []

    if (isNewDonor && temporaryPassword) {
      emailPromises.push(
        sendDonorWelcomeEmail({
          donorName: donorName.trim(),
          donorEmail: normalizedEmail,
          temporaryPassword,
          projectName: projectName || 'General Fund',
          amount: amount ? parseFloat(String(amount)) : undefined,
          paymentMethod: normalizedMethod,
        }).catch(err => console.error('Failed to send donor welcome email:', err))
      )
    }

    emailPromises.push(
      sendDonationNotificationToAdmin({
        donorName: donorName.trim(),
        donorEmail: normalizedEmail,
        donorOrganization: donorOrganization?.trim(),
        projectName: projectName || 'General Fund',
        projectId,
        amount: amount ? parseFloat(String(amount)) : undefined,
        paymentMethod: normalizedMethod,
        referenceNumber: referenceNumber?.trim(),
        isNewDonor,
      }).catch(err => console.error('Failed to send admin notification:', err))
    )

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
