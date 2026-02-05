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
      'about.projectCategories': 'Project Categories',
      'about.categoryIntro': 'We fund solar PVs, battery storage, heat pumps, and thermo-modernization for:',
      'about.categoryHospital': 'Medical facilities',
      'about.categorySchool': 'Educational institutions',
      'about.categoryWater': 'Water utilities',
      'about.categoryEnergy': 'Energy infrastructure',
      'about.categoryOther': 'Other public infrastructure',
      'about.browseProjects': 'Browse Projects',
      'categories.HOSPITAL': 'Hospital',
      'categories.SCHOOL': 'School',
      'categories.WATER': 'Water',
      'categories.ENERGY': 'Energy',
      'categories.OTHER': 'Other',
      'nav.submitProject': 'Submit a Project',
      'transparency.visitTrustCenter': 'Visit Trust Center',
      'transparency.civilianOnlyTitle': 'Civilian Infrastructure Only',
      'transparency.civilianOnlyText': 'We exclusively fund civilian infrastructure projects.',
      'transparency.partnersTitle': 'Our Partners',
      'transparency.partnersText': 'We work with trusted NGOs.',
      'transparency.processTitle': 'How It Works',
      'transparency.processStep1Title': 'Submit',
      'transparency.processStep1Text': 'Municipality submits project',
      'transparency.processStep2Title': 'Verify',
      'transparency.processStep2Text': 'We verify details',
      'transparency.processStep3Title': 'Publish',
      'transparency.processStep3Text': 'Project goes live',
      'transparency.processStep4Title': 'Connect',
      'transparency.processStep4Text': 'Donors find projects',
      'transparency.processStep5Title': 'Fund',
      'transparency.processStep5Text': 'Direct funding',
      'transparency.faqTitle': 'Frequently Asked Questions',
      'transparency.faq1Question': 'How are projects verified?',
      'transparency.faq1Answer': 'We verify all projects.',
      'transparency.faq2Question': 'How do funds reach communities?',
      'transparency.faq2Answer': 'Direct transfer.',
      'transparency.faq3Question': 'Can I visit a project site?',
      'transparency.faq3Answer': 'Yes, with coordination.',
      'transparency.faq4Question': 'What types of projects?',
      'transparency.faq4Answer': 'Civilian infrastructure only.',
      'transparency.faq5Question': 'How long does funding take?',
      'transparency.faq5Answer': 'Varies by project.',
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

    it('renders Civilian Infrastructure Only section', () => {
      render(<AboutPage />)
      expect(screen.getByText('Civilian Infrastructure Only')).toBeInTheDocument()
      expect(screen.getByText(/exclusively fund civilian/)).toBeInTheDocument()
    })

    it('renders How It Works section', () => {
      render(<AboutPage />)
      expect(screen.getByText('How It Works')).toBeInTheDocument()
    })

    it('renders Our Partners section', () => {
      render(<AboutPage />)
      expect(screen.getByText('Our Partners')).toBeInTheDocument()
    })

    it('renders Project Categories section', () => {
      render(<AboutPage />)
      expect(screen.getByText('Project Categories')).toBeInTheDocument()
    })

    it('lists all category types', () => {
      render(<AboutPage />)
      expect(screen.getByText('Hospital')).toBeInTheDocument()
      expect(screen.getByText('School')).toBeInTheDocument()
      expect(screen.getByText('Water')).toBeInTheDocument()
      expect(screen.getByText('Energy')).toBeInTheDocument()
      expect(screen.getByText('Other')).toBeInTheDocument()
    })

    it('renders FAQ section', () => {
      render(<AboutPage />)
      expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument()
    })
  })

  describe('Trust Center', () => {
    it('renders Trust Center link', () => {
      render(<AboutPage />)
      expect(screen.getByText('Visit Trust Center')).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('renders Browse Projects link', () => {
      render(<AboutPage />)
      expect(screen.getByTestId('link-/')).toBeInTheDocument()
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
      expect(wrapper).toHaveClass('bg-[var(--cream-50)]')
    })

    it('has min-height screen', () => {
      const { container } = render(<AboutPage />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('min-h-screen')
    })
  })
})
