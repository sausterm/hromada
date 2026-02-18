import { render, screen, waitFor } from '@testing-library/react'
import HomePage from '@/app/[locale]/(public)/page'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, any>) => {
    const translations: Record<string, string> = {
      'homepage.hero.promiseBadge': '100% of your donation goes to the project',
      'homepage.hero.headline': 'Fund Renewable Energy for Ukrainian Communities',
      'homepage.hero.subheadline': 'Browse vetted infrastructure projects and fund them directly.',
      'homepage.hero.ctaBrowse': 'Browse Projects',
      'homepage.hero.ctaHowItWorks': 'How It Works',
      'homepage.hero.statCommunities': 'Communities',
      'homepage.hero.statProjects': 'Projects',
      'homepage.hero.statFunding': 'Funding Needed',
      'homepage.featured.title': 'Featured Projects',
      'homepage.featured.viewAll': 'View All',
      'homepage.howItWorks.title': 'How It Works',
      'homepage.howItWorks.step1Title': 'Browse Projects',
      'homepage.howItWorks.step1Desc': 'Explore verified projects.',
      'homepage.howItWorks.step2Title': 'Fund Directly',
      'homepage.howItWorks.step2Desc': 'Your donation goes directly.',
      'homepage.howItWorks.step3Title': 'Track Impact',
      'homepage.howItWorks.step3Desc': 'See the impact.',
      'homepage.howItWorks.promiseTitle': 'Promise',
      'homepage.howItWorks.promiseDesc': 'Promise description',
      'homepage.caseStudy.label': 'Case Study',
      'homepage.caseStudy.title': 'Novohrodivka School',
      'homepage.caseStudy.photoCaption1': 'Solar panels on school',
      'homepage.caseStudy.photoCaption2': 'Panels on rooftop',
      'homepage.caseStudy.photoCaption3': 'School interior',
      'homepage.caseStudy.badge': 'Completed',
      'homepage.caseStudy.partnerLabel': 'Partner',
      'homepage.caseStudy.partnerName': 'Ecoaction',
      'homepage.caseStudy.projectName': 'School Solar PV',
      'homepage.caseStudy.projectDesc': 'A case study project.',
      'homepage.caseStudy.timeline1Date': 'Jan 2024',
      'homepage.caseStudy.timeline1Title': 'Started',
      'homepage.caseStudy.timeline1Desc': 'Project launched.',
      'homepage.caseStudy.timeline2Date': 'Feb 2024',
      'homepage.caseStudy.timeline2Title': 'Funded',
      'homepage.caseStudy.timeline2Desc': 'Fully funded.',
      'homepage.caseStudy.timeline3Date': 'Mar 2024',
      'homepage.caseStudy.timeline3Title': 'Installation',
      'homepage.caseStudy.timeline3Desc': 'Panels installed.',
      'homepage.caseStudy.timeline4Date': 'Apr 2024',
      'homepage.caseStudy.timeline4Title': 'Connected',
      'homepage.caseStudy.timeline4Desc': 'Connected to grid.',
      'homepage.caseStudy.timeline5Date': 'May 2024',
      'homepage.caseStudy.timeline5Title': 'Complete',
      'homepage.caseStudy.timeline5Desc': 'Project complete.',
      'homepage.caseStudy.impactTitle': 'Impact',
      'homepage.caseStudy.impactPower': '50 kW',
      'homepage.caseStudy.impactPanels': '100 panels',
      'homepage.caseStudy.impactCost': '$75,000',
      'homepage.caseStudy.impactBeneficiaries': '500 students',
      'homepage.photoStrip.title': 'From the Field',
      'homepage.faq.title': 'Frequently Asked Questions',
      'homepage.faq.q1': 'FAQ Q1',
      'homepage.faq.a1': 'FAQ A1',
      'homepage.faq.q2': 'FAQ Q2',
      'homepage.faq.a2': 'FAQ A2',
      'homepage.faq.q3': 'FAQ Q3',
      'homepage.faq.a3': 'FAQ A3',
      'homepage.faq.q4': 'FAQ Q4',
      'homepage.faq.a4': 'FAQ A4',
      'homepage.faq.q5': 'FAQ Q5',
      'homepage.faq.a5': 'FAQ A5',
      'homepage.cta.title': 'Ready to Make a Difference?',
      'homepage.cta.subtitle': 'Browse projects and fund directly.',
      'homepage.cta.button': 'Browse Projects',
      'homepage.cta.emailDivider': 'Or stay updated',
      'about.projectCategories': 'Project Categories',
      'about.categoryIntro': 'We support the following categories.',
      'about.categoryHospital': 'Medical facilities',
      'about.categorySchool': 'Education buildings',
      'about.categoryWater': 'Water infrastructure',
      'about.categoryEnergy': 'Energy systems',
      'about.categoryOther': 'Other infrastructure',
      'transparency.civilianOnlyTitle': 'Civilian Only',
      'transparency.civilianOnlyText': 'Only civilian infrastructure.',
      'categories.HOSPITAL': 'Hospital / Medical',
      'categories.SCHOOL': 'School / Education',
      'categories.WATER': 'Water Utility',
      'categories.ENERGY': 'Energy Infrastructure',
      'categories.OTHER': 'Other Infrastructure',
    }
    return translations[key] || key
  },
  useLocale: () => 'en',
}))

