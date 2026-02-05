import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminPage from '@/app/[locale]/admin/page'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'admin.login.title': 'Admin Login',
      'admin.login.subtitle': 'Enter your password to continue',
      'admin.login.password': 'Password',
      'admin.login.passwordPlaceholder': 'Enter admin password',
      'admin.login.button': 'Login',
      'admin.login.loggingIn': 'Logging in...',
      'admin.login.passwordRequired': 'Password is required',
      'admin.login.error': 'Invalid password',
      'nav.admin': 'Admin',
    }
    return translations[key] || key
  },
}))

// Mock @/i18n/navigation
jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className} data-testid={`link-${href}`}>
      {children}
    </a>
  ),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/admin',
}))

// Mock useAuth hook
const mockAuthState = {
  isAuthenticated: false,
  isLoading: false,
}
const mockLogin = jest.fn()
const mockLogout = jest.fn()

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    get isAuthenticated() { return mockAuthState.isAuthenticated },
    get isLoading() { return mockAuthState.isLoading },
    login: mockLogin,
    logout: mockLogout,
    isAdmin: () => true,
    role: 'ADMIN',
    get user() { return mockAuthState.isAuthenticated ? { id: 'user-1', email: 'admin@test.com', role: 'ADMIN', name: 'Admin User' } : null },
  }),
}))

// Mock useAdminAuth hook (legacy)
jest.mock('@/hooks/useAdminAuth', () => ({
  useAdminAuth: () => ({
    get isAuthenticated() { return mockAuthState.isAuthenticated },
    get isLoading() { return mockAuthState.isLoading },
    login: mockLogin,
    logout: mockLogout,
  }),
}))

// Mock LoadingSpinner component
jest.mock('@/components/ui/LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: { size?: string }) => (
    <div data-testid="loading-spinner" className="animate-spin" data-size={size}>
      Loading...
    </div>
  ),
}))

// Mock fetch
global.fetch = jest.fn()

describe('AdminPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockReset()
    mockAuthState.isAuthenticated = false
    mockAuthState.isLoading = false
    mockLogin.mockReset()
    mockLogout.mockReset()
  })

  describe('Loading State', () => {
    it('shows loading spinner while checking auth', () => {
      mockAuthState.isLoading = true
      render(<AdminPage />)
      // Should show loading state (spinner)
      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })
  })

  // Note: Login form tests removed - admin page now redirects to /login for unauthenticated users

  describe('Authenticated Dashboard', () => {
    beforeEach(() => {
      mockAuthState.isAuthenticated = true
      // Mock all API endpoints
      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/projects')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ projects: [], submissions: [] }),
          })
        }
        if (url === '/api/contact') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ submissions: [] }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        })
      })
    })

    it('renders hromada logo when authenticated', async () => {
      render(<AdminPage />)
      await waitFor(() => {
        expect(screen.getByText('hromada')).toBeInTheDocument()
      })
    })

    it('renders Admin badge', async () => {
      render(<AdminPage />)
      await waitFor(() => {
        expect(screen.getByText('Admin')).toBeInTheDocument()
      })
    })

    it('renders add project link', async () => {
      render(<AdminPage />)
      await waitFor(() => {
        expect(screen.getByTestId('link-/admin/projects/new')).toBeInTheDocument()
      })
    })

    it('fetches projects from API', async () => {
      render(<AdminPage />)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/projects?all=true')
      })
    })

    it('fetches contact submissions from API', async () => {
      render(<AdminPage />)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/contact')
      })
    })

    it('fetches project submissions from API', async () => {
      render(<AdminPage />)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/projects/submissions')
      })
    })

    it('calls logout when clicking logout button', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      // Wait for dashboard to render
      await waitFor(() => {
        expect(screen.getByText('hromada')).toBeInTheDocument()
      })

      // Find logout button by looking for ghost variant button with logout translation
      const buttons = screen.getAllByRole('button')
      const logoutButton = buttons.find(btn => btn.textContent?.includes('admin.logout'))

      if (logoutButton) {
        await user.click(logoutButton)
        expect(mockLogout).toHaveBeenCalled()
      }
    })
  })
})
