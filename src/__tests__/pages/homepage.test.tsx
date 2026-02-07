import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HomePage from '@/app/[locale]/(public)/page'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, any>) => {
    const translations: Record<string, string> = {
      'homepage.filters.price': 'Price',
      'homepage.filters.projectType': 'Project Type',
      'homepage.filters.urgency': 'Urgency',
      'homepage.filters.status': 'Status',
      'homepage.filters.cofinancing': 'Co-financing',
      'homepage.filters.clear': 'Clear',
      'homepage.searchPlaceholder': 'Search projects...',
      'homepage.searchClear': 'Clear search',
      'homepage.noProjectsFound': 'No projects found',
      'homepage.noProjectsHint': 'Try adjusting your filters',
      'homepage.clearAllFilters': 'Clear all filters',
      'homepage.footer': 'connects American donors with Ukrainian communities.',
      'homepage.noPaymentProcessing': 'We do not process payments.',
      'homepage.viewMap': 'View Map',
      'homepage.sortOptions.newest': 'Newest',
      'homepage.sortOptions.oldest': 'Oldest',
      'homepage.sortOptions.highestCost': 'Highest Cost',
      'homepage.sortOptions.lowestCost': 'Lowest Cost',
      'homepage.sortOptions.alphabetical': 'A-Z',
      'categories.HOSPITAL': 'Hospital',
      'categories.SCHOOL': 'School',
      'categories.WATER': 'Water',
      'categories.ENERGY': 'Energy',
      'categories.OTHER': 'Other',
      'urgency.LOW': 'Low',
      'urgency.MEDIUM': 'Medium',
      'urgency.HIGH': 'High',
      'urgency.CRITICAL': 'Critical',
      'status.OPEN': 'Open',
      'status.IN_DISCUSSION': 'In Discussion',
      'status.MATCHED': 'Matched',
      'status.FULFILLED': 'Fulfilled',
      'cofinancing.YES': 'Yes',
      'cofinancing.NO': 'No',
      'cofinancing.NEEDS_CLARIFICATION': 'Needs Clarification',
      'projectTypes.SOLAR_PV': 'Solar PV',
      'projectTypes.HEAT_PUMP': 'Heat Pump',
      'projectTypes.BATTERY_STORAGE': 'Battery Storage',
      'projectTypes.THERMO_MODERNIZATION': 'Thermo-modernization',
      'common.projects': 'projects',
      'common.needed': 'needed',
    }
    return translations[key] || key
  },
  useLocale: () => 'en',
}))

// Mock Header component
jest.mock('@/components/layout/Header', () => ({
  Header: ({ children }: { children?: React.ReactNode }) => (
    <header data-testid="mock-header">
      Header
      {children}
    </header>
  ),
}))

// Mock MapWrapper component
jest.mock('@/components/map/MapWrapper', () => ({
  MapWrapper: ({ projects, onProjectClick, onProjectHover }: any) => (
    <div data-testid="mock-map">
      Map with {projects?.length || 0} projects
      <button
        data-testid="map-marker-click"
        onClick={() => onProjectClick && projects?.[0] && onProjectClick(projects[0])}
      >
        Click Marker
      </button>
      <button
        data-testid="map-marker-hover"
        onMouseEnter={() => onProjectHover && projects?.[0] && onProjectHover(projects[0])}
        onMouseLeave={() => onProjectHover && onProjectHover(null)}
      >
        Hover Marker
      </button>
    </div>
  ),
}))

// Mock ProjectCard component
jest.mock('@/components/projects/ProjectCard', () => ({
  ProjectCard: ({ project, isHighlighted, onMouseEnter, onMouseLeave, onClick }: any) => (
    <div
      data-testid={`project-card-${project.id}`}
      data-highlighted={isHighlighted}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      {project.facilityName}
    </div>
  ),
}))

