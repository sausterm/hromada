import { render, screen } from '@testing-library/react'
import ContactPage from '@/app/[locale]/(public)/contact/page'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      title: 'Contact Us',
      description: 'Get in touch with our team.',
      generalInquiriesText: 'For questions or partnership opportunities, reach out at',
    }
    return translations[key] || key
  },
}))

// Mock Header component
jest.mock('@/components/layout/Header', () => ({
  Header: () => <header data-testid="mock-header">Header</header>,
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
      expect(wrapper).toHaveClass('bg-[var(--cream-50)]')
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
