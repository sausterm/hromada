import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProjectsPage from '@/app/[locale]/(public)/projects/page'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, any>) => {
    const translations: Record<string, string> = {
      'homepage.filters.price': 'Price',
      'homepage.filters.power': 'Power',
      'homepage.filters.projectType': 'Project Type',
      'homepage.filters.cofinancing': 'Co-financing',
      'homepage.filters.clear': 'Clear',
      'homepage.searchPlaceholder': 'Search projects...',
      'homepage.searchClear': 'Clear search',
      'homepage.noProjectsFound': 'No projects found',
      'homepage.noProjectsHint': 'Try adjusting your filters or search terms.',
      'homepage.clearAllFilters': 'Clear all filters',
      'homepage.viewList': 'View List',
      'homepage.viewMap': 'View Map',
      'homepage.footer': '— connecting donors with communities.',
      'homepage.noPaymentProcessing': 'No payment processing yet.',
      'homepage.sortOptions.newest': 'Newest',
      'homepage.sortOptions.oldest': 'Oldest',
      'homepage.sortOptions.highestCost': 'Highest Cost',
      'homepage.sortOptions.lowestCost': 'Lowest Cost',
      'homepage.sortOptions.alphabetical': 'Alphabetical',
      'categories.HOSPITAL': 'Hospital / Medical',
      'categories.SCHOOL': 'School / Education',
      'categories.WATER': 'Water Utility',
      'categories.ENERGY': 'Energy Infrastructure',
      'categories.OTHER': 'Other Infrastructure',
      'projectTypes.SOLAR_PV': 'Solar PV',
      'projectTypes.BATTERY_STORAGE': 'Battery Storage',
      'projectTypes.HEAT_PUMP': 'Heat Pump',
      'projectTypes.THERMO_MODERNIZATION': 'Thermo Modernization',
      'projectTypes.GENERAL': 'General',
      'cofinancing.YES': 'Yes',
      'cofinancing.NO': 'No',
      'cofinancing.NEEDS_CLARIFICATION': 'Needs Clarification',
      'common.projects': 'projects',
      'common.needed': 'needed',
      'nav.projects': 'Projects',
    }
    return translations[key] || key
  },
  useLocale: () => 'en',
}))

// Mock Header component
jest.mock('@/components/layout/Header', () => ({
  Header: () => <header data-testid="mock-header">Header</header>,
}))

// Mock ProjectCard component
jest.mock('@/components/projects/ProjectCard', () => ({
  ProjectCard: ({ project, isHighlighted, onClick, onMouseEnter, onMouseLeave }: any) => (
    <div
      data-testid={`project-card-${project.id}`}
      data-highlighted={isHighlighted}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {project.facilityName}
    </div>
  ),
}))

// Mock Button component
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, className, variant, size }: any) => (
    <button onClick={onClick} className={className} data-variant={variant} data-size={size}>
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

// Mock MapWrapper component
jest.mock('@/components/map/MapWrapper', () => ({
  MapWrapper: ({ projects, onBoundsChange, onProjectClick, onProjectHover }: any) => (
    <div data-testid="map-wrapper" data-project-count={projects?.length ?? 0}>
      Map
    </div>
  ),
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, ...props }: any) => <img alt={alt} {...props} />,
}))

// Mock i18n/navigation
const mockPush = jest.fn()
jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className} data-testid={`link-${href}`}>{children}</a>
  ),
  usePathname: () => '/projects',
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  redirect: jest.fn(),
}))

