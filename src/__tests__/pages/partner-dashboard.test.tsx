import { render, screen, waitFor } from '@testing-library/react'
import PartnerDashboardPage from '@/app/[locale]/(public)/partner/page'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'partner.title': 'Partner',
      'partner.stats.totalSubmissions': 'Total Submissions',
      'partner.stats.pending': 'Pending',
      'partner.stats.approved': 'Approved',
      'partner.stats.rejected': 'Rejected',
      'partner.projects.title': 'Your Projects',
      'partner.projects.addNew': 'Add New Project',
      'partner.projects.noProjects': 'No projects submitted yet',
      'partner.projects.table.facility': 'Facility',
      'partner.projects.table.municipality': 'Municipality',
      'partner.projects.table.category': 'Category',
      'partner.projects.table.status': 'Status',
      'partner.projects.table.submitted': 'Submitted',
      'partner.projects.viewDetails': 'View Details',
      'partner.projects.edit': 'Edit',
      'admin.projects.table.actions': 'Actions',
      'admin.submissions.pending': 'Pending',
      'admin.submissions.approved': 'Approved',
      'admin.submissions.rejected': 'Rejected',
      'admin.loggedInAs': 'Logged in as',
      'admin.nav.logout': 'Logout',
      'categories.HOSPITAL': 'Hospital',
      'categories.SCHOOL': 'School',
      'categories.WATER': 'Water',
      'categories.ENERGY': 'Energy',
      'categories.OTHER': 'Other',
    }
    return translations[key] || key
  },
}))

// Mock i18n navigation
const mockPush = jest.fn()
jest.mock('@/i18n/navigation', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock useAuth hook
const mockLogout = jest.fn()
const mockIsPartner = jest.fn()
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: mockAuthState.isAuthenticated,
    isLoading: mockAuthState.isLoading,
    isPartner: mockIsPartner,
    user: mockAuthState.user,
    logout: mockLogout,
  }),
}))

// Mock Button component
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, variant, size }: any) => (
    <button onClick={onClick} data-variant={variant} data-size={size}>
      {children}
    </button>
  ),
}))

// Mock Card components
jest.mock('@/components/ui/Card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card">{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <h3 data-testid="card-title">{children}</h3>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
}))

// Mock Badge component
jest.mock('@/components/ui/Badge', () => ({
  Badge: ({ children, variant, dot, dotColor, size }: any) => (
    <span data-testid="badge" data-variant={variant} data-dot={dot} data-dot-color={dotColor} data-size={size}>
      {children}
    </span>
  ),
}))

// Mock LoadingSpinner component
jest.mock('@/components/ui/LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: { size?: string }) => (
    <div data-testid="loading-spinner" data-size={size}>Loading...</div>
  ),
}))

// Mock types module
jest.mock('@/types', () => ({
  CATEGORY_CONFIG: {
    HOSPITAL: { color: '#ff0000', icon: '🏥' },
    SCHOOL: { color: '#00ff00', icon: '🏫' },
    WATER: { color: '#0000ff', icon: '💧' },
    ENERGY: { color: '#ffff00', icon: '⚡' },
    OTHER: { color: '#808080', icon: '🏢' },
  },
}))

// Mock fetch
global.fetch = jest.fn()

// Auth state that can be modified per test
const mockAuthState = {
  isAuthenticated: true,
  isLoading: false,
  user: { name: 'Test Partner', email: 'partner@example.com' },
}

