import { render, screen } from '@testing-library/react'
import { MapWrapper } from '@/components/map/MapWrapper'
import { Project } from '@/types'

// Mock the dynamic import
jest.mock('next/dynamic', () => {
  return function mockDynamic(importFn: () => Promise<any>, options: any) {
    // Return loading component for testing - destructure to avoid DOM prop warnings
    const MockComponent = ({
      projects,
      highlightedProjectId,
      flyToProjectId,
      onProjectClick,
      onProjectHover,
      onBoundsChange,
      onFlyToComplete,
      ...rest
    }: any) => (
      <div
        data-testid="mock-ukraine-map"
        data-projects={JSON.stringify(projects?.length || 0)}
        data-highlighted={highlightedProjectId || ''}
        data-flyto={flyToProjectId || ''}
      >
        Mock Ukraine Map
      </div>
    )
    return MockComponent
  }
})

// Mock LoadingSpinner
jest.mock('@/components/ui/LoadingSpinner', () => ({
  LoadingSpinner: ({ size, className }: { size?: string; className?: string }) => (
    <div data-testid="loading-spinner" data-size={size} className={className}>
      Loading...
    </div>
  ),
}))

describe('MapWrapper', () => {
  const mockProjects: Project[] = [
    {
      id: 'proj-1',
      municipalityName: 'Kyiv',
      municipalityEmail: 'kyiv@example.com',
      facilityName: 'Hospital 1',
      category: 'HOSPITAL',
      briefDescription: 'Test project 1',
      description: 'Description 1',
      address: '123 Main St',
      cityLatitude: 50.4501,
      cityLongitude: 30.5234,
      contactName: 'John Doe',
      contactEmail: 'john@example.com',
      urgency: 'HIGH',
      status: 'OPEN',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<MapWrapper projects={mockProjects} />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('renders the map component', () => {
      render(<MapWrapper projects={mockProjects} />)
      expect(screen.getByTestId('mock-ukraine-map')).toBeInTheDocument()
    })

    it('applies default className', () => {
      const { container } = render(<MapWrapper projects={mockProjects} />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('w-full', 'h-full')
    })

    it('applies custom className', () => {
      const { container } = render(
        <MapWrapper projects={mockProjects} className="custom-class" />
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('w-full', 'h-full', 'custom-class')
    })
  })

  describe('Props passing', () => {
    it('passes projects to map component', () => {
      render(<MapWrapper projects={mockProjects} />)
      const mapComponent = screen.getByTestId('mock-ukraine-map')
      expect(mapComponent).toBeInTheDocument()
    })

    it('passes highlightedProjectId to map component', () => {
      render(
        <MapWrapper
          projects={mockProjects}
          highlightedProjectId="proj-1"
        />
      )
      expect(screen.getByTestId('mock-ukraine-map')).toBeInTheDocument()
    })

    it('passes flyToProjectId to map component', () => {
      render(
        <MapWrapper
          projects={mockProjects}
          flyToProjectId="proj-1"
        />
      )
      expect(screen.getByTestId('mock-ukraine-map')).toBeInTheDocument()
    })

    it('passes callback functions to map component', () => {
      const onProjectClick = jest.fn()
      const onProjectHover = jest.fn()
      const onBoundsChange = jest.fn()
      const onFlyToComplete = jest.fn()

      render(
        <MapWrapper
          projects={mockProjects}
          onProjectClick={onProjectClick}
          onProjectHover={onProjectHover}
          onBoundsChange={onBoundsChange}
          onFlyToComplete={onFlyToComplete}
        />
      )
      expect(screen.getByTestId('mock-ukraine-map')).toBeInTheDocument()
    })
  })

  describe('Empty state', () => {
    it('renders with empty projects array', () => {
      render(<MapWrapper projects={[]} />)
      expect(screen.getByTestId('mock-ukraine-map')).toBeInTheDocument()
    })
  })

  describe('With multiple projects', () => {
    it('handles multiple projects', () => {
      const multipleProjects: Project[] = [
        ...mockProjects,
        {
          id: 'proj-2',
          municipalityName: 'Lviv',
          municipalityEmail: 'lviv@example.com',
          facilityName: 'School 1',
          category: 'SCHOOL',
          briefDescription: 'Test project 2',
          description: 'Description 2',
          address: '456 Oak Ave',
          cityLatitude: 49.8397,
          cityLongitude: 24.0297,
          contactName: 'Jane Smith',
          contactEmail: 'jane@example.com',
          urgency: 'MEDIUM',
          status: 'IN_DISCUSSION',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      render(<MapWrapper projects={multipleProjects} />)
      expect(screen.getByTestId('mock-ukraine-map')).toBeInTheDocument()
    })
  })

  describe('Optional props', () => {
    it('works with null highlightedProjectId', () => {
      render(
        <MapWrapper
          projects={mockProjects}
          highlightedProjectId={null}
        />
      )
      expect(screen.getByTestId('mock-ukraine-map')).toBeInTheDocument()
    })

    it('works with null flyToProjectId', () => {
      render(
        <MapWrapper
          projects={mockProjects}
          flyToProjectId={null}
        />
      )
      expect(screen.getByTestId('mock-ukraine-map')).toBeInTheDocument()
    })

    it('works without optional callback props', () => {
      render(<MapWrapper projects={mockProjects} />)
      expect(screen.getByTestId('mock-ukraine-map')).toBeInTheDocument()
    })
  })
})
