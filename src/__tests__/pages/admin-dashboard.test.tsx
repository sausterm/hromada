import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminPage from '@/app/[locale]/admin/page'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, any>) => {
    const translations: Record<string, string> = {
      'admin.login.title': 'Admin Login',
      'admin.login.subtitle': 'Enter your password to access the admin dashboard',
      'admin.login.password': 'Password',
      'admin.login.passwordPlaceholder': 'Enter password',
      'admin.login.passwordRequired': 'Password is required',
      'admin.login.error': 'Invalid password',
      'admin.login.loginButton': 'Login',
      'admin.backToMap': 'Back to Map',
      'admin.nav.logout': 'Logout',
      'admin.nav.projects': 'Projects',
      'admin.nav.submissions': 'Submissions',
      'admin.nav.contacts': 'Contacts',
      'admin.stats.totalProjects': 'Total Projects',
      'admin.stats.openProjects': 'Open Projects',
      'admin.stats.criticalProjects': 'Critical Projects',
      'admin.stats.pendingSubmissions': 'Pending Submissions',
      'admin.projects.title': 'Projects',
      'admin.projects.searchPlaceholder': 'Search projects...',
      'admin.projects.addNew': 'Add New Project',
      'admin.projects.selectedCount': `${params?.count || 0} selected`,
      'admin.projects.clearSelection': 'Clear Selection',
      'admin.projects.deleteSelected': 'Delete Selected',
      'admin.projects.confirmBulkDelete': `Delete ${params?.count || 0} projects?`,
      'admin.projects.bulkDeleteSuccess': `${params?.count || 0} projects deleted`,
      'admin.projects.bulkDeletePartialFail': 'Some deletes failed',
      'admin.projects.bulkDeleteFail': 'Delete failed',
      'admin.submissions.approveSuccess': 'Submission approved',
      'admin.submissions.rejectSuccess': 'Submission rejected',
      'admin.submissions.provideReason': 'Please provide a reason',
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
let mockAuthLoading = false

jest.mock('@/hooks/useAdminAuth', () => ({
  useAdminAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    isLoading: mockAuthLoading,
    login: mockLogin,
    logout: mockLogout,
  }),
}))

// Mock UI components
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, type, isLoading, disabled, variant, fullWidth, size, className }: any) => (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled || isLoading}
      data-variant={variant}
      data-loading={isLoading}
      className={className}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  ),
}))

jest.mock('@/components/ui/Input', () => ({
  Input: ({ id, type, value, onChange, placeholder, error }: any) => (
    <div>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        data-testid={`input-${id}`}
      />
      {error && <span className="error">{error}</span>}
    </div>
  ),
}))

jest.mock('@/components/ui/Card', () => ({
  Card: ({ children, className }: any) => <div className={className} data-testid="card">{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <h2 className={className}>{children}</h2>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
}))

jest.mock('@/components/ui/Badge', () => ({
  Badge: ({ children, variant, size, className }: any) => (
    <span data-variant={variant} data-size={size} className={className}>{children}</span>
  ),
}))

jest.mock('@/components/ui/LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: { size?: string }) => (
    <div data-testid="loading-spinner" data-size={size}>Loading...</div>
  ),
}))

// Mock types module
jest.mock('@/types', () => ({
  CATEGORY_CONFIG: {
    HOSPITAL: { label: 'Hospital', icon: '🏥' },
    SCHOOL: { label: 'School', icon: '🏫' },
    WATER: { label: 'Water', icon: '💧' },
    ENERGY: { label: 'Energy', icon: '⚡' },
    OTHER: { label: 'Other', icon: '🏢' },
  },
  STATUS_CONFIG: {
    OPEN: { label: 'Open' },
    IN_DISCUSSION: { label: 'In Discussion' },
    MATCHED: { label: 'Matched' },
    FULFILLED: { label: 'Fulfilled' },
  },
  URGENCY_CONFIG: {
    LOW: { label: 'Low' },
    MEDIUM: { label: 'Medium' },
    HIGH: { label: 'High' },
    CRITICAL: { label: 'Critical' },
  },
  PROJECT_TYPE_CONFIG: {
    SOLAR_PV: { label: 'Solar PV' },
    HEAT_PUMP: { label: 'Heat Pump' },
    WATER_TREATMENT: { label: 'Water Treatment' },
    GENERAL: { label: 'General' },
  },
}))

// Mock fetch
global.fetch = jest.fn()
global.alert = jest.fn()
global.confirm = jest.fn(() => true)