describe('PartnerDashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPush.mockClear()
    mockLogout.mockClear()
    mockIsPartner.mockReturnValue(true)
    mockAuthState.isAuthenticated = true
    mockAuthState.isLoading = false
    mockAuthState.user = { name: 'Test Partner', email: 'partner@example.com' }
    ;(global.fetch as jest.Mock).mockReset()
  })

  describe('Loading State', () => {
    it('shows loading spinner while authentication is loading', async () => {
      mockAuthState.isLoading = true
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ submissions: [] }),
      })

      render(<PartnerDashboardPage />)

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })

  describe('Authentication Redirects', () => {
    it('redirects to login when not authenticated', async () => {
      mockAuthState.isAuthenticated = false
      mockAuthState.isLoading = false
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ submissions: [] }),
      })

      render(<PartnerDashboardPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login')
      })
    })

    it('redirects to home when authenticated but not a partner', async () => {
      mockAuthState.isAuthenticated = true
      mockAuthState.isLoading = false
      mockIsPartner.mockReturnValue(false)
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ submissions: [] }),
      })

      render(<PartnerDashboardPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/')
      })
    })

    it('shows loading spinner when authenticated but not a partner (before redirect)', async () => {
      mockAuthState.isAuthenticated = true
      mockAuthState.isLoading = false
      mockIsPartner.mockReturnValue(false)
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ submissions: [] }),
      })

      render(<PartnerDashboardPage />)

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })

  describe('Authenticated Partner View', () => {
    beforeEach(() => {
      mockAuthState.isAuthenticated = true
      mockAuthState.isLoading = false
      mockIsPartner.mockReturnValue(true)
    })

    it('renders header with partner badge', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ submissions: [] }),
      })

      render(<PartnerDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('hromada')).toBeInTheDocument()
        expect(screen.getByText('Partner')).toBeInTheDocument()
      })
    })

    it('displays user name when logged in', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ submissions: [] }),
      })

      render(<PartnerDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Partner')).toBeInTheDocument()
        expect(screen.getByText(/Logged in as/)).toBeInTheDocument()
      })
    })

    it('renders logout button', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ submissions: [] }),
      })

      render(<PartnerDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Logout')).toBeInTheDocument()
      })
    })

    it('calls logout when logout button is clicked', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ submissions: [] }),
      })

      render(<PartnerDashboardPage />)

      await waitFor(() => {
        const logoutButton = screen.getByText('Logout')
        logoutButton.click()
      })

      expect(mockLogout).toHaveBeenCalled()
    })
  })

  describe('Stats Display', () => {
    it('displays correct stats with no submissions', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ submissions: [] }),
      })

      render(<PartnerDashboardPage />)

      await waitFor(() => {
        // All stats should be 0
        const zeros = screen.getAllByText('0')
        expect(zeros.length).toBe(4)
        expect(screen.getByText('Total Submissions')).toBeInTheDocument()
      })
    })

    it('displays correct stats with multiple submissions', async () => {
      const submissions = [
        { id: '1', facilityName: 'Hospital 1', status: 'PENDING', category: 'HOSPITAL', createdAt: '2026-01-01' },
        { id: '2', facilityName: 'School 1', status: 'APPROVED', category: 'SCHOOL', createdAt: '2026-01-02' },
        { id: '3', facilityName: 'Hospital 2', status: 'APPROVED', category: 'HOSPITAL', createdAt: '2026-01-03' },
        { id: '4', facilityName: 'Water Plant', status: 'REJECTED', category: 'WATER', createdAt: '2026-01-04' },
      ]
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ submissions }),
      })

      render(<PartnerDashboardPage />)

      await waitFor(() => {
        // Total: 4
        const statNumbers = screen.getAllByText(/^[0-4]$/)
        expect(statNumbers.length).toBeGreaterThanOrEqual(4)
      })
    })
  })

  describe('Submissions Loading', () => {
    it('shows loading spinner while fetching submissions', async () => {
      // Create a promise that never resolves to keep loading state
      ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))

      render(<PartnerDashboardPage />)

      // The page shows loading spinner during fetch
      await waitFor(() => {
        const spinners = screen.queryAllByTestId('loading-spinner')
        expect(spinners.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('fetches submissions from API', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ submissions: [] }),
      })

      render(<PartnerDashboardPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/partner/projects')
      })
    })

    it('handles fetch error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(<PartnerDashboardPage />)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch submissions:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it('handles non-ok response gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      })

      render(<PartnerDashboardPage />)

      await waitFor(() => {
        // Should show empty state
        expect(screen.getByText('No projects submitted yet')).toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no submissions', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ submissions: [] }),
      })

      render(<PartnerDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('No projects submitted yet')).toBeInTheDocument()
      })
    })

    it('shows add new project button in empty state', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ submissions: [] }),
      })

      render(<PartnerDashboardPage />)

      await waitFor(() => {
        const addButtons = screen.getAllByText('Add New Project')
        expect(addButtons.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  describe('Submissions Table', () => {
    const mockSubmissions = [
      {
        id: 'sub-1',
        facilityName: 'Test Hospital',
        municipalityName: 'Kyiv',
        briefDescription: 'A hospital project',
        category: 'HOSPITAL',
        projectType: 'SOLAR_PV',
        status: 'PENDING',
        rejectionReason: null,
        approvedProjectId: null,
        createdAt: '2026-01-15T10:00:00Z',
      },
      {
        id: 'sub-2',
        facilityName: 'Test School',
        municipalityName: 'Lviv',
        briefDescription: 'A school project',
        category: 'SCHOOL',
        projectType: 'HEAT_PUMP',
        status: 'APPROVED',
        rejectionReason: null,
        approvedProjectId: 'project-123',
        createdAt: '2026-01-10T10:00:00Z',
      },
      {
        id: 'sub-3',
        facilityName: 'Test Water Plant',
        municipalityName: 'Odesa',
        briefDescription: 'A water project',
        category: 'WATER',
        projectType: 'SOLAR_PV',
        status: 'REJECTED',
        rejectionReason: 'Incomplete documentation',
        approvedProjectId: null,
        createdAt: '2026-01-05T10:00:00Z',
      },
    ]

    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ submissions: mockSubmissions }),
      })
    })

    it('renders submissions table when there are submissions', async () => {
      render(<PartnerDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Hospital')).toBeInTheDocument()
        expect(screen.getByText('Test School')).toBeInTheDocument()
        expect(screen.getByText('Test Water Plant')).toBeInTheDocument()
      })
    })

    it('displays municipality names', async () => {
      render(<PartnerDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Kyiv')).toBeInTheDocument()
        expect(screen.getByText('Lviv')).toBeInTheDocument()
        expect(screen.getByText('Odesa')).toBeInTheDocument()
      })
    })

    it('displays brief descriptions', async () => {
      render(<PartnerDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('A hospital project')).toBeInTheDocument()
        expect(screen.getByText('A school project')).toBeInTheDocument()
        expect(screen.getByText('A water project')).toBeInTheDocument()
      })
    })

    it('displays status badges', async () => {
      render(<PartnerDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument()
        expect(screen.getByText('Approved')).toBeInTheDocument()
        expect(screen.getByText('Rejected')).toBeInTheDocument()
      })
    })

    it('displays rejection reason for rejected submissions', async () => {
      render(<PartnerDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Incomplete documentation')).toBeInTheDocument()
      })
    })

    it('shows View Details link for approved submissions', async () => {
      render(<PartnerDashboardPage />)

      await waitFor(() => {
        const viewDetailsLink = screen.getByText('View Details')
        expect(viewDetailsLink).toBeInTheDocument()
        expect(viewDetailsLink.closest('a')).toHaveAttribute('href', '/projects/project-123')
      })
    })

    it('shows Edit link for pending submissions', async () => {
      render(<PartnerDashboardPage />)

      await waitFor(() => {
        const editLink = screen.getByText('Edit')
        expect(editLink).toBeInTheDocument()
        expect(editLink.closest('a')).toHaveAttribute('href', '/partner/projects/sub-1')
      })
    })

    it('does not show action buttons for rejected submissions', async () => {
      render(<PartnerDashboardPage />)

      await waitFor(() => {
        // Count the action buttons - should be 2 (one for pending, one for approved)
        const viewDetails = screen.queryAllByText('View Details')
        const editButtons = screen.queryAllByText('Edit')
        expect(viewDetails.length).toBe(1) // Only for approved
        expect(editButtons.length).toBe(1) // Only for pending
      })
    })

    it('displays formatted dates', async () => {
      render(<PartnerDashboardPage />)

      await waitFor(() => {
        // Dates should be formatted as locale date strings
        // The exact format depends on the locale
        const dateElements = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/)
        expect(dateElements.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('displays category badges with correct styling', async () => {
      render(<PartnerDashboardPage />)

      await waitFor(() => {
        const badges = screen.getAllByTestId('badge')
        // Should have category badges
        expect(badges.length).toBeGreaterThanOrEqual(3)
      })
    })
  })

  describe('Add New Project Link', () => {
    it('renders add new project link', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ submissions: [] }),
      })

      render(<PartnerDashboardPage />)

      await waitFor(() => {
        const addLinks = screen.getAllByText('Add New Project')
        expect(addLinks[0].closest('a')).toHaveAttribute('href', '/partner/projects/new')
      })
    })
  })

  describe('Category Display', () => {
    it('displays category for known categories', async () => {
      const submissions = [
        {
          id: '1',
          facilityName: 'Test Facility',
          municipalityName: 'Kyiv',
          category: 'HOSPITAL',
          status: 'PENDING',
          createdAt: '2026-01-01',
        },
      ]
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ submissions }),
      })

      render(<PartnerDashboardPage />)

      await waitFor(() => {
        // The badge shows the translated category
        const badges = screen.getAllByTestId('badge')
        expect(badges.some(badge => badge.textContent?.includes('Hospital'))).toBe(true)
      })
    })

    it('displays raw category for unknown categories', async () => {
      const submissions = [
        {
          id: '1',
          facilityName: 'Unknown',
          municipalityName: 'Kyiv',
          category: 'UNKNOWN_CATEGORY',
          status: 'PENDING',
          createdAt: '2026-01-01',
        },
      ]
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ submissions }),
      })

      render(<PartnerDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('UNKNOWN_CATEGORY')).toBeInTheDocument()
      })
    })
  })
})