// Mock types module
jest.mock('@/types', () => ({
  CATEGORY_CONFIG: {
    HOSPITAL: { label: 'Hospital / Medical', color: '#B85042', icon: '<path d="M3 12h18M12 3v18"/>' },
    SCHOOL: { label: 'School / Education', color: '#D4A373', icon: '<path d="M4 19V5"/>' },
    WATER: { label: 'Water Utility', color: '#5B8CA0', icon: '<path d="M12 2L2 22h20L12 2z"/>' },
    ENERGY: { label: 'Energy Infrastructure', color: '#D4A017', icon: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>' },
    OTHER: { label: 'Other Infrastructure', color: '#8B7D6B', icon: '<path d="M12 12m-10 0a10 10 0 1 0 20 0"/>' },
  },
  PROJECT_TYPE_CONFIG: {
    SOLAR_PV: { label: 'Solar PV', color: '#D4A017', icon: '' },
    BATTERY_STORAGE: { label: 'Battery Storage', color: '#5C7F4B', icon: '' },
    HEAT_PUMP: { label: 'Heat Pump', color: '#B85042', icon: '' },
    THERMO_MODERNIZATION: { label: 'Thermo Modernization', color: '#5B8CA0', icon: '' },
    GENERAL: { label: 'General', color: '#8B7D6B', icon: '' },
  },
  COFINANCING_CONFIG: {
    YES: { label: 'Yes', color: '#5C7F4B' },
    NO: { label: 'No', color: '#9A3D28' },
    NEEDS_CLARIFICATION: { label: 'Needs Clarification', color: '#C4A55A' },
  },
  formatCurrency: (value: number, options?: { compact?: boolean }) =>
    options?.compact ? `$${Math.round(value / 1000)}K` : `$${value.toLocaleString()}`,
  getLocalizedProject: (project: any, locale: string) => ({
    municipalityName: project.municipalityName,
    facilityName: project.facilityName,
    briefDescription: project.briefDescription,
    fullDescription: project.fullDescription || project.description || '',
  }),
}))

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn()
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})
window.IntersectionObserver = mockIntersectionObserver

// Mock fetch
global.fetch = jest.fn()

// Helper: create mock project
const createMockProject = (overrides: Record<string, any> = {}) => ({
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
  fullDescription: 'Full description of hospital project',
  description: 'Full description of hospital project',
  address: '123 Main St',
  cityLatitude: '50.4501',
  cityLongitude: '30.5234',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-20T10:00:00Z',
  municipalityEmail: 'test@test.com',
  contactName: 'Contact',
  contactEmail: 'contact@test.com',
  technicalPowerKw: 50,
  ...overrides,
})

const mockProjects = [
  createMockProject({ id: 'project-1', facilityName: 'Hospital Alpha', estimatedCostUsd: 50000, createdAt: '2024-03-01T00:00:00Z', technicalPowerKw: 100 }),
  createMockProject({ id: 'project-2', facilityName: 'School Beta', category: 'SCHOOL', estimatedCostUsd: 30000, createdAt: '2024-02-01T00:00:00Z', technicalPowerKw: 50, municipalityName: 'Lviv' }),
  createMockProject({ id: 'project-3', facilityName: 'Water Plant Gamma', category: 'WATER', estimatedCostUsd: 100000, createdAt: '2024-01-01T00:00:00Z', technicalPowerKw: 200 }),
]

// Helper to render with successful fetch
const renderWithProjects = async (projects = mockProjects) => {
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ projects }),
  })

  const result = render(<ProjectsPage />)

  // Wait for loading to finish
  await waitFor(() => {
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
  })

  return result
}

