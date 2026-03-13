import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth'
import {
  sendPasswordResetEmail,
  sendContactNotification,
  sendDonationReceivedEmail,
  sendDonationNotificationToAdmin,
  sendNewsletterWelcomeEmail,
  sendCalendlyWelcomeEmail,
  sendPartnershipInquiryNotification,
  sendDonationForwardedEmail,
  sendProjectSubmissionNotification,
  sendProjectSubmissionConfirmation,
  sendProjectApprovalEmail,
  sendProjectUpdateEmail,
  sendProzorroMatchEmail,
  sendProjectRejectionEmail,
  sendProjectCompletedEmail,
} from '@/lib/email'
import { generateTaxReceipt, generateReceiptNumber } from '@/lib/tax-receipt'
import { supabaseAdmin as supabase, isSupabaseConfigured, TAX_RECEIPTS_BUCKET } from '@/lib/supabase'

const TEST_EMAIL = 'tprotzmant+test1@gmail.com'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * POST /api/admin/test-emails — Sends one test email per template (#1–#15).
 * Temporary endpoint for review. Delete after use.
 * Auth: admin session OR HROMADA_ADMIN_SECRET header (for CLI triggering).
 */
export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdminAuth(request)
  const secretHeader = request.headers.get('x-admin-secret')
  const validSecret = secretHeader && secretHeader === process.env.HROMADA_ADMIN_SECRET
  if (!isAdmin && !validSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: { id: number; name: string; status: string; error?: string }[] = []

  // Optional: send only specific email(s) via ?only=8 or ?only=3,8
  const url = new URL(request.url)
  const onlyParam = url.searchParams.get('only')
  const onlyIds = onlyParam ? onlyParam.split(',').map(Number) : null

  // #1 Password Reset
  if (onlyIds && !onlyIds.includes(1)) { /* skip */ } else try {
    await sendPasswordResetEmail({
      name: 'Thomas',
      email: TEST_EMAIL,
      code: 'ABC123',
    })
    results.push({ id: 1, name: 'Password Reset', status: 'sent' })
  } catch (e: unknown) {
    results.push({ id: 1, name: 'Password Reset', status: 'failed', error: String(e) })
  }

  await sleep(1500)

  // #2 Contact / Donor Interest Notification (→ admin)
  if (onlyIds && !onlyIds.includes(2)) { /* skip */ } else try {
    await sendContactNotification({
      donorName: 'Jane Donor',
      donorEmail: 'jane@example.com',
      message: 'I would like to learn more about supporting the Horenka hospital project.',
      projectName: 'Horenka Central Hospital Heat Pump',
      municipalityName: 'Horenka',
      municipalityEmail: 'admin@horenka.gov.ua',
      projectId: 'test-project-id',
    })
    results.push({ id: 2, name: 'Contact Notification (admin)', status: 'sent' })
  } catch (e: unknown) {
    results.push({ id: 2, name: 'Contact Notification (admin)', status: 'failed', error: String(e) })
  }

  await sleep(1500)

  // #3 Donation Received (→ donor)
  if (onlyIds && !onlyIds.includes(3)) { /* skip */ } else try {
    await sendDonationReceivedEmail({
      donorName: 'Thomas',
      donorEmail: TEST_EMAIL,
      projectName: 'Horenka Central Hospital Heat Pump',
      amount: 5000,
      paymentMethod: 'wire',
      referenceNumber: 'HRO-2026-0001',
      municipality: 'Horenka',
      partnerName: 'NGO Ecoaction',
    })
    results.push({ id: 3, name: 'Donation Received', status: 'sent' })
  } catch (e: unknown) {
    results.push({ id: 3, name: 'Donation Received', status: 'failed', error: String(e) })
  }

  await sleep(1500)

  // #4 Donation Notification (→ admin)
  if (onlyIds && !onlyIds.includes(4)) { /* skip */ } else try {
    await sendDonationNotificationToAdmin({
      donorName: 'Jane Donor',
      donorEmail: 'jane@example.com',
      donorOrganization: 'Donor Foundation',
      projectName: 'Horenka Central Hospital Heat Pump',
      projectId: 'test-project-id',
      amount: 5000,
      paymentMethod: 'wire',
      referenceNumber: 'HRO-2026-0001',
      isNewDonor: true,
    })
    results.push({ id: 4, name: 'Donation Notification (admin)', status: 'sent' })
  } catch (e: unknown) {
    results.push({ id: 4, name: 'Donation Notification (admin)', status: 'failed', error: String(e) })
  }

  await sleep(1500)

  // #5 Newsletter Welcome
  if (onlyIds && !onlyIds.includes(5)) { /* skip */ } else try {
    await sendNewsletterWelcomeEmail(TEST_EMAIL, 'test-unsub-token', 'Thomas')
    results.push({ id: 5, name: 'Newsletter Welcome', status: 'sent' })
  } catch (e: unknown) {
    results.push({ id: 5, name: 'Newsletter Welcome', status: 'failed', error: String(e) })
  }

  await sleep(1500)

  // #6 Calendly Welcome
  if (onlyIds && !onlyIds.includes(6)) { /* skip */ } else try {
    await sendCalendlyWelcomeEmail(TEST_EMAIL, 'Thomas', 'test-unsub-token', 'Horenka Central Hospital Heat Pump')
    results.push({ id: 6, name: 'Calendly Welcome', status: 'sent' })
  } catch (e: unknown) {
    results.push({ id: 6, name: 'Calendly Welcome', status: 'failed', error: String(e) })
  }

  await sleep(1500)

  // #7 Partnership Inquiry Notification (→ admin)
  if (onlyIds && !onlyIds.includes(7)) { /* skip */ } else try {
    await sendPartnershipInquiryNotification({
      communityName: 'Charlottesville, VA',
      contactName: 'Mayor Smith',
      contactEmail: 'mayor@charlottesville.gov',
      communityType: 'city',
      approximateSize: '50,000',
      message: 'We are interested in partnering with a Ukrainian municipality for infrastructure rebuilding.',
    })
    results.push({ id: 7, name: 'Partnership Inquiry (admin)', status: 'sent' })
  } catch (e: unknown) {
    results.push({ id: 7, name: 'Partnership Inquiry (admin)', status: 'failed', error: String(e) })
  }

  await sleep(1500)

  // #8 Donation Forwarded + Receipt (→ donor)
  // Generate a real tax receipt PDF, upload to Supabase, get signed download URL
  if (onlyIds && !onlyIds.includes(8)) { /* skip */ } else try {
    const donationId = 'clxyz12345abcdef'
    const receivedAt = new Date()
    const receiptNumber = generateReceiptNumber(donationId, receivedAt)
    const receiptPdfBuffer = await generateTaxReceipt({
      receiptNumber,
      donorName: 'Thomas Protzman',
      donorOrganization: 'Hromada',
      donorEmail: TEST_EMAIL,
      amount: 56000,
      paymentMethod: 'WIRE',
      referenceNumber: 'HRO-2026-0001',
      projectName: 'Horenka Central Hospital Heat Pump & Solar Array',
      receivedAt,
      donationId,
    })

    // Upload PDF to Supabase and get a signed download URL
    let receiptUrl = ''
    const storagePath = `receipts/test/${receiptNumber}.pdf`
    if (isSupabaseConfigured) {
      await supabase.storage
        .from(TAX_RECEIPTS_BUCKET)
        .upload(storagePath, receiptPdfBuffer, {
          contentType: 'application/pdf',
          cacheControl: '31536000',
          upsert: true,
        })
      const { data: signedData } = await supabase.storage
        .from(TAX_RECEIPTS_BUCKET)
        .createSignedUrl(storagePath, 604800) // 7 days
      receiptUrl = signedData?.signedUrl ?? ''
    }

    await sendDonationForwardedEmail({
      donorName: 'Thomas',
      donorEmail: TEST_EMAIL,
      temporaryPassword: 'TempPass123!',
      projectName: 'Horenka Central Hospital Heat Pump & Solar Array',
      amount: 56000,
      paymentMethod: 'wire',
      referenceNumber: 'HRO-2026-0001',
      municipality: 'Horenka',
      partnerName: 'NGO Ecoaction',
      receiptUrl,
      receiptPdfBuffer,
      receiptNumber,
    })
    results.push({ id: 8, name: 'Donation Forwarded + Receipt', status: 'sent' })
  } catch (e: unknown) {
    results.push({ id: 8, name: 'Donation Forwarded + Receipt', status: 'failed', error: String(e) })
  }

  await sleep(1500)

  // #9 Project Submission Notification (→ admin)
  if (onlyIds && !onlyIds.includes(9)) { /* skip */ } else try {
    await sendProjectSubmissionNotification({
      facilityName: 'Bucha School #3 Solar Array',
      municipalityName: 'Bucha',
      municipalityEmail: 'admin@bucha.gov.ua',
      region: 'Kyiv Oblast',
      category: 'EDUCATION',
      projectType: 'SOLAR_PV',
      briefDescription: 'Install 50kW solar array on school roof to provide energy independence.',
      contactName: 'Olena Kovalenko',
      contactEmail: 'olena@bucha.gov.ua',
      contactPhone: '+380 50 123 4567',
      photoCount: 3,
      edrpou: '12345678',
    })
    results.push({ id: 9, name: 'Project Submission (admin)', status: 'sent' })
  } catch (e: unknown) {
    results.push({ id: 9, name: 'Project Submission (admin)', status: 'failed', error: String(e) })
  }

  await sleep(1500)

  // #10 Project Submission Confirmation (→ submitter)
  if (onlyIds && !onlyIds.includes(10)) { /* skip */ } else try {
    await sendProjectSubmissionConfirmation({
      contactName: 'Thomas',
      contactEmail: TEST_EMAIL,
      facilityName: 'Bucha School #3 Solar Array',
    })
    results.push({ id: 10, name: 'Project Submission Confirmation', status: 'sent' })
  } catch (e: unknown) {
    results.push({ id: 10, name: 'Project Submission Confirmation', status: 'failed', error: String(e) })
  }

  await sleep(1500)

  // #11 Project Approval (→ submitter)
  if (onlyIds && !onlyIds.includes(11)) { /* skip */ } else try {
    await sendProjectApprovalEmail({
      contactName: 'Thomas',
      contactEmail: TEST_EMAIL,
      facilityName: 'Bucha School #3 Solar Array',
      projectId: 'test-project-id',
    })
    results.push({ id: 11, name: 'Project Approval', status: 'sent' })
  } catch (e: unknown) {
    results.push({ id: 11, name: 'Project Approval', status: 'failed', error: String(e) })
  }

  await sleep(1500)

  // #12 Project Update — Prozorro → Donor
  if (onlyIds && !onlyIds.includes(12)) { /* skip */ } else try {
    await sendProjectUpdateEmail({
      donorName: 'Thomas',
      donorEmail: TEST_EMAIL,
      projectName: 'Horenka Central Hospital Heat Pump',
      projectId: 'test-project-id',
      updateTitle: 'Procurement Tender Published',
      updateMessage: 'A public procurement tender has been published on Prozorro for equipment related to this project. This means construction planning is underway.',
      tenderID: 'UA-2026-03-01-000123-a',
    })
    results.push({ id: 12, name: 'Project Update (Prozorro)', status: 'sent' })
  } catch (e: unknown) {
    results.push({ id: 12, name: 'Project Update (Prozorro)', status: 'failed', error: String(e) })
  }

  await sleep(1500)

  // #13 Prozorro Match Notification (→ admin)
  if (onlyIds && !onlyIds.includes(13)) { /* skip */ } else try {
    await sendProzorroMatchEmail({
      facilityName: 'Horenka Central Hospital Heat Pump',
      edrpou: '12345678',
      tenderID: 'UA-2026-03-01-000123-a',
      tenderUuid: 'abc123-uuid',
      entityName: 'Horenka City Council',
      tenderStatus: 'active.tendering',
      prozorroUrl: 'https://prozorro.gov.ua/tender/UA-2026-03-01-000123-a',
    })
    results.push({ id: 13, name: 'Prozorro Match (admin)', status: 'sent' })
  } catch (e: unknown) {
    results.push({ id: 13, name: 'Prozorro Match (admin)', status: 'failed', error: String(e) })
  }

  await sleep(1500)

  // #14 Project Rejection (→ submitter)
  if (onlyIds && !onlyIds.includes(14)) { /* skip */ } else try {
    await sendProjectRejectionEmail({
      contactName: 'Thomas',
      contactEmail: TEST_EMAIL,
      facilityName: 'Test Rejected Project',
      rejectionReason: 'The project documentation was incomplete. We were unable to verify the cost estimates provided. Please resubmit with engineering assessments or partner verification.',
    })
    results.push({ id: 14, name: 'Project Rejection', status: 'sent' })
  } catch (e: unknown) {
    results.push({ id: 14, name: 'Project Rejection', status: 'failed', error: String(e) })
  }

  await sleep(1500)

  // #15 Project Completed (→ donor)
  if (onlyIds && !onlyIds.includes(15)) { /* skip */ } else try {
    await sendProjectCompletedEmail({
      donorName: 'Thomas',
      donorEmail: TEST_EMAIL,
      projectName: 'Horenka Central Hospital Heat Pump',
      projectId: 'test-project-id',
      municipality: 'Horenka',
      partnerName: 'NGO Ecoaction',
      amount: 56000,
    })
    results.push({ id: 15, name: 'Project Completed', status: 'sent' })
  } catch (e: unknown) {
    results.push({ id: 15, name: 'Project Completed', status: 'failed', error: String(e) })
  }

  const sent = results.filter(r => r.status === 'sent').length
  const failed = results.filter(r => r.status === 'failed').length

  return NextResponse.json({
    summary: `${sent} sent, ${failed} failed`,
    results,
  })
}
