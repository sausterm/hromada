import { render, screen } from '@testing-library/react'
import ContactPage from '@/app/[locale]/(public)/contact/page'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      title: 'Contact Us',
      description: 'Get in touch with our team.',
      forMunicipalities: 'For Municipalities',
      forMunicipalitiesText: 'Submit your project through our platform.',
      forDonors: 'For Donors',
      forDonorsText: 'Express interest directly through project pages.',
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
  })

  describe('Information Sections', () => {
    it('renders for municipalities section', () => {
      render(<ContactPage />)
      expect(screen.getByText('For Municipalities')).toBeInTheDocument()
      expect(screen.getByText(/Submit your project/)).toBeInTheDocument()
    })

    it('renders for donors section', () => {
      render(<ContactPage />)
      expect(screen.getByText('For Donors')).toBeInTheDocument()
      expect(screen.getByText(/Express interest/)).toBeInTheDocument()
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
