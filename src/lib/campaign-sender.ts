import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/ses'
import { emailLayout } from '@/lib/email-template'
import type { EmailCampaign, CampaignStatus } from '@prisma/client'

const BATCH_SIZE = 50
const BATCH_DELAY_MS = 200

/**
 * Send a campaign to all active subscribers.
 * Updates campaign stats and per-recipient tracking as it goes.
 */
export async function sendCampaign(campaignId: string): Promise<{
  success: boolean
  sent: number
  failed: number
  error?: string
}> {
  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
  })

  if (!campaign) {
    return { success: false, sent: 0, failed: 0, error: 'Campaign not found' }
  }

  if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
    return { success: false, sent: 0, failed: 0, error: `Campaign status is ${campaign.status}, expected DRAFT or SCHEDULED` }
  }

  // Mark as sending
  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: { status: 'SENDING' as CampaignStatus, sentAt: new Date() },
  })

  // Get active subscribers
  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { unsubscribed: false },
    select: { email: true, unsubscribeToken: true },
  })

  // Update total recipients
  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: { totalRecipients: subscribers.length },
  })

  let sent = 0
  let failed = 0

  // Process in batches
  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE)

    // Create EmailSend records for this batch
    await prisma.emailSend.createMany({
      data: batch.map((sub) => ({
        campaignId,
        recipientEmail: sub.email,
        status: 'QUEUED',
      })),
    })

    // Send emails individually (SES bulk API requires templates; individual send is simpler)
    const results = await Promise.allSettled(
      batch.map(async (sub) => {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const unsubscribeLink = `${appUrl}/unsubscribe?token=${sub.unsubscribeToken}`

        const htmlWithFooter = emailLayout(campaign.htmlContent, {
          unsubscribeUrl: unsubscribeLink,
        })

        const result = await sendEmail({
          to: sub.email,
          subject: campaign.subject,
          html: htmlWithFooter,
        })

        // Update EmailSend record
        await prisma.emailSend.updateMany({
          where: { campaignId, recipientEmail: sub.email },
          data: {
            status: result.success ? 'SENT' : 'FAILED',
            sesMessageId: result.messageId || null,
            errorMessage: result.error || null,
            sentAt: result.success ? new Date() : null,
          },
        })

        if (!result.success) {
          throw new Error(result.error || 'Send failed')
        }

        return result
      })
    )

    const batchSent = results.filter((r) => r.status === 'fulfilled').length
    const batchFailed = results.filter((r) => r.status === 'rejected').length
    sent += batchSent
    failed += batchFailed

    // Update campaign stats incrementally
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { sentCount: sent, failedCount: failed },
    })

    // Rate-limit between batches
    if (i + BATCH_SIZE < subscribers.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS))
    }
  }

  // Mark as completed
  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: {
      status: 'COMPLETED' as CampaignStatus,
      completedAt: new Date(),
      sentCount: sent,
      failedCount: failed,
    },
  })

  return { success: true, sent, failed }
}