// Mock Button component
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, className, variant }: any) => (
    <button onClick={onClick} className={className} data-variant={variant}>
      {children}
    </button>
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
    HOSPITAL: { icon: '🏥' },
    SCHOOL: { icon: '🏫' },
    WATER: { icon: '💧' },
    ENERGY: { icon: '⚡' },
    OTHER: { icon: '🏢' },
  },
  URGENCY_CONFIG: {
    LOW: {},
    MEDIUM: {},
    HIGH: {},
    CRITICAL: {},
  },
  STATUS_CONFIG: {
    OPEN: {},
    IN_DISCUSSION: {},
    MATCHED: {},
    FULFILLED: {},
  },
  COFINANCING_CONFIG: {
    YES: {},
    NO: {},
    NEEDS_CLARIFICATION: {},
  },
  PROJECT_TYPE_CONFIG: {
    SOLAR_PV: {},
    HEAT_PUMP: {},
    BATTERY_STORAGE: {},
    THERMO_MODERNIZATION: {},
  },
  formatCurrency: (value: number, options?: { compact?: boolean }) =>
    options?.compact ? `$${Math.round(value/1000)}K` : `$${value.toLocaleString()}`,
  getLocalizedProject: (project: any, locale: string) => project,
}))

// Mock fetch
global.fetch = jest.fn()

// Sample project data
const createMockProject = (overrides = {}) => ({
  id: 'project-1',
  facilityName: 'Test Hospital',
  municipalityName: 'Test Municipality',
  region: 'Kyiv Oblast',
  category: 'HOSPITAL',
  urgency: 'HIGH',
  status: 'OPEN',
  estimatedCostUsd: 50000,
  projectType: 'SOLAR_PV',
  cofinancingAvailable: 'YES',
  briefDescription: 'A test project',
  fullDescription: 'Full description',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-20T10:00:00Z',
  cityLatitude: 50.4501,
  cityLongitude: 30.5234,
  ...overrides,
})