describe('ProjectsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockReset()
    mockPush.mockReset()

    // Mock getBoundingClientRect for dropdown positioning
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      x: 0,
      y: 0,
      width: 130,
      height: 36,
      top: 50,
      right: 130,
      bottom: 86,
      left: 0,
      toJSON: () => {},
    }))
  })

  // ----- Loading State -----

  describe('Loading State', () => {
    it('shows loading spinner while fetching projects', () => {
      ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))
      render(<ProjectsPage />)
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('shows large loading spinner', () => {
      ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))
      render(<ProjectsPage />)
      expect(screen.getByTestId('loading-spinner')).toHaveAttribute('data-size', 'lg')
    })

    it('does not render main content while loading', () => {
      ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))
      render(<ProjectsPage />)
      expect(screen.queryByTestId('mock-header')).not.toBeInTheDocument()
    })
  })

  // ----- API Fetching -----

  describe('API Fetching', () => {
    it('fetches projects with Ukraine bounding box on mount', async () => {
      await renderWithProjects()
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/projects?bounds=44,22,52.5,40.5'
      )
    })

    it('handles fetch error gracefully (does not crash)', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
      render(<ProjectsPage />)
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
      })
      // Page should render with empty state
      expect(screen.getByTestId('mock-header')).toBeInTheDocument()
    })

    it('handles non-ok response gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      })
      render(<ProjectsPage />)
      await waitFor(() => {
        // Should still finish loading (isLoading set to false in finally block)
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
      })
    })
  })

  // ----- Initial Render with Projects -----

  describe('Initial Render', () => {
    it('renders header component', async () => {
      await renderWithProjects()
      expect(screen.getByTestId('mock-header')).toBeInTheDocument()
    })

    it('renders project cards for all projects', async () => {
      await renderWithProjects()
      expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
      expect(screen.getByTestId('project-card-project-2')).toBeInTheDocument()
      expect(screen.getByTestId('project-card-project-3')).toBeInTheDocument()
    })

    it('renders accessible h1 with sr-only class', async () => {
      await renderWithProjects()
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('Projects')
      expect(heading).toHaveClass('sr-only')
    })

    it('renders project count', async () => {
      await renderWithProjects()
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('projects')).toBeInTheDocument()
    })

    it('renders total funding needed', async () => {
      await renderWithProjects()
      // 50000 + 30000 + 100000 = 180000 -> $180K
      expect(screen.getByText('$180K')).toBeInTheDocument()
      expect(screen.getByText('needed')).toBeInTheDocument()
    })

    it('renders the search input', async () => {
      await renderWithProjects()
      expect(screen.getByPlaceholderText('Search projects...')).toBeInTheDocument()
    })

    it('renders category filter chips', async () => {
      await renderWithProjects()
      // Category chips show first word on sm+ screens
      expect(screen.getByText('Hospital')).toBeInTheDocument()
      expect(screen.getByText('School')).toBeInTheDocument()
      expect(screen.getByText('Water')).toBeInTheDocument()
      expect(screen.getByText('Energy')).toBeInTheDocument()
      expect(screen.getByText('Other')).toBeInTheDocument()
    })

    it('renders sort dropdown defaulting to Newest', async () => {
      await renderWithProjects()
      // "Newest" appears both in the sort button label and as the active option in the dropdown
      const newestElements = screen.getAllByText('Newest')
      expect(newestElements.length).toBeGreaterThanOrEqual(1)
    })

    it('renders desktop map', async () => {
      await renderWithProjects()
      expect(screen.getByTestId('map-wrapper')).toBeInTheDocument()
    })

    it('renders footer text', async () => {
      await renderWithProjects()
      expect(screen.getByText(/connecting donors with communities/)).toBeInTheDocument()
    })

    it('renders mobile map toggle button (View Map)', async () => {
      await renderWithProjects()
      expect(screen.getByText('View Map')).toBeInTheDocument()
    })
  })

  // ----- Empty State -----

  describe('Empty State', () => {
    it('shows empty state when no projects are returned', async () => {
      await renderWithProjects([])
      expect(screen.getByText('No projects found')).toBeInTheDocument()
      expect(screen.getByText('Try adjusting your filters or search terms.')).toBeInTheDocument()
    })

    it('does not show clear filters button in empty state when no filters active', async () => {
      await renderWithProjects([])
      expect(screen.queryByText('Clear all filters')).not.toBeInTheDocument()
    })

    it('shows project count as 0', async () => {
      await renderWithProjects([])
      expect(screen.getByText('0')).toBeInTheDocument()
    })
  })

  // ----- Search -----

  describe('Search Filtering', () => {
    it('filters projects by facility name', async () => {
      await renderWithProjects()

      const searchInput = screen.getByPlaceholderText('Search projects...')
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'Hospital' } })
      })

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
        expect(screen.queryByTestId('project-card-project-2')).not.toBeInTheDocument()
        expect(screen.queryByTestId('project-card-project-3')).not.toBeInTheDocument()
      })
    })

    it('filters projects by municipality name', async () => {
      await renderWithProjects()

      const searchInput = screen.getByPlaceholderText('Search projects...')
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'Lviv' } })
      })

      await waitFor(() => {
        expect(screen.queryByTestId('project-card-project-1')).not.toBeInTheDocument()
        expect(screen.getByTestId('project-card-project-2')).toBeInTheDocument()
        expect(screen.queryByTestId('project-card-project-3')).not.toBeInTheDocument()
      })
    })

    it('shows clear search button when search is active', async () => {
      await renderWithProjects()

      const searchInput = screen.getByPlaceholderText('Search projects...')
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'test' } })
      })

      await waitFor(() => {
        expect(screen.getByLabelText('Clear search')).toBeInTheDocument()
      })
    })

    it('clears search when clear button is clicked', async () => {
      await renderWithProjects()

      const searchInput = screen.getByPlaceholderText('Search projects...')
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'Hospital' } })
      })

      await waitFor(() => {
        expect(screen.queryByTestId('project-card-project-2')).not.toBeInTheDocument()
      })

      const clearButton = screen.getByLabelText('Clear search')
      await act(async () => {
        fireEvent.click(clearButton)
      })

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-2')).toBeInTheDocument()
      })
    })

    it('shows empty state when search matches nothing', async () => {
      await renderWithProjects()

      const searchInput = screen.getByPlaceholderText('Search projects...')
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'xyznonexistent' } })
      })

      await waitFor(() => {
        expect(screen.getByText('No projects found')).toBeInTheDocument()
      })
    })

    it('search is case-insensitive', async () => {
      await renderWithProjects()

      const searchInput = screen.getByPlaceholderText('Search projects...')
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'hospital' } })
      })

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
      })
    })
  })

  // ----- Category Filtering -----

  describe('Category Filtering', () => {
    it('filters by single category when chip is clicked', async () => {
      await renderWithProjects()

      const schoolChip = screen.getByText('School')
      await act(async () => {
        fireEvent.click(schoolChip)
      })

      await waitFor(() => {
        expect(screen.queryByTestId('project-card-project-1')).not.toBeInTheDocument()
        expect(screen.getByTestId('project-card-project-2')).toBeInTheDocument()
        expect(screen.queryByTestId('project-card-project-3')).not.toBeInTheDocument()
      })
    })

    it('supports multiple category selection', async () => {
      await renderWithProjects()

      await act(async () => {
        fireEvent.click(screen.getByText('Hospital'))
      })
      await act(async () => {
        fireEvent.click(screen.getByText('Water'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
        expect(screen.queryByTestId('project-card-project-2')).not.toBeInTheDocument()
        expect(screen.getByTestId('project-card-project-3')).toBeInTheDocument()
      })
    })

    it('deselects category on second click', async () => {
      await renderWithProjects()

      await act(async () => {
        fireEvent.click(screen.getByText('School'))
      })

      await waitFor(() => {
        expect(screen.queryByTestId('project-card-project-1')).not.toBeInTheDocument()
      })

      await act(async () => {
        fireEvent.click(screen.getByText('School'))
      })

      await waitFor(() => {
        // All projects visible again
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
        expect(screen.getByTestId('project-card-project-2')).toBeInTheDocument()
        expect(screen.getByTestId('project-card-project-3')).toBeInTheDocument()
      })
    })
  })

  // ----- Clear Filters -----

  describe('Clear Filters', () => {
    it('shows clear button with active filter count when filters are active', async () => {
      await renderWithProjects()

      await act(async () => {
        fireEvent.click(screen.getByText('Hospital'))
      })

      await waitFor(() => {
        const clearButton = screen.getByText('Clear').closest('button')!
        expect(clearButton).toBeInTheDocument()
        // The badge inside the clear button shows the count
        const badge = clearButton.querySelector('span.inline-flex')
        expect(badge).toHaveTextContent('1')
      })
    })

    it('does not show clear button when no filters active', async () => {
      await renderWithProjects()
      expect(screen.queryByText('Clear')).not.toBeInTheDocument()
    })

    it('clears all filters and restores all projects', async () => {
      await renderWithProjects()

      // Apply a category filter
      await act(async () => {
        fireEvent.click(screen.getByText('School'))
      })

      await waitFor(() => {
        expect(screen.queryByTestId('project-card-project-1')).not.toBeInTheDocument()
      })

      // Click clear button
      const clearButton = screen.getByText('Clear')
      await act(async () => {
        fireEvent.click(clearButton.closest('button')!)
      })

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
        expect(screen.getByTestId('project-card-project-2')).toBeInTheDocument()
        expect(screen.getByTestId('project-card-project-3')).toBeInTheDocument()
      })
    })

    it('shows clear all filters button in empty state when filters are active', async () => {
      await renderWithProjects()

      // Search for something that matches no projects
      const searchInput = screen.getByPlaceholderText('Search projects...')
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'xyznonexistent' } })
      })

      await waitFor(() => {
        expect(screen.getByText('Clear all filters')).toBeInTheDocument()
      })
    })
  })

  // ----- Sorting -----

  describe('Sorting', () => {
    it('sorts by newest first by default', async () => {
      await renderWithProjects()

      const cards = screen.getAllByTestId(/^project-card-/)
      expect(cards[0]).toHaveAttribute('data-testid', 'project-card-project-1') // Mar 2024
      expect(cards[1]).toHaveAttribute('data-testid', 'project-card-project-2') // Feb 2024
      expect(cards[2]).toHaveAttribute('data-testid', 'project-card-project-3') // Jan 2024
    })

    it('renders all sort options in the DOM', async () => {
      await renderWithProjects()

      // Sort options are always rendered (shown/hidden via CSS), so they should be in the DOM
      expect(screen.getByText('Oldest')).toBeInTheDocument()
      expect(screen.getByText('Highest Cost')).toBeInTheDocument()
      expect(screen.getByText('Lowest Cost')).toBeInTheDocument()
      expect(screen.getByText('Alphabetical')).toBeInTheDocument()
    })
  })

  // ----- Pagination -----

  describe('Pagination', () => {
    it('shows Show More button when there are more than 12 projects', async () => {
      const manyProjects = Array.from({ length: 15 }, (_, i) =>
        createMockProject({
          id: `project-${i + 1}`,
          facilityName: `Project ${i + 1}`,
          estimatedCostUsd: 10000 * (i + 1),
          createdAt: new Date(2024, 0, 15 - i).toISOString(),
        })
      )
      await renderWithProjects(manyProjects)

      expect(screen.getByText(/Show More/)).toBeInTheDocument()
      expect(screen.getByText(/3 remaining/)).toBeInTheDocument()
    })

    it('does not show Show More button when 12 or fewer projects', async () => {
      await renderWithProjects()
      expect(screen.queryByText(/Show More/)).not.toBeInTheDocument()
    })

    it('loads more projects when Show More is clicked', async () => {
      const manyProjects = Array.from({ length: 15 }, (_, i) =>
        createMockProject({
          id: `project-${i + 1}`,
          facilityName: `Project ${i + 1}`,
          estimatedCostUsd: 10000 * (i + 1),
          createdAt: new Date(2024, 0, 15 - i).toISOString(),
        })
      )
      await renderWithProjects(manyProjects)

      // Initially 12 cards
      const initialCards = screen.getAllByTestId(/^project-card-/)
      expect(initialCards).toHaveLength(12)

      // Click Show More
      const showMoreButton = screen.getByText(/Show More/)
      await act(async () => {
        fireEvent.click(showMoreButton)
      })

      await waitFor(() => {
        const allCards = screen.getAllByTestId(/^project-card-/)
        expect(allCards).toHaveLength(15)
      })
    })
  })

  // ----- Mobile Map Toggle -----

  describe('Mobile Map Toggle', () => {
    it('toggles to map view when View Map button is clicked', async () => {
      await renderWithProjects()

      const toggleButton = screen.getByText('View Map')
      await act(async () => {
        fireEvent.click(toggleButton)
      })

      await waitFor(() => {
        expect(screen.getByText('View List')).toBeInTheDocument()
      })
    })

    it('toggles back to list view when View List button is clicked', async () => {
      await renderWithProjects()

      // Open map
      await act(async () => {
        fireEvent.click(screen.getByText('View Map'))
      })

      // Close map
      await act(async () => {
        fireEvent.click(screen.getByText('View List'))
      })

      await waitFor(() => {
        expect(screen.getByText('View Map')).toBeInTheDocument()
      })
    })
  })

  // ----- Filter Dropdowns -----

  describe('Filter Dropdowns', () => {
    it('renders price filter button', async () => {
      await renderWithProjects()
      expect(screen.getByText('Price')).toBeInTheDocument()
    })

    it('renders power filter button', async () => {
      await renderWithProjects()
      expect(screen.getByText('Power')).toBeInTheDocument()
    })

    it('renders project type filter button', async () => {
      await renderWithProjects()
      expect(screen.getByText('Project Type')).toBeInTheDocument()
    })

    it('renders co-financing filter button', async () => {
      await renderWithProjects()
      expect(screen.getByText('Co-financing')).toBeInTheDocument()
    })

    it('price button has correct aria-expanded attribute', async () => {
      await renderWithProjects()
      const priceButton = screen.getByText('Price').closest('button')!
      expect(priceButton).toHaveAttribute('aria-expanded', 'false')
    })
  })

  // ----- Combined Filters -----

  describe('Combined Filters', () => {
    it('search + category filters work together', async () => {
      await renderWithProjects()

      // Filter by category HOSPITAL
      await act(async () => {
        fireEvent.click(screen.getByText('Hospital'))
      })

      // Then search for something that matches the hospital
      const searchInput = screen.getByPlaceholderText('Search projects...')
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'Alpha' } })
      })

      await waitFor(() => {
        expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
        expect(screen.queryByTestId('project-card-project-2')).not.toBeInTheDocument()
        expect(screen.queryByTestId('project-card-project-3')).not.toBeInTheDocument()
      })
    })

    it('active filter count reflects all applied filters', async () => {
      await renderWithProjects()

      // Add a category filter
      await act(async () => {
        fireEvent.click(screen.getByText('Hospital'))
      })

      // Add another category filter
      await act(async () => {
        fireEvent.click(screen.getByText('Water'))
      })

      // Add a search filter
      const searchInput = screen.getByPlaceholderText('Search projects...')
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'test' } })
      })

      await waitFor(() => {
        // 2 categories + 1 search = 3
        expect(screen.getByText('3')).toBeInTheDocument()
      })
    })
  })

  // ----- Card Interactions -----

  describe('Card Interactions', () => {
    it('navigates to project page on card click when map is not visible (mobile)', async () => {
      // Window width < 1024 means isMapVisible = false
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 768 })
      window.dispatchEvent(new Event('resize'))

      await renderWithProjects()

      const card = screen.getByTestId('project-card-project-1')
      await act(async () => {
        fireEvent.click(card)
      })

      expect(mockPush).toHaveBeenCalledWith('/projects/project-1')
    })
  })

  // ----- Styling -----

  describe('Styling', () => {
    it('has correct background color', async () => {
      const { container } = await renderWithProjects()
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('bg-[var(--cream-100)]')
    })

    it('renders as full screen height layout', async () => {
      const { container } = await renderWithProjects()
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('h-screen')
    })
  })

  // ----- transformProject helper -----

  describe('Data Transformation', () => {
    it('transforms API response correctly (Decimal strings to numbers)', async () => {
      const apiProject = createMockProject({
        id: 'transform-test',
        facilityName: 'Transform Test',
        cityLatitude: '48.123',
        cityLongitude: '35.456',
        estimatedCostUsd: '75000',
        technicalPowerKw: '100',
      })

      await renderWithProjects([apiProject])
      expect(screen.getByTestId('project-card-transform-test')).toBeInTheDocument()
    })

    it('handles missing optional fields gracefully', async () => {
      const minimalProject = createMockProject({
        id: 'minimal-test',
        facilityName: 'Minimal Project',
        latitude: null,
        longitude: null,
        technicalPowerKw: null,
        estimatedCostUsd: null,
      })

      await renderWithProjects([minimalProject])
      expect(screen.getByTestId('project-card-minimal-test')).toBeInTheDocument()
    })
  })
})
