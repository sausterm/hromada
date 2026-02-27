import {
  SESv2Client,
  SendEmailCommand,
  SendBulkEmailCommand,
  type BulkEmailEntry,
} from '@aws-sdk/client-sesv2'

const SES_REGION = process.env.SES_REGION || 'us-east-1'
const FROM_ADDRESS = 'Hromada <noreply@hromadaproject.org>'

let client: SESv2Client | null = null

function getClient(): SESv2Client | null {
  if (client) return client

  // In AWS (Amplify), credentials come from the IAM role automatically.
  // Locally, the SDK uses ~/.aws/credentials or env vars.
  try {
    client = new SESv2Client({ region: SES_REGION })
    return client
  } catch (error) {
    console.warn('Failed to initialize SES client:', error)
    return null
  }
}

export interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string[]
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export async function sendEmail({
  to,
  subject,
  html,
  from,
  replyTo,
}: SendEmailParams): Promise<SendEmailResult> {
  const ses = getClient()
  if (!ses) {
    console.warn('SES client not available, skipping email send')
    return { success: true }
  }

  const toAddresses = Array.isArray(to) ? to : [to]

  try {
    const result = await ses.send(
      new SendEmailCommand({
        FromEmailAddress: from || FROM_ADDRESS,
        Destination: { ToAddresses: toAddresses },
        ReplyToAddresses: replyTo,
        Content: {
          Simple: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: {
              Html: { Data: html, Charset: 'UTF-8' },
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

export async function sendBulkEmail({
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

  // Process in batches of 50 (SES bulk limit)
  for (let i = 0; i < recipients.length; i += BULK_BATCH_SIZE) {
    const batch = recipients.slice(i, i + BULK_BATCH_SIZE)

    const entries: BulkEmailEntry[] = batch.map((r) => ({
      Destination: { ToAddresses: [r.to] },
    }))

    try {
      const response = await ses.send(
        new SendBulkEmailCommand({
          FromEmailAddress: from || FROM_ADDRESS,
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
      // Entire batch failed
      result.failed += batch.length
      const errorMsg = error instanceof Error ? error.message : 'Batch send failed'
      batch.forEach((r) => {
        result.errors.push({ to: r.to, error: errorMsg })
      })
    }

    // Rate-limit between batches
    if (i + BULK_BATCH_SIZE < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS))
    }
  }

  return result
}
