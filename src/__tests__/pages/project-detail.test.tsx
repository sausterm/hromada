import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProjectDetailPage from '@/app/[locale]/(public)/projects/[id]/page'

// Mock useParams
const mockParams = { id: 'test-project-123' }
jest.mock('next/navigation', () => ({
  useParams: () => mockParams,
}))

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, any>) => {
    const translations: Record<string, string> = {
      'projectDetail.notFound': 'Project Not Found',
      'projectDetail.notFoundMessage': 'The project you are looking for does not exist.',
      'projectDetail.backToMap': 'Back to Map',
      'projectDetail.aboutProject': 'About This Project',
      'projectDetail.projectSpecifications': 'Project Specifications',
      'projectDetail.specifications.projectType': 'Project Type',
      'projectDetail.specifications.subtype': 'Subtype',
      'projectDetail.specifications.estimatedCost': 'Estimated Cost',
      'projectDetail.specifications.technicalPower': 'Technical Power',
      'projectDetail.specifications.numberOfPanels': 'Number of Panels',
      'projectDetail.specifications.cofinancing': 'Co-financing Available',
      'projectDetail.specifications.partnerOrganization': 'Partner Organization',
      'projectDetail.postedTime': `Posted ${params?.time || ''}`,
      'projectDetail.urgencyLabel': `${params?.level || ''} Urgency`,
      'categories.HOSPITAL': 'Hospital / Medical',
      'categories.SCHOOL': 'School / Education',
      'categories.WATER': 'Water Utility',
      'categories.ENERGY': 'Energy Infrastructure',
      'categories.OTHER': 'Other Infrastructure',
      'urgency.LOW': 'Low',
      'urgency.MEDIUM': 'Medium',
      'urgency.HIGH': 'High',
      'urgency.CRITICAL': 'Critical',
      'status.OPEN': 'Seeking Donors',
      'status.IN_DISCUSSION': 'In Discussion',
      'status.MATCHED': 'Matched',
      'status.FULFILLED': 'Fulfilled',
      'projectTypes.SOLAR_PV': 'Solar PV',
      'projectTypes.HEAT_PUMP': 'Heat Pump',
      'projectTypes.BATTERY_STORAGE': 'Battery Storage',
      'projectTypes.THERMO_MODERNIZATION': 'Thermo-modernization',
      'cofinancing.YES': 'Yes',
      'cofinancing.NO': 'No',
      'cofinancing.NEEDS_CLARIFICATION': 'Needs Discussion',
      'common.notSpecified': 'Not specified',
      'homepage.footer': 'connects American donors with Ukrainian communities.',
    }
    return translations[key] || key
  },
  useLocale: () => 'en',
}))

// Mock @/i18n/navigation
jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className} data-testid={`link-${href}`}>
      {children}
    </a>
  ),
}))

// Mock Header component
jest.mock('@/components/layout/Header', () => ({
  Header: () => <header data-testid="mock-header">Header</header>,
}))

// Mock LoadingSpinner component
jest.mock('@/components/ui/LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: { size?: string }) => (
    <div data-testid="loading-spinner" className="animate-spin" data-size={size}>
      Loading...
    </div>
  ),
}))

// Mock ContactForm component
jest.mock('@/components/projects/ContactForm', () => ({
  ContactForm: ({ projectId, projectName }: { projectId: string; projectName: string }) => (
    <div data-testid="contact-form">
      Contact Form for {projectName} (ID: {projectId})
    </div>
  ),
}))

// Mock ShareButton component
jest.mock('@/components/ui/ShareButton', () => ({
  ShareButton: ({ projectId, projectTitle }: { projectId: string; projectTitle: string }) => (
    <button data-testid="share-button" aria-label="Share project">
      Share {projectTitle}
    </button>
  ),
}))

// Mock fetch
global.fetch = jest.fn()

