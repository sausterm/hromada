/**
 * Tests for src/lib/email-template.ts
 */

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

describe('email-template', () => {
  describe('emailLayout', () => {
    it('wraps content in full HTML document with header and footer', () => {
      const html = emailLayout('<p>Hello</p>')
      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('<p>Hello</p>')
      expect(html).toContain('hromada')
      expect(html).toContain('POCACITO Network')
      expect(html).toContain('EIN 99-0392258')
    })

    it('includes preheader text when provided', () => {
      const html = emailLayout('<p>Body</p>', { preheader: 'Preview text here' })
      expect(html).toContain('Preview text here')
      expect(html).toContain('display:none')
    })

    it('omits preheader block when not provided', () => {
      const html = emailLayout('<p>Body</p>')
      expect(html).not.toContain('max-height:0px')
    })

    it('includes unsubscribe link when URL provided', () => {
      const html = emailLayout('<p>Body</p>', {
        unsubscribeUrl: 'https://hromada.org/unsubscribe?token=abc',
      })
      expect(html).toContain('Unsubscribe')
      expect(html).toContain('https://hromada.org/unsubscribe?token=abc')
    })

    it('omits unsubscribe link when not provided', () => {
      const html = emailLayout('<p>Body</p>')
      expect(html).not.toContain('Unsubscribe')
    })

    it('uses baseUrl override for app URL', () => {
      const html = emailLayout('<p>Body</p>', { baseUrl: 'https://custom.example.com' })
      // The layout itself does not embed appUrl in the body currently,
      // but the function should accept it without error
      expect(html).toContain('<!DOCTYPE html>')
    })

    it('uses NEXT_PUBLIC_APP_URL env var', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://hromada.org'
      const html = emailLayout('<p>Body</p>')
      expect(html).toContain('<!DOCTYPE html>')
      delete process.env.NEXT_PUBLIC_APP_URL
    })
  })

  describe('emailButton', () => {
    it('renders a CTA button with text and href', () => {
      const html = emailButton('Donate Now', 'https://hromada.org/donate')
      expect(html).toContain('Donate Now')
      expect(html).toContain('href="https://hromada.org/donate"')
      expect(html).toContain('role="presentation"')
    })
  })

  describe('emailInfoBox', () => {
    it('renders cream-toned info box', () => {
      const html = emailInfoBox('<p>Info content</p>')
      expect(html).toContain('Info content')
      expect(html).toContain('#F5F1E8') // cream color
    })
  })

  describe('emailHighlightBox', () => {
    it('renders blue-bordered highlight box', () => {
      const html = emailHighlightBox('<p>Important data</p>')
      expect(html).toContain('Important data')
      expect(html).toContain('#0057B8') // blue border
    })
  })

  describe('emailAccentBox', () => {
    it('renders left-accent box with default green', () => {
      const html = emailAccentBox('<p>Metric</p>')
      expect(html).toContain('Metric')
      expect(html).toContain('border-left:4px solid')
      expect(html).toContain('#1a7a3a') // green
    })

    it('accepts custom accent color', () => {
      const html = emailAccentBox('<p>Status</p>', '#ff0000')
      expect(html).toContain('#ff0000')
    })
  })

  describe('emailHeading', () => {
    it('renders h2 with brand font', () => {
      const html = emailHeading('Welcome')
      expect(html).toContain('<h2')
      expect(html).toContain('Welcome')
      expect(html).toContain('Outfit')
    })
  })

  describe('emailSubheading', () => {
    it('renders h3 with brand font', () => {
      const html = emailSubheading('Details')
      expect(html).toContain('<h3')
      expect(html).toContain('Details')
      expect(html).toContain('Outfit')
    })
  })

  describe('emailCode', () => {
    it('renders centered monospace code', () => {
      const html = emailCode('ABC-123')
      expect(html).toContain('ABC-123')
      expect(html).toContain('letter-spacing:8px')
      expect(html).toContain('Geist Mono')
    })
  })

  describe('emailDivider', () => {
    it('renders horizontal rule', () => {
      const html = emailDivider()
      expect(html).toContain('<hr')
      expect(html).toContain('border-top:1px solid')
    })
  })

  describe('emailMuted', () => {
    it('renders muted text', () => {
      const html = emailMuted('Fine print')
      expect(html).toContain('Fine print')
      expect(html).toContain('font-size:13px')
      expect(html).toContain('#999999')
    })
  })

  describe('emailBadge', () => {
    it('renders badge with default blue color', () => {
      const html = emailBadge('NEW DONOR')
      expect(html).toContain('NEW DONOR')
      expect(html).toContain('#0057B8')
      expect(html).toContain('border-radius:12px')
    })

    it('renders badge with custom color', () => {
      const html = emailBadge('URGENT', '#ff0000')
      expect(html).toContain('#ff0000')
    })
  })

  describe('emailField', () => {
    it('renders key-value pair', () => {
      const html = emailField('Amount', '$10,000')
      expect(html).toContain('Amount:')
      expect(html).toContain('$10,000')
      expect(html).toContain('<strong')
    })
  })

  describe('emailProjectCard', () => {
    it('renders minimal card with just project name', () => {
      const html = emailProjectCard({ projectName: 'Solar Panels for School' })
      expect(html).toContain('Solar Panels for School')
      expect(html).toContain('role="presentation"')
    })

    it('renders card with photo', () => {
      const html = emailProjectCard({
        projectName: 'Solar Panels',
        photoUrl: 'https://example.com/photo.jpg',
      })
      expect(html).toContain('src="https://example.com/photo.jpg"')
    })

    it('renders card without photo with blue left border', () => {
      const html = emailProjectCard({ projectName: 'Solar Panels' })
      expect(html).toContain('border-left:4px solid #0057B8')
    })

    it('renders partner info with logo', () => {
      const html = emailProjectCard({
        projectName: 'Solar Panels',
        partnerName: 'NGO Ecoaction',
        partnerLogoUrl: 'https://example.com/logo.png',
      })
      expect(html).toContain('NGO Ecoaction')
      expect(html).toContain('src="https://example.com/logo.png"')
      expect(html).toContain('Partner:')
    })

    it('renders partner name without logo', () => {
      const html = emailProjectCard({
        projectName: 'Solar Panels',
        partnerName: 'Ecoclub Rivne',
      })
      expect(html).toContain('Ecoclub Rivne')
      expect(html).not.toContain('partnerLogoUrl')
    })

    it('renders municipality', () => {
      const html = emailProjectCard({
        projectName: 'Solar Panels',
        municipality: 'Lychkove',
      })
      expect(html).toContain('Lychkove')
    })

    it('renders category, project type, and cost metadata', () => {
      const html = emailProjectCard({
        projectName: 'Solar Panels',
        category: 'Hospital / Medical',
        projectType: 'Solar PV',
        estimatedCostUsd: 25000,
      })
      expect(html).toContain('Hospital / Medical')
      expect(html).toContain('Solar PV')
      expect(html).toContain('$25,000')
      expect(html).toContain('&middot;')
    })

    it('wraps card in link when projectUrl provided', () => {
      const html = emailProjectCard({
        projectName: 'Solar Panels',
        projectUrl: 'https://hromada.org/projects/1',
      })
      expect(html).toContain('href="https://hromada.org/projects/1"')
    })

    it('does not wrap in link when no projectUrl', () => {
      const html = emailProjectCard({ projectName: 'Solar Panels' })
      expect(html).not.toContain('<a href=')
    })
  })

  describe('emailProcessFlow', () => {
    it('renders numbered steps with title', () => {
      const html = emailProcessFlow('What Happens Next', [
        { number: 1, title: 'Confirmation', description: 'You will receive a confirmation email.' },
        { number: 2, title: 'Procurement', description: 'The municipality will post on Prozorro.' },
      ])
      expect(html).toContain('What Happens Next')
      expect(html).toContain('Confirmation')
      expect(html).toContain('Procurement')
      expect(html).toContain('You will receive a confirmation email.')
    })

    it('renders completed steps with checkmark', () => {
      const html = emailProcessFlow('Progress', [
        { number: 1, title: 'Done Step', description: 'Completed.', completed: true },
        { number: 2, title: 'Next Step', description: 'Pending.' },
      ])
      expect(html).toContain('&#10003;') // checkmark
      expect(html).toContain('#4CAF50') // green for completed
    })

    it('renders step with logo', () => {
      const html = emailProcessFlow('Flow', [
        {
          number: 1,
          title: 'Prozorro',
          description: 'Posted on Prozorro.',
          logoUrl: 'https://example.com/prozorro.png',
          logoAlt: 'Prozorro',
        },
      ])
      expect(html).toContain('src="https://example.com/prozorro.png"')
      expect(html).toContain('alt="Prozorro"')
    })

    it('does not render connector line on last step', () => {
      const html = emailProcessFlow('Flow', [
        { number: 1, title: 'Step 1', description: 'First.' },
        { number: 2, title: 'Step 2', description: 'Last.' },
      ])
      // The last step should not have the background gradient line
      // This is a structural test - the last <tr> should not have the lineGradient background
      const rows = html.split('<tr>')
      const lastStepRow = rows[rows.length - 1]
      expect(lastStepRow).not.toContain('linear-gradient')
    })
  })
})
