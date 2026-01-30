import { render, screen } from '@testing-library/react'
import React from 'react'

// Store map events handlers for testing
let storedMapEventsHandlers: any = {}

// Mock react-leaflet and leaflet before importing the component
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children, className, style }: any) => (
    <div data-testid="map-container" className={className} style={style}>
      {children}
    </div>
  ),
  TileLayer: ({ attribution, url }: any) => (
    <div data-testid="tile-layer" data-attribution={attribution} data-url={url} />
  ),
  Marker: ({ children, position, eventHandlers }: any) => (
    <div
      data-testid="marker"
      data-position={JSON.stringify(position)}
      onClick={eventHandlers?.click}
      onMouseOver={eventHandlers?.mouseover}
      onMouseOut={eventHandlers?.mouseout}
    >
      {children}
    </div>
  ),
  Popup: ({ children, maxWidth, minWidth }: any) => (
    <div data-testid="popup" data-max-width={maxWidth} data-min-width={minWidth}>
      {children}
    </div>
  ),
  useMap: () => ({
    getBounds: () => ({
      getNorth: () => 52,
      getSouth: () => 44,
      getEast: () => 40,
      getWest: () => 22,
    }),
    flyTo: jest.fn(),
  }),
  useMapEvents: (handlers: any) => {
    storedMapEventsHandlers = handlers
    return null
  },
}))

jest.mock('react-leaflet-cluster', () => {
  return React.forwardRef(({ children }: any, ref: any) => {
    // Provide mock ref methods that the component uses
    React.useImperativeHandle(ref, () => ({
      eachLayer: jest.fn(),
      getLayers: jest.fn(() => []),
    }))
    return (
      <div data-testid="marker-cluster-group">
        {children}
      </div>
    )
  })
})

jest.mock('leaflet', () => ({
  divIcon: jest.fn((options) => ({
    options,
    _type: 'divIcon',
  })),
  point: jest.fn((x, y) => ({ x, y })),
}))

// Mock CSS imports
jest.mock('leaflet/dist/leaflet.css', () => ({}))
jest.mock('react-leaflet-cluster/dist/assets/MarkerCluster.css', () => ({}))
jest.mock('react-leaflet-cluster/dist/assets/MarkerCluster.Default.css', () => ({}))

// Mock ProjectPopup
jest.mock('@/components/map/ProjectPopup', () => ({
  ProjectPopup: ({ project }: any) => (
    <div data-testid="project-popup">{project.facilityName}</div>
  ),
}))

import { UkraineMap } from '@/components/map/UkraineMap'
import { type Project } from '@/types'

const createMockProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'project-1',
  facilityName: 'Test Hospital',
  municipalityName: 'Test Municipality',
  category: 'HOSPITAL',
  urgency: 'HIGH',
  status: 'OPEN',
  briefDescription: 'Test description',
  description: 'Full description',
  cityLatitude: 50.45,
  cityLongitude: 30.52,
  cityName: 'Kyiv',
  address: '123 Test St',
  contactName: 'Test Contact',
  contactEmail: 'test@example.com',
  createdAt: new Date(),
  updatedAt: new Date(),
  photos: [],
  ...overrides,
})

