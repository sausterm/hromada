import { SESClient, SendEmailCommand, SendRawEmailCommand } from '@aws-sdk/client-ses'
import { sanitizeInput } from '@/lib/security'
import {
  emailLayout,
  emailButton,
  emailInfoBox,
  emailHighlightBox,
  emailAccentBox,
  emailHeading,
  emailSubheading,
  emailCode,
  emailDivider,
  emailMuted,
  emailBadge,
  emailField,
  emailProjectCard,
  emailProcessFlow,
} from '@/lib/email-template'

// Only create SES client if region is configured
// On AWS Amplify, credentials come from the IAM role automatically
const ses = process.env.AWS_SES_REGION
  ? new SESClient({ region: process.env.AWS_SES_REGION })
  : null

const FROM_EMAIL = process.env.AWS_SES_FROM_EMAIL || 'noreply@hromadaproject.org'

// Helper to sanitize values before HTML interpolation
const s = sanitizeInput

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  if (!ses) {
    throw new Error('SES not configured')
  }

  await ses.send(
    new SendEmailCommand({
      Source: `Hromada <${FROM_EMAIL}>`,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: { Html: { Data: html, Charset: 'UTF-8' } },
      },
    })
  )
}

// ---------------------------------------------------------------------------
// Payment method display labels
// ---------------------------------------------------------------------------

const PAYMENT_LABELS: Record<string, string> = {
  wire: 'wire transfer',
  daf: 'DAF grant',
  check: 'check',
  ach: 'bank transfer',
}

const PAYMENT_LABELS_TITLE: Record<string, string> = {
  wire: 'Wire Transfer',
  daf: 'DAF Grant',
  check: 'Check',
  ach: 'ACH Transfer',
}

// ---------------------------------------------------------------------------
// 1. Password Reset
// ---------------------------------------------------------------------------

interface PasswordResetEmailParams {
  name: string
  email: string
  code: string
}