// Mock Header component
jest.mock('@/components/layout/Header', () => ({
  Header: ({ children, transparent }: { children?: React.ReactNode; transparent?: boolean }) => (
    <header data-testid="mock-header" data-transparent={transparent}>
      Header
      {children}
    </header>
  ),
}))

// Mock ProjectCard component
jest.mock('@/components/projects/ProjectCard', () => ({
  ProjectCard: ({ project }: any) => (
    <div data-testid={`project-card-${project.id}`}>
      {project.facilityName}
    </div>
  ),
}))

// Mock Button component
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, className, variant, size }: any) => (
    <button onClick={onClick} className={className} data-variant={variant} data-size={size}>
      {children}
    </button>
  ),
}))

// Mock LoadingSpinner component
jest.mock('@/components/ui/LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: { size?: string }) => (
    <div data-testid="loading-spinner" data-size={size}>Loading...</div>
  ),
}))

// Mock homepage sub-components
jest.mock('@/components/homepage/FAQItem', () => ({
  FAQItem: ({ question, children }: { question: string; children: React.ReactNode }) => (
    <div data-testid="faq-item"><strong>{question}</strong><p>{children}</p></div>
  ),
}))

jest.mock('@/components/homepage/TimelineEvent', () => ({
  TimelineEvent: ({ title }: { title: string }) => (
    <div data-testid="timeline-event">{title}</div>
  ),
}))

jest.mock('@/components/homepage/DocumentaryPhoto', () => ({
  DocumentaryPhoto: ({ alt }: { alt: string; src: string; caption?: string; location?: string }) => (
    <div data-testid="documentary-photo">{alt}</div>
  ),
}))

jest.mock('@/components/homepage/EmailCaptureForm', () => ({
  EmailCaptureForm: () => (
    <div data-testid="email-capture">Email Capture</div>
  ),
}))

jest.mock('@/components/homepage/CountUp', () => ({
  CountUp: ({ end }: { end: number }) => <span>{end}</span>,
  CountUpCurrency: ({ end }: { end: number }) => <span>${Math.round(end/1000)}K</span>,
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, ...props }: any) => <img alt={alt} {...props} />,
}))

// Mock i18n/navigation
jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className} data-testid={`link-${href}`}>{children}</a>
  ),
}))

// Mock types module
jest.mock('@/types', () => ({
  formatCurrency: (value: number, options?: { compact?: boolean }) =>
    options?.compact ? `$${Math.round(value/1000)}K` : `$${value.toLocaleString()}`,
}))

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn()
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})
window.IntersectionObserver = mockIntersectionObserver

// Mock fetch
global.fetch = jest.fn()

// Sample project data
const createMockProject = (overrides = {}) => ({
  id: 'project-1',
  facilityName: 'Test Hospital',
  municipalityName: 'Test Municipality',
  region: 'Kyiv Oblast',
  category: 'HOSPITAL',
  urgency: 'HIGH',
  status: 'OPEN',
  estimatedCostUsd: 50000,
  projectType: 'SOLAR_PV',
  cofinancingAvailable: 'YES',
  briefDescription: 'A test project',
  fullDescription: 'Full description',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-20T10:00:00Z',
  cityLatitude: 50.4501,
  cityLongitude: 30.5234,
  ...overrides,
})