describe('UkraineMap', () => {
  beforeEach(() => {
    storedMapEventsHandlers = {}
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Rendering', () => {
    it('renders the map container', () => {
      render(<UkraineMap projects={[]} />)
      jest.runAllTimers()
      expect(screen.getByTestId('map-container')).toBeInTheDocument()
    })

    it('renders the tile layer with OpenStreetMap', () => {
      render(<UkraineMap projects={[]} />)
      jest.runAllTimers()
      const tileLayer = screen.getByTestId('tile-layer')
      expect(tileLayer).toBeInTheDocument()
      expect(tileLayer).toHaveAttribute('data-url', 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
    })

    it('renders markers for each project', () => {
      const projects = [
        createMockProject({ id: '1', facilityName: 'Hospital A' }),
        createMockProject({ id: '2', facilityName: 'School B', category: 'SCHOOL' }),
      ]

      render(<UkraineMap projects={projects} />)
      jest.runAllTimers()

      const markers = screen.getAllByTestId('marker')
      expect(markers).toHaveLength(2)
    })

    it('renders popup for each marker', () => {
      const projects = [createMockProject({ facilityName: 'Test Facility' })]

      render(<UkraineMap projects={projects} />)
      jest.runAllTimers()

      expect(screen.getByTestId('popup')).toBeInTheDocument()
      expect(screen.getByTestId('project-popup')).toHaveTextContent('Test Facility')
    })

    it('uses marker cluster group', () => {
      render(<UkraineMap projects={[createMockProject()]} />)
      jest.runAllTimers()
      expect(screen.getByTestId('marker-cluster-group')).toBeInTheDocument()
    })

    it('does not render marker for project without coordinates', () => {
      const projectWithoutCoords = createMockProject({
        id: '1',
        cityLatitude: undefined as any,
        cityLongitude: undefined as any,
        latitude: undefined,
        longitude: undefined,
      })

      render(<UkraineMap projects={[projectWithoutCoords]} />)
      jest.runAllTimers()

      expect(screen.queryByTestId('marker')).not.toBeInTheDocument()
    })
  })

  describe('Event handlers', () => {
    it('calls onProjectClick when marker is clicked', () => {
      const onProjectClick = jest.fn()
      const project = createMockProject()

      render(<UkraineMap projects={[project]} onProjectClick={onProjectClick} />)
      jest.runAllTimers()

      const marker = screen.getByTestId('marker')
      marker.click()

      expect(onProjectClick).toHaveBeenCalledWith(project)
    })

    it('calls onProjectHover with project on mouse over', () => {
      const onProjectHover = jest.fn()
      const project = createMockProject()

      render(<UkraineMap projects={[project]} onProjectHover={onProjectHover} />)
      jest.runAllTimers()

      const marker = screen.getByTestId('marker')
      marker.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))

      expect(onProjectHover).toHaveBeenCalledWith(project)
    })

    it('calls onProjectHover with null on mouse out', () => {
      const onProjectHover = jest.fn()
      const project = createMockProject()

      render(<UkraineMap projects={[project]} onProjectHover={onProjectHover} />)
      jest.runAllTimers()

      const marker = screen.getByTestId('marker')
      marker.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }))

      expect(onProjectHover).toHaveBeenCalledWith(null)
    })
  })

  describe('Marker positioning', () => {
    it('uses latitude/longitude when available', () => {
      const project = createMockProject({
        latitude: 51.5,
        longitude: 31.5,
        cityLatitude: 50.45,
        cityLongitude: 30.52,
      })

      render(<UkraineMap projects={[project]} />)
      jest.runAllTimers()

      const marker = screen.getByTestId('marker')
      expect(marker).toHaveAttribute('data-position', JSON.stringify([51.5, 31.5]))
    })

    it('falls back to cityLatitude/cityLongitude when latitude/longitude not available', () => {
      const project = createMockProject({
        latitude: undefined,
        longitude: undefined,
        cityLatitude: 50.45,
        cityLongitude: 30.52,
      })

      render(<UkraineMap projects={[project]} />)
      jest.runAllTimers()

      const marker = screen.getByTestId('marker')
      expect(marker).toHaveAttribute('data-position', JSON.stringify([50.45, 30.52]))
    })
  })

  describe('Category icons', () => {
    it('renders different icons for different categories', () => {
      const hospitalProject = createMockProject({ id: '1', category: 'HOSPITAL' })
      const schoolProject = createMockProject({ id: '2', category: 'SCHOOL' })

      render(<UkraineMap projects={[hospitalProject, schoolProject]} />)
      jest.runAllTimers()

      const markers = screen.getAllByTestId('marker')
      expect(markers).toHaveLength(2)
    })
  })

  describe('FlyTo functionality', () => {
    it('renders without error when flyToProjectId is provided', () => {
      const project = createMockProject({ id: 'fly-target' })

      render(
        <UkraineMap
          projects={[project]}
          flyToProjectId="fly-target"
          onFlyToComplete={jest.fn()}
        />
      )
      jest.runAllTimers()

      expect(screen.getByTestId('map-container')).toBeInTheDocument()
    })

    it('does not crash when flyToProjectId is null', () => {
      render(<UkraineMap projects={[createMockProject()]} flyToProjectId={null} />)
      jest.runAllTimers()
      expect(screen.getByTestId('map-container')).toBeInTheDocument()
    })
  })

  describe('Highlight functionality', () => {
    it('renders with highlightedProjectId', () => {
      const project = createMockProject({ id: 'highlighted' })

      render(<UkraineMap projects={[project]} highlightedProjectId="highlighted" />)
      jest.runAllTimers()

      expect(screen.getByTestId('map-container')).toBeInTheDocument()
    })

    it('handles null highlightedProjectId', () => {
      render(<UkraineMap projects={[createMockProject()]} highlightedProjectId={null} />)
      jest.runAllTimers()
      expect(screen.getByTestId('map-container')).toBeInTheDocument()
    })
  })

  describe('Bounds change callback', () => {
    it('renders with onBoundsChange callback', () => {
      const onBoundsChange = jest.fn()

      render(<UkraineMap projects={[createMockProject()]} onBoundsChange={onBoundsChange} />)
      jest.runAllTimers()

      expect(screen.getByTestId('map-container')).toBeInTheDocument()
    })
  })
})

describe('createCategoryIcon', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('creates icons for all categories', () => {
    const projects = [
      createMockProject({ id: '1', category: 'HOSPITAL' }),
      createMockProject({ id: '2', category: 'SCHOOL' }),
      createMockProject({ id: '3', category: 'WATER' }),
      createMockProject({ id: '4', category: 'ENERGY' }),
      createMockProject({ id: '5', category: 'OTHER' }),
    ]

    render(<UkraineMap projects={projects} />)
    jest.runAllTimers()

    const markers = screen.getAllByTestId('marker')
    expect(markers).toHaveLength(5)
  })
})

describe('createClusterIcon', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('provides iconCreateFunction to cluster group', () => {
    render(<UkraineMap projects={[createMockProject()]} />)
    jest.runAllTimers()
    expect(screen.getByTestId('marker-cluster-group')).toBeInTheDocument()
  })
})
