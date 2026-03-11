import { render, screen, waitFor } from '@testing-library/react'
import DonorProjectDetailPage from '@/app/[locale]/(public)/donor/projects/[id]/page'

// Mock useAuth
const mockUseAuth = jest.fn()
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

// Mock next-intl
jest.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}))

// Mock i18n navigation
const mockRouterPush = jest.fn()
jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
  useRouter: () => ({ push: mockRouterPush }),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'test-project-id' }),
  useRouter: () => ({ push: mockRouterPush }),
  usePathname: () => '/donor/projects/test-project-id',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}))

// Mock Header
jest.mock('@/components/layout/Header', () => ({
  Header: () => <header data-testid="mock-header">Header</header>,
}))

// Mock UI components
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}))

jest.mock('@/components/ui/Card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

jest.mock('@/components/ui/Badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}))

jest.mock('@/components/ui/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}))

// Mock child components
jest.mock('@/components/donor/JourneyStepper', () => ({
  JourneyStepper: (props: any) => <div data-testid="journey-stepper" data-status={props.status}>JourneyStepper</div>,
}))

jest.mock('@/components/donor/UpdateTimeline', () => ({
  UpdateTimeline: (props: any) => <div data-testid="update-timeline" data-variant={props.variant}>UpdateTimeline ({props.updates?.length || 0} updates)</div>,
}))

jest.mock('@/components/donor/PhotoLightbox', () => ({
  PhotoLightbox: (props: any) => <div data-testid="photo-lightbox" />,
}))

const mockProject = {
  id: 'test-project-id',
  facilityName: 'Test Facility',
  facilityNameUk: 'Test Facility UK',
  municipalityName: 'Test City',
  municipalityNameUk: 'Test City UK',
  category: 'ENERGY',
  projectType: 'HEAT_PUMP',
  estimatedCostUsd: '100000',
  technicalPowerKw: '50',
  region: 'Volyn Oblast',
  cofinancingAvailable: 'NO',
  partnerOrganization: 'NGO Ecoaction',
  description: 'Test description',
  fullDescription: 'Full test description',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-02-01T00:00:00Z',
  cityLatitude: '50.7',
  cityLongitude: '25.3',
  status: 'MATCHED',
  photos: [],
  updates: [],
}

const mockDonation = {
  id: 'don-1',
  projectId: 'test-project-id',
  amount: 100000,
  paymentMethod: 'WIRE',
  status: 'FORWARDED',
  submittedAt: '2026-01-10T00:00:00Z',
  receivedAt: '2026-01-13T00:00:00Z',
}

function setupAuthenticatedDonor() {
  mockUseAuth.mockReturnValue({
    isAuthenticated: true,
    isLoading: false,
    hasRole: jest.fn(() => true),
    isPartner: jest.fn(() => false),
    isDonor: jest.fn(() => true),
    logout: jest.fn(),
    user: { name: 'Test Donor', role: 'DONOR' },
  })
}

describe('DonorProjectDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  it('shows loading spinner when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      hasRole: jest.fn(() => false),
      user: null,
    })

    render(<DonorProjectDetailPage />)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('redirects to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      hasRole: jest.fn(() => false),
      user: null,
    })

    render(<DonorProjectDetailPage />)
    expect(mockRouterPush).toHaveBeenCalledWith('/login')
  })

  it('redirects to home when user lacks required role', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: jest.fn(() => false),
      user: { name: 'Nobody', role: 'UNKNOWN' },
    })

    render(<DonorProjectDetailPage />)
    expect(mockRouterPush).toHaveBeenCalledWith('/')
  })

  it('shows project not found when fetch returns 404', async () => {
    setupAuthenticatedDonor()
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/projects/')) {
        return Promise.resolve({ ok: false, status: 404 })
      }
      if (url.includes('/api/donor/donations')) {
        return Promise.resolve({ ok: true, json: async () => ({ donations: [] }) })
      }
      return Promise.resolve({ ok: false })
    })

    render(<DonorProjectDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Project not found')).toBeInTheDocument()
    })
    expect(screen.getByText('Back to Dashboard')).toBeInTheDocument()
  })

  it('renders project header with facility and municipality name', async () => {
    setupAuthenticatedDonor()
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/projects/')) {
        return Promise.resolve({ ok: true, json: async () => ({ project: mockProject }) })
      }
      if (url.includes('/api/donor/donations')) {
        return Promise.resolve({ ok: true, json: async () => ({ donations: [] }) })
      }
      return Promise.resolve({ ok: false })
    })

    render(<DonorProjectDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Test Facility')).toBeInTheDocument()
    })
    expect(screen.getByText('Test City')).toBeInTheDocument()
  })

  it('renders donation info and journey stepper when donations exist', async () => {
    setupAuthenticatedDonor()
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/projects/')) {
        return Promise.resolve({ ok: true, json: async () => ({ project: mockProject }) })
      }
      if (url.includes('/api/donor/donations')) {
        return Promise.resolve({ ok: true, json: async () => ({ donations: [mockDonation] }) })
      }
      return Promise.resolve({ ok: false })
    })

    render(<DonorProjectDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Your Contribution')).toBeInTheDocument()
    })
    expect(screen.getByTestId('journey-stepper')).toBeInTheDocument()
    expect(screen.getByTestId('journey-stepper')).toHaveAttribute('data-status', 'FORWARDED')
  })

  it('renders update timeline', async () => {
    setupAuthenticatedDonor()
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/projects/')) {
        return Promise.resolve({ ok: true, json: async () => ({ project: mockProject }) })
      }
      if (url.includes('/api/donor/donations')) {
        return Promise.resolve({ ok: true, json: async () => ({ donations: [] }) })
      }
      return Promise.resolve({ ok: false })
    })

    render(<DonorProjectDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Project Updates')).toBeInTheDocument()
    })
    expect(screen.getByTestId('update-timeline')).toBeInTheDocument()
  })

  it('renders project details sidebar with cost and region', async () => {
    setupAuthenticatedDonor()
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/projects/')) {
        return Promise.resolve({ ok: true, json: async () => ({ project: mockProject }) })
      }
      if (url.includes('/api/donor/donations')) {
        return Promise.resolve({ ok: true, json: async () => ({ donations: [] }) })
      }
      return Promise.resolve({ ok: false })
    })

    render(<DonorProjectDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Project Details')).toBeInTheDocument()
    })
    expect(screen.getByText('Volyn Oblast')).toBeInTheDocument()
    expect(screen.getByText('Estimated Cost')).toBeInTheDocument()
    expect(screen.getByText('Region')).toBeInTheDocument()
  })

  it('renders partner organization with link for known partners', async () => {
    setupAuthenticatedDonor()
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/projects/')) {
        return Promise.resolve({ ok: true, json: async () => ({ project: mockProject }) })
      }
      if (url.includes('/api/donor/donations')) {
        return Promise.resolve({ ok: true, json: async () => ({ donations: [] }) })
      }
      return Promise.resolve({ ok: false })
    })

    render(<DonorProjectDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Partner')).toBeInTheDocument()
    })
    expect(screen.getByText('NGO Ecoaction')).toBeInTheDocument()
  })

  it('handles fetch error gracefully', async () => {
    setupAuthenticatedDonor()
    const consoleError = jest.spyOn(console, 'error').mockImplementation()
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    render(<DonorProjectDetailPage />)

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Failed to fetch project data:', expect.any(Error))
    })

    consoleError.mockRestore()
  })
})
