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
