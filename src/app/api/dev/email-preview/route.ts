import { NextResponse } from 'next/server'
import { buildCalendlyWelcomeEmailHtml } from '@/lib/email'
import {
  emailLayout,
  emailHeading,
  emailSubheading,
  emailButton,
  emailCode,
  emailDivider,
  emailMuted,
  emailField,
  emailHighlightBox,
  emailAccentBox,
  emailProjectCard,
  emailProcessFlow,
} from '@/lib/email-template'

// DEV ONLY — preview email templates in the browser
// Visit: http://localhost:3000/api/dev/email-preview?template=calendly-welcome
// List all: http://localhost:3000/api/dev/email-preview?template=list

const TEMPLATES = [
  'calendly-welcome',
  'newsletter-welcome',
  'donation-confirmation',
  'donor-welcome',
  'donation-forwarded',
  'password-reset',
  'project-submission-confirmation',
  'project-approval',
  'project-rejection',
  'contact-notification',
  'admin-donation-notification',
  'partnership-inquiry',
] as const

export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const template = searchParams.get('template') || 'list'

  if (template === 'list') {
    const appUrl = 'http://localhost:3000'
    const links = TEMPLATES.map(
      (t) => `<li><a href="${appUrl}/api/dev/email-preview?template=${t}">${t}</a></li>`
    ).join('\n')
    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:40px;max-width:600px;margin:0 auto;">
        <h1>Email Template Previews</h1>
        <ul style="line-height:2;">${links}</ul>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    )
  }

  let html: string

  switch (template) {
    case 'calendly-welcome': {
      const result = buildCalendlyWelcomeEmailHtml(
        'donor@example.com',
        'Thomas Protzman',
        'fake-token-123',
        'Nizhyn Maternity Hospital',
      )
      html = result.html
      break
    }

    case 'newsletter-welcome': {
      const appUrl = 'http://localhost:3000'
      html = emailLayout(`
        ${emailHeading('Welcome to Hromada')}

        <p>Thanks for signing up. We\u2019ll send occasional updates on projects being funded, communities being powered, and how your support makes a difference.</p>

        <p>Hromada connects donors directly with Ukrainian municipalities rebuilding civilian infrastructure \u2014 schools, hospitals, water systems, energy. Every project is verified by our NGO partners. No overhead fees.</p>

        ${emailButton('Browse Projects', `${appUrl}/projects`)}

        ${emailMuted("You're receiving this because you signed up at hromadaproject.org.")}
      `, { preheader: 'Thanks for joining. Browse projects that need support.' })
      break
    }

    case 'donation-confirmation': {
      html = emailLayout(`
        ${emailHeading('We received your donation details')}

        <p>Hi Thomas,</p>

        <p>Thank you for your wire transfer contribution of <strong>$5,000</strong> toward <strong>Nizhyn Maternity Hospital</strong>. We\u2019re verifying receipt with our bank now.</p>

        ${emailSubheading('What happens next')}
        <p>We\u2019ll confirm your payment within 1\u20133 business days. Once your funds are forwarded to Ukraine, you\u2019ll receive your tax receipt and login credentials for your donor dashboard.</p>

        ${emailMuted('If you have any questions in the meantime, just reply to this email.')}

        <p style="margin-top:20px;color:#1a2744;font-weight:600;">Tom &amp; Sloan<br>
        <span style="font-weight:400;color:#666;">Hromada</span></p>
      `, { preheader: "We're verifying your wire transfer now." })
      break
    }

    case 'donor-welcome': {
      const appUrl = 'http://localhost:3000'
      html = emailLayout(`
        ${emailHeading("You're powering Nizhyn Maternity Hospital")}

        <p>Thomas, your <strong>$5,000</strong> contribution is going to make a real difference. This project was requested by the community and verified by our NGO partner on the ground in Ukraine.</p>

        ${emailProjectCard({
          projectName: 'Nizhyn Maternity Hospital',
          municipality: 'Nizhyn, Chernihiv Oblast',
          partnerName: 'NGO Ecoaction',
        })}

        ${emailProcessFlow('Your Project\u2019s Journey', [
          { number: 1, title: 'Payment Confirmed', description: 'We confirm receipt of your wire transfer (1\u20133 business days).' },
          { number: 2, title: 'Funds Sent to Ukraine', description: 'Your donation is wired directly to the municipality\u2019s bank account.' },
          { number: 3, title: 'Construction Begins', description: 'The municipality procures materials and work begins on your project.' },
          { number: 4, title: 'Progress Updates', description: 'You\u2019ll receive photos as construction moves forward.' },
          { number: 5, title: 'Project Complete', description: 'Final photos and documentation delivered to your donor dashboard.' },
        ])}

        ${emailDivider()}

        <p>We\u2019ve created a donor account so you can follow along. Here are your login credentials:</p>

        ${emailHighlightBox(`
          ${emailField('Email', 'donor@example.com')}
          ${emailField('Temporary Password', '<code style="background:#F5F1E8;padding:3px 8px;border-radius:4px;font-family:\'Geist Mono\',monospace;font-size:13px;">Xk9mP2vQ</code>')}
          ${emailMuted('We recommend changing your password after your first login.')}
        `)}

        ${emailButton('View Your Donor Dashboard', `${appUrl}/login`)}

        <p style="margin-top:24px;">Your donation is tax-deductible through POCACITO Network, a registered 501(c)(3) nonprofit (EIN&nbsp;99-0392258). A tax receipt will be sent once your payment is confirmed.</p>

        <p>Thank you for standing with this community. If you have any questions, just reply to this email.</p>

        <p style="color:#1a2744;font-weight:600;">Tom &amp; Sloan<br>
        <span style="font-weight:400;color:#666;">Hromada</span></p>
      `, { preheader: 'Your contribution is on its way to Ukraine.' })
      break
    }

    case 'donation-forwarded': {
      const appUrl = 'http://localhost:3000'
      html = emailLayout(`
        ${emailHeading('Your donation is on its way to Ukraine')}

        <p>Thomas, your <strong>$5,000</strong> contribution has been forwarded to the community. This project was requested by the municipality and verified by our NGO partner on the ground.</p>

        ${emailProjectCard({
          projectName: 'Nizhyn Maternity Hospital',
          municipality: 'Nizhyn, Chernihiv Oblast',
          partnerName: 'NGO Ecoaction',
        })}

        ${emailProcessFlow('Your Project\u2019s Journey', [
          { number: 1, title: 'Payment Confirmed', description: 'Your wire transfer was confirmed.' },
          { number: 2, title: 'Funds Sent to Ukraine', description: 'Your donation has been wired to the municipality\u2019s bank account.' },
          { number: 3, title: 'Construction Begins', description: 'The municipality procures materials and work begins on your project.' },
          { number: 4, title: 'Progress Updates', description: 'You\u2019ll receive photos as construction moves forward.' },
          { number: 5, title: 'Project Complete', description: 'Final photos and documentation delivered to your donor dashboard.' },
        ])}

        ${emailDivider()}

        <p><strong style="color:#1a2744;">Your Tax Receipt</strong></p>
        <p>Your tax receipt (HR-2026-0001) is attached to this email and available for download below.</p>
        ${emailButton('Download Tax Receipt', `${appUrl}/receipts/sample`)}
        <p style="font-size:13px;color:#666;">Your donation is tax-deductible through POCACITO Network, a registered 501(c)(3) nonprofit (EIN&nbsp;99-0392258). Reference: HRM-20260225-ABCD</p>

        <p style="margin-top:24px;">Thank you for standing with this community. If you have any questions, just reply to this email.</p>

        <p style="color:#1a2744;font-weight:600;">Tom &amp; Sloan<br>
        <span style="font-weight:400;color:#666;">Hromada</span></p>
      `, { preheader: 'Your tax receipt is attached.' })
      break
    }

    case 'password-reset': {
      html = emailLayout(`
        ${emailHeading('Password Reset')}
        <p>Hi Thomas,</p>
        <p>You requested a password reset for your Hromada donor account. Enter this code to set a new password:</p>
        ${emailCode('482917')}
        ${emailMuted('This code expires in <strong>15 minutes</strong>.')}
        ${emailDivider()}
        <p style="color:#666;">If you didn\u2019t request this, you can safely ignore this email. Your password will not be changed.</p>
      `, { preheader: 'Your reset code is 482917' })
      break
    }

    case 'project-submission-confirmation': {
      html = emailLayout(`
        ${emailHeading('Thank You for Your Submission')}

        <p>Dear Olena Shevchenko,</p>

        <p>We have received your project submission for <strong>Nizhyn Maternity Hospital Solar Installation</strong>.</p>

        ${emailSubheading('What happens next')}
        <p>Our team will review your submission within 3\u20135 business days. We may contact you if we need additional information. Once approved, your project will be visible to donors on our platform.</p>

        <p>If you have any questions, just reply to this email.</p>

        <p>Thank you for working to rebuild Ukraine\u2019s communities.</p>

        <p style="color:#1a2744;font-weight:600;">Tom &amp; Sloan<br>
        <span style="font-weight:400;color:#666;">Hromada</span></p>
      `, { preheader: 'We received your submission for Nizhyn Maternity Hospital Solar Installation.' })
      break
    }

    case 'project-approval': {
      const appUrl = 'http://localhost:3000'
      html = emailLayout(`
        ${emailHeading('Your Project is Now Live')}

        <p>Dear Olena Shevchenko,</p>

        <p>Your project <strong>Nizhyn Maternity Hospital Solar Installation</strong> has been approved and is now live on the Hromada platform. Donors can see your project and express interest in supporting it.</p>

        ${emailButton('View Your Project', `${appUrl}/projects/sample-id`)}

        <p>We encourage you to share this link with your network to increase visibility.</p>

        <p>Thank you for working to rebuild Ukraine\u2019s communities.</p>

        <p style="color:#1a2744;font-weight:600;">Tom &amp; Sloan<br>
        <span style="font-weight:400;color:#666;">Hromada</span></p>
      `, { preheader: 'Nizhyn Maternity Hospital Solar Installation is now on the Hromada platform.' })
      break
    }

    case 'project-rejection': {
      html = emailLayout(`
        ${emailHeading('Project Submission Update')}

        <p>Dear Olena Shevchenko,</p>

        <p>Thank you for submitting your project <strong>Nizhyn Maternity Hospital Solar Installation</strong> to Hromada.</p>

        <p>After review, we were unable to approve your submission at this time:</p>

        ${emailAccentBox('<p style="margin:0;">The submitted cost estimate requires additional documentation. Please provide an engineer\'s assessment or a quote from a certified installer for the solar panel system.</p>', '#999999')}

        <p>You are welcome to address these concerns and submit a new application. If you have questions, just reply to this email.</p>

        <p style="color:#1a2744;font-weight:600;">Tom &amp; Sloan<br>
        <span style="font-weight:400;color:#666;">Hromada</span></p>
      `, { preheader: 'Update on your submission for Nizhyn Maternity Hospital Solar Installation.' })
      break
    }

    case 'contact-notification': {
      const appUrl = 'http://localhost:3000'
      html = emailLayout(`
        ${emailHeading('New Donor Contact')}
        <p>A donor has submitted an inquiry about a project on the platform.</p>

        ${emailSubheading('Project')}
        ${emailField('Project', 'Nizhyn Maternity Hospital')}
        ${emailField('Municipality', 'Nizhyn')}
        ${emailField('Municipality Contact', '<a href="mailto:nizhyn@gov.ua" style="color:#0057B8;">nizhyn@gov.ua</a>')}

        ${emailSubheading('Donor')}
        ${emailField('Name', 'Thomas Protzman')}
        ${emailField('Email', '<a href="mailto:donor@example.com" style="color:#0057B8;">donor@example.com</a>')}

        ${emailSubheading('Message')}
        <p style="white-space:pre-wrap;margin:8px 0 0;">I would like to learn more about this project and discuss potential funding options.</p>

        ${emailButton('View in Admin Dashboard', `${appUrl}/admin`)}

        ${emailMuted('<a href="' + appUrl + '/projects/sample-id" style="color:#999;">View project on site</a>')}
      `)
      break
    }

    case 'admin-donation-notification': {
      const appUrl = 'http://localhost:3000'
      html = emailLayout(`
        ${emailHeading('New Donation Received')}

        ${emailAccentBox(`
          <p style="margin:0;font-size:28px;font-weight:700;color:#1a7a3a;">$5,000</p>
          <p style="margin:4px 0 0;font-size:14px;color:#666;">via Wire Transfer</p>
        `)}

        ${emailSubheading('Donor')}
        <p style="margin:6px 0;">
          <strong style="color:#1a2744;">Name:</strong> Thomas Protzman
          &nbsp;&nbsp;<span style="background:#0057B8;color:#ffffff;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600;letter-spacing:0.5px;">NEW DONOR</span>
        </p>
        ${emailField('Email', '<a href="mailto:donor@example.com" style="color:#0057B8;">donor@example.com</a>')}
        ${emailField('Organization', 'Example Foundation')}
        ${emailField('Reference #', '<code style="background:#F5F1E8;padding:2px 6px;border-radius:3px;font-size:13px;">HRM-20260225-ABCD</code>')}

        ${emailSubheading('Project')}
        <p style="margin:6px 0;font-size:16px;font-weight:600;color:#1a2744;">Nizhyn Maternity Hospital</p>

        ${emailButton('View in Dashboard', `${appUrl}/nonprofit`)}

        ${emailMuted('Check your bank account to confirm receipt, then mark as &ldquo;Received&rdquo; in the Nonprofit Manager dashboard.')}
      `)
      break
    }

    case 'partnership-inquiry': {
      const appUrl = 'http://localhost:3000'
      html = emailLayout(`
        ${emailHeading('New Partnership Inquiry')}
        <p>A community has submitted an inquiry through the Municipal Partnership Program page.</p>

        ${emailSubheading('Community')}
        ${emailField('Name', 'Charlottesville Rotary Club')}
        ${emailField('Type', 'Rotary Club or Service Organization')}
        ${emailField('Approximate Size', '150 members')}

        ${emailSubheading('Contact')}
        ${emailField('Name', 'Sarah Johnson')}
        ${emailField('Email', '<a href="mailto:sarah@rotary.org" style="color:#0057B8;">sarah@rotary.org</a>')}

        ${emailSubheading('Message')}
        <p style="white-space:pre-wrap;margin:8px 0 0;">We are interested in establishing a sister-city partnership with a Ukrainian municipality. Our club has experience with international service projects.</p>

        ${emailButton('View in Admin Dashboard', `${appUrl}/admin`)}

        ${emailMuted('Municipal Partnership Program inquiry via Hromada.')}
      `)
      break
    }

    default:
      return NextResponse.json(
        { error: 'Unknown template', available: TEMPLATES },
        { status: 400 },
      )
  }

  // Replace production URL with localhost for dev preview
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  if (appUrl && appUrl !== 'http://localhost:3000') {
    html = html.replaceAll(appUrl, 'http://localhost:3000')
  }

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
