/**
 * SES transport — extracted from ses.ts for use by the email-provider router.
 * Only loaded when EMAIL_PROVIDER=ses.
 */

import {
  SESv2Client,
  SendEmailCommand,
  SendBulkEmailCommand,
  type BulkEmailEntry,
} from '@aws-sdk/client-sesv2'
import type { EmailSendParams, EmailSendResult } from '@/lib/email-provider'

const SES_REGION = process.env.SES_REGION || 'us-east-1'

let client: SESv2Client | null = null

function getClient(): SESv2Client | null {
  if (client) return client

  try {
    client = new SESv2Client({
      region: SES_REGION,
      ...(process.env.SES_ACCESS_KEY_ID && process.env.SES_SECRET_ACCESS_KEY
        ? {
            credentials: {
              accessKeyId: process.env.SES_ACCESS_KEY_ID,
              secretAccessKey: process.env.SES_SECRET_ACCESS_KEY,
            },
          }
        : {}),
    })
    return client
  } catch (error) {
    console.warn('Failed to initialize SES client:', error)
    return null
  }
}

export async function sesSendEmail(params: EmailSendParams): Promise<EmailSendResult> {
  const ses = getClient()
  if (!ses) {
    console.warn('SES client not available, skipping email send')
    return { success: true }
  }

  const toAddresses = Array.isArray(params.to) ? params.to : [params.to]

  // If there are attachments, we need raw MIME (SES v1 SendRawEmailCommand).
  // For simplicity, use SES v2 for non-attachment emails.
  // Attachment emails should go through the email.ts raw MIME path directly.

  try {
    const result = await ses.send(
      new SendEmailCommand({
        FromEmailAddress: params.from,
        Destination: { ToAddresses: toAddresses },
        ReplyToAddresses: params.replyTo,
        Content: {
          Simple: {
            Subject: { Data: params.subject, Charset: 'UTF-8' },
            Body: {
              Html: { Data: params.html, Charset: 'UTF-8' },
            },
          },
        },
      })
    )

    return { success: true, messageId: result.MessageId }
  } catch (error) {
    console.error('SES sendEmail failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

const BULK_BATCH_SIZE = 50
const BATCH_DELAY_MS = 200

export interface BulkEmailRecipient {
  to: string
  replacementData?: Record<string, string>
}

export interface BulkSendResult {
  total: number
  sent: number
  failed: number
  errors: Array<{ to: string; error: string }>
}

export async function sesSendBulkEmail({
  recipients,
  subject,
  html,
  from,
}: {
  recipients: BulkEmailRecipient[]
  subject: string
  html: string
  from?: string
}): Promise<BulkSendResult> {
  const ses = getClient()
  if (!ses) {
    console.warn('SES client not available, skipping bulk email send')
    return { total: recipients.length, sent: 0, failed: 0, errors: [] }
  }

  const result: BulkSendResult = {
    total: recipients.length,
    sent: 0,
    failed: 0,
    errors: [],
  }

  for (let i = 0; i < recipients.length; i += BULK_BATCH_SIZE) {
    const batch = recipients.slice(i, i + BULK_BATCH_SIZE)

    const entries: BulkEmailEntry[] = batch.map((r) => ({
      Destination: { ToAddresses: [r.to] },
    }))

    try {
      const response = await ses.send(
        new SendBulkEmailCommand({
          FromEmailAddress: from,
          DefaultContent: {
            Template: {
              TemplateData: JSON.stringify({}),
              TemplateContent: {
                Subject: subject,
                Html: html,
              },
            },
          },
          BulkEmailEntries: entries,
        })
      )

      if (response.BulkEmailEntryResults) {
        response.BulkEmailEntryResults.forEach((entry, idx) => {
          if (entry.Status === 'SUCCESS') {
            result.sent++
          } else {
            result.failed++
            result.errors.push({
              to: batch[idx].to,
              error: entry.Error || 'Unknown error',
            })
          }
        })
      }
    } catch (error) {
      result.failed += batch.length
      const errorMsg = error instanceof Error ? error.message : 'Batch send failed'
      batch.forEach((r) => {
        result.errors.push({ to: r.to, error: errorMsg })
      })
    }

    if (i + BULK_BATCH_SIZE < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS))
    }
  }

  return result
}
