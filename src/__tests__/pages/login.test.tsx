import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '@/app/[locale]/(public)/login/page'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'login.title': 'Login',
      'login.subtitle': 'Sign in to your account',
      'login.email': 'Email',
      'login.emailPlaceholder': 'Enter your email',
      'login.password': 'Password',
      'login.passwordPlaceholder': 'Enter your password',
      'login.loginButton': 'Sign In',
      'login.backToHome': 'Back to Home',
      'login.emailPasswordRequired': 'Email and password are required',
      'login.invalidCredentials': 'Invalid credentials',
    }
    return translations[key] || key
  },
}))

// Mock @/i18n/navigation
const mockPush = jest.fn()

jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className} data-testid={`link-${href}`}>
      {children}
    </a>
  ),
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
}))

// Mock useAuth hook
const mockAuthState = {
  isAuthenticated: false,
  isLoading: false,
  role: null as string | null,
}
const mockLogin = jest.fn()

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    get isAuthenticated() { return mockAuthState.isAuthenticated },
    get isLoading() { return mockAuthState.isLoading },
    get role() { return mockAuthState.role },
    login: mockLogin,
    logout: jest.fn(),
    isAdmin: () => mockAuthState.role === 'ADMIN',
    isPartner: () => mockAuthState.role === 'PARTNER' || mockAuthState.role === 'NONPROFIT_MANAGER',
    user: null,
    getDashboardPath: () => {
      if (mockAuthState.role === 'ADMIN') return '/admin'
      if (mockAuthState.role === 'PARTNER') return '/partner'
      if (mockAuthState.role === 'NONPROFIT_MANAGER') return '/nonprofit'
      return '/'
    },
  }),
}))

// Mock LoadingSpinner component
jest.mock('@/components/ui/LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: { size?: string }) => (
    <div data-testid="loading-spinner" data-size={size}>
      Loading...
    </div>
  ),
}))

// Mock Card components
jest.mock('@/components/ui/Card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-header" className={className}>{children}</div>
  ),
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h2 data-testid="card-title" className={className}>{children}</h2>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
}))

// Mock Button component
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, type, fullWidth, isLoading, onClick }: {
    children: React.ReactNode
    type?: string
    fullWidth?: boolean
    isLoading?: boolean
    onClick?: () => void
  }) => (
    <button
      type={type as 'submit' | 'button' | 'reset'}
      data-testid="submit-button"
      data-fullwidth={fullWidth}
      disabled={isLoading}
      onClick={onClick}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  ),
}))

