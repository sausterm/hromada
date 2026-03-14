import { render, screen } from '@testing-library/react'
import AboutPage from '@/app/[locale]/(public)/about/page'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'about.title': 'About Hromada',
      'about.mission': 'Connecting donors with Ukrainian communities.',
      'about.statementOfPurpose': 'What Hromada Is',
      'about.statementOfPurposeText': 'We bridge the gap between American donors and Ukrainian municipalities.',
      'about.browseProjects': 'Browse Projects',
      'about.ourPartners': 'Our Partners',
      'about.ourPartnersText': 'We work with trusted NGOs.',
      'about.teamTitle': 'Our Team',
      'about.teamTomName': 'Tom Protzman',
      'about.teamTomRole': 'Co-Founder',
      'about.teamTomBio': 'Bio text.',
      'about.teamKostiaName': 'Kostia K',
      'about.teamKostiaRole': 'Founding Partner',
      'about.teamKostiaBio': 'Bio text.',
      'about.teamSloanName': 'Sloan A',
      'about.teamSloanRole': 'Engineer',
      'about.teamSloanBio': 'Bio text.',
      'about.partnerEcoactionDesc': 'Environmental NGO.',
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
      expect(screen.getByText('What Hromada Is')).toBeInTheDocument()
      expect(screen.getByText(/bridge the gap/)).toBeInTheDocument()
    })

    it('renders Our Partners section', () => {
      render(<AboutPage />)
      expect(screen.getByText('Our Partners')).toBeInTheDocument()
      expect(screen.getByText('We work with trusted NGOs.')).toBeInTheDocument()
    })

    it('renders only Ecoaction partner logo (directory mode)', () => {
      render(<AboutPage />)
      expect(screen.getByAltText('Ecoaction')).toBeInTheDocument()
      // Ecoclub and Greenpeace hidden for directory mode
      expect(screen.queryByAltText('Ecoclub')).not.toBeInTheDocument()
      expect(screen.queryByAltText('Greenpeace')).not.toBeInTheDocument()
    })

    it('renders team section', () => {
      render(<AboutPage />)
      expect(screen.getByText('Our Team')).toBeInTheDocument()
      expect(screen.getByText('Tom Protzman')).toBeInTheDocument()
    })

    it('does not render fiscal sponsor section (directory mode)', () => {
      render(<AboutPage />)
      expect(screen.queryByText('Fiscal Sponsor')).not.toBeInTheDocument()
      expect(screen.queryByAltText('POCACITO Network')).not.toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('renders Browse Projects link', () => {
      render(<AboutPage />)
      expect(screen.getByTestId('link-/projects')).toBeInTheDocument()
      expect(screen.getByText('Browse Projects')).toBeInTheDocument()
    })

    it('does not render Submit Project link (directory mode)', () => {
      render(<AboutPage />)
      expect(screen.queryByTestId('link-/submit-project')).not.toBeInTheDocument()
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
