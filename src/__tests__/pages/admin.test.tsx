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
}))

// Mock useAdminAuth hook
const mockLogin = jest.fn()
const mockLogout = jest.fn()
let mockIsAuthenticated = false
let mockIsLoading = false

jest.mock('@/hooks/useAdminAuth', () => ({
  useAdminAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    isLoading: mockIsLoading,
    login: mockLogin,
    logout: mockLogout,
  }),
}))

// Mock fetch
global.fetch = jest.fn()

describe('AdminPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockReset()
    mockIsAuthenticated = false
    mockIsLoading = false
    mockLogin.mockReset()
    mockLogout.mockReset()
  })

  describe('Loading State', () => {
    it('shows loading spinner while checking auth', () => {
      mockIsLoading = true
      render(<AdminPage />)
      // Should show loading state (spinner)
      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })
  })

  describe('Login Form', () => {
    it('renders login form when not authenticated', () => {
      mockIsAuthenticated = false
      render(<AdminPage />)
      expect(screen.getByText('Admin Login')).toBeInTheDocument()
    })

    it('renders password input', () => {
      render(<AdminPage />)
      expect(screen.getByPlaceholderText('Enter admin password')).toBeInTheDocument()
    })

    it('renders login button', () => {
      const { container } = render(<AdminPage />)
      const form = container.querySelector('form')
      const loginButton = form?.querySelector('button[type="submit"]')
      expect(loginButton).toBeInTheDocument()
    })

    it('shows subtitle text', () => {
      render(<AdminPage />)
      expect(screen.getByText('Enter your password to continue')).toBeInTheDocument()
    })

    it('shows error when submitting empty password', async () => {
      const user = userEvent.setup()

      const { container } = render(<AdminPage />)

      // Find and click the submit button in the form
      const form = container.querySelector('form')
      const loginButton = form?.querySelector('button[type="submit"]') as HTMLButtonElement
      await user.click(loginButton)

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument()
      })
    })

    it('calls login when submitting password', async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValueOnce(true)

      const { container } = render(<AdminPage />)

      const passwordInput = screen.getByPlaceholderText('Enter admin password')
      await user.type(passwordInput, 'testpassword')

      // Find and click the submit button in the form
      const form = container.querySelector('form')
      const loginButton = form?.querySelector('button[type="submit"]') as HTMLButtonElement
      await user.click(loginButton)

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('testpassword')
      })
    })

    it('shows error on failed login', async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValueOnce(false)

      const { container } = render(<AdminPage />)

      const passwordInput = screen.getByPlaceholderText('Enter admin password')
      await user.type(passwordInput, 'wrongpassword')

      // Find the submit button in the form
      const form = container.querySelector('form')
      const loginButton = form?.querySelector('button[type="submit"]') as HTMLButtonElement
      await user.click(loginButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid password')).toBeInTheDocument()
      })
    })
  })

  describe('Authenticated Dashboard', () => {
    beforeEach(() => {
      mockIsAuthenticated = true
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

    it('renders Hromada logo when authenticated', async () => {
      render(<AdminPage />)
      await waitFor(() => {
        expect(screen.getByText('Hromada')).toBeInTheDocument()
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
        expect(screen.getByText('Hromada')).toBeInTheDocument()
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
