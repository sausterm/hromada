import { render, screen } from '@testing-library/react'
import AboutPage from '@/app/[locale]/(public)/about/page'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'about.title': 'About Hromada',
      'about.mission': 'Connecting donors with Ukrainian communities.',
      'about.statementOfPurpose': 'Statement of Purpose',
      'about.statementOfPurposeText': 'We bridge the gap between American donors and Ukrainian municipalities.',
      'about.browseProjects': 'Browse Projects',
      'nav.submitProject': 'Submit a Project',
      'transparency.visitTrustCenter': 'Visit Trust Center',
      'transparency.partnersTitle': 'Our Partners',
      'transparency.partnersText': 'We work with trusted NGOs.',
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

// Mock Button
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, variant, className }: { children: React.ReactNode; variant?: string; className?: string }) => (
    <button data-variant={variant} className={className}>{children}</button>
  ),
}))

describe('AboutPage', () => {
  describe('Rendering', () => {
    it('renders the page title', () => {
      render(<AboutPage />)
      expect(screen.getByText('About Hromada')).toBeInTheDocument()
    })

    it('renders the header', () => {
      render(<AboutPage />)
      expect(screen.getByTestId('mock-header')).toBeInTheDocument()
    })

    it('renders the mission statement', () => {
      render(<AboutPage />)
      expect(screen.getByText('Connecting donors with Ukrainian communities.')).toBeInTheDocument()
    })
  })

  describe('Sections', () => {
    it('renders Statement of Purpose section', () => {
      render(<AboutPage />)
      expect(screen.getByText('Statement of Purpose')).toBeInTheDocument()
      expect(screen.getByText(/bridge the gap/)).toBeInTheDocument()
    })

    it('renders Our Partners section', () => {
      render(<AboutPage />)
      expect(screen.getByText('about.ourPartners')).toBeInTheDocument()
      expect(screen.getByText('about.ourPartnersText')).toBeInTheDocument()
    })

    it('renders partner logos', () => {
      render(<AboutPage />)
      expect(screen.getByAltText('Ecoaction')).toBeInTheDocument()
      expect(screen.getByAltText('Ecoclub')).toBeInTheDocument()
      expect(screen.getByAltText('RePower Ukraine')).toBeInTheDocument()
      expect(screen.getByAltText('Greenpeace')).toBeInTheDocument()
      expect(screen.getByAltText('Energy Act For Ukraine')).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('renders Browse Projects link', () => {
      render(<AboutPage />)
      expect(screen.getByTestId('link-/projects')).toBeInTheDocument()
      expect(screen.getByText('Browse Projects')).toBeInTheDocument()
    })

    it('renders Submit Project link', () => {
      render(<AboutPage />)
      expect(screen.getByTestId('link-/submit-project')).toBeInTheDocument()
      expect(screen.getByText('Submit a Project')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('has proper background', () => {
      const { container } = render(<AboutPage />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('bg-[var(--cream-100)]')
    })

    it('has min-height screen', () => {
      const { container } = render(<AboutPage />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('min-h-screen')
    })
  })
})
