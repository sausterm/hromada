import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionData, validateSessionWithDatabase } from '@/lib/auth'
import { getClientIp } from '@/lib/security'
import { logTransactionEvent, TransactionAction } from '@/lib/audit'
import { generateTaxReceipt, generateReceiptNumber } from '@/lib/tax-receipt'
import { sendDonationForwardedEmail } from '@/lib/email'
import { supabase, isSupabaseConfigured, TAX_RECEIPTS_BUCKET } from '@/lib/supabase'
import type { DonationStatus } from '@prisma/client'

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING_CONFIRMATION: ['RECEIVED', 'FAILED'],
  RECEIVED: ['FORWARDED', 'REFUNDED'],
  FORWARDED: ['COMPLETED'],
  FAILED: [],
  REFUNDED: [],
  COMPLETED: [],
}

// PATCH /api/donations/[id]/status — update donation status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth: admin or nonprofit manager
  const session = await getSessionData()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'NONPROFIT_MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { valid } = await validateSessionWithDatabase(session)
  if (!valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  let body: { status: string; internalNotes?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const newStatus = body.status as DonationStatus
  if (!newStatus) {
    return NextResponse.json({ error: 'Status is required' }, { status: 400 })
  }

  // Fetch donation
  const donation = await prisma.donation.findUnique({ where: { id } })
  if (!donation) {
    return NextResponse.json({ error: 'Donation not found' }, { status: 404 })
  }

  // Validate transition
  const allowedTransitions = VALID_TRANSITIONS[donation.status]
  if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
    return NextResponse.json(
      { error: `Cannot transition from ${donation.status} to ${newStatus}` },
      { status: 400 }
    )
  }

  const now = new Date()
  const ipAddress = getClientIp(request)

  try {
    // Build update data
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updatedAt: now,
    }

    if (body.internalNotes) {
      updateData.internalNotes = body.internalNotes
    }

    // Status-specific fields
    if (newStatus === 'RECEIVED') {
      updateData.receivedAt = now
    } else if (newStatus === 'FORWARDED') {
      updateData.forwardedAt = now
    }

    // Update donation
    const updated = await prisma.donation.update({
      where: { id },
      data: updateData,
      include: { donorUser: true },
    })

    // Log audit event
    await logTransactionEvent({
      transactionType: 'DONATION',
      transactionId: id,
      action: newStatus === 'FORWARDED'
        ? TransactionAction.DONATION_FORWARDED
        : TransactionAction.DONATION_STATUS_CHANGED,
      previousStatus: donation.status,
      newStatus,
      amount: donation.amount ? Number(donation.amount) : undefined,
      paymentMethod: donation.paymentMethod,
      referenceNumber: donation.referenceNumber ?? undefined,
      actorId: session.userId,
      actorRole: session.role,
      ipAddress,
    })

    // FORWARDED: generate receipt + send email
    if (newStatus === 'FORWARDED') {
      const receivedAt = updated.receivedAt ?? now
      const receiptNumber = generateReceiptNumber(id, receivedAt)
      const donationAmount = updated.amount ? Number(updated.amount) : 0

      // Generate PDF
      const pdfBuffer = await generateTaxReceipt({
        receiptNumber,
        donorName: updated.donorName,
        donorOrganization: updated.donorOrganization ?? undefined,
        donorEmail: updated.donorEmail,
        amount: donationAmount,
        paymentMethod: updated.paymentMethod,
        referenceNumber: updated.referenceNumber ?? undefined,
        projectName: updated.projectName,
        receivedAt,
        donationId: id,
      })

      // Upload to Supabase storage
      let receiptUrl = ''
      const storagePath = `receipts/${id}/${receiptNumber}.pdf`

      if (isSupabaseConfigured) {
        const { error: uploadError } = await supabase.storage
          .from(TAX_RECEIPTS_BUCKET)
          .upload(storagePath, pdfBuffer, {
            contentType: 'application/pdf',
            cacheControl: '31536000',
            upsert: true,
          })

        if (uploadError) {
          console.error('Failed to upload tax receipt:', uploadError)
        } else {
          // Generate signed URL (7 days)
          const { data: signedData } = await supabase.storage
            .from(TAX_RECEIPTS_BUCKET)
            .createSignedUrl(storagePath, 604800)

          receiptUrl = signedData?.signedUrl ?? ''

          // Store path in donation record
          await prisma.donation.update({
            where: { id },
            data: { taxReceiptUrl: storagePath },
          })
        }
      }

      // Check if donor needs credentials (new donor who hasn't logged in)
      let temporaryPassword: string | undefined
      if (updated.donorUser && updated.donorUser.lastLoginAt === null) {
        // Donor was auto-created but never logged in — they already have a temp password
        // We don't store plain passwords, so we don't re-send one here.
        // The user can use password reset if needed.
        temporaryPassword = undefined
      }

      // Fetch project photo if available
      let projectPhotoUrl: string | undefined
      let municipalityName: string | undefined
      let partnerName: string | undefined

      if (updated.projectId) {
        const project = await prisma.project.findUnique({
          where: { id: updated.projectId },
          include: { photos: { orderBy: { sortOrder: 'asc' }, take: 1 } },
        })
        if (project) {
          projectPhotoUrl = project.photos[0]?.url
          municipalityName = project.municipalityName
          partnerName = project.partnerOrganization ?? undefined
        }
      }

      // Send email (non-blocking)
      sendDonationForwardedEmail({
        donorName: updated.donorName,
        donorEmail: updated.donorEmail,
        temporaryPassword,
        projectName: updated.projectName,
        amount: donationAmount,
        paymentMethod: updated.paymentMethod.toLowerCase(),
        referenceNumber: updated.referenceNumber ?? undefined,
        projectPhotoUrl,
        municipality: municipalityName,
        partnerName,
        receiptUrl,
        receiptPdfBuffer: pdfBuffer,
        receiptNumber,
      }).catch(err => console.error('Failed to send donation forwarded email:', err))
    }

    return NextResponse.json({
      success: true,
      donation: {
        id: updated.id,
        status: updated.status,
        receivedAt: updated.receivedAt,
        forwardedAt: updated.forwardedAt,
        taxReceiptUrl: updated.taxReceiptUrl,
      },
    })
  } catch (error) {
    console.error('Failed to update donation status:', error)
    return NextResponse.json(
      { error: 'Failed to update donation status' },
      { status: 500 }
    )
  }
}
