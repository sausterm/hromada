import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import NonprofitPage from '@/app/[locale]/(public)/nonprofit/page'

// Mock useAuth
const mockUseAuth = jest.fn()
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

// Mock next-intl
jest.mock('next-intl', () => ({
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

const MOCK_DONATIONS = [
  {
    id: '1',
    projectName: 'Kharkiv Regional Hospital - Solar Installation',
    projectId: 'proj-1',
    donorName: 'John Smith',
    donorEmail: 'john@example.com',
    donorOrganization: 'Smith Foundation',
    amount: 150000,
    paymentMethod: 'WIRE',
    referenceNumber: null,
    status: 'PENDING_CONFIRMATION',
    submittedAt: '2026-02-05T10:30:00Z',
    receivedAt: null,
    forwardedAt: null,
    taxReceiptUrl: null,
  },
  {
    id: '2',
    projectName: 'Odesa School #5 - Battery Storage',
    projectId: 'proj-2',
    donorName: 'Acme Corporation',
    donorEmail: 'giving@acme.com',
    donorOrganization: 'Acme Corp',
    amount: 75000,
    paymentMethod: 'DAF',
    referenceNumber: null,
    status: 'PENDING_CONFIRMATION',
    submittedAt: '2026-02-04T14:20:00Z',
    receivedAt: null,
    forwardedAt: null,
    taxReceiptUrl: null,
  },
  {
    id: '3',
    projectName: 'Lviv Community Center - Heat Pump',
    projectId: 'proj-3',
    donorName: 'Jane Doe',
    donorEmail: 'jane@example.com',
    donorOrganization: null,
    amount: 50000,
    paymentMethod: 'WIRE',
    referenceNumber: null,
    status: 'RECEIVED',
    submittedAt: '2026-02-01T16:45:00Z',
    receivedAt: '2026-02-02T09:00:00Z',
    forwardedAt: null,
    taxReceiptUrl: null,
  },
]

const MOCK_WIRE_TRANSFERS = [
  {
    id: '1',
    referenceNumber: 'WT-2026-001',
    recipientName: 'Zaporizhzhia City Administration',
    projectName: 'Zaporizhzhia School - Solar PV',
    amount: 100000,
    status: 'IN_TRANSIT',
    sentAt: '2026-02-01T10:00:00Z',
    confirmedAt: null,
    createdAt: '2026-01-31T14:00:00Z',
  },
]

function mockFetchSuccess() {
  global.fetch = jest.fn((url: string) => {
    if (url.includes('/api/donations/list')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ donations: MOCK_DONATIONS }),
      })
    }
    if (url.includes('/api/wire-transfers/list')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ wireTransfers: MOCK_WIRE_TRANSFERS }),
      })
    }
    return Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
  }) as jest.Mock
}

describe('NonprofitPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetchSuccess()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('shows loading spinner when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      hasRole: jest.fn(() => false),
      logout: jest.fn(),
      user: null,
    })

    render(<NonprofitPage />)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('redirects to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      hasRole: jest.fn(() => false),
      logout: jest.fn(),
      user: null,
    })

    render(<NonprofitPage />)
    expect(mockRouterPush).toHaveBeenCalledWith('/login')
  })

  it('redirects to home when user lacks nonprofit role', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: jest.fn(() => false),
      logout: jest.fn(),
      user: { name: 'Test', role: 'DONOR' },
    })

    render(<NonprofitPage />)
    expect(mockRouterPush).toHaveBeenCalledWith('/')
  })

  it('renders nonprofit dashboard when authenticated', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: jest.fn(() => true),
      logout: jest.fn(),
      user: { name: 'Admin User', organization: 'POCACITO' },
    })

    render(<NonprofitPage />)

    await waitFor(() => {
      expect(screen.getByText('Nonprofit Manager Dashboard')).toBeInTheDocument()
    })
    expect(screen.getByText(/Welcome, Admin User/)).toBeInTheDocument()
    expect(screen.getByText(/POCACITO/)).toBeInTheDocument()
  })

  it('renders overview tab by default with stats', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: jest.fn(() => true),
      logout: jest.fn(),
      user: { name: 'Admin' },
    })

    render(<NonprofitPage />)

    await waitFor(() => {
      expect(screen.getByText('Pending Confirmation')).toBeInTheDocument()
    })
    expect(screen.getByText('Ready to Forward')).toBeInTheDocument()
    expect(screen.getByText('In Transit to Ukraine')).toBeInTheDocument()
    expect(screen.getByText('Completed Transfers')).toBeInTheDocument()
  })

  it('renders pending actions section with Mark Received buttons', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: jest.fn(() => true),
      logout: jest.fn(),
      user: { name: 'Admin' },
    })

    render(<NonprofitPage />)

    await waitFor(() => {
      expect(screen.getByText('Pending Actions')).toBeInTheDocument()
    })
    expect(screen.getAllByText('Mark Received').length).toBeGreaterThan(0)
  })

  it('switches to donations tab', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: jest.fn(() => true),
      logout: jest.fn(),
      user: { name: 'Admin' },
    })

    render(<NonprofitPage />)

    await waitFor(() => {
      expect(screen.getByText(/Donations/)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText(/Donations/))
    expect(screen.getByText('All Donations')).toBeInTheDocument()
  })

  it('switches to wire transfers tab', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: jest.fn(() => true),
      logout: jest.fn(),
      user: { name: 'Admin' },
    })

    render(<NonprofitPage />)

    await waitFor(() => {
      expect(screen.getByText('Wire Transfers')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Wire Transfers'))
    expect(screen.getByText('Wire Transfers to Ukraine')).toBeInTheDocument()
    expect(screen.getByText('Transfer Fee Comparison')).toBeInTheDocument()
  })

  it('handles mark received action via API', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: jest.fn(() => true),
      logout: jest.fn(),
      user: { name: 'Admin' },
    })

    render(<NonprofitPage />)

    await waitFor(() => {
      expect(screen.getAllByText('Mark Received').length).toBeGreaterThan(0)
    })

    // Mock the status update API call
    const updatedDonations = MOCK_DONATIONS.map(d =>
      d.id === '1' ? { ...d, status: 'RECEIVED', receivedAt: '2026-02-25T10:00:00Z' } : d
    )

    ;(global.fetch as jest.Mock).mockImplementation((url: string, opts?: any) => {
      if (opts?.method === 'PATCH') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) })
      }
      if (url.includes('/api/donations/list')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ donations: updatedDonations }),
        })
      }
      if (url.includes('/api/wire-transfers/list')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ wireTransfers: MOCK_WIRE_TRANSFERS }),
        })
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
    })

    const markButtons = screen.getAllByText('Mark Received')
    fireEvent.click(markButtons[0])

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/donations/1/status',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'RECEIVED' }),
        })
      )
    })
  })
})
