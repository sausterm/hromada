import { Resend } from 'resend'

// Only create Resend client if API key is configured
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

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

  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping email notification')
    return { success: true }
  }

  try {
    await resend.emails.send({
      from: 'Hromada <onboarding@resend.dev>',
      to: adminEmail,
      subject: `New Donor Interest: ${projectName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0057B8;">New Donor Contact Submission</h2>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Project Details</h3>
            <p><strong>Project:</strong> ${projectName}</p>
            <p><strong>Municipality:</strong> ${municipalityName}</p>
            <p><strong>Municipality Contact:</strong> ${municipalityEmail}</p>
          </div>

          <div style="background: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Donor Information</h3>
            <p><strong>Name:</strong> ${donorName}</p>
            <p><strong>Email:</strong> <a href="mailto:${donorEmail}">${donorEmail}</a></p>
          </div>

          <div style="background: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Message</h3>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <a href="${appUrl}/admin" style="background: #0057B8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View in Admin Dashboard
            </a>
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This notification was sent from Hromada.
            <a href="${appUrl}/projects/${projectId}">View Project</a>
          </p>
        </div>
      `,
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

interface DonorWelcomeParams {
  donorName: string
  donorEmail: string
  temporaryPassword: string
  projectName: string
  amount?: number
  paymentMethod: string
}

export async function sendDonorWelcomeEmail({
  donorName,
  donorEmail,
  temporaryPassword,
  projectName,
  amount,
  paymentMethod,
}: DonorWelcomeParams): Promise<{ success: boolean; error?: string }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping donor welcome email')
    return { success: true }
  }

  const paymentMethodLabels: Record<string, string> = {
    wire: 'wire transfer',
    daf: 'DAF grant',
    check: 'check',
    ach: 'bank transfer',
  }

  try {
    await resend.emails.send({
      from: 'Hromada <onboarding@resend.dev>',
      to: donorEmail,
      subject: `Thank you for supporting ${projectName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #0057B8; margin: 0;">hromada</h1>
            <p style="color: #666; margin: 5px 0;">Supporting Ukrainian Infrastructure Recovery</p>
          </div>

          <h2 style="color: #333;">Thank you, ${donorName}!</h2>

          <p>We've received your notification of a${amount ? ` <strong>$${amount.toLocaleString()}</strong>` : ''} ${paymentMethodLabels[paymentMethod] || paymentMethod} for:</p>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #0057B8;">${projectName}</p>
          </div>

          <p>We've created a donor account for you to track your contribution as it makes its way to Ukraine.</p>

          <div style="background: #fff; border: 2px solid #0057B8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0057B8;">Your Login Credentials</h3>
            <p><strong>Email:</strong> ${donorEmail}</p>
            <p><strong>Temporary Password:</strong> <code style="background: #f5f5f5; padding: 4px 8px; border-radius: 4px;">${temporaryPassword}</code></p>
            <p style="font-size: 12px; color: #666;">We recommend changing your password after your first login.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/login" style="background: #0057B8; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              View Your Donor Dashboard
            </a>
          </div>

          <h3>What Happens Next?</h3>
          <ol style="color: #555; line-height: 1.8;">
            <li><strong>Confirmation:</strong> We'll verify receipt of your ${paymentMethodLabels[paymentMethod] || 'payment'} (usually 1-3 business days)</li>
            <li><strong>Transfer:</strong> Funds will be wired to the municipality in Ukraine</li>
            <li><strong>Updates:</strong> You'll receive updates as your contribution reaches its destination</li>
          </ol>

          <div style="margin-top: 30px; padding: 20px; background: #f9f9f9; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #666;">
              <strong>Tax Information:</strong> Your donation is tax-deductible through POCACITO Network, a registered 501(c)(3) nonprofit organization (EIN 99-0392258). A tax receipt will be sent once your payment is confirmed.
            </p>
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
            Questions? Reply to this email or contact us at donations@pocacito.org
          </p>
        </div>
      `,
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

  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping admin notification')
    return { success: true }
  }

  const paymentMethodLabels: Record<string, string> = {
    wire: 'Wire Transfer',
    daf: 'DAF Grant',
    check: 'Check',
    ach: 'ACH Transfer',
  }

  try {
    await resend.emails.send({
      from: 'Hromada <onboarding@resend.dev>',
      to: adminEmail,
      subject: `💰 New Donation: ${amount ? `$${amount.toLocaleString()}` : 'Amount TBD'} for ${projectName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0057B8;">New Donation Confirmation Received</h2>

          <div style="background: #e8f4e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <p style="margin: 0; font-size: 24px; font-weight: bold; color: #28a745;">
              ${amount ? `$${amount.toLocaleString()}` : 'Amount to be confirmed'}
            </p>
            <p style="margin: 5px 0 0; color: #666;">via ${paymentMethodLabels[paymentMethod] || paymentMethod}</p>
          </div>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Donor Information</h3>
            <p><strong>Name:</strong> ${donorName} ${isNewDonor ? '<span style="background: #0057B8; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">NEW DONOR</span>' : ''}</p>
            <p><strong>Email:</strong> <a href="mailto:${donorEmail}">${donorEmail}</a></p>
            ${donorOrganization ? `<p><strong>Organization:</strong> ${donorOrganization}</p>` : ''}
            ${referenceNumber ? `<p><strong>Reference #:</strong> ${referenceNumber}</p>` : ''}
          </div>

          <div style="background: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Project</h3>
            <p style="font-size: 18px; margin: 0;"><strong>${projectName}</strong></p>
          </div>

          <div style="margin-top: 30px;">
            <a href="${appUrl}/nonprofit" style="background: #0057B8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View in Dashboard
            </a>
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Check your bank account to confirm receipt, then mark as "Received" in the Nonprofit Manager dashboard.
          </p>
        </div>
      `,
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

  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping email notification')
    return { success: true }
  }

  try {
    await resend.emails.send({
      from: 'Hromada <onboarding@resend.dev>',
      to: adminEmail,
      subject: `New MPP Inquiry: ${communityName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0057B8;">New Municipal Partnership Program Inquiry</h2>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Community Details</h3>
            <p><strong>Community:</strong> ${communityName}</p>
            <p><strong>Type:</strong> ${communityTypeLabels[communityType] || communityType}</p>
            ${approximateSize ? `<p><strong>Size:</strong> ${approximateSize}</p>` : ''}
          </div>

          <div style="background: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Contact</h3>
            <p><strong>Name:</strong> ${contactName}</p>
            <p><strong>Email:</strong> <a href="mailto:${contactEmail}">${contactEmail}</a></p>
          </div>

          ${message ? `
          <div style="background: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Message</h3>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          ` : ''}

          <div style="margin-top: 30px;">
            <a href="${appUrl}/admin" style="background: #0057B8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View in Admin Dashboard
            </a>
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This notification was sent from Hromada — Municipal Partnership Program.
          </p>
        </div>
      `,
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
