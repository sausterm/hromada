/**
 * Campaign/bulk email service.
 * Routes through email-provider abstraction (Resend or SES).
 */

import { providerSendEmail, providerSendBulkEmail } from '@/lib/email-provider'

const FROM_ADDRESS = 'Hromada <noreply@hromadaproject.org>'

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
  return providerSendEmail({
    from: from || FROM_ADDRESS,
    to,
    subject,
    html,
    replyTo,
  })
}

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
  return providerSendBulkEmail({
    recipients,
    subject,
    html,
    from: from || FROM_ADDRESS,
  })
}
