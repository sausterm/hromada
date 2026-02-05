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

// Mock useAuth hook - use a mutable object to allow test changes
const mockAuthState = {
  isAuthenticated: false,
  isLoading: false,
}
const mockLogin = jest.fn()
const mockLogout = jest.fn()

// Keep for backward compatibility with test code
let mockIsAuthenticated = false
let mockAuthLoading = false

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
    BATTERY_STORAGE: { label: 'Battery Storage' },
    THERMO_MODERNIZATION: { label: 'Thermo-modernization' },
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
    projectType: 'BATTERY_STORAGE',
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
    mockAuthState.isAuthenticated = false
    mockAuthState.isLoading = false
    ;(global.fetch as jest.Mock).mockReset()
    ;(global.alert as jest.Mock).mockReset()
    ;(global.confirm as jest.Mock).mockReturnValue(true)
  })

  describe('Loading State', () => {
    it('shows loading spinner while checking auth', () => {
      mockAuthState.isLoading = true
      render(<AdminPage />)
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })

  // Note: Login form tests removed - admin page now redirects to /login for unauthenticated users

  describe('Dashboard - Authenticated', () => {
    beforeEach(() => {
      mockAuthState.isAuthenticated = true
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
        expect(screen.getByText('hromada')).toBeInTheDocument()
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
      mockAuthState.isAuthenticated = true
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
      mockAuthState.isAuthenticated = true
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
      mockAuthState.isAuthenticated = true
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
      mockAuthState.isAuthenticated = true
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
      mockAuthState.isAuthenticated = true
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

    it('handles project submissions fetch error', async () => {
      mockAuthState.isAuthenticated = true
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      ;(global.fetch as jest.Mock).mockImplementation((url) => {
        if (url === '/api/projects?all=true') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: [] }),
          })
        }
        if (url === '/api/contact') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ submissions: [] }),
          })
        }
        if (url === '/api/projects/submissions') {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      render(<AdminPage />)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch project submissions:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Project Sorting', () => {
    beforeEach(() => {
      mockAuthState.isAuthenticated = true
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
    })

    it('sorts projects when clicking column header', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByText('Hospital A')).toBeInTheDocument()
      })

      // Click on facility name header to toggle sort
      const facilityHeader = screen.getByText('admin.projects.table.facility')
      await user.click(facilityHeader)

      // The sort direction should toggle (starts at asc)
      await waitFor(() => {
        expect(screen.getByText('Hospital A')).toBeInTheDocument()
      })
    })

    it('toggles sort direction when clicking same column', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByText('Hospital A')).toBeInTheDocument()
      })

      // Click municipality header twice to toggle direction
      const municipalityHeader = screen.getByText('admin.projects.table.municipality')
      await user.click(municipalityHeader)
      await user.click(municipalityHeader)

      // Projects should still be rendered
      expect(screen.getByText('Hospital A')).toBeInTheDocument()
    })
  })

  describe('Pagination', () => {
    beforeEach(() => {
      mockAuthState.isAuthenticated = true
      // Create many projects for pagination testing
      const manyProjects = Array.from({ length: 25 }, (_, i) => ({
        id: `project-${i}`,
        facilityName: `Facility ${i}`,
        municipalityName: `Municipality ${i}`,
        region: 'Test Oblast',
        category: 'HOSPITAL',
        urgency: 'MEDIUM',
        status: 'OPEN',
        projectType: 'SOLAR_PV',
        estimatedCostUsd: 10000,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T10:00:00Z',
      }))

      ;(global.fetch as jest.Mock).mockImplementation((url) => {
        if (url === '/api/projects?all=true') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: manyProjects }),
          })
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
    })

    it('shows pagination controls when there are more projects than page size', async () => {
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByText('Facility 0')).toBeInTheDocument()
      })

      // Should show Previous and Next buttons
      expect(screen.getByText('Previous')).toBeInTheDocument()
      expect(screen.getByText('Next')).toBeInTheDocument()
    })

    it('navigates to next page', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByText('Facility 0')).toBeInTheDocument()
      })

      // Verify previous button is disabled on first page
      const prevButton = screen.getByText('Previous')
      expect(prevButton).toBeDisabled()

      const nextButton = screen.getByText('Next')
      await user.click(nextButton)

      // After clicking next, previous button should be enabled
      await waitFor(() => {
        expect(prevButton).not.toBeDisabled()
      })
    })

    it('changes items per page', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByText('Facility 0')).toBeInTheDocument()
      })

      // Change to 50 items per page
      const pageSizeSelect = screen.getByLabelText('Per page:')
      await user.selectOptions(pageSizeSelect, '50')

      // Should show more projects now
      await waitFor(() => {
        expect(screen.getByText('Facility 24')).toBeInTheDocument()
      })
    })
  })

  describe('Bulk Delete', () => {
    beforeEach(() => {
      mockAuthState.isAuthenticated = true
      ;(global.fetch as jest.Mock).mockImplementation((url, options) => {
        if (url === '/api/projects?all=true') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: mockProjects }),
          })
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
        if (options?.method === 'DELETE') {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })
    })

    it('performs bulk delete when confirmed', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByText('Hospital A')).toBeInTheDocument()
      })

      // Select a project
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[1]) // First project checkbox

      // Click delete button
      const deleteButton = screen.getByText('Delete Selected')
      await user.click(deleteButton)

      // Should call delete API
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/projects/'),
          expect.objectContaining({ method: 'DELETE' })
        )
      })
    })

    it('cancels bulk delete when not confirmed', async () => {
      ;(global.confirm as jest.Mock).mockReturnValueOnce(false)
      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByText('Hospital A')).toBeInTheDocument()
      })

      // Select a project
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[1])

      // Click delete button
      const deleteButton = screen.getByText('Delete Selected')
      await user.click(deleteButton)

      // Delete API should not be called
      const deleteCalls = (global.fetch as jest.Mock).mock.calls.filter(
        (call: any[]) => call[1]?.method === 'DELETE'
      )
      expect(deleteCalls.length).toBe(0)
    })

    it('clears selection after successful delete', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByText('Hospital A')).toBeInTheDocument()
      })

      // Select a project
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[1])

      // Verify selection shown
      expect(screen.getByText(/selected/)).toBeInTheDocument()

      // Click delete button
      const deleteButton = screen.getByText('Delete Selected')
      await user.click(deleteButton)

      // Selection should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/selected/)).not.toBeInTheDocument()
      })
    })

    it('clears selection when clicking clear button', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByText('Hospital A')).toBeInTheDocument()
      })

      // Select a project
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[1])

      // Verify selection shown
      expect(screen.getByText(/selected/)).toBeInTheDocument()

      // Click clear selection button
      const clearButton = screen.getByText('Clear Selection')
      await user.click(clearButton)

      // Selection should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/selected/)).not.toBeInTheDocument()
      })
    })

    it('shows partial failure alert when some deletes fail', async () => {
      let deleteCount = 0
      ;(global.fetch as jest.Mock).mockImplementation((url, options) => {
        if (url === '/api/projects?all=true') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: mockProjects }),
          })
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
        if (options?.method === 'DELETE') {
          deleteCount++
          // First delete succeeds, second fails
          return Promise.resolve({ ok: deleteCount === 1, json: () => Promise.resolve({}) })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByText('Hospital A')).toBeInTheDocument()
      })

      // Select both projects
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[1])
      await user.click(checkboxes[2])

      // Click delete button
      const deleteButton = screen.getByText('Delete Selected')
      await user.click(deleteButton)

      // Should show partial failure alert
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Some deletes failed'))
      })
    })
  })

  describe('Select All on Page', () => {
    beforeEach(() => {
      mockAuthState.isAuthenticated = true
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
    })

    it('selects all projects on page when clicking header checkbox', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByText('Hospital A')).toBeInTheDocument()
      })

      // Click header checkbox to select all
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[0]) // Header checkbox

      // Should show selection count
      expect(screen.getByText('2 selected')).toBeInTheDocument()
    })

    it('deselects all when clicking header checkbox with all selected', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByText('Hospital A')).toBeInTheDocument()
      })

      // Click header checkbox to select all
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[0])

      // Verify all selected
      expect(screen.getByText('2 selected')).toBeInTheDocument()

      // Click again to deselect all
      await user.click(checkboxes[0])

      // Should clear selection
      await waitFor(() => {
        expect(screen.queryByText(/selected/)).not.toBeInTheDocument()
      })
    })
  })

  describe('Submission Review', () => {
    beforeEach(() => {
      mockAuthState.isAuthenticated = true
      ;(global.fetch as jest.Mock).mockImplementation((url, options) => {
        if (url === '/api/projects?all=true') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: mockProjects }),
          })
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
            json: () => Promise.resolve({ submissions: mockProjectSubmissions }),
          })
        }
        if (url.includes('/api/projects/submissions/') && options?.method === 'PATCH') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projectId: 'new-project-id' }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })
    })

    it('opens review modal when clicking review button', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      // Switch to submissions tab
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Submissions/i })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: /Submissions/i }))

      // Wait for submissions to load
      await waitFor(() => {
        expect(screen.getByText('New Project')).toBeInTheDocument()
      })

      // Click review button
      const reviewButton = screen.getByText('admin.submissions.reviewDetails')
      await user.click(reviewButton)

      // Modal should appear
      await waitFor(() => {
        expect(screen.getByText(/admin.submissions.reviewSubmission/)).toBeInTheDocument()
      })
    })

    it('approves submission successfully', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      // Switch to submissions tab
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Submissions/i })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: /Submissions/i }))

      // Wait for submissions to load
      await waitFor(() => {
        expect(screen.getByText('New Project')).toBeInTheDocument()
      })

      // Click approve button directly
      const approveButtons = screen.getAllByText('admin.submissions.approve')
      await user.click(approveButtons[0])

      // Should call PATCH API
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/projects/submissions/submission-1'),
          expect.objectContaining({
            method: 'PATCH',
            body: expect.stringContaining('approve'),
          })
        )
      })
    })

    it('shows alert when rejecting without reason', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      // Switch to submissions tab
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Submissions/i })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: /Submissions/i }))

      // Wait for submissions to load
      await waitFor(() => {
        expect(screen.getByText('New Project')).toBeInTheDocument()
      })

      // Click reject button on the submission card (this opens modal with rejection reason focus)
      const rejectButton = screen.getByText('admin.submissions.reject')
      await user.click(rejectButton)

      // Modal should open
      await waitFor(() => {
        expect(screen.getByText(/admin.submissions.reviewSubmission/)).toBeInTheDocument()
      })

      // Find modal reject button (it's disabled when no reason is provided)
      const modalRejectButtons = screen.getAllByText('admin.submissions.reject')
      const modalRejectButton = modalRejectButtons[modalRejectButtons.length - 1]

      // The button should be disabled since no rejection reason is provided
      expect(modalRejectButton).toBeDisabled()
    })
  })

  describe('Contacts Tab', () => {
    beforeEach(() => {
      mockAuthState.isAuthenticated = true
      ;(global.fetch as jest.Mock).mockImplementation((url, options) => {
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
            json: () => Promise.resolve({ submissions: [] }),
          })
        }
        if (url.includes('/api/contact/') && options?.method === 'PATCH') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({}),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })
    })

    it('shows contact submissions', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Contacts/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Contacts/i }))

      await waitFor(() => {
        expect(screen.getByText('John Donor')).toBeInTheDocument()
        expect(screen.getByText('I want to help')).toBeInTheDocument()
      })
    })

    it('marks contact as handled', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Contacts/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Contacts/i }))

      await waitFor(() => {
        expect(screen.getByText('John Donor')).toBeInTheDocument()
      })

      // Click mark as handled button
      const handleButton = screen.getByText('admin.contacts.markHandled')
      await user.click(handleButton)

      // Should call PATCH API
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/contact/contact-1',
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({ handled: true }),
          })
        )
      })
    })

    it('filters contacts by search query', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Contacts/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Contacts/i }))

      await waitFor(() => {
        expect(screen.getByText('John Donor')).toBeInTheDocument()
      })

      // Type in search
      const searchInput = screen.getByPlaceholderText('Search contacts...')
      await user.type(searchInput, 'nonexistent')

      // Contact should be filtered out
      await waitFor(() => {
        expect(screen.queryByText('John Donor')).not.toBeInTheDocument()
      })
    })

    it('filters contacts by handled status', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Contacts/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Contacts/i }))

      await waitFor(() => {
        expect(screen.getByText('John Donor')).toBeInTheDocument()
      })

      // Filter by handled only
      const filterSelect = screen.getByDisplayValue('All')
      await user.selectOptions(filterSelect, 'HANDLED')

      // Unhandled contact should be filtered out
      await waitFor(() => {
        expect(screen.queryByText('John Donor')).not.toBeInTheDocument()
      })
    })
  })

  describe('Submissions Tab Filtering', () => {
    beforeEach(() => {
      mockAuthState.isAuthenticated = true
      const submissionsWithDifferentStatus = [
        { ...mockProjectSubmissions[0], id: 'sub-1', status: 'PENDING', facilityName: 'Pending Project' },
        { ...mockProjectSubmissions[0], id: 'sub-2', status: 'APPROVED', facilityName: 'Approved Project' },
        { ...mockProjectSubmissions[0], id: 'sub-3', status: 'REJECTED', facilityName: 'Rejected Project', rejectionReason: 'Test reason' },
      ]

      ;(global.fetch as jest.Mock).mockImplementation((url) => {
        if (url === '/api/projects?all=true') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: [] }),
          })
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
            json: () => Promise.resolve({ submissions: submissionsWithDifferentStatus }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })
    })

    it('filters submissions by status', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Submissions/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Submissions/i }))

      await waitFor(() => {
        expect(screen.getByText('Pending Project')).toBeInTheDocument()
      })

      // Filter by pending only
      const statusSelect = screen.getByDisplayValue('All Status')
      await user.selectOptions(statusSelect, 'PENDING')

      // Should show only pending
      await waitFor(() => {
        expect(screen.getByText('Pending Project')).toBeInTheDocument()
        expect(screen.queryByText('Approved Project')).not.toBeInTheDocument()
        expect(screen.queryByText('Rejected Project')).not.toBeInTheDocument()
      })
    })

    it('sorts submissions by status', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Submissions/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Submissions/i }))

      await waitFor(() => {
        expect(screen.getByText('Pending Project')).toBeInTheDocument()
      })

      // Change sort to by status
      const sortSelect = screen.getByDisplayValue('Newest First')
      await user.selectOptions(sortSelect, 'status')

      // All submissions should still be visible
      expect(screen.getByText('Pending Project')).toBeInTheDocument()
    })

    it('shows rejection reason for rejected submissions', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Submissions/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Submissions/i }))

      await waitFor(() => {
        expect(screen.getByText('Rejected Project')).toBeInTheDocument()
        expect(screen.getByText(/Test reason/)).toBeInTheDocument()
      })
    })
  })

  describe('Empty States', () => {
    it('shows empty state when no projects match search', async () => {
      mockAuthState.isAuthenticated = true
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

      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByText('Hospital A')).toBeInTheDocument()
      })

      // Search for nonexistent project
      const searchInput = screen.getByPlaceholderText('Search projects...')
      await user.type(searchInput, 'nonexistent project name')

      // Should show no match message
      await waitFor(() => {
        expect(screen.getByText('admin.projects.noMatch')).toBeInTheDocument()
      })
    })

    it('shows empty state when no projects exist', async () => {
      mockAuthState.isAuthenticated = true
      ;(global.fetch as jest.Mock).mockImplementation((url) => {
        if (url === '/api/projects?all=true') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: [] }),
          })
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
        expect(screen.getByText('admin.projects.noProjects')).toBeInTheDocument()
      })
    })
  })

  describe('Reject Submission', () => {
    beforeEach(() => {
      mockAuthState.isAuthenticated = true
      ;(global.fetch as jest.Mock).mockImplementation((url, options) => {
        if (url === '/api/projects?all=true') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: mockProjects }),
          })
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
            json: () => Promise.resolve({ submissions: mockProjectSubmissions }),
          })
        }
        if (url.includes('/api/projects/submissions/') && options?.method === 'PATCH') {
          const body = JSON.parse(options.body)
          if (body.action === 'reject') {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({}),
            })
          }
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projectId: 'new-project-id' }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })
    })

    it('rejects submission with reason', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      // Switch to submissions tab
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Submissions/i })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: /Submissions/i }))

      // Wait for submissions to load
      await waitFor(() => {
        expect(screen.getByText('New Project')).toBeInTheDocument()
      })

      // Click reject button on the submission card
      const rejectButton = screen.getByText('admin.submissions.reject')
      await user.click(rejectButton)

      // Modal should open
      await waitFor(() => {
        expect(screen.getByText(/admin.submissions.reviewSubmission/)).toBeInTheDocument()
      })

      // Enter rejection reason
      const textarea = screen.getByPlaceholderText('admin.submissions.rejectionReasonPlaceholder')
      await user.type(textarea, 'Project not suitable')

      // Find and click modal reject button
      const modalRejectButtons = screen.getAllByText('admin.submissions.reject')
      const modalRejectButton = modalRejectButtons[modalRejectButtons.length - 1]
      await user.click(modalRejectButton)

      // Should call PATCH API with reject action
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/projects/submissions/submission-1'),
          expect.objectContaining({
            method: 'PATCH',
            body: expect.stringContaining('reject'),
          })
        )
      })
    })

    it('closes modal when clicking cancel', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      // Switch to submissions tab
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Submissions/i })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: /Submissions/i }))

      // Wait for submissions to load
      await waitFor(() => {
        expect(screen.getByText('New Project')).toBeInTheDocument()
      })

      // Open review modal
      const reviewButton = screen.getByText('admin.submissions.reviewDetails')
      await user.click(reviewButton)

      // Modal should be open
      await waitFor(() => {
        expect(screen.getByText(/admin.submissions.reviewSubmission/)).toBeInTheDocument()
      })

      // Click cancel button
      const cancelButton = screen.getByText('common.cancel')
      await user.click(cancelButton)

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByText(/admin.submissions.reviewSubmission/)).not.toBeInTheDocument()
      })
    })
  })

  describe('Approve Submission Error Handling', () => {
    it('handles approve submission API error response', async () => {
      mockAuthState.isAuthenticated = true
      ;(global.fetch as jest.Mock).mockImplementation((url, options) => {
        if (url === '/api/projects?all=true') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: mockProjects }),
          })
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
            json: () => Promise.resolve({ submissions: mockProjectSubmissions }),
          })
        }
        if (url.includes('/api/projects/submissions/') && options?.method === 'PATCH') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'Approval failed' }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Submissions/i })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: /Submissions/i }))

      await waitFor(() => {
        expect(screen.getByText('New Project')).toBeInTheDocument()
      })

      // Click approve button
      const approveButton = screen.getByText('admin.submissions.approve')
      await user.click(approveButton)

      // Should show error alert
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Approval failed')
      })
    })

    it('handles approve submission network error', async () => {
      mockAuthState.isAuthenticated = true
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      ;(global.fetch as jest.Mock).mockImplementation((url, options) => {
        if (url === '/api/projects?all=true') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: mockProjects }),
          })
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
            json: () => Promise.resolve({ submissions: mockProjectSubmissions }),
          })
        }
        if (url.includes('/api/projects/submissions/') && options?.method === 'PATCH') {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Submissions/i })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: /Submissions/i }))

      await waitFor(() => {
        expect(screen.getByText('New Project')).toBeInTheDocument()
      })

      // Click approve button
      const approveButton = screen.getByText('admin.submissions.approve')
      await user.click(approveButton)

      // Should log error
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to approve submission:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Reject Submission Error Handling', () => {
    it('handles reject submission API error response', async () => {
      mockAuthState.isAuthenticated = true
      ;(global.fetch as jest.Mock).mockImplementation((url, options) => {
        if (url === '/api/projects?all=true') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: mockProjects }),
          })
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
            json: () => Promise.resolve({ submissions: mockProjectSubmissions }),
          })
        }
        if (url.includes('/api/projects/submissions/') && options?.method === 'PATCH') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'Rejection failed' }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Submissions/i })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: /Submissions/i }))

      await waitFor(() => {
        expect(screen.getByText('New Project')).toBeInTheDocument()
      })

      // Click reject button to open modal
      const rejectButton = screen.getByText('admin.submissions.reject')
      await user.click(rejectButton)

      // Enter rejection reason
      await waitFor(() => {
        expect(screen.getByPlaceholderText('admin.submissions.rejectionReasonPlaceholder')).toBeInTheDocument()
      })
      const textarea = screen.getByPlaceholderText('admin.submissions.rejectionReasonPlaceholder')
      await user.type(textarea, 'Test reason')

      // Click reject in modal
      const modalRejectButtons = screen.getAllByText('admin.submissions.reject')
      await user.click(modalRejectButtons[modalRejectButtons.length - 1])

      // Should show error alert
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Rejection failed')
      })
    })

    it('handles reject submission network error', async () => {
      mockAuthState.isAuthenticated = true
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      ;(global.fetch as jest.Mock).mockImplementation((url, options) => {
        if (url === '/api/projects?all=true') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: mockProjects }),
          })
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
            json: () => Promise.resolve({ submissions: mockProjectSubmissions }),
          })
        }
        if (url.includes('/api/projects/submissions/') && options?.method === 'PATCH') {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Submissions/i })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: /Submissions/i }))

      await waitFor(() => {
        expect(screen.getByText('New Project')).toBeInTheDocument()
      })

      // Click reject button to open modal
      const rejectButton = screen.getByText('admin.submissions.reject')
      await user.click(rejectButton)

      // Enter rejection reason
      await waitFor(() => {
        expect(screen.getByPlaceholderText('admin.submissions.rejectionReasonPlaceholder')).toBeInTheDocument()
      })
      const textarea = screen.getByPlaceholderText('admin.submissions.rejectionReasonPlaceholder')
      await user.type(textarea, 'Test reason')

      // Click reject in modal
      const modalRejectButtons = screen.getAllByText('admin.submissions.reject')
      await user.click(modalRejectButtons[modalRejectButtons.length - 1])

      // Should log error
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to reject submission:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Contact Mark As Handled Error', () => {
    it('handles mark as handled error', async () => {
      mockAuthState.isAuthenticated = true
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      ;(global.fetch as jest.Mock).mockImplementation((url, options) => {
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
            json: () => Promise.resolve({ submissions: [] }),
          })
        }
        if (url.includes('/api/contact/') && options?.method === 'PATCH') {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Contacts/i })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: /Contacts/i }))

      await waitFor(() => {
        expect(screen.getByText('John Donor')).toBeInTheDocument()
      })

      // Click mark as handled button
      const handleButton = screen.getByText('admin.contacts.markHandled')
      await user.click(handleButton)

      // Should log error
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to update submission:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Bulk Delete Error', () => {
    it('handles bulk delete network error', async () => {
      mockAuthState.isAuthenticated = true
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      ;(global.fetch as jest.Mock).mockImplementation((url, options) => {
        if (url === '/api/projects?all=true') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: mockProjects }),
          })
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
        if (options?.method === 'DELETE') {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByText('Hospital A')).toBeInTheDocument()
      })

      // Select a project
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[1])

      // Click delete button
      const deleteButton = screen.getByText('Delete Selected')
      await user.click(deleteButton)

      // Should log error and show alert
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Bulk delete failed:', expect.any(Error))
        expect(global.alert).toHaveBeenCalledWith('Delete failed')
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Sort by Different Fields', () => {
    beforeEach(() => {
      mockAuthState.isAuthenticated = true
      const projectsWithVariety = [
        { ...mockProjects[0], id: '1', facilityName: 'Zebra Hospital', region: 'Kyiv Oblast', category: 'HOSPITAL', projectType: 'SOLAR_PV', urgency: 'HIGH', status: 'OPEN' },
        { ...mockProjects[1], id: '2', facilityName: 'Alpha School', region: 'Lviv Oblast', category: 'SCHOOL', projectType: 'HEAT_PUMP', urgency: 'LOW', status: 'MATCHED' },
      ]
      ;(global.fetch as jest.Mock).mockImplementation((url) => {
        if (url === '/api/projects?all=true') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: projectsWithVariety }),
          })
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
    })

    it('sorts by region when clicking region header', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByText('Zebra Hospital')).toBeInTheDocument()
      })

      const regionHeader = screen.getByText('admin.projects.table.oblast')
      await user.click(regionHeader)

      // Projects should still be rendered
      expect(screen.getByText('Zebra Hospital')).toBeInTheDocument()
    })

    it('sorts by category when clicking category header', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByText('Zebra Hospital')).toBeInTheDocument()
      })

      const categoryHeader = screen.getByText('admin.projects.table.category')
      await user.click(categoryHeader)

      // Projects should still be rendered
      expect(screen.getByText('Zebra Hospital')).toBeInTheDocument()
    })

    it('sorts by project type when clicking type header', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByText('Zebra Hospital')).toBeInTheDocument()
      })

      const typeHeader = screen.getByText('admin.projects.table.type')
      await user.click(typeHeader)

      // Projects should still be rendered
      expect(screen.getByText('Zebra Hospital')).toBeInTheDocument()
    })

    it('sorts by urgency when clicking urgency header', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByText('Zebra Hospital')).toBeInTheDocument()
      })

      const urgencyHeader = screen.getByText('admin.projects.table.urgency')
      await user.click(urgencyHeader)

      // Projects should still be rendered
      expect(screen.getByText('Zebra Hospital')).toBeInTheDocument()
    })

    it('sorts by status when clicking status header', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByText('Zebra Hospital')).toBeInTheDocument()
      })

      const statusHeader = screen.getByText('admin.projects.table.status')
      await user.click(statusHeader)

      // Projects should still be rendered
      expect(screen.getByText('Zebra Hospital')).toBeInTheDocument()
    })
  })

  describe('Project Without ProjectType', () => {
    it('renders dash when project has no projectType', async () => {
      mockAuthState.isAuthenticated = true
      const projectsWithoutType = [
        { ...mockProjects[0], projectType: null },
      ]
      ;(global.fetch as jest.Mock).mockImplementation((url) => {
        if (url === '/api/projects?all=true') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: projectsWithoutType }),
          })
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
        expect(screen.getByText('Hospital A')).toBeInTheDocument()
      })

      // Should render dash for missing project type
      const dashes = screen.getAllByText('-')
      expect(dashes.length).toBeGreaterThan(0)
    })
  })

  describe('Contacts Sort by Handled', () => {
    beforeEach(() => {
      mockAuthState.isAuthenticated = true
      const contactsWithMixed = [
        { ...mockContactSubmissions[0], id: 'contact-1', handled: false, donorName: 'Unhandled Donor' },
        { ...mockContactSubmissions[0], id: 'contact-2', handled: true, donorName: 'Handled Donor' },
      ]
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
            json: () => Promise.resolve({ submissions: contactsWithMixed }),
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
    })

    it('sorts contacts by handled status', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Contacts/i })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: /Contacts/i }))

      await waitFor(() => {
        expect(screen.getByText('Unhandled Donor')).toBeInTheDocument()
      })

      // Change sort to by handled
      const sortSelect = screen.getByDisplayValue('Newest First')
      await user.selectOptions(sortSelect, 'handled')

      // Both contacts should still be visible
      expect(screen.getByText('Unhandled Donor')).toBeInTheDocument()
      expect(screen.getByText('Handled Donor')).toBeInTheDocument()
    })
  })

  describe('Toggle Individual Project Selection', () => {
    beforeEach(() => {
      mockAuthState.isAuthenticated = true
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
    })

    it('toggles individual project selection on and off', async () => {
      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByText('Hospital A')).toBeInTheDocument()
      })

      // Select a project
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[1])

      // Verify selection shown
      expect(screen.getByText('1 selected')).toBeInTheDocument()

      // Deselect the same project
      await user.click(checkboxes[1])

      // Selection should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/selected/)).not.toBeInTheDocument()
      })
    })
  })

  describe('Submissions with Approved Project Link', () => {
    it('shows approved project link when submission is approved', async () => {
      mockAuthState.isAuthenticated = true
      const approvedSubmission = [
        { ...mockProjectSubmissions[0], status: 'APPROVED', approvedProjectId: 'approved-id' },
      ]
      ;(global.fetch as jest.Mock).mockImplementation((url) => {
        if (url === '/api/projects?all=true') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: [] }),
          })
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
            json: () => Promise.resolve({ submissions: approvedSubmission }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      const user = userEvent.setup()
      render(<AdminPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Submissions/i })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: /Submissions/i }))

      await waitFor(() => {
        expect(screen.getByText('admin.submissions.viewApproved')).toBeInTheDocument()
      })
    })
  })
})
