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
      contains: () => true,
    }),
    getZoom: () => 6,
    getCenter: () => ({ lat: 49, lng: 31 }),
    setView: jest.fn(),
    flyTo: jest.fn(),
    closePopup: jest.fn(),
    openPopup: jest.fn(),
    addControl: jest.fn(),
    removeControl: jest.fn(),
    getContainer: jest.fn(() => document.createElement('div')),
    on: jest.fn(),
    off: jest.fn(),
    once: jest.fn(),
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
  Control: {
    extend: jest.fn(() => {
      // Return a mock control constructor
      return function MockControl() {
        this.addTo = jest.fn().mockReturnThis()
        this.remove = jest.fn()
      }
    }),
  },
  DomUtil: {
    create: jest.fn((tagName, className, container) => {
      const el = document.createElement(tagName)
      if (className) el.className = className
      if (container) container.appendChild(el)
      return el
    }),
  },
  DomEvent: {
    disableClickPropagation: jest.fn(),
    disableScrollPropagation: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  },
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

describe('getOffsetPositions - Multiple projects at same coordinates', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('handles multiple projects at the same coordinates', () => {
    // Create multiple projects at the same location
    const projects = [
      createMockProject({ id: '1', facilityName: 'Project 1', cityLatitude: 50.45, cityLongitude: 30.52 }),
      createMockProject({ id: '2', facilityName: 'Project 2', cityLatitude: 50.45, cityLongitude: 30.52 }),
      createMockProject({ id: '3', facilityName: 'Project 3', cityLatitude: 50.45, cityLongitude: 30.52 }),
    ]

    render(<UkraineMap projects={projects} />)
    jest.runAllTimers()

    const markers = screen.getAllByTestId('marker')
    expect(markers).toHaveLength(3)

    // Each marker should have different positions due to offset
    const positions = markers.map(marker => marker.getAttribute('data-position'))
    const uniquePositions = new Set(positions)
    expect(uniquePositions.size).toBe(3)
  })

  it('handles single project at location without offset', () => {
    const projects = [
      createMockProject({ id: '1', cityLatitude: 50.45, cityLongitude: 30.52 }),
    ]

    render(<UkraineMap projects={projects} />)
    jest.runAllTimers()

    const marker = screen.getByTestId('marker')
    const position = JSON.parse(marker.getAttribute('data-position')!)
    expect(position).toEqual([50.45, 30.52])
  })

  it('handles more than 2 projects at same location with increased offset', () => {
    // Create 5 projects at the same location
    const projects = Array.from({ length: 5 }, (_, i) =>
      createMockProject({
        id: `project-${i}`,
        facilityName: `Project ${i}`,
        cityLatitude: 49.0,
        cityLongitude: 32.0,
      })
    )

    render(<UkraineMap projects={projects} />)
    jest.runAllTimers()

    const markers = screen.getAllByTestId('marker')
    expect(markers).toHaveLength(5)
  })

  it('handles projects at different locations independently', () => {
    const projects = [
      createMockProject({ id: '1', cityLatitude: 50.0, cityLongitude: 30.0 }),
      createMockProject({ id: '2', cityLatitude: 50.0, cityLongitude: 30.0 }),
      createMockProject({ id: '3', cityLatitude: 51.0, cityLongitude: 31.0 }),
      createMockProject({ id: '4', cityLatitude: 51.0, cityLongitude: 31.0 }),
    ]

    render(<UkraineMap projects={projects} />)
    jest.runAllTimers()

    const markers = screen.getAllByTestId('marker')
    expect(markers).toHaveLength(4)
  })
})

