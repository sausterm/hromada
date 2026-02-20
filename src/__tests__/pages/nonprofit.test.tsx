import { render, screen, fireEvent } from '@testing-library/react'
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

describe('NonprofitPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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

  it('renders nonprofit dashboard when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: jest.fn(() => true),
      logout: jest.fn(),
      user: { name: 'Admin User', organization: 'POCACITO' },
    })

    render(<NonprofitPage />)
    expect(screen.getByText('Nonprofit Manager Dashboard')).toBeInTheDocument()
    expect(screen.getByText(/Welcome, Admin User/)).toBeInTheDocument()
    expect(screen.getByText(/POCACITO/)).toBeInTheDocument()
  })

  it('renders overview tab by default with stats', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: jest.fn(() => true),
      logout: jest.fn(),
      user: { name: 'Admin' },
    })

    render(<NonprofitPage />)
    expect(screen.getByText('Pending Confirmation')).toBeInTheDocument()
    expect(screen.getByText('Ready to Forward')).toBeInTheDocument()
    expect(screen.getByText('In Transit to Ukraine')).toBeInTheDocument()
    expect(screen.getByText('Completed Transfers')).toBeInTheDocument()
  })

  it('renders pending actions section', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: jest.fn(() => true),
      logout: jest.fn(),
      user: { name: 'Admin' },
    })

    render(<NonprofitPage />)
    expect(screen.getByText('Pending Actions')).toBeInTheDocument()
    expect(screen.getAllByText('Mark Received').length).toBeGreaterThan(0)
  })

  it('switches to donations tab', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: jest.fn(() => true),
      logout: jest.fn(),
      user: { name: 'Admin' },
    })

    render(<NonprofitPage />)

    fireEvent.click(screen.getByText('Donations'))
    expect(screen.getByText('All Donations')).toBeInTheDocument()
  })

  it('switches to wire transfers tab', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: jest.fn(() => true),
      logout: jest.fn(),
      user: { name: 'Admin' },
    })

    render(<NonprofitPage />)

    fireEvent.click(screen.getByText('Wire Transfers'))
    expect(screen.getByText('Wire Transfers to Ukraine')).toBeInTheDocument()
    expect(screen.getByText('Transfer Fee Comparison')).toBeInTheDocument()
  })

  it('handles mark received action', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: jest.fn(() => true),
      logout: jest.fn(),
      user: { name: 'Admin' },
    })

    render(<NonprofitPage />)

    const markButtons = screen.getAllByText('Mark Received')
    const initialCount = markButtons.length
    fireEvent.click(markButtons[0])

    // After marking received, there should be one fewer button
    expect(screen.getAllByText('Mark Received').length).toBeLessThan(initialCount)
  })
})
