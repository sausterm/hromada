import { render, screen } from '@testing-library/react'
import ContactPage from '@/app/[locale]/(public)/contact/page'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      title: 'Contact Us',
      description: 'Get in touch with our team.',
      responseTime: 'We typically respond within 48 hours.',
      generalInquiries: 'General Inquiries',
      generalInquiriesText: 'For questions or partnership opportunities, reach out at',
      forMunicipalities: 'For Municipalities',
      forMunicipalitiesText: 'Submit your project for review.',
      forMunicipalitiesAction: 'Submit a Project',
      forDonors: 'For Donors',
      forDonorsText: 'Browse projects seeking support.',
      forDonorsAction: 'Browse Projects',
      forPartners: 'For NGO Partners',
      forPartnersText: 'Partner with us.',
      forPartnersAction: 'Get in Touch',
      forMedia: 'Media & Press',
      forMediaText: 'For press inquiries.',
      forMediaAction: 'Contact Press',
    }
    return translations[key] || key
  },
}))

// Mock Header component
jest.mock('@/components/layout/Header', () => ({
  Header: () => <header data-testid="mock-header">Header</header>,
}))

// Mock i18n navigation
jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href} data-testid={`link-${href}`}>{children}</a>
  ),
}))

describe('ContactPage', () => {
  describe('Rendering', () => {
    it('renders the page title', () => {
      render(<ContactPage />)
      expect(screen.getByText('Contact Us')).toBeInTheDocument()
    })

    it('renders the header', () => {
      render(<ContactPage />)
      expect(screen.getByTestId('mock-header')).toBeInTheDocument()
    })

    it('renders the description', () => {
      render(<ContactPage />)
      expect(screen.getByText('Get in touch with our team.')).toBeInTheDocument()
    })

    it('renders the email link', () => {
      render(<ContactPage />)
      const emailLink = screen.getByRole('link', { name: /thomas@hromadaproject.org/ })
      expect(emailLink).toBeInTheDocument()
      expect(emailLink).toHaveAttribute('href', 'mailto:thomas@hromadaproject.org')
    })
  })

  describe('Styling', () => {
    it('has proper background', () => {
      const { container } = render(<ContactPage />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('bg-[var(--cream-100)]')
    })

    it('has min-height screen', () => {
      const { container } = render(<ContactPage />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('min-h-screen')
    })

    it('uses flex layout', () => {
      const { container } = render(<ContactPage />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('flex', 'flex-col')
    })
  })
})