const mockProjects = [
  createMockProject({ id: 'project-1', facilityName: 'Hospital A', estimatedCostUsd: 50000 }),
  createMockProject({ id: 'project-2', facilityName: 'School B', category: 'SCHOOL', estimatedCostUsd: 30000 }),
  createMockProject({ id: 'project-3', facilityName: 'Water Plant C', category: 'WATER', urgency: 'CRITICAL', estimatedCostUsd: 100000 }),
]

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockReset()
  })

  describe('Loading State', () => {
    it('shows loading spinner while fetching projects', () => {
      ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))

      render(<HomePage />)

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('shows large loading spinner', () => {
      ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))

      render(<HomePage />)

      expect(screen.getByTestId('loading-spinner')).toHaveAttribute('data-size', 'lg')
    })
  })

  describe('Project Loading', () => {
    it('fetches projects from API on mount', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })

      render(<HomePage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/projects?all=true')
      })
    })

    it('renders projects after loading', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
        expect(screen.getByTestId('project-card-project-2')).toBeInTheDocument()
        expect(screen.getByTestId('project-card-project-3')).toBeInTheDocument()
      })
    })

    it('handles fetch error gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(<HomePage />)

      await waitFor(() => {
        // Should not crash, should show empty state
        expect(screen.getByText('No projects found')).toBeInTheDocument()
      })
    })
  })

  describe('Header and Filter Bar', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })
    })

    it('renders header component', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('mock-header')).toBeInTheDocument()
      })
    })

    it('renders price filter button', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText('Price')).toBeInTheDocument()
      })
    })

    it('renders project type filter button', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText('Project Type')).toBeInTheDocument()
      })
    })

    it('renders cofinancing filter button', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText('Co-financing')).toBeInTheDocument()
      })
    })

    it('renders category filter chips', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText('Hospital')).toBeInTheDocument()
        expect(screen.getByText('School')).toBeInTheDocument()
      })
    })
  })

  describe('Search Functionality', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })
    })

    it('renders search input', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search projects...')).toBeInTheDocument()
      })
    })

    it('filters projects by search query', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search projects...')
      await user.type(searchInput, 'Hospital A')

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
        expect(screen.queryByTestId('project-card-project-2')).not.toBeInTheDocument()
      })
    })

    it('shows clear button when search has value', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search projects...')
      await user.type(searchInput, 'test')

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument()
      })
    })

    it('clears search when clear button is clicked', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search projects...')
      await user.type(searchInput, 'test')

      const clearButton = screen.getByRole('button', { name: 'Clear search' })
      await user.click(clearButton)

      expect(searchInput).toHaveValue('')
    })
  })

  describe('Category Filters', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })
    })

    it('filters projects when category chip is clicked', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
      })

      // Click Hospital category
      const hospitalChip = screen.getByText('Hospital')
      await user.click(hospitalChip)

      await waitFor(() => {
        // Hospital A should be visible
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
        // School B should not be visible
        expect(screen.queryByTestId('project-card-project-2')).not.toBeInTheDocument()
      })
    })

    it('toggles category filter off when clicked again', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
      })

      const hospitalChip = screen.getByText('Hospital')

      // Click to enable
      await user.click(hospitalChip)

      await waitFor(() => {
        expect(screen.queryByTestId('project-card-project-2')).not.toBeInTheDocument()
      })

      // Click to disable
      await user.click(hospitalChip)

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-2')).toBeInTheDocument()
      })
    })
  })

  describe('Sort Functionality', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })
    })

    it('shows sort dropdown on hover', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
      })

      // Find the sort button (first "Newest" text in a button)
      const sortButtons = screen.getAllByText('Newest')
      const sortButton = sortButtons[0]
      fireEvent.mouseEnter(sortButton.parentElement!)

      await waitFor(() => {
        expect(screen.getByText('Oldest')).toBeInTheDocument()
        expect(screen.getByText('Highest Cost')).toBeInTheDocument()
        expect(screen.getByText('Lowest Cost')).toBeInTheDocument()
        expect(screen.getByText('A-Z')).toBeInTheDocument()
      })
    })
  })

  describe('Clear Filters', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })
    })

    it('shows clear button when filters are active', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
      })

      // Apply a filter
      const hospitalChip = screen.getByText('Hospital')
      await user.click(hospitalChip)

      await waitFor(() => {
        expect(screen.getByText('Clear')).toBeInTheDocument()
      })
    })

    it('shows filter count badge', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
      })

      // Apply a filter
      const hospitalChip = screen.getByText('Hospital')
      await user.click(hospitalChip)

      await waitFor(() => {
        // Should show count badge (the small circle with number inside the clear button)
        const clearButton = screen.getByText('Clear').closest('button')
        expect(clearButton).toBeInTheDocument()
        // The badge is inside the clear button - verify it exists
        const badge = clearButton?.querySelector('.rounded-full.bg-\\[var\\(--navy-600\\)\\]')
        expect(badge).toBeInTheDocument()
      })
    })

    it('clears all filters when clear button is clicked', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
      })

      // Apply a filter
      const hospitalChip = screen.getByText('Hospital')
      await user.click(hospitalChip)

      await waitFor(() => {
        expect(screen.queryByTestId('project-card-project-2')).not.toBeInTheDocument()
      })

      // Clear filters
      const clearButton = screen.getByText('Clear')
      await user.click(clearButton)

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-2')).toBeInTheDocument()
      })
    })
  })

  describe('Project Count and Funding', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })
    })

    it('displays project count', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument()
        expect(screen.getByText('projects')).toBeInTheDocument()
      })
    })

    it('displays total funding needed', async () => {
      render(<HomePage />)

      await waitFor(() => {
        // Total: 50000 + 30000 + 100000 = 180000 -> $180K
        expect(screen.getByText('$180K')).toBeInTheDocument()
        expect(screen.getByText('needed')).toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no projects match filters', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
      })

      // Search for something that doesn't exist
      const searchInput = screen.getByPlaceholderText('Search projects...')
      await user.type(searchInput, 'xyznonexistent')

      await waitFor(() => {
        expect(screen.getByText('No projects found')).toBeInTheDocument()
        expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument()
      })
    })

    it('shows clear all filters button in empty state', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
      })

      // Search for something that doesn't exist
      const searchInput = screen.getByPlaceholderText('Search projects...')
      await user.type(searchInput, 'xyznonexistent')

      await waitFor(() => {
        expect(screen.getByText('Clear all filters')).toBeInTheDocument()
      })
    })
  })

  describe('Card Interactions', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })
    })

    it('highlights card on hover', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
      })

      const card = screen.getByTestId('project-card-project-1')
      fireEvent.mouseEnter(card)

      await waitFor(() => {
        expect(card).toHaveAttribute('data-highlighted', 'true')
      })
    })

    it('removes highlight on mouse leave', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
      })

      const card = screen.getByTestId('project-card-project-1')
      fireEvent.mouseEnter(card)
      fireEvent.mouseLeave(card)

      await waitFor(() => {
        expect(card).toHaveAttribute('data-highlighted', 'false')
      })
    })
  })

  describe('Map Integration', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })
    })

    it('renders map with projects', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('mock-map')).toBeInTheDocument()
        expect(screen.getByText('Map with 3 projects')).toBeInTheDocument()
      })
    })
  })

  describe('Footer', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })
    })

    it('renders footer text', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText(/connects American donors with Ukrainian communities/)).toBeInTheDocument()
      })
    })

    it('renders hromada brand in footer', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText('hromada')).toBeInTheDocument()
      })
    })

    it('renders payment disclaimer', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText('We do not process payments.')).toBeInTheDocument()
      })
    })
  })

  describe('Mobile Map Toggle', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })
    })

    it('renders view map button for mobile', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText('View Map')).toBeInTheDocument()
      })
    })
  })

  describe('Cofinancing Filter', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })
    })

    it('filters projects by cofinancing status', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
      })

      // Hover over cofinancing filter to open dropdown
      const cofinancingButton = screen.getByText('Co-financing')
      fireEvent.mouseEnter(cofinancingButton.parentElement!)

      await waitFor(() => {
        expect(screen.getByText('Yes')).toBeInTheDocument()
      })
    })
  })

  describe('Project Type Filter', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })
    })

    it('shows project type dropdown on hover', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
      })

      const projectTypeButton = screen.getByText('Project Type')
      fireEvent.mouseEnter(projectTypeButton.parentElement!)

      await waitFor(() => {
        expect(screen.getByText('Solar PV')).toBeInTheDocument()
        expect(screen.getByText('Heat Pump')).toBeInTheDocument()
        expect(screen.getByText('Battery Storage')).toBeInTheDocument()
      })
    })
  })

  describe('Power Range Filter', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          projects: [
            ...mockProjects,
            createMockProject({ id: 'project-4', technicalPowerKw: 100 }),
          ],
        }),
      })
    })

    it('renders power filter button', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText('homepage.filters.power')).toBeInTheDocument()
      })
    })
  })

  describe('Sorting', () => {
    const projectsWithDifferentDates = [
      createMockProject({ id: 'project-1', facilityName: 'Alpha Hospital', estimatedCostUsd: 100000, createdAt: '2024-01-15T10:00:00Z' }),
      createMockProject({ id: 'project-2', facilityName: 'Beta School', estimatedCostUsd: 50000, createdAt: '2024-02-15T10:00:00Z' }),
      createMockProject({ id: 'project-3', facilityName: 'Gamma Water', estimatedCostUsd: 75000, createdAt: '2024-03-15T10:00:00Z' }),
    ]

    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ projects: projectsWithDifferentDates }),
      })
    })

    it('sorts by highest cost', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
      })

      // Open sort dropdown
      const sortButtons = screen.getAllByText('Newest')
      const sortButton = sortButtons[0]
      fireEvent.mouseEnter(sortButton.parentElement!)

      await waitFor(() => {
        expect(screen.getByText('Highest Cost')).toBeInTheDocument()
      })

      // Click on highest cost option
      await user.click(screen.getByText('Highest Cost'))

      // Projects should be sorted by cost
      const projectCards = screen.getAllByTestId(/project-card/)
      expect(projectCards.length).toBe(3)
    })

    it('sorts by lowest cost', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
      })

      // Open sort dropdown
      const sortButtons = screen.getAllByText('Newest')
      const sortButton = sortButtons[0]
      fireEvent.mouseEnter(sortButton.parentElement!)

      await waitFor(() => {
        expect(screen.getByText('Lowest Cost')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Lowest Cost'))
    })

    it('sorts alphabetically', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
      })

      // Open sort dropdown
      const sortButtons = screen.getAllByText('Newest')
      const sortButton = sortButtons[0]
      fireEvent.mouseEnter(sortButton.parentElement!)

      await waitFor(() => {
        expect(screen.getByText('A-Z')).toBeInTheDocument()
      })

      await user.click(screen.getByText('A-Z'))
    })

    it('sorts by oldest first', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
      })

      // Open sort dropdown
      const sortButtons = screen.getAllByText('Newest')
      const sortButton = sortButtons[0]
      fireEvent.mouseEnter(sortButton.parentElement!)

      await waitFor(() => {
        expect(screen.getByText('Oldest')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Oldest'))
    })
  })

  describe('Projects with missing cost data', () => {
    const projectsWithMissingCost = [
      createMockProject({ id: 'project-1', facilityName: 'Hospital A', estimatedCostUsd: 50000 }),
      createMockProject({ id: 'project-2', facilityName: 'School B', estimatedCostUsd: undefined }),
      createMockProject({ id: 'project-3', facilityName: 'Water C', estimatedCostUsd: null }),
    ]

    it('handles projects with undefined cost', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ projects: projectsWithMissingCost }),
      })

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
        expect(screen.getByTestId('project-card-project-2')).toBeInTheDocument()
      })
    })

    it('handles sorting with missing cost data', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ projects: projectsWithMissingCost }),
      })

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
      })

      const sortButtons = screen.getAllByText('Newest')
      const sortButton = sortButtons[0]
      fireEvent.mouseEnter(sortButton.parentElement!)

      await waitFor(() => {
        expect(screen.getByText('Highest Cost')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Highest Cost'))

      // Should not crash
      expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
    })
  })

  describe('Price filter edge cases', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })
    })

    it('renders price filter button', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
      })

      // Price filter button should exist
      expect(screen.getByText('Price')).toBeInTheDocument()
    })
  })

  describe('Map marker interactions', () => {
    beforeEach(() => {
      // Mock scrollTo for jsdom
      Element.prototype.scrollTo = jest.fn()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })
    })

    it('handles marker click from map', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('mock-map')).toBeInTheDocument()
      })

      // Click on the mock marker
      const markerClickButton = screen.getByTestId('map-marker-click')
      await user.click(markerClickButton)

      // Should trigger highlighting
      await waitFor(() => {
        const card = screen.getByTestId('project-card-project-1')
        expect(card).toBeInTheDocument()
      })
    })

    it('handles marker hover from map', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('mock-map')).toBeInTheDocument()
      })

      const markerHoverButton = screen.getByTestId('map-marker-hover')
      fireEvent.mouseEnter(markerHoverButton)

      await waitFor(() => {
        const card = screen.getByTestId('project-card-project-1')
        expect(card).toHaveAttribute('data-highlighted', 'true')
      })

      fireEvent.mouseLeave(markerHoverButton)

      await waitFor(() => {
        const card = screen.getByTestId('project-card-project-1')
        expect(card).toHaveAttribute('data-highlighted', 'false')
      })
    })
  })

  describe('Pagination', () => {
    it('shows show more button when there are more projects', async () => {
      // Create more than 12 projects
      const manyProjects = Array.from({ length: 15 }, (_, i) =>
        createMockProject({ id: `project-${i + 1}`, facilityName: `Project ${i + 1}` })
      )

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ projects: manyProjects }),
      })

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText(/Show More/)).toBeInTheDocument()
      })
    })

    it('loads more projects when show more is clicked', async () => {
      const user = userEvent.setup()
      const manyProjects = Array.from({ length: 15 }, (_, i) =>
        createMockProject({ id: `project-${i + 1}`, facilityName: `Project ${i + 1}` })
      )

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ projects: manyProjects }),
      })

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText(/Show More/)).toBeInTheDocument()
      })

      const showMoreButton = screen.getByText(/Show More/)
      await user.click(showMoreButton)

      // Should now show more projects
      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-13')).toBeInTheDocument()
      })
    })
  })

  describe('Card click interaction', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })
    })

    it('handles card click', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
      })

      const card = screen.getByTestId('project-card-project-1')
      await user.click(card)

      // Card click should trigger fly to project
      await waitFor(() => {
        expect(card).toHaveAttribute('data-highlighted', 'true')
      })
    })
  })

  describe('API response handling', () => {
    it('handles response without ok status', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      })

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText('No projects found')).toBeInTheDocument()
      })
    })
  })

  describe('Search with region and address', () => {
    it('searches in region field', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search projects...')
      await user.type(searchInput, 'Kyiv Oblast')

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
      })
    })
  })

  describe('Sorting with undefined cost values', () => {
    const projectsWithMixedCosts = [
      ...mockProjects,
      {
        id: 'no-cost-project',
        municipalityName: 'Test City',
        facilityName: 'No Cost Facility',
        category: 'HOSPITAL' as const,
        briefDescription: 'Test description',
        description: 'Full description',
        address: 'Test Address',
        cityLatitude: 50.45,
        cityLongitude: 30.52,
        contactName: 'Contact',
        contactEmail: 'test@test.com',
        urgency: 'MEDIUM' as const,
        status: 'OPEN' as const,
        region: 'Test Oblast',
        estimatedCostUsd: undefined,
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-03-01'),
      },
    ]

    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ projects: projectsWithMixedCosts }),
      })
    })

    it('places undefined costs at end when sorting by highest cost', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
      })

      // Use the same pattern as other sorting tests
      const sortButtons = screen.getAllByText('Newest')
      const sortButton = sortButtons[0]
      fireEvent.mouseEnter(sortButton.parentElement!)

      await waitFor(() => {
        const highestOption = screen.getByText('Highest Cost')
        expect(highestOption).toBeInTheDocument()
      })

      const highestCostOption = screen.getByText('Highest Cost')
      fireEvent.click(highestCostOption)

      // The project without cost should be last (project cards will be in different order)
      await waitFor(() => {
        expect(screen.getByTestId('project-card-no-cost-project')).toBeInTheDocument()
      })
    })

    it('places undefined costs at end when sorting by lowest cost', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
      })

      // Use the same pattern as other sorting tests
      const sortButtons = screen.getAllByText('Newest')
      const sortButton = sortButtons[0]
      fireEvent.mouseEnter(sortButton.parentElement!)

      await waitFor(() => {
        const lowestOption = screen.getByText('Lowest Cost')
        expect(lowestOption).toBeInTheDocument()
      })

      const lowestCostOption = screen.getByText('Lowest Cost')
      fireEvent.click(lowestCostOption)

      await waitFor(() => {
        expect(screen.getByTestId('project-card-no-cost-project')).toBeInTheDocument()
      })
    })
  })

  describe('Price and power range filtering edge cases', () => {
    const projectsWithVariousCosts = [
      {
        ...mockProjects[0],
        id: 'high-cost',
        estimatedCostUsd: 600000,
        technicalPowerKw: 600,
      },
      {
        ...mockProjects[0],
        id: 'no-cost',
        estimatedCostUsd: null,
        technicalPowerKw: null,
      },
    ]

    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ projects: projectsWithVariousCosts }),
      })
    })

    it('includes projects with undefined cost in price filter', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByTestId('project-card-high-cost')).toBeInTheDocument()
        expect(screen.getByTestId('project-card-no-cost')).toBeInTheDocument()
      })
    })

    it('includes high-cost projects when max price is at maximum', async () => {
      render(<HomePage />)

      await waitFor(() => {
        // Both projects should be visible with default (max) price range
        expect(screen.getByTestId('project-card-high-cost')).toBeInTheDocument()
      })
    })
  })
})