describe('Map event handling', () => {
  beforeEach(() => {
    storedMapEventsHandlers = {}
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('handles moveend event', () => {
    const onBoundsChange = jest.fn()
    const projects = [createMockProject()]

    render(<UkraineMap projects={projects} onBoundsChange={onBoundsChange} />)
    jest.runAllTimers()

    // Trigger moveend event
    if (storedMapEventsHandlers.moveend) {
      storedMapEventsHandlers.moveend()
    }

    expect(onBoundsChange).toHaveBeenCalled()
  })

  it('handles zoomend event', () => {
    const onBoundsChange = jest.fn()
    const projects = [createMockProject()]

    render(<UkraineMap projects={projects} onBoundsChange={onBoundsChange} />)
    jest.runAllTimers()

    // Trigger zoomend event
    if (storedMapEventsHandlers.zoomend) {
      storedMapEventsHandlers.zoomend()
    }

    expect(onBoundsChange).toHaveBeenCalled()
  })

  it('handles popupopen event', () => {
    const projects = [createMockProject()]

    render(<UkraineMap projects={projects} />)
    jest.runAllTimers()

    // Trigger popupopen event with mock popup
    if (storedMapEventsHandlers.popupopen) {
      const mockPopup = {
        getLatLng: () => ({ lat: 50.45, lng: 30.52 }),
        getElement: () => ({
          offsetHeight: 350,
        }),
      }
      storedMapEventsHandlers.popupopen({ popup: mockPopup })
      jest.runAllTimers()
    }

    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })

  it('handles popupclose event', () => {
    const projects = [createMockProject()]

    render(<UkraineMap projects={projects} />)
    jest.runAllTimers()

    // Trigger popupclose event
    if (storedMapEventsHandlers.popupclose) {
      storedMapEventsHandlers.popupclose()
      jest.runAllTimers()
    }

    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })
})

describe('Optional callback props', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('works without onProjectClick', () => {
    const project = createMockProject()

    render(<UkraineMap projects={[project]} />)
    jest.runAllTimers()

    const marker = screen.getByTestId('marker')
    marker.click()

    // Should not crash
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })

  it('works without onProjectHover', () => {
    const project = createMockProject()

    render(<UkraineMap projects={[project]} />)
    jest.runAllTimers()

    const marker = screen.getByTestId('marker')
    marker.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    marker.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }))

    // Should not crash
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })

  it('works without onBoundsChange', () => {
    const project = createMockProject()

    render(<UkraineMap projects={[project]} />)
    jest.runAllTimers()

    // Trigger moveend event
    if (storedMapEventsHandlers.moveend) {
      storedMapEventsHandlers.moveend()
    }

    // Should not crash
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })

  it('works without onFlyToComplete', () => {
    const project = createMockProject({ id: 'fly-target' })

    render(<UkraineMap projects={[project]} flyToProjectId="fly-target" />)
    jest.runAllTimers()

    // Should not crash
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })
})

describe('Projects filtering by bounds', () => {
  beforeEach(() => {
    storedMapEventsHandlers = {}
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('calculates visible projects based on map bounds', () => {
    const onBoundsChange = jest.fn()
    const projects = [
      createMockProject({ id: '1', cityLatitude: 50.0, cityLongitude: 30.0 }),
      createMockProject({ id: '2', cityLatitude: 45.0, cityLongitude: 35.0 }),
    ]

    render(<UkraineMap projects={projects} onBoundsChange={onBoundsChange} />)
    jest.runAllTimers()

    if (storedMapEventsHandlers.moveend) {
      storedMapEventsHandlers.moveend()
    }

    expect(onBoundsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        north: expect.any(Number),
        south: expect.any(Number),
        east: expect.any(Number),
        west: expect.any(Number),
      }),
      expect.any(Array)
    )
  })
})

describe('Alternative coordinate props', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('uses latitude/longitude props when both are present', () => {
    const project = createMockProject({
      latitude: 48.5,
      longitude: 29.5,
      cityLatitude: 50.45,
      cityLongitude: 30.52,
    })

    render(<UkraineMap projects={[project]} />)
    jest.runAllTimers()

    const marker = screen.getByTestId('marker')
    const position = JSON.parse(marker.getAttribute('data-position')!)
    expect(position[0]).toBe(48.5)
    expect(position[1]).toBe(29.5)
  })
})
