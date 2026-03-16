import { Resend } from 'resend'

let client: Resend | null = null

function getClient(): Resend | null {
  if (client) return client

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set, Resend email disabled')
    return null
  }

  client = new Resend(apiKey)
  return client
}

// ---------------------------------------------------------------------------
// Single email
// ---------------------------------------------------------------------------

export interface ResendSendParams {
  from: string
  to: string | string[]
  subject: string
  html: string
  replyTo?: string[]
  attachments?: Array<{
    filename: string
    content: Buffer
    contentType?: string
  }>
}

export interface ResendSendResult {
  success: boolean
  messageId?: string
  error?: string
}

export async function resendSendEmail(params: ResendSendParams): Promise<ResendSendResult> {
  const resend = getClient()
  if (!resend) {
    console.warn('Resend client not available, skipping email send')
    return { success: true }
  }

  const toAddresses = Array.isArray(params.to) ? params.to : [params.to]

  try {
    const { data, error } = await resend.emails.send({
      from: params.from,
      to: toAddresses,
      subject: params.subject,
      html: params.html,
      replyTo: params.replyTo,
      attachments: params.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    })

    if (error) {
      console.error('Resend send failed:', error)
      return { success: false, error: error.message }
    }

    return { success: true, messageId: data?.id }
  } catch (error) {
    console.error('Resend send failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

// ---------------------------------------------------------------------------
// Bulk email (send individually, Resend batch API is limited)
// ---------------------------------------------------------------------------

const BATCH_SIZE = 50
const BATCH_DELAY_MS = 200

export interface ResendBulkRecipient {
  to: string
  replacementData?: Record<string, string>
}

export interface ResendBulkResult {
  total: number
  sent: number
  failed: number
  errors: Array<{ to: string; error: string }>
}

export async function resendSendBulkEmail({
  recipients,
  subject,
  html,
  from,
}: {
  recipients: ResendBulkRecipient[]
  subject: string
  html: string
  from: string
}): Promise<ResendBulkResult> {
  const resend = getClient()
  if (!resend) {
    console.warn('Resend client not available, skipping bulk email send')
    return { total: recipients.length, sent: 0, failed: 0, errors: [] }
  }

  const result: ResendBulkResult = {
    total: recipients.length,
    sent: 0,
    failed: 0,
    errors: [],
  }

  // Process in batches using Resend batch API
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE)

    try {
      const { data, error } = await resend.batch.send(
        batch.map((r) => ({
          from,
          to: [r.to],
          subject,
          html,
        }))
      )

      if (error) {
        result.failed += batch.length
        batch.forEach((r) => {
          result.errors.push({ to: r.to, error: error.message })
        })
      } else if (data) {
        // Resend batch returns array of results
        const batchData = Array.isArray(data) ? data : (data as { data: Array<{ id: string }> }).data ?? []
        result.sent += batchData.length
        const failedCount = batch.length - batchData.length
        if (failedCount > 0) result.failed += failedCount
      }
    } catch (error) {
      result.failed += batch.length
      const errorMsg = error instanceof Error ? error.message : 'Batch send failed'
      batch.forEach((r) => {
        result.errors.push({ to: r.to, error: errorMsg })
      })
    }

    // Rate-limit between batches
    if (i + BATCH_SIZE < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS))
    }
  }

  return result
}
