/**
 * Email provider abstraction — routes to Resend or SES based on EMAIL_PROVIDER env var.
 *
 * Set EMAIL_PROVIDER=resend (default) or EMAIL_PROVIDER=ses to switch.
 * Each provider needs its own env vars:
 *   Resend: RESEND_API_KEY
 *   SES:    SES_REGION, SES_ACCESS_KEY_ID, SES_SECRET_ACCESS_KEY
 */

import { resendSendEmail, resendSendBulkEmail } from '@/lib/resend'
import type { ResendBulkRecipient, ResendBulkResult } from '@/lib/resend'

// ---------------------------------------------------------------------------
// Provider detection
// ---------------------------------------------------------------------------

export type EmailProviderName = 'resend' | 'ses'

export function getEmailProvider(): EmailProviderName {
  const provider = (process.env.EMAIL_PROVIDER || 'resend').toLowerCase()
  if (provider === 'ses') return 'ses'
  return 'resend'
}

// ---------------------------------------------------------------------------
// Unified send interface
// ---------------------------------------------------------------------------

export interface EmailSendParams {
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

export interface EmailSendResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send a single email via the configured provider.
 */
export async function providerSendEmail(params: EmailSendParams): Promise<EmailSendResult> {
  const provider = getEmailProvider()

  if (provider === 'resend') {
    return resendSendEmail(params)
  }

  // SES path — lazy import to avoid loading SES SDK when using Resend
  const { sesSendEmail } = await import('@/lib/ses-transport')
  return sesSendEmail(params)
}

// ---------------------------------------------------------------------------
// Unified bulk send interface
// ---------------------------------------------------------------------------

export interface BulkEmailParams {
  recipients: ResendBulkRecipient[]
  subject: string
  html: string
  from: string
}

/**
 * Send bulk emails via the configured provider.
 */
export async function providerSendBulkEmail(params: BulkEmailParams): Promise<ResendBulkResult> {
  const provider = getEmailProvider()

  if (provider === 'resend') {
    return resendSendBulkEmail(params)
  }

  // SES path
  const { sesSendBulkEmail } = await import('@/lib/ses-transport')
  return sesSendBulkEmail(params)
}
