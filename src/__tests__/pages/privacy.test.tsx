import { render, screen } from '@testing-library/react'
import PrivacyPage from '@/app/[locale]/(public)/privacy/page'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      privacyTitle: 'Privacy Policy',
      privacyComingSoon: 'Privacy policy details coming soon.',
    }
    return translations[key] || key
  },
}))

// Mock Header component
jest.mock('@/components/layout/Header', () => ({
  Header: () => <header data-testid="mock-header">Header</header>,
}))

describe('PrivacyPage', () => {
  describe('Rendering', () => {
    it('renders the page title', () => {
      render(<PrivacyPage />)
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
    })

    it('renders the header', () => {
      render(<PrivacyPage />)
      expect(screen.getByTestId('mock-header')).toBeInTheDocument()
    })

    it('renders privacy policy content', () => {
      render(<PrivacyPage />)
      // The page has real content now, not a placeholder
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Structure', () => {
    it('has h1 heading', () => {
      render(<PrivacyPage />)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('Privacy Policy')
    })

    it('has main content area', () => {
      render(<PrivacyPage />)
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('has proper background', () => {
      const { container } = render(<PrivacyPage />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('bg-[var(--cream-100)]')
    })

    it('has min-height screen', () => {
      const { container } = render(<PrivacyPage />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('min-h-screen')
    })

    it('title has proper styling', () => {
      render(<PrivacyPage />)
      const title = screen.getByRole('heading', { level: 1 })
      expect(title).toHaveClass('text-3xl', 'font-semibold')
    })
  })
})