export async function sendPasswordResetEmail({
  name,
  email,
  code,
}: PasswordResetEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!ses) {
    console.warn('AWS SES not configured, skipping password reset email')
    console.log(`[DEV] Password reset code for ${email}: ${code}`)
    return { success: true }
  }

  try {
    const body = `
      ${emailHeading('Password Reset')}
      <p>Hi ${s(name)},</p>
      <p>You requested a password reset for your Hromada donor account. Enter this code to set a new password:</p>
      ${emailCode(s(code))}
      ${emailMuted('This code expires in <strong>15 minutes</strong>.')}
      ${emailDivider()}
      <p style="color:#666;">If you didn&rsquo;t request this, you can safely ignore this email. Your password will not be changed.</p>
    `

    await sendEmail({
      to: email,
      subject: 'Your Hromada password reset code',
      html: emailLayout(body, { preheader: `Your reset code is ${code}` }),
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Contact / Donor Interest Notification (admin)
// ---------------------------------------------------------------------------

interface ContactNotificationParams {
  donorName: string
  donorEmail: string
  message: string
  projectName: string
  municipalityName: string
  municipalityEmail: string
  projectId: string
}

export async function sendContactNotification({
  donorName,
  donorEmail,
  message,
  projectName,
  municipalityName,
  municipalityEmail,
  projectId,
}: ContactNotificationParams): Promise<{ success: boolean; error?: string }> {
  const adminEmail = process.env.ADMIN_EMAIL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (!adminEmail) {
    console.warn('ADMIN_EMAIL not configured, skipping email notification')
    return { success: true }
  }

  if (!ses) {
    console.warn('AWS SES not configured, skipping email notification')
    return { success: true }
  }

  try {
    const body = `
      ${emailHeading('New Donor Contact')}
      <p>A donor has submitted an inquiry about a project on the platform.</p>

      ${emailSubheading('Project')}
      ${emailField('Project', s(projectName))}
      ${emailField('Municipality', s(municipalityName))}
      ${emailField('Municipality Contact', `<a href="mailto:${s(municipalityEmail)}" style="color:#0057B8;">${s(municipalityEmail)}</a>`)}

      ${emailSubheading('Donor')}
      ${emailField('Name', s(donorName))}
      ${emailField('Email', `<a href="mailto:${s(donorEmail)}" style="color:#0057B8;">${s(donorEmail)}</a>`)}

      ${emailSubheading('Message')}
      <p style="white-space:pre-wrap;margin:8px 0 0;">${s(message)}</p>

      ${emailButton('View in Admin Dashboard', `${appUrl}/admin`)}

      ${emailMuted(`<a href="${appUrl}/projects/${s(projectId)}" style="color:#999;">View project on site</a>`)}
    `

    await sendEmail({
      to: adminEmail,
      subject: `New Donor Interest: ${s(projectName)}`,
      html: emailLayout(body),
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send email notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Donor Welcome Email
// ---------------------------------------------------------------------------

interface DonorWelcomeParams {
  donorName: string
  donorEmail: string
  temporaryPassword: string
  projectName: string
  amount?: number
  paymentMethod: string
  /** Full URL to a project photo. */
  projectPhotoUrl?: string
  /** Municipality name (e.g., "Novohrodivka"). */
  municipality?: string
  /** NGO partner name (e.g., "NGO Ecoaction"). */
  partnerName?: string
  /** Full URL to the partner's logo image. */
  partnerLogoUrl?: string
}

export async function sendDonorWelcomeEmail({
  donorName,
  donorEmail,
  temporaryPassword,
  projectName,
  amount,
  paymentMethod,
  projectPhotoUrl,
  municipality,
  partnerName,
  partnerLogoUrl,
}: DonorWelcomeParams): Promise<{ success: boolean; error?: string }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (!ses) {
    console.warn('AWS SES not configured, skipping donor welcome email')
    return { success: true }
  }

  const methodLabel = PAYMENT_LABELS[paymentMethod] || paymentMethod
  const amountText = amount ? ` <strong>$${amount.toLocaleString()}</strong>` : ''

  try {
    const body = `
      ${emailHeading(`You're powering ${s(projectName)}`)}

      <p>${s(donorName)}, your${amountText} contribution is going to make a real difference. This project was requested by the community and verified by our NGO partner on the ground in Ukraine.</p>

      ${emailProjectCard({
        projectName: s(projectName),
        photoUrl: projectPhotoUrl,
        municipality: municipality ? s(municipality) : undefined,
        partnerName: partnerName ? s(partnerName) : undefined,
        partnerLogoUrl,
      })}

      ${emailProcessFlow('Your Project\u2019s Journey', [
        {
          number: 1,
          title: 'Payment Confirmed',
          description: `We confirm receipt of your ${s(methodLabel)} (1\u20133 business days).`,
        },
        {
          number: 2,
          title: 'Funds Sent to Ukraine',
          description: 'Your donation is wired directly to the municipality\u2019s bank account.',
        },
        {
          number: 3,
          title: 'Construction Begins',
          description: 'The municipality procures materials and work begins on your project.',
        },
        {
          number: 4,
          title: 'Progress Updates',
          description: 'You\u2019ll receive photos as construction moves forward.',
        },
        {
          number: 5,
          title: 'Project Complete',
          description: 'Final photos and documentation delivered to your donor dashboard.',
        },
      ])}

      ${emailDivider()}

      <p>We\u2019ve created a donor account so you can follow along. Here are your login credentials:</p>

      ${emailHighlightBox(`
        ${emailField('Email', s(donorEmail))}
        ${emailField('Temporary Password', `<code style="background:#F5F1E8;padding:3px 8px;border-radius:4px;font-family:'Geist Mono','SF Mono','Courier New',monospace;font-size:13px;">${s(temporaryPassword)}</code>`)}
        ${emailMuted('We recommend changing your password after your first login.')}
      `)}

      ${emailButton('View Your Donor Dashboard', `${appUrl}/login`)}

      <p style="margin-top:24px;">Your donation is tax-deductible through POCACITO Network, a registered 501(c)(3) nonprofit (EIN&nbsp;99-0392258). A tax receipt will be sent once your payment is confirmed.</p>

      <p>Thank you for standing with this community. If you have any questions, just reply to this email.</p>

      <p style="color:#1a2744;font-weight:600;">Tom &amp; Sloan<br>
      <span style="font-weight:400;color:#666;">Hromada</span></p>
    `

    await sendEmail({
      to: donorEmail,
      subject: `You're powering ${s(projectName)}`,
      html: emailLayout(body, { preheader: `Your contribution is on its way to Ukraine.` }),
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send donor welcome email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    }
  }
}

// ---------------------------------------------------------------------------
// 4. Donation Notification to Admin
// ---------------------------------------------------------------------------

interface DonationNotificationParams {
  donorName: string
  donorEmail: string
  donorOrganization?: string
  projectName: string
  projectId: string
  amount?: number
  paymentMethod: string
  referenceNumber?: string
  isNewDonor: boolean
}

export async function sendDonationNotificationToAdmin({
  donorName,
  donorEmail,
  donorOrganization,
  projectName,
  projectId,
  amount,
  paymentMethod,
  referenceNumber,
  isNewDonor,
}: DonationNotificationParams): Promise<{ success: boolean; error?: string }> {
  const adminEmail = process.env.ADMIN_EMAIL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (!adminEmail) {
    console.warn('ADMIN_EMAIL not configured, skipping admin notification')
    return { success: true }
  }

  if (!ses) {
    console.warn('AWS SES not configured, skipping admin notification')
    return { success: true }
  }

  const methodLabel = PAYMENT_LABELS_TITLE[paymentMethod] || paymentMethod
  const amountDisplay = amount ? `$${amount.toLocaleString()}` : 'Amount to be confirmed'

  try {
    const body = `
      ${emailHeading('New Donation Received')}

      ${emailAccentBox(`
        <p style="margin:0;font-size:28px;font-weight:700;color:#1a7a3a;">${amountDisplay}</p>
        <p style="margin:4px 0 0;font-size:14px;color:#666;">via ${s(methodLabel)}</p>
      `)}

      ${emailSubheading('Donor')}
      <p style="margin:6px 0;">
        <strong style="color:#1a2744;">Name:</strong> ${s(donorName)}
        ${isNewDonor ? '&nbsp;&nbsp;' + emailBadge('NEW DONOR') : ''}
      </p>
      ${emailField('Email', `<a href="mailto:${s(donorEmail)}" style="color:#0057B8;">${s(donorEmail)}</a>`)}
      ${donorOrganization ? emailField('Organization', s(donorOrganization)) : ''}
      ${referenceNumber ? emailField('Reference #', `<code style="background:#F5F1E8;padding:2px 6px;border-radius:3px;font-size:13px;">${s(referenceNumber)}</code>`) : ''}

      ${emailSubheading('Project')}
      <p style="margin:6px 0;font-size:16px;font-weight:600;color:#1a2744;">${s(projectName)}</p>

      ${emailButton('View in Dashboard', `${appUrl}/nonprofit`)}

      ${emailMuted('Check your bank account to confirm receipt, then mark as &ldquo;Received&rdquo; in the Nonprofit Manager dashboard.')}
    `

    await sendEmail({
      to: adminEmail,
      subject: `New Donation: ${amountDisplay} for ${s(projectName)}`,
      html: emailLayout(body),
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send admin notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    }
  }
}

// ---------------------------------------------------------------------------
// 5. Newsletter Welcome
// ---------------------------------------------------------------------------

export async function sendNewsletterWelcomeEmail(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (!ses) {
    console.warn('AWS SES not configured, skipping newsletter welcome email')
    return { success: true }
  }

  try {
    const body = `
      ${emailHeading('Welcome to Hromada')}

      <p>Thanks for signing up. We&rsquo;ll send occasional updates on projects being funded, communities being powered, and how your support makes a difference.</p>

      <p>Hromada connects donors directly with Ukrainian municipalities rebuilding civilian infrastructure &mdash; schools, hospitals, water systems, energy. Every project is verified by our NGO partners. No overhead fees.</p>

      ${emailButton('Browse Projects', `${appUrl}/projects`)}

      ${emailMuted("You're receiving this because you signed up at hromadaproject.org.")}
    `

    await sendEmail({
      to: email,
      subject: "You're on the list — welcome to Hromada",
      html: emailLayout(body, { preheader: 'Thanks for joining. Browse projects that need support.' }),
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send newsletter welcome email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

// ---------------------------------------------------------------------------
// 6. Calendly Booking Welcome Email
// ---------------------------------------------------------------------------

export function buildCalendlyWelcomeEmailHtml(
  email: string,
  name: string | null,
  unsubscribeToken: string,
  projectName?: string,
): { subject: string; html: string } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const firstName = name ? s(name.split(' ')[0]) : null
  const subject = firstName
    ? `${firstName}, welcome to our hromada`
    : 'Welcome to our hromada'
  const unsubscribeUrl = `${appUrl}/api/newsletter/unsubscribe?token=${unsubscribeToken}`

  const body = `
    ${emailHeading(subject)}

    <p><em>Hromada</em> (громада) means <em>community</em> in Ukrainian. Thanks for your interest in what these communities are building.</p>

    ${projectName ? `
      <p>You were looking at <strong>${s(projectName)}</strong> &mdash; a project identified and requested by the municipality it serves. Every project on our platform came directly from a Ukrainian community that knows what it needs and is asking for support.</p>
    ` : `
      <p>Every project on our platform was identified and requested by the Ukrainian community it serves. They know what they need &mdash; Hromada is the infrastructure that carries their request to you.</p>
    `}

    <p>We&rsquo;ll have a chance to talk through all of this on our call. In the meantime, feel free to explore.</p>

    ${emailButton('Browse Projects', `${appUrl}/projects`)}

    <p style="font-size:13px;color:#666;margin-top:24px;">You&rsquo;ll get occasional updates from us on projects funded and communities being rebuilt. No spam &mdash; just progress.</p>

    ${emailMuted(`You're receiving this because you signed up via hromadaproject.org. <a href="${unsubscribeUrl}" style="color:#999;text-decoration:underline;">Unsubscribe</a>`)}
  `

  const html = emailLayout(body, {
    preheader: projectName
      ? `Thanks for your interest in ${projectName}.`
      : 'Thanks for your interest. Welcome to our community.',
    unsubscribeUrl,
  })

  return { subject, html }
}

export async function sendCalendlyWelcomeEmail(
  email: string,
  name: string | null,
  unsubscribeToken: string,
  projectName?: string,
): Promise<{ success: boolean; error?: string }> {
  if (!ses) {
    console.warn('AWS SES not configured, skipping Calendly welcome email')
    return { success: true }
  }

  try {
    const { subject, html } = buildCalendlyWelcomeEmailHtml(
      email, name, unsubscribeToken, projectName,
    )

    await sendEmail({ to: email, subject, html })

    return { success: true }
  } catch (error) {
    console.error('Failed to send Calendly welcome email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

// ---------------------------------------------------------------------------
// 7. Partnership Inquiry Notification (admin)
// ---------------------------------------------------------------------------

interface PartnershipInquiryNotificationParams {
  communityName: string
  contactName: string
  contactEmail: string
  communityType: string
  approximateSize?: string
  message?: string
}

const communityTypeLabels: Record<string, string> = {
  rotary: 'Rotary Club or Service Organization',
  city_council: 'City Council or Municipality',
  faith: 'Faith Community',
  school: 'School or University',
  diaspora: 'Diaspora Organization',
  corporate: 'Corporate CSR / Business',
  other: 'Other',
}

export async function sendPartnershipInquiryNotification({
  communityName,
  contactName,
  contactEmail,
  communityType,
  approximateSize,
  message,
}: PartnershipInquiryNotificationParams): Promise<{ success: boolean; error?: string }> {
  const adminEmail = process.env.ADMIN_EMAIL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (!adminEmail) {
    console.warn('ADMIN_EMAIL not configured, skipping email notification')
    return { success: true }
  }

  if (!ses) {
    console.warn('AWS SES not configured, skipping email notification')
    return { success: true }
  }

  try {
    const body = `
      ${emailHeading('New Partnership Inquiry')}
      <p>A community has submitted an inquiry through the Municipal Partnership Program page.</p>

      ${emailSubheading('Community')}
      ${emailField('Name', s(communityName))}
      ${emailField('Type', s(communityTypeLabels[communityType] || communityType))}
      ${approximateSize ? emailField('Approximate Size', s(approximateSize)) : ''}

      ${emailSubheading('Contact')}
      ${emailField('Name', s(contactName))}
      ${emailField('Email', `<a href="mailto:${s(contactEmail)}" style="color:#0057B8;">${s(contactEmail)}</a>`)}

      ${message ? `
        ${emailSubheading('Message')}
        <p style="white-space:pre-wrap;margin:8px 0 0;">${s(message)}</p>
      ` : ''}

      ${emailButton('View in Admin Dashboard', `${appUrl}/admin`)}

      ${emailMuted('Municipal Partnership Program inquiry via Hromada.')}
    `

    await sendEmail({
      to: adminEmail,
      subject: `New MPP Inquiry: ${s(communityName)}`,
      html: emailLayout(body),
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send partnership inquiry notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    }
  }
}

// ---------------------------------------------------------------------------
// 7. Donation Forwarded Email (receipt + credentials)
// ---------------------------------------------------------------------------

interface DonationForwardedParams {
  donorName: string
  donorEmail: string
  temporaryPassword?: string
  projectName: string
  amount: number
  paymentMethod: string
  referenceNumber?: string
  projectPhotoUrl?: string
  municipality?: string
  partnerName?: string
  partnerLogoUrl?: string
  receiptUrl: string
  receiptPdfBuffer: Buffer
  receiptNumber: string
}

/**
 * Send the donation forwarded email with tax receipt PDF attached.
 * Uses SendRawEmailCommand to support MIME attachments.
 */
export async function sendDonationForwardedEmail({
  donorName,
  donorEmail,
  temporaryPassword,
  projectName,
  amount,
  paymentMethod,
  referenceNumber,
  projectPhotoUrl,
  municipality,
  partnerName,
  partnerLogoUrl,
  receiptUrl,
  receiptPdfBuffer,
  receiptNumber,
}: DonationForwardedParams): Promise<{ success: boolean; error?: string }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (!ses) {
    console.warn('AWS SES not configured, skipping donation forwarded email')
    return { success: true }
  }

  const methodLabel = PAYMENT_LABELS[paymentMethod.toLowerCase()] || paymentMethod
  const amountText = ` <strong>$${amount.toLocaleString()}</strong>`

  try {
    // Build credentials section
    const credentialsBlock = temporaryPassword
      ? `
        ${emailDivider()}
        <p>We\u2019ve created a donor account so you can follow along. Here are your login credentials:</p>
        ${emailHighlightBox(`
          ${emailField('Email', s(donorEmail))}
          ${emailField('Temporary Password', `<code style="background:#F5F1E8;padding:3px 8px;border-radius:4px;font-family:'Geist Mono','SF Mono','Courier New',monospace;font-size:13px;">${s(temporaryPassword)}</code>`)}
          ${emailMuted('We recommend changing your password after your first login.')}
        `)}
        ${emailButton('View Your Donor Dashboard', `${appUrl}/login`)}
      `
      : ''

    const body = `
      ${emailHeading(`Your donation is on its way to Ukraine`)}

      <p>${s(donorName)}, your${amountText} contribution has been forwarded to the community. This project was requested by the municipality and verified by our NGO partner on the ground.</p>

      ${emailProjectCard({
        projectName: s(projectName),
        photoUrl: projectPhotoUrl,
        municipality: municipality ? s(municipality) : undefined,
        partnerName: partnerName ? s(partnerName) : undefined,
        partnerLogoUrl,
      })}

      ${emailProcessFlow('Your Project\u2019s Journey', [
        {
          number: 1,
          title: 'Payment Confirmed',
          description: `Your ${s(methodLabel)} was confirmed.`,
        },
        {
          number: 2,
          title: 'Funds Sent to Ukraine',
          description: 'Your donation has been wired to the municipality\u2019s bank account.',
        },
        {
          number: 3,
          title: 'Construction Begins',
          description: 'The municipality procures materials and work begins on your project.',
        },
        {
          number: 4,
          title: 'Progress Updates',
          description: 'You\u2019ll receive photos as construction moves forward.',
        },
        {
          number: 5,
          title: 'Project Complete',
          description: 'Final photos and documentation delivered to your donor dashboard.',
        },
      ])}

      ${credentialsBlock}

      ${emailDivider()}

      <p><strong style="color:#1a2744;">Your Tax Receipt</strong></p>
      <p>Your tax receipt (${s(receiptNumber)}) is attached to this email and available for download below.</p>
      ${emailButton('Download Tax Receipt', receiptUrl)}
      <p style="font-size:13px;color:#666;">Your donation is tax-deductible through POCACITO Network, a registered 501(c)(3) nonprofit (EIN&nbsp;99-0392258).${referenceNumber ? ` Reference: ${s(referenceNumber)}` : ''}</p>

      <p style="margin-top:24px;">Thank you for standing with this community. If you have any questions, just reply to this email.</p>

      <p style="color:#1a2744;font-weight:600;">Tom &amp; Sloan<br>
      <span style="font-weight:400;color:#666;">Hromada</span></p>
    `

    const subject = `Your donation is on its way to Ukraine \u2014 ${s(projectName)}`
    const htmlContent = emailLayout(body, { preheader: 'Your tax receipt is attached.' })

    // Build raw MIME email with PDF attachment
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const pdfBase64 = receiptPdfBuffer.toString('base64')

    const rawEmail = [
      `From: Hromada <${FROM_EMAIL}>`,
      `To: ${donorEmail}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      htmlContent,
      '',
      `--${boundary}`,
      `Content-Type: application/pdf; name="Hromada_Tax_Receipt_${receiptNumber}.pdf"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="Hromada_Tax_Receipt_${receiptNumber}.pdf"`,
      '',
      pdfBase64,
      '',
      `--${boundary}--`,
    ].join('\r\n')

    await ses.send(
      new SendRawEmailCommand({
        RawMessage: { Data: new TextEncoder().encode(rawEmail) },
      })
    )

    return { success: true }
  } catch (error) {
    console.error('Failed to send donation forwarded email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

// ---------------------------------------------------------------------------
// 8. Lightweight Donation Confirmation (no credentials, no receipt)
// ---------------------------------------------------------------------------

interface DonationConfirmationParams {
  donorName: string
  donorEmail: string
  projectName: string
  amount?: number
  paymentMethod: string
}

/**
 * Lightweight email confirming we received the donor's submission.
 * No login credentials or tax receipt — those come later at FORWARDED.
 */
export async function sendDonationConfirmationEmail({
  donorName,
  donorEmail,
  projectName,
  amount,
  paymentMethod,
}: DonationConfirmationParams): Promise<{ success: boolean; error?: string }> {
  if (!ses) {
    console.warn('AWS SES not configured, skipping donation confirmation email')
    return { success: true }
  }

  const methodLabel = PAYMENT_LABELS[paymentMethod.toLowerCase()] || paymentMethod
  const amountText = amount ? ` of <strong>$${amount.toLocaleString()}</strong>` : ''

  try {
    const body = `
      ${emailHeading('We received your donation details')}

      <p>Hi ${s(donorName)},</p>

      <p>Thank you for your ${s(methodLabel)} contribution${amountText} toward <strong>${s(projectName)}</strong>. We\u2019re verifying receipt with our bank now.</p>

      ${emailSubheading('What happens next')}
      <p>We\u2019ll confirm your payment within 1\u20133 business days. Once your funds are forwarded to Ukraine, you\u2019ll receive your tax receipt and login credentials for your donor dashboard.</p>

      ${emailMuted('If you have any questions in the meantime, just reply to this email.')}

      <p style="margin-top:20px;color:#1a2744;font-weight:600;">Tom &amp; Sloan<br>
      <span style="font-weight:400;color:#666;">Hromada</span></p>
    `

    await sendEmail({
      to: donorEmail,
      subject: `We received your donation details \u2014 ${s(projectName)}`,
      html: emailLayout(body, { preheader: `We're verifying your ${methodLabel} now.` }),
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send donation confirmation email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

// ---------------------------------------------------------------------------
// 9. Project Submission Notification (admin)
// ---------------------------------------------------------------------------

interface ProjectSubmissionNotificationParams {
  facilityName: string
  municipalityName: string
  municipalityEmail: string
  region?: string | null
  category: string
  projectType: string
  urgency: string
  briefDescription: string
  contactName: string
  contactEmail: string
  contactPhone?: string | null
  photoCount: number
  edrpou?: string
}

export async function sendProjectSubmissionNotification({
  facilityName,
  municipalityName,
  municipalityEmail,
  region,
  category,
  projectType,
  urgency,
  briefDescription,
  contactName,
  contactEmail,
  contactPhone,
  photoCount,
  edrpou,
}: ProjectSubmissionNotificationParams): Promise<{ success: boolean; error?: string }> {
  const adminEmail = process.env.ADMIN_EMAIL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (!adminEmail || !ses) {
    console.warn('ADMIN_EMAIL or SES not configured, skipping submission notification')
    return { success: true }
  }

  try {
    // EDRPOU status block for admin
    const edrpouBlock = edrpou
      ? emailField('EDRPOU', `<code style="background:#e8f5e9;padding:2px 6px;border-radius:3px;font-size:13px;">${s(edrpou)}</code>`)
      : `<div style="background:#fff3e0;border-left:3px solid #ff9800;padding:10px 14px;margin:8px 0;border-radius:4px;">
          <p style="margin:0;color:#e65100;font-weight:600;">EDRPOU not provided</p>
          <p style="margin:4px 0 0;color:#666;font-size:13px;">The partner did not enter an EDRPOU. Enter it manually after approval to enable Prozorro procurement tracking.</p>
        </div>`

    const body = `
      ${emailHeading('New Project Submission')}
      <p>A new project has been submitted for review.</p>

      ${emailSubheading('Municipality')}
      ${emailField('Municipality', s(municipalityName))}
      ${emailField('Email', `<a href="mailto:${s(municipalityEmail)}" style="color:#0057B8;">${s(municipalityEmail)}</a>`)}
      ${region ? emailField('Region', s(region)) : ''}
      ${edrpouBlock}

      ${emailSubheading('Project Details')}
      ${emailField('Facility', s(facilityName))}
      ${emailField('Category', s(category))}
      ${emailField('Type', s(projectType))}
      ${emailField('Urgency', s(urgency))}

      ${emailSubheading('Description')}
      <p>${s(briefDescription)}</p>

      ${photoCount > 0 ? `<p>${photoCount} photo(s) uploaded</p>` : ''}

      ${emailSubheading('Contact')}
      ${emailField('Name', s(contactName))}
      ${emailField('Email', `<a href="mailto:${s(contactEmail)}" style="color:#0057B8;">${s(contactEmail)}</a>`)}
      ${contactPhone ? emailField('Phone', s(contactPhone)) : ''}

      ${emailButton('Review in Admin Dashboard', `${appUrl}/admin`)}
    `

    await sendEmail({
      to: adminEmail,
      subject: `New Project Submission: ${s(facilityName)}`,
      html: emailLayout(body),
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send submission notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

// ---------------------------------------------------------------------------
// 10. Project Submission Confirmation (to submitter)
// ---------------------------------------------------------------------------

interface ProjectSubmissionConfirmationParams {
  contactName: string
  contactEmail: string
  facilityName: string
}

export async function sendProjectSubmissionConfirmation({
  contactName,
  contactEmail,
  facilityName,
}: ProjectSubmissionConfirmationParams): Promise<{ success: boolean; error?: string }> {
  if (!ses) {
    console.warn('AWS SES not configured, skipping submission confirmation email')
    return { success: true }
  }

  try {
    const body = `
      ${emailHeading('Thank You for Your Submission')}

      <p>Dear ${s(contactName)},</p>

      <p>We have received your project submission for <strong>${s(facilityName)}</strong>.</p>

      ${emailSubheading('What happens next')}
      <p>Our team will review your submission within 3\u20135 business days. We may contact you if we need additional information. Once approved, your project will be visible to donors on our platform.</p>

      <p>If you have any questions, just reply to this email.</p>

      <p>Thank you for working to rebuild Ukraine\u2019s communities.</p>

      <p style="color:#1a2744;font-weight:600;">Tom &amp; Sloan<br>
      <span style="font-weight:400;color:#666;">Hromada</span></p>
    `

    await sendEmail({
      to: contactEmail,
      subject: `Project Submission Received \u2014 ${s(facilityName)}`,
      html: emailLayout(body, { preheader: `We received your submission for ${facilityName}.` }),
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send submission confirmation email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

// ---------------------------------------------------------------------------
// 11. Project Approval Email (to submitter)
// ---------------------------------------------------------------------------

interface ProjectApprovalParams {
  contactName: string
  contactEmail: string
  facilityName: string
  projectId: string
}

export async function sendProjectApprovalEmail({
  contactName,
  contactEmail,
  facilityName,
  projectId,
}: ProjectApprovalParams): Promise<{ success: boolean; error?: string }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (!ses) {
    console.warn('AWS SES not configured, skipping project approval email')
    return { success: true }
  }

  try {
    const body = `
      ${emailHeading('Your Project is Now Live')}

      <p>Dear ${s(contactName)},</p>

      <p>Your project <strong>${s(facilityName)}</strong> has been approved and is now live on the Hromada platform. Donors can see your project and express interest in supporting it.</p>

      ${emailButton('View Your Project', `${appUrl}/projects/${s(projectId)}`)}

      <p>We encourage you to share this link with your network to increase visibility.</p>

      <p>Thank you for working to rebuild Ukraine\u2019s communities.</p>

      <p style="color:#1a2744;font-weight:600;">Tom &amp; Sloan<br>
      <span style="font-weight:400;color:#666;">Hromada</span></p>
    `

    await sendEmail({
      to: contactEmail,
      subject: `Your Project is Now Live \u2014 ${s(facilityName)}`,
      html: emailLayout(body, { preheader: `${facilityName} is now on the Hromada platform.` }),
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send project approval email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

// ---------------------------------------------------------------------------
// 12. Project Rejection Email (to submitter)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 12b. Project Update Email (Prozorro status change → donor)
// ---------------------------------------------------------------------------

interface ProjectUpdateEmailParams {
  donorName: string
  donorEmail: string
  projectName: string
  updateTitle: string
  updateMessage: string
  tenderID: string
}

export async function sendProjectUpdateEmail({
  donorName,
  donorEmail,
  projectName,
  updateTitle,
  updateMessage,
  tenderID,
}: ProjectUpdateEmailParams): Promise<{ success: boolean; error?: string }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (!ses) {
    console.warn('AWS SES not configured, skipping project update email')
    return { success: true }
  }

  const prozorroUrl = `https://prozorro.gov.ua/tender/${tenderID}`

  try {
    const body = `
      ${emailHeading(`Update: ${s(projectName)}`)}

      <p>Hi ${s(donorName)},</p>

      <p>There\u2019s a new update on <strong>${s(projectName)}</strong>, a project you\u2019ve funded through Hromada.</p>

      ${emailInfoBox(`
        <p style="margin:0 0 8px;font-weight:600;color:#1a2744;">${s(updateTitle)}</p>
        <p style="margin:0;color:#444;">${s(updateMessage)}</p>
      `)}

      ${emailButton('View on Prozorro', prozorroUrl)}

      <p style="font-size:13px;color:#666;">Prozorro is Ukraine\u2019s official public procurement platform. All municipal purchases above a minimum threshold are posted there for transparency.</p>

      ${emailDivider()}

      ${emailButton('View Donor Dashboard', `${appUrl}/donor`)}

      <p style="margin-top:20px;color:#1a2744;font-weight:600;">Tom &amp; Sloan<br>
      <span style="font-weight:400;color:#666;">Hromada</span></p>
    `

    await sendEmail({
      to: donorEmail,
      subject: `Project update: ${s(projectName)}`,
      html: emailLayout(body, { preheader: s(updateTitle) }),
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send project update email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

// ---------------------------------------------------------------------------
// 13. Prozorro Match Notification (to admin)
// ---------------------------------------------------------------------------

interface ProzorroMatchEmailParams {
  facilityName: string
  edrpou: string
  tenderID: string
  entityName: string
  tenderStatus: string
  prozorroUrl: string
}

export async function sendProzorroMatchEmail({
  facilityName,
  edrpou,
  tenderID,
  entityName,
  tenderStatus,
  prozorroUrl,
}: ProzorroMatchEmailParams): Promise<{ success: boolean; error?: string }> {
  const adminEmail = process.env.ADMIN_EMAIL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (!adminEmail || !ses) {
    console.warn('ADMIN_EMAIL or SES not configured, skipping Prozorro match notification')
    return { success: true }
  }

  try {
    const body = `
      ${emailHeading('Prozorro Match Found')}
      <p>A new tender on Prozorro may be related to a Hromada project. Please review and link it manually if it matches.</p>

      ${emailSubheading('Hromada Project')}
      ${emailField('Project', s(facilityName))}
      ${emailField('EDRPOU', `<code style="background:#e8f5e9;padding:2px 6px;border-radius:3px;font-size:13px;">${s(edrpou)}</code>`)}

      ${emailSubheading('Prozorro Tender')}
      ${emailField('Tender ID', s(tenderID))}
      ${emailField('Procuring Entity', s(entityName))}
      ${emailField('Status', s(tenderStatus))}

      ${emailButton('View on Prozorro', prozorroUrl)}

      <p style="font-size:13px;color:#666;">If this tender is related to the project above, link it via the admin dashboard by entering the Tender ID and UUID in the project&rsquo;s Prozorro Tracking section.</p>

      ${emailButton('Open Admin Dashboard', `${appUrl}/admin`)}
    `

    await sendEmail({
      to: adminEmail,
      subject: `Prozorro match: ${s(facilityName)}`,
      html: emailLayout(body),
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send Prozorro match notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

// ---------------------------------------------------------------------------
// 14. Project Rejection Email (to submitter)
// ---------------------------------------------------------------------------

interface ProjectRejectionParams {
  contactName: string
  contactEmail: string
  facilityName: string
  rejectionReason: string
}

export async function sendProjectRejectionEmail({
  contactName,
  contactEmail,
  facilityName,
  rejectionReason,
}: ProjectRejectionParams): Promise<{ success: boolean; error?: string }> {
  if (!ses) {
    console.warn('AWS SES not configured, skipping project rejection email')
    return { success: true }
  }

  try {
    const body = `
      ${emailHeading('Project Submission Update')}

      <p>Dear ${s(contactName)},</p>

      <p>Thank you for submitting your project <strong>${s(facilityName)}</strong> to Hromada.</p>

      <p>After review, we were unable to approve your submission at this time:</p>

      ${emailAccentBox(`<p style="margin:0;">${s(rejectionReason)}</p>`, '#999999')}

      <p>You are welcome to address these concerns and submit a new application. If you have questions, just reply to this email.</p>

      <p style="color:#1a2744;font-weight:600;">Tom &amp; Sloan<br>
      <span style="font-weight:400;color:#666;">Hromada</span></p>
    `

    await sendEmail({
      to: contactEmail,
      subject: `Project Submission Update \u2014 ${s(facilityName)}`,
      html: emailLayout(body, { preheader: `Update on your submission for ${facilityName}.` }),
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send project rejection email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}