const mockProjects = [
  createMockProject({ id: 'project-1', facilityName: 'Hospital A', estimatedCostUsd: 50000 }),
  createMockProject({ id: 'project-2', facilityName: 'School B', category: 'SCHOOL', estimatedCostUsd: 30000 }),
  createMockProject({ id: 'project-3', facilityName: 'Water Plant C', category: 'WATER', urgency: 'CRITICAL', estimatedCostUsd: 100000 }),
]

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockReset()
  })

  describe('Loading State', () => {
    it('shows loading spinner while fetching projects', () => {
      ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))

      render(<HomePage />)

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('shows large loading spinner', () => {
      ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))

      render(<HomePage />)

      expect(screen.getByTestId('loading-spinner')).toHaveAttribute('data-size', 'lg')
    })
  })

  describe('Project Loading', () => {
    it('fetches projects from API on mount', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })

      render(<HomePage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/projects?all=true')
      })
    })

    it('renders page after loading', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText('Fund Renewable Energy for Ukrainian Communities')).toBeInTheDocument()
      })
    })

    it('handles fetch error gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(<HomePage />)

      await waitFor(() => {
        // Should not crash — shows the page without projects
        expect(screen.getByText('Fund Renewable Energy for Ukrainian Communities')).toBeInTheDocument()
      })
    })
  })

  describe('Header', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })
    })

    it('renders header component with transparent prop', async () => {
      render(<HomePage />)

      await waitFor(() => {
        const header = screen.getByTestId('mock-header')
        expect(header).toBeInTheDocument()
        expect(header).toHaveAttribute('data-transparent', 'true')
      })
    })
  })

  describe('Hero Section', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })
    })

    it('renders hero headline', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText('Fund Renewable Energy for Ukrainian Communities')).toBeInTheDocument()
      })
    })

    it('renders hero subheadline', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText('Browse vetted infrastructure projects and fund them directly.')).toBeInTheDocument()
      })
    })

    it('renders hero stats', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText('Communities')).toBeInTheDocument()
        expect(screen.getByText('Projects')).toBeInTheDocument()
        expect(screen.getByText('Funding Needed')).toBeInTheDocument()
      })
    })

    it('renders CTA buttons', async () => {
      render(<HomePage />)

      await waitFor(() => {
        // "Browse Projects" appears in hero CTA, how-it-works step, and final CTA section
        expect(screen.getAllByText('Browse Projects').length).toBeGreaterThanOrEqual(1)
        // "How It Works" appears as hero CTA button and section title
        expect(screen.getAllByText('How It Works').length).toBeGreaterThanOrEqual(1)
      })
    })

    it('renders promise badge', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText('100% of your donation goes to the project')).toBeInTheDocument()
      })
    })
  })

  describe('Featured Projects Section', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })
    })

    it('renders featured projects section title', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText('Featured Projects')).toBeInTheDocument()
      })
    })

    it('renders featured project cards', async () => {
      render(<HomePage />)

      await waitFor(() => {
        // The homepage shows up to 4 featured projects
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
        expect(screen.getByTestId('project-card-project-2')).toBeInTheDocument()
        expect(screen.getByTestId('project-card-project-3')).toBeInTheDocument()
      })
    })

    it('renders view all link', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText('View All')).toBeInTheDocument()
      })
    })
  })

  describe('How It Works Section', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })
    })

    it('renders how it works section title', async () => {
      render(<HomePage />)

      await waitFor(() => {
        // "How It Works" appears as both hero CTA button and section title
        const howItWorksElements = screen.getAllByText('How It Works')
        expect(howItWorksElements.length).toBeGreaterThanOrEqual(2) // CTA button + section title
      })
    })

    it('renders step titles', async () => {
      render(<HomePage />)

      await waitFor(() => {
        // "Browse Projects" appears in multiple places (hero CTA, step title, final CTA)
        expect(screen.getAllByText('Browse Projects').length).toBeGreaterThanOrEqual(1)
        expect(screen.getByText('Fund Directly')).toBeInTheDocument()
        expect(screen.getByText('Track Impact')).toBeInTheDocument()
      })
    })
  })

  describe('Case Study Section', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })
    })

    it('renders case study section', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText('Case Study')).toBeInTheDocument()
        expect(screen.getByText('Novohrodivka School')).toBeInTheDocument()
      })
    })
  })

  describe('FAQ Section', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })
    })

    it('renders FAQ section title', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument()
      })
    })

    it('renders FAQ items', async () => {
      render(<HomePage />)

      await waitFor(() => {
        const faqItems = screen.getAllByTestId('faq-item')
        expect(faqItems.length).toBe(5)
      })
    })
  })

  describe('Final CTA Section', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })
    })

    it('renders CTA title', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText('Ready to Make a Difference?')).toBeInTheDocument()
      })
    })

    it('renders email capture form', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('email-capture')).toBeInTheDocument()
      })
    })
  })

  describe('API response handling', () => {
    it('handles response without ok status', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      })

      render(<HomePage />)

      await waitFor(() => {
        // Should not crash — page renders with no projects
        expect(screen.getByText('Fund Renewable Energy for Ukrainian Communities')).toBeInTheDocument()
      })
    })
  })
})
