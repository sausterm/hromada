import { render, screen } from '@testing-library/react'
import TermsPage from '@/app/[locale]/(public)/terms/page'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      termsTitle: 'Terms of Service',
      termsComingSoon: 'Terms of service details coming soon.',
    }
    return translations[key] || key
  },
}))

// Mock Header component
jest.mock('@/components/layout/Header', () => ({
  Header: () => <header data-testid="mock-header">Header</header>,
}))

describe('TermsPage', () => {
  describe('Rendering', () => {
    it('renders the page title', () => {
      render(<TermsPage />)
      expect(screen.getByText('Terms of Service')).toBeInTheDocument()
    })

    it('renders the header', () => {
      render(<TermsPage />)
      expect(screen.getByTestId('mock-header')).toBeInTheDocument()
    })

    it('renders coming soon message', () => {
      render(<TermsPage />)
      expect(screen.getByText('Terms of service details coming soon.')).toBeInTheDocument()
    })
  })

  describe('Structure', () => {
    it('has h1 heading', () => {
      render(<TermsPage />)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('Terms of Service')
    })

    it('has main content area', () => {
      render(<TermsPage />)
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('has proper background', () => {
      const { container } = render(<TermsPage />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('bg-[var(--cream-100)]')
    })

    it('has min-height screen', () => {
      const { container } = render(<TermsPage />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('min-h-screen')
    })

    it('content has max width', () => {
      render(<TermsPage />)
      const main = screen.getByRole('main')
      expect(main).toHaveClass('max-w-3xl')
    })
  })
})