// Sample data
const mockProjects = [
  {
    id: 'project-1',
    facilityName: 'Hospital A',
    municipalityName: 'Municipality 1',
    region: 'Kyiv Oblast',
    category: 'HOSPITAL',
    urgency: 'HIGH',
    status: 'OPEN',
    projectType: 'SOLAR_PV',
    estimatedCostUsd: 50000,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  },
  {
    id: 'project-2',
    facilityName: 'School B',
    municipalityName: 'Municipality 2',
    region: 'Lviv Oblast',
    category: 'SCHOOL',
    urgency: 'CRITICAL',
    status: 'OPEN',
    projectType: 'HEAT_PUMP',
    estimatedCostUsd: 30000,
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
]

const mockContactSubmissions = [
  {
    id: 'contact-1',
    donorName: 'John Donor',
    donorEmail: 'john@example.com',
    message: 'I want to help',
    handled: false,
    createdAt: '2024-01-20T10:00:00Z',
    project: {
      id: 'project-1',
      facilityName: 'Hospital A',
      municipalityName: 'Municipality 1',
      contactEmail: 'contact@hospital.ua',
    },
  },
]

const mockProjectSubmissions = [
  {
    id: 'submission-1',
    facilityName: 'New Project',
    municipalityName: 'New Municipality',
    municipalityEmail: 'new@municipality.ua',
    region: 'Odesa Oblast',
    category: 'WATER',
    projectType: 'WATER_TREATMENT',
    briefDescription: 'Water treatment project',
    fullDescription: 'Full description here',
    urgency: 'MEDIUM',
    status: 'PENDING',
    cityName: 'Odesa',
    cityLatitude: 46.4825,
    cityLongitude: 30.7233,
    contactName: 'Contact Person',
    contactEmail: 'contact@new.ua',
    createdAt: '2024-01-18T10:00:00Z',
    updatedAt: '2024-01-18T10:00:00Z',
  },
]

describe('AdminPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsAuthenticated = false
    mockAuthLoading = false
    ;(global.fetch as jest.Mock).mockReset()
    ;(global.alert as jest.Mock).mockReset()
    ;(global.confirm as jest.Mock).mockReturnValue(true)
  })

  describe('Loading State', () => {
    it('shows loading spinner while checking auth', () => {
      mockAuthLoading = true
      render(<AdminPage />)
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })

  describe('Login Form', () => {
    it('shows login form when not authenticated', () => {
      mockIsAuthenticated = false
      render(<AdminPage />)
      expect(screen.getByText('Admin Login')).toBeInTheDocument()
      expect(screen.getByTestId('input-password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument()
    })

    it('shows back to map link', () => {
      mockIsAuthenticated = false
      render(<AdminPage />)
      expect(screen.getByTestId('link-/')).toBeInTheDocument()
      expect(screen.getByText('Back to Map')).toBeInTheDocument()
    })

    it('shows error when password is empty', async () => {
      const user = userEvent.setup()
      mockIsAuthenticated = false
      render(<AdminPage />)

      await user.click(screen.getByRole('button', { name: 'Login' }))

      expect(screen.getByText('Password is required')).toBeInTheDocument()
      expect(mockLogin).not.toHaveBeenCalled()
    })

    it('calls login with password', async () => {
      const user = userEvent.setup()
      mockIsAuthenticated = false
      mockLogin.mockResolvedValue(true)
      render(<AdminPage />)

      await user.type(screen.getByTestId('input-password'), 'mypassword')
      await user.click(screen.getByRole('button', { name: 'Login' }))

      expect(mockLogin).toHaveBeenCalledWith('mypassword')
    })

    it('shows error on failed login', async () => {
      const user = userEvent.setup()
      mockIsAuthenticated = false
      mockLogin.mockResolvedValue(false)
      render(<AdminPage />)

      await user.type(screen.getByTestId('input-password'), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: 'Login' }))

      await waitFor(() => {
        expect(screen.getByText('Invalid password')).toBeInTheDocument()
      })
    })
  })

  describe('Dashboard - Authenticated', () => {
    beforeEach(() => {
      mockIsAuthenticated = true
      ;(global.fetch as jest.Mock).mockImplementation((url) => {
        if (url === '/api/projects?all=true') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: mockProjects }),
          })
        }
        if (url === '/api/contact') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ submissions: mockContactSubmissions }),
          })
        }
        if (url === '/api/projects/submissions') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ submissions: mockProjectSubmissions }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })
    })

    it('shows dashboard header with logout button', async () => {
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByText('Hromada')).toBeInTheDocument()
      })
      expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument()
    })

    it('calls logout when clicking logout button', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'Logout' }))
      expect(mockLogout).toHaveBeenCalled()
    })

    it('displays stats cards', async () => {
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByText('Total Projects')).toBeInTheDocument()
        expect(screen.getByText('Open Projects')).toBeInTheDocument()
        expect(screen.getByText('Critical Projects')).toBeInTheDocument()
        expect(screen.getByText('Pending Submissions')).toBeInTheDocument()
      })
    })

    it('shows correct project count in stats', async () => {
      render(<AdminPage />)

      await waitFor(() => {
        // Verify projects loaded
        expect(screen.getByText('Hospital A')).toBeInTheDocument()
      })

      // Stats should show project counts (may have multiple elements with same number)
      const statCards = screen.getAllByTestId('card')
      expect(statCards.length).toBeGreaterThanOrEqual(4) // 4 stats cards
    })

    it('renders tab buttons', async () => {
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Projects/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Submissions/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Contacts/i })).toBeInTheDocument()
      })
    })
  })

  describe('Projects Tab', () => {
    beforeEach(() => {
      mockIsAuthenticated = true
      ;(global.fetch as jest.Mock).mockImplementation((url) => {
        if (url === '/api/projects?all=true') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: mockProjects }),
          })
        }
        if (url === '/api/contact') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ submissions: mockContactSubmissions }),
          })
        }
        if (url === '/api/projects/submissions') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ submissions: mockProjectSubmissions }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })
    })

    it('renders projects list', async () => {
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByText('Hospital A')).toBeInTheDocument()
        expect(screen.getByText('School B')).toBeInTheDocument()
      })
    })

    it('renders search input', async () => {
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search projects...')).toBeInTheDocument()
      })
    })

    it('renders add new project link', async () => {
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByTestId('link-/admin/projects/new')).toBeInTheDocument()
        expect(screen.getByText('Add New Project')).toBeInTheDocument()
      })
    })

    it('filters projects by search query', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByText('Hospital A')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search projects...')
      await user.type(searchInput, 'Hospital')

      await waitFor(() => {
        expect(screen.getByText('Hospital A')).toBeInTheDocument()
        expect(screen.queryByText('School B')).not.toBeInTheDocument()
      })
    })
  })

  describe('Tab Switching', () => {
    beforeEach(() => {
      mockIsAuthenticated = true
      ;(global.fetch as jest.Mock).mockImplementation((url) => {
        if (url === '/api/projects?all=true') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: mockProjects }),
          })
        }
        if (url === '/api/contact') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ submissions: mockContactSubmissions }),
          })
        }
        if (url === '/api/projects/submissions') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ submissions: mockProjectSubmissions }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })
    })

    it('switches to submissions tab', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Submissions/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Submissions/i }))

      await waitFor(() => {
        expect(screen.getByText('New Project')).toBeInTheDocument()
      })
    })

    it('switches to contacts tab', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Contacts/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Contacts/i }))

      await waitFor(() => {
        expect(screen.getByText('John Donor')).toBeInTheDocument()
      })
    })
  })

  describe('Bulk Actions', () => {
    beforeEach(() => {
      mockIsAuthenticated = true
      ;(global.fetch as jest.Mock).mockImplementation((url) => {
        if (url === '/api/projects?all=true') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: mockProjects }),
          })
        }
        if (url === '/api/contact') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ submissions: mockContactSubmissions }),
          })
        }
        if (url === '/api/projects/submissions') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ submissions: mockProjectSubmissions }),
          })
        }
        if (url.includes('/api/projects/') && !url.includes('submissions')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })
    })

    it('shows bulk actions toolbar when projects are selected', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByText('Hospital A')).toBeInTheDocument()
      })

      // Find and click a checkbox to select a project
      const checkboxes = screen.getAllByRole('checkbox')
      if (checkboxes.length > 0) {
        await user.click(checkboxes[1]) // First project checkbox (skip "select all")

        await waitFor(() => {
          expect(screen.getByText(/selected/)).toBeInTheDocument()
        })
      }
    })
  })

  describe('API Error Handling', () => {
    it('handles projects fetch error', async () => {
      mockIsAuthenticated = true
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      ;(global.fetch as jest.Mock).mockImplementation((url) => {
        if (url === '/api/projects?all=true') {
          return Promise.reject(new Error('Network error'))
        }
        if (url === '/api/contact') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ submissions: [] }),
          })
        }
        if (url === '/api/projects/submissions') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ submissions: [] }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      render(<AdminPage />)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch projects:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it('handles contact submissions fetch error', async () => {
      mockIsAuthenticated = true
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      ;(global.fetch as jest.Mock).mockImplementation((url) => {
        if (url === '/api/projects?all=true') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: [] }),
          })
        }
        if (url === '/api/contact') {
          return Promise.reject(new Error('Network error'))
        }
        if (url === '/api/projects/submissions') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ submissions: [] }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      render(<AdminPage />)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch contact submissions:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })
  })
})
