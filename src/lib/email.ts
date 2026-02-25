import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
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

      ${emailInfoBox(`
        ${emailSubheading('Project')}
        ${emailField('Project', s(projectName))}
        ${emailField('Municipality', s(municipalityName))}
        ${emailField('Municipality Contact', `<a href="mailto:${s(municipalityEmail)}" style="color:#0057B8;">${s(municipalityEmail)}</a>`)}
      `)}

      ${emailInfoBox(`
        ${emailSubheading('Donor')}
        ${emailField('Name', s(donorName))}
        ${emailField('Email', `<a href="mailto:${s(donorEmail)}" style="color:#0057B8;">${s(donorEmail)}</a>`)}
      `)}

      ${emailInfoBox(`
        ${emailSubheading('Message')}
        <p style="white-space:pre-wrap;margin:8px 0 0;">${s(message)}</p>
      `)}

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
      ${emailHeading(`Thank you, ${s(donorName)}`)}

      <p>We&rsquo;ve received your notification of a${amountText} ${s(methodLabel)} contribution for:</p>

      ${emailProjectCard({
        projectName: s(projectName),
        photoUrl: projectPhotoUrl,
        municipality: municipality ? s(municipality) : undefined,
        partnerName: partnerName ? s(partnerName) : undefined,
        partnerLogoUrl,
      })}

      <p>We&rsquo;ve created a donor account so you can track your contribution as it makes its way to Ukraine.</p>

      ${emailHighlightBox(`
        ${emailSubheading('Your Login Credentials')}
        ${emailField('Email', s(donorEmail))}
        ${emailField('Temporary Password', `<code style="background:#F5F1E8;padding:3px 8px;border-radius:4px;font-family:'Geist Mono','SF Mono','Courier New',monospace;font-size:13px;">${s(temporaryPassword)}</code>`)}
        ${emailMuted('We recommend changing your password after your first login.')}
      `)}

      ${emailButton('View Your Donor Dashboard', `${appUrl}/login`)}

      ${emailProcessFlow('What Happens Next', [
        {
          number: 1,
          title: 'Confirmation',
          description: `We verify receipt of your ${s(methodLabel)} (usually 1\u20133 business days).`,
        },
        {
          number: 2,
          title: 'Procurement',
          description: 'The municipality procures materials through Prozorro, Ukraine\u2019s transparent e-procurement system.',
          logoUrl: `${appUrl}/partners/prozorrologo.png`,
          logoAlt: 'Prozorro',
        },
        {
          number: 3,
          title: 'Transfer',
          description: 'Funds are wired directly to the municipality in Ukraine.',
        },
        {
          number: 4,
          title: 'Updates',
          description: 'You\u2019ll receive progress photos and updates as your project is completed.',
        },
      ])}

      ${emailInfoBox(`
        <p style="margin:0;font-size:13px;color:#666;">
          <strong style="color:#1a2744;">Tax Information</strong><br>
          Your donation is tax-deductible through POCACITO Network, a registered 501(c)(3) nonprofit organization (EIN&nbsp;99-0392258). A tax receipt will be sent once your payment is confirmed.
        </p>
      `)}

      ${emailMuted('Questions? Reply to this email or contact us at <a href="mailto:donations@pocacito.org" style="color:#999;">donations@pocacito.org</a>')}
    `

    await sendEmail({
      to: donorEmail,
      subject: `Thank you for supporting ${s(projectName)}`,
      html: emailLayout(body, { preheader: `Your contribution to ${projectName} has been recorded.` }),
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

      ${emailInfoBox(`
        ${emailSubheading('Donor')}
        <p style="margin:6px 0;">
          <strong style="color:#1a2744;">Name:</strong> ${s(donorName)}
          ${isNewDonor ? '&nbsp;&nbsp;' + emailBadge('NEW DONOR') : ''}
        </p>
        ${emailField('Email', `<a href="mailto:${s(donorEmail)}" style="color:#0057B8;">${s(donorEmail)}</a>`)}
        ${donorOrganization ? emailField('Organization', s(donorOrganization)) : ''}
        ${referenceNumber ? emailField('Reference #', `<code style="background:#F5F1E8;padding:2px 6px;border-radius:3px;font-size:13px;">${s(referenceNumber)}</code>`) : ''}
      `)}

      ${emailInfoBox(`
        ${emailSubheading('Project')}
        <p style="margin:6px 0;font-size:16px;font-weight:600;color:#1a2744;">${s(projectName)}</p>
      `)}

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

      ${emailInfoBox(`
        <p style="margin:0 0 6px;font-weight:600;color:#1a2744;">What we&rsquo;re building</p>
        <p style="margin:0;font-size:14px;color:#555;">
          Hromada connects donors directly with Ukrainian municipalities rebuilding civilian infrastructure &mdash; schools, hospitals, water systems, energy. Every project is verified by our NGO partners. No overhead fees.
        </p>
      `)}

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
// 6. Partnership Inquiry Notification (admin)
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

      ${emailInfoBox(`
        ${emailSubheading('Community')}
        ${emailField('Name', s(communityName))}
        ${emailField('Type', s(communityTypeLabels[communityType] || communityType))}
        ${approximateSize ? emailField('Approximate Size', s(approximateSize)) : ''}
      `)}

      ${emailInfoBox(`
        ${emailSubheading('Contact')}
        ${emailField('Name', s(contactName))}
        ${emailField('Email', `<a href="mailto:${s(contactEmail)}" style="color:#0057B8;">${s(contactEmail)}</a>`)}
      `)}

      ${message ? emailInfoBox(`
        ${emailSubheading('Message')}
        <p style="white-space:pre-wrap;margin:8px 0 0;">${s(message)}</p>
      `) : ''}

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