// Mock Input component
jest.mock('@/components/ui/Input', () => ({
  Input: ({ id, type, value, onChange, placeholder, error, autoComplete }: {
    id?: string
    type?: string
    value?: string
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    placeholder?: string
    error?: string
    autoComplete?: string
  }) => (
    <div>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        data-testid={`input-${id}`}
      />
      {error && <span data-testid="input-error">{error}</span>}
    </div>
  ),
}))

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthState.isAuthenticated = false
    mockAuthState.isLoading = false
    mockAuthState.role = null
    mockLogin.mockReset()
  })

  describe('Loading State', () => {
    it('shows loading spinner while checking auth', () => {
      mockAuthState.isLoading = true
      render(<LoginPage />)
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('shows large loading spinner', () => {
      mockAuthState.isLoading = true
      render(<LoginPage />)
      expect(screen.getByTestId('loading-spinner')).toHaveAttribute('data-size', 'lg')
    })
  })

  describe('Rendering', () => {
    it('renders the login form when not loading', () => {
      render(<LoginPage />)
      expect(screen.getByTestId('card')).toBeInTheDocument()
    })

    it('renders the login title', () => {
      render(<LoginPage />)
      expect(screen.getByText('Login')).toBeInTheDocument()
    })

    it('renders the login subtitle', () => {
      render(<LoginPage />)
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
    })

    it('renders email input field', () => {
      render(<LoginPage />)
      expect(screen.getByTestId('input-email')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
    })

    it('renders password input field', () => {
      render(<LoginPage />)
      expect(screen.getByTestId('input-password')).toBeInTheDocument()
      expect(screen.getByText('Password')).toBeInTheDocument()
    })

    it('renders submit button', () => {
      render(<LoginPage />)
      expect(screen.getByTestId('submit-button')).toBeInTheDocument()
      expect(screen.getByText('Sign In')).toBeInTheDocument()
    })

    it('renders back to home link', () => {
      render(<LoginPage />)
      expect(screen.getByTestId('link-/')).toBeInTheDocument()
      expect(screen.getByText('Back to Home')).toBeInTheDocument()
    })
  })

  describe('Form Interactions', () => {
    it('updates email input on change', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      const emailInput = screen.getByTestId('input-email')
      await user.type(emailInput, 'test@example.com')

      expect(emailInput).toHaveValue('test@example.com')
    })

    it('updates password input on change', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      const passwordInput = screen.getByTestId('input-password')
      await user.type(passwordInput, 'password123')

      expect(passwordInput).toHaveValue('password123')
    })
  })

  describe('Form Validation', () => {
    it('shows error when submitting with empty email', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      const passwordInput = screen.getByTestId('input-password')
      await user.type(passwordInput, 'password123')

      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByTestId('input-error')).toHaveTextContent('Email and password are required')
      })
    })

    it('shows error when submitting with empty password', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      const emailInput = screen.getByTestId('input-email')
      await user.type(emailInput, 'test@example.com')

      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByTestId('input-error')).toHaveTextContent('Email and password are required')
      })
    })

    it('shows error when submitting with whitespace-only values', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      const emailInput = screen.getByTestId('input-email')
      const passwordInput = screen.getByTestId('input-password')
      await user.type(emailInput, '   ')
      await user.type(passwordInput, '   ')

      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByTestId('input-error')).toHaveTextContent('Email and password are required')
      })
    })
  })

  describe('Form Submission', () => {
    it('calls login with trimmed email and password', async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValue({ success: true, role: 'PARTNER' })

      render(<LoginPage />)

      const emailInput = screen.getByTestId('input-email')
      const passwordInput = screen.getByTestId('input-password')
      await user.type(emailInput, '  test@example.com  ')
      await user.type(passwordInput, 'password123')

      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
      })
    })

    it('redirects to admin page on successful ADMIN login', async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValue({ success: true, role: 'ADMIN' })

      render(<LoginPage />)

      const emailInput = screen.getByTestId('input-email')
      const passwordInput = screen.getByTestId('input-password')
      await user.type(emailInput, 'admin@example.com')
      await user.type(passwordInput, 'adminpass')

      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin')
      })
    })

    it('redirects to partner page on successful PARTNER login', async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValue({ success: true, role: 'PARTNER' })

      render(<LoginPage />)

      const emailInput = screen.getByTestId('input-email')
      const passwordInput = screen.getByTestId('input-password')
      await user.type(emailInput, 'partner@example.com')
      await user.type(passwordInput, 'partnerpass')

      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/partner')
      })
    })

    it('redirects to nonprofit page on successful NONPROFIT_MANAGER login', async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValue({ success: true, role: 'NONPROFIT_MANAGER' })

      render(<LoginPage />)

      const emailInput = screen.getByTestId('input-email')
      const passwordInput = screen.getByTestId('input-password')
      await user.type(emailInput, 'nonprofit@example.com')
      await user.type(passwordInput, 'nonprofitpass')

      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/nonprofit')
      })
    })

    it('redirects to home page for other roles', async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValue({ success: true, role: 'USER' })

      render(<LoginPage />)

      const emailInput = screen.getByTestId('input-email')
      const passwordInput = screen.getByTestId('input-password')
      await user.type(emailInput, 'user@example.com')
      await user.type(passwordInput, 'userpass')

      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/')
      })
    })

    it('shows error on failed login', async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValue({ success: false })

      render(<LoginPage />)

      const emailInput = screen.getByTestId('input-email')
      const passwordInput = screen.getByTestId('input-password')
      await user.type(emailInput, 'wrong@example.com')
      await user.type(passwordInput, 'wrongpass')

      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByTestId('input-error')).toHaveTextContent('Invalid credentials')
      })
    })
  })

  describe('Authenticated Redirect', () => {
    it('redirects ADMIN users to admin page when already authenticated', async () => {
      mockAuthState.isAuthenticated = true
      mockAuthState.role = 'ADMIN'

      render(<LoginPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin')
      })
    })

    it('redirects PARTNER users to partner page when already authenticated', async () => {
      mockAuthState.isAuthenticated = true
      mockAuthState.role = 'PARTNER'

      render(<LoginPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/partner')
      })
    })

    it('redirects NONPROFIT_MANAGER users to nonprofit page when already authenticated', async () => {
      mockAuthState.isAuthenticated = true
      mockAuthState.role = 'NONPROFIT_MANAGER'

      render(<LoginPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/nonprofit')
      })
    })

    it('does not redirect when loading', () => {
      mockAuthState.isAuthenticated = true
      mockAuthState.isLoading = true
      mockAuthState.role = 'ADMIN'

      render(<LoginPage />)

      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('Button Loading State', () => {
    it('disables submit button during submission', async () => {
      const user = userEvent.setup()
      // Make login resolve slowly
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true, role: 'PARTNER' }), 1000)))

      render(<LoginPage />)

      const emailInput = screen.getByTestId('input-email')
      const passwordInput = screen.getByTestId('input-password')
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')

      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      // Button should be disabled (isLoading)
      await waitFor(() => {
        expect(submitButton).toBeDisabled()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper form structure', () => {
      render(<LoginPage />)

      const emailLabel = screen.getByText('Email')
      const passwordLabel = screen.getByText('Password')

      expect(emailLabel).toBeInTheDocument()
      expect(passwordLabel).toBeInTheDocument()
    })

    it('email input has correct type', () => {
      render(<LoginPage />)
      const emailInput = screen.getByTestId('input-email')
      expect(emailInput).toHaveAttribute('type', 'email')
    })

    it('password input has correct type', () => {
      render(<LoginPage />)
      const passwordInput = screen.getByTestId('input-password')
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('submit button has correct type', () => {
      render(<LoginPage />)
      const submitButton = screen.getByTestId('submit-button')
      expect(submitButton).toHaveAttribute('type', 'submit')
    })

    it('email input has autocomplete attribute', () => {
      render(<LoginPage />)
      const emailInput = screen.getByTestId('input-email')
      expect(emailInput).toHaveAttribute('autoComplete', 'email')
    })

    it('password input has autocomplete attribute', () => {
      render(<LoginPage />)
      const passwordInput = screen.getByTestId('input-password')
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password')
    })
  })
})