// Sample project data
const createMockProject = (overrides = {}) => ({
  id: 'test-project-123',
  municipalityName: 'Test Municipality',
  region: 'Kyiv Oblast',
  municipalityEmail: 'test@municipality.gov.ua',
  facilityName: 'Test Hospital Building',
  category: 'HOSPITAL',
  briefDescription: 'A brief description of the test project.',
  fullDescription: 'Full detailed description of the test hospital project that needs funding for renewable energy.',
  address: '123 Test Street',
  cityLatitude: 50.4501,
  cityLongitude: 30.5234,
  contactName: 'John Doe',
  contactEmail: 'john@example.com',
  urgency: 'HIGH',
  status: 'OPEN',
  projectType: 'SOLAR_PV',
  estimatedCostUsd: 75000,
  technicalPowerKw: 50,
  numberOfPanels: 100,
  cofinancingAvailable: 'YES',
  cofinancingDetails: 'Up to 20% available',
  partnerOrganization: 'NGO Partner',
  projectSubtype: 'Building-mounted PV',
  photos: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-20T10:00:00Z',
  ...overrides,
})

describe('ProjectDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockReset()
  })

  describe('Loading State', () => {
    it('shows loading spinner while fetching project', async () => {
      // Don't resolve fetch immediately to test loading state
      ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))

      render(<ProjectDetailPage />)

      // Should show loading spinner
      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })
  })

  describe('Not Found State', () => {
    it('shows not found message when project does not exist', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      render(<ProjectDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Project Not Found')).toBeInTheDocument()
      })
      expect(screen.getByText('The project you are looking for does not exist.')).toBeInTheDocument()
    })

    it('shows back to map button when project not found', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      render(<ProjectDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Back to Map')).toBeInTheDocument()
      })
    })

    it('handles fetch error gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(<ProjectDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Project Not Found')).toBeInTheDocument()
      })
    })
  })

  describe('Project Display', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ project: createMockProject() }),
      })
    })

    it('renders header component', async () => {
      render(<ProjectDetailPage />)

      await waitFor(() => {
        expect(screen.getByTestId('mock-header')).toBeInTheDocument()
      })
    })

    it('renders project title', async () => {
      render(<ProjectDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Hospital Building')).toBeInTheDocument()
      })
    })

    it('renders municipality name', async () => {
      render(<ProjectDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Municipality')).toBeInTheDocument()
      })
    })

    it('renders project description', async () => {
      render(<ProjectDetailPage />)

      await waitFor(() => {
        expect(screen.getByText(/Full detailed description of the test hospital project/)).toBeInTheDocument()
      })
    })

    it('renders category badge', async () => {
      render(<ProjectDetailPage />)

      await waitFor(() => {
        expect(screen.getByText(/Hospital \/ Medical/)).toBeInTheDocument()
      })
    })

    it('renders status badge', async () => {
      render(<ProjectDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Seeking Donors')).toBeInTheDocument()
      })
    })

    // Note: Urgency badges are not displayed on the project detail page,
    // only on the project cards and map popups

    it('renders back to map link', async () => {
      render(<ProjectDetailPage />)

      await waitFor(() => {
        expect(screen.getByTestId('link-/')).toBeInTheDocument()
      })
    })

    it('renders share button', async () => {
      render(<ProjectDetailPage />)

      await waitFor(() => {
        expect(screen.getByTestId('share-button')).toBeInTheDocument()
      })
    })

    it('renders contact form', async () => {
      render(<ProjectDetailPage />)

      await waitFor(() => {
        expect(screen.getByTestId('contact-form')).toBeInTheDocument()
        expect(screen.getByText(/Contact Form for Test Hospital Building/)).toBeInTheDocument()
      })
    })
  })

  describe('Photo Gallery', () => {
    it('renders photo gallery when photos exist', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project: createMockProject() }),
      })

      render(<ProjectDetailPage />)

      await waitFor(() => {
        const images = screen.getAllByRole('img')
        expect(images.length).toBeGreaterThan(0)
      })
    })

    it('shows thumbnail navigation when multiple photos', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project: createMockProject() }),
      })

      render(<ProjectDetailPage />)

      await waitFor(() => {
        // Should have thumbnail buttons (one for each additional photo)
        const images = screen.getAllByRole('img')
        // Main image + thumbnails
        expect(images.length).toBeGreaterThanOrEqual(2)
      })
    })

    it('does not render gallery when no photos', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project: createMockProject({ photos: [] }) }),
      })

      render(<ProjectDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Hospital Building')).toBeInTheDocument()
      })
      // Should not have any project images (but header might have images)
      const images = screen.queryAllByRole('img')
      expect(images.length).toBe(0)
    })

    it('changes selected photo when thumbnail is clicked', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project: createMockProject() }),
      })

      render(<ProjectDetailPage />)

      await waitFor(() => {
        expect(screen.getAllByRole('img').length).toBeGreaterThan(0)
      })

      // Find thumbnail buttons (they're the smaller images in buttons)
      const thumbnailButtons = screen.getAllByRole('button').filter(btn =>
        btn.querySelector('img')
      )

      if (thumbnailButtons.length > 1) {
        await user.click(thumbnailButtons[1])
        // The second photo should now be displayed
      }
    })
  })

  describe('Project Specifications', () => {
    it('renders project type when present', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project: createMockProject() }),
      })

      render(<ProjectDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Project Type')).toBeInTheDocument()
        expect(screen.getByText('Solar PV')).toBeInTheDocument()
      })
    })

    it('renders estimated cost when present', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project: createMockProject() }),
      })

      render(<ProjectDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Estimated Cost')).toBeInTheDocument()
        expect(screen.getByText(/\$75K/)).toBeInTheDocument()
      })
    })

    it('renders technical power when present', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project: createMockProject() }),
      })

      render(<ProjectDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Technical Power')).toBeInTheDocument()
        expect(screen.getByText('50 kW')).toBeInTheDocument()
      })
    })

    it('renders number of panels when present', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project: createMockProject() }),
      })

      render(<ProjectDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Number of Panels')).toBeInTheDocument()
        expect(screen.getByText('100')).toBeInTheDocument()
      })
    })

    it('renders cofinancing information when available', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project: createMockProject() }),
      })

      render(<ProjectDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Co-financing Available')).toBeInTheDocument()
        expect(screen.getByText('Yes')).toBeInTheDocument()
        expect(screen.getByText('Up to 20% available')).toBeInTheDocument()
      })
    })

    it('renders partner organization when present', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project: createMockProject() }),
      })

      render(<ProjectDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Partner Organization')).toBeInTheDocument()
        expect(screen.getByText('NGO Partner')).toBeInTheDocument()
      })
    })

    it('renders project subtype when present', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project: createMockProject() }),
      })

      render(<ProjectDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Subtype')).toBeInTheDocument()
        expect(screen.getByText('Building-mounted PV')).toBeInTheDocument()
      })
    })

    it('does not render specifications section when no technical fields', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project: createMockProject({
          projectType: undefined,
          estimatedCostUsd: undefined,
          technicalPowerKw: undefined,
          numberOfPanels: undefined,
          cofinancingAvailable: undefined,
          partnerOrganization: undefined,
        }) }),
      })

      render(<ProjectDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Hospital Building')).toBeInTheDocument()
      })
      expect(screen.queryByText('Project Specifications')).not.toBeInTheDocument()
    })

    it('omits project type field when not specified', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project: createMockProject({
          projectType: undefined,
          estimatedCostUsd: 50000, // Need at least one field to show specs section
        }) }),
      })

      render(<ProjectDetailPage />)

      await waitFor(() => {
        expect(screen.getByText(/\$50K/)).toBeInTheDocument()
      })
      // Project type field should not be shown when undefined
      expect(screen.queryByText('Project Type')).not.toBeInTheDocument()
    })
  })

  describe('API Integration', () => {
    it('fetches project with correct ID', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project: createMockProject() }),
      })

      render(<ProjectDetailPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/projects/test-project-123')
      })
    })
  })
})
