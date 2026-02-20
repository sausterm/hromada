import { render, screen } from '@testing-library/react'
import DonorPage from '@/app/[locale]/(public)/donor/page'

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

describe('DonorPage', () => {
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

    render(<DonorPage />)
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

    render(<DonorPage />)
    expect(mockRouterPush).toHaveBeenCalledWith('/login')
  })

  it('redirects to home when user lacks donor role', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: jest.fn(() => false),
      logout: jest.fn(),
      user: { name: 'Test', role: 'PARTNER' },
    })

    render(<DonorPage />)
    expect(mockRouterPush).toHaveBeenCalledWith('/')
  })

  it('renders donor dashboard when authenticated with DONOR role', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: jest.fn(() => true),
      logout: jest.fn(),
      user: { name: 'John Donor' },
    })

    render(<DonorPage />)
    expect(screen.getByText('Donor Dashboard')).toBeInTheDocument()
    expect(screen.getByText(/Welcome back, John Donor/)).toBeInTheDocument()
  })

  it('renders donation stats', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: jest.fn(() => true),
      logout: jest.fn(),
      user: { name: 'John' },
    })

    render(<DonorPage />)
    expect(screen.getByText('Total Contributed')).toBeInTheDocument()
    expect(screen.getByText('Projects Supported')).toBeInTheDocument()
  })

  it('renders tax information section', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: jest.fn(() => true),
      logout: jest.fn(),
      user: { name: 'John' },
    })

    render(<DonorPage />)
    expect(screen.getByText('Tax-Deductible Donations')).toBeInTheDocument()
  })
})
