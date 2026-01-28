'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import { type Project, type Category, CATEGORY_CONFIG } from '@/types'
import { ProjectPopup } from './ProjectPopup'
import 'leaflet/dist/leaflet.css'

// Ukraine center coordinates
const UKRAINE_CENTER: [number, number] = [48.3794, 31.1656]
const UKRAINE_ZOOM = 6

// Create custom icon for each category
function createCategoryIcon(category: Category, isHighlighted: boolean = false): L.DivIcon {
  const config = CATEGORY_CONFIG[category]
  const size = isHighlighted ? 44 : 36

  return L.divIcon({
    className: 'custom-marker-wrapper',
    html: `
      <div class="custom-marker ${category.toLowerCase()}" style="
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: ${isHighlighted
          ? '0 0 0 4px rgba(44, 62, 80, 0.5), 0 4px 16px rgba(58, 54, 51, 0.35)'
          : '0 3px 12px rgba(58, 54, 51, 0.25)'};
        font-size: ${isHighlighted ? '18px' : '16px'};
        background-color: ${config.color};
      ">
        ${config.icon}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
}

// Pre-create normal icons for each category
const categoryIcons: Record<Category, L.DivIcon> = {
  HOSPITAL: createCategoryIcon('HOSPITAL'),
  SCHOOL: createCategoryIcon('SCHOOL'),
  WATER: createCategoryIcon('WATER'),
  ENERGY: createCategoryIcon('ENERGY'),
  OTHER: createCategoryIcon('OTHER'),
}

// Pre-create highlighted icons for each category
const highlightedIcons: Record<Category, L.DivIcon> = {
  HOSPITAL: createCategoryIcon('HOSPITAL', true),
  SCHOOL: createCategoryIcon('SCHOOL', true),
  WATER: createCategoryIcon('WATER', true),
  ENERGY: createCategoryIcon('ENERGY', true),
  OTHER: createCategoryIcon('OTHER', true),
}


// Create cluster icon with count and smooth animation
function createClusterIcon(cluster: { getChildCount: () => number }): L.DivIcon {
  const count = cluster.getChildCount()
  let size = 40
  let fontSize = 14

  if (count >= 100) {
    size = 56
    fontSize = 16
  } else if (count >= 50) {
    size = 50
    fontSize = 15
  } else if (count >= 10) {
    size = 44
    fontSize = 14
  }

  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--navy-600) 0%, var(--navy-700) 100%);
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        color: white;
        font-size: ${fontSize}px;
        font-weight: 700;
        font-family: system-ui, -apple-system, sans-serif;
      ">
        ${count}
      </div>
    `,
    className: 'custom-cluster-icon',
    iconSize: L.point(size, size),
    iconAnchor: [size / 2, size / 2],
  })
}

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

interface UkraineMapProps {
  projects: Project[]
  highlightedProjectId?: string | null
  flyToProjectId?: string | null  // Separate prop for zoom-on-click (not hover)
  onProjectClick?: (project: Project) => void
  onProjectHover?: (project: Project | null) => void
  onBoundsChange?: (bounds: MapBounds, visibleProjects: Project[]) => void
  onFlyToComplete?: () => void  // Called when fly animation completes
  showControls?: boolean
}

// Component to handle map events and bounds
function MapEventHandler({
  projects,
  onBoundsChange,
}: {
  projects: Project[]
  onBoundsChange?: (bounds: MapBounds, visibleProjects: Project[]) => void
}) {
  const map = useMap()

  const updateBounds = useCallback(() => {
    if (!onBoundsChange) return

    const bounds = map.getBounds()
    const mapBounds: MapBounds = {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    }

    // Filter projects within bounds
    const visibleProjects = projects.filter((p) => {
      const lat = p.latitude || p.cityLatitude
      const lng = p.longitude || p.cityLongitude
      return (
        lat >= mapBounds.south &&
        lat <= mapBounds.north &&
        lng >= mapBounds.west &&
        lng <= mapBounds.east
      )
    })

    onBoundsChange(mapBounds, visibleProjects)
  }, [map, projects, onBoundsChange])

  useMapEvents({
    moveend: updateBounds,
    zoomend: updateBounds,
  })

  // Initial bounds update
  useEffect(() => {
    // Small delay to ensure map is ready
    const timer = setTimeout(updateBounds, 100)
    return () => clearTimeout(timer)
  }, [updateBounds])

  return null
}

// Component to fly to a project and open popup - triggered when card is clicked
function FlyToProject({
  projectId,
  projects,
  markerRefs,
  onComplete
}: {
  projectId: string | null
  projects: Project[]
  markerRefs: React.MutableRefObject<Record<string, L.Marker>>
  onComplete?: () => void
}) {
  const map = useMap()

  useEffect(() => {
    if (projectId) {
      const project = projects.find((p) => p.id === projectId)
      if (project) {
        const lat = project.latitude || project.cityLatitude
        const lng = project.longitude || project.cityLongitude
        // Zoom to level 12 so marker is not clustered, then open popup
        map.flyTo([lat, lng], 12, {
          duration: 0.4,
        })
        // After animation completes, open the popup
        setTimeout(() => {
          const marker = markerRefs.current[projectId]
          if (marker) {
            marker.openPopup()
          }
          onComplete?.()
        }, 450)
      }
    }
  }, [projectId, projects, map, markerRefs, onComplete])

  return null
}

export function UkraineMap({
  projects,
  highlightedProjectId,
  flyToProjectId,
  onProjectClick,
  onProjectHover,
  onBoundsChange,
  onFlyToComplete,
  showControls = false,
}: UkraineMapProps) {
  const markerRefs = useRef<Record<string, L.Marker>>({})
  const [clusterGroup, setClusterGroup] = useState<L.MarkerClusterGroup | null>(null)
  const highlightedClusterRef = useRef<HTMLElement | null>(null)

  // Callback ref for cluster group
  const clusterGroupCallback = useCallback((node: L.MarkerClusterGroup | null) => {
    if (node) {
      setClusterGroup(node)
    }
  }, [])

  // Get icon for a project - uses pre-created icons, switches based on highlight state
  const getIcon = useCallback(
    (project: Project) => {
      const isHighlighted = project.id === highlightedProjectId
      return isHighlighted ? highlightedIcons[project.category] : categoryIcons[project.category]
    },
    [highlightedProjectId]
  )

  // Handle cluster highlighting when marker is inside a cluster
  useEffect(() => {
    // Remove previous cluster highlight
    if (highlightedClusterRef.current) {
      highlightedClusterRef.current.classList.remove('cluster-highlighted')
      highlightedClusterRef.current = null
    }

    if (!highlightedProjectId || !clusterGroup) {
      return
    }

    // Try to get marker from refs first
    let marker = markerRefs.current[highlightedProjectId]

    // If not found, search through cluster group layers
    if (!marker) {
      clusterGroup.eachLayer((layer: any) => {
        if (layer.projectId === highlightedProjectId) {
          marker = layer
        }
      })
    }

    if (!marker) {
      return
    }

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      try {
        const visibleParent = clusterGroup.getVisibleParent(marker!)

        // If visibleParent is different from marker, it means marker is in a cluster
        if (visibleParent && visibleParent !== marker) {
          const clusterEl = visibleParent.getElement()
          if (clusterEl) {
            clusterEl.classList.add('cluster-highlighted')
            highlightedClusterRef.current = clusterEl
          }
        }
      } catch (e) {
        // getVisibleParent might fail
      }
    }, 50)

    return () => clearTimeout(timeoutId)
  }, [highlightedProjectId, clusterGroup])

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={UKRAINE_CENTER}
        zoom={UKRAINE_ZOOM}
        className="w-full h-full"
        scrollWheelZoom={true}
        style={{ minHeight: '100%' }}
      >
        {/* Warm-toned map tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapEventHandler projects={projects} onBoundsChange={onBoundsChange} />

        {/* FlyToProject - triggered only on click, not hover */}
        {flyToProjectId && (
          <FlyToProject
            projectId={flyToProjectId}
            projects={projects}
            markerRefs={markerRefs}
            onComplete={onFlyToComplete}
          />
        )}

        <MarkerClusterGroup
          ref={clusterGroupCallback}
          chunkedLoading
          iconCreateFunction={createClusterIcon}
          maxClusterRadius={60}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          zoomToBoundsOnClick={true}
          disableClusteringAtZoom={12}
          removeOutsideVisibleBounds={true}
          animate={false}
        >
          {projects.map((project) => {
            const lat = project.latitude || project.cityLatitude
            const lng = project.longitude || project.cityLongitude

            if (!lat || !lng) return null

            return (
              <Marker
                key={project.id}
                position={[lat, lng]}
                icon={getIcon(project)}
                ref={(ref) => {
                  if (ref) {
                    markerRefs.current[project.id] = ref
                    // Store project ID on the marker for later lookup
                    ;(ref as any).projectId = project.id
                  }
                }}
                eventHandlers={{
                  click: () => onProjectClick?.(project),
                  mouseover: () => onProjectHover?.(project),
                  mouseout: () => onProjectHover?.(null),
                }}
              >
                <Popup maxWidth={300} minWidth={280}>
                  <ProjectPopup project={project} />
                </Popup>
              </Marker>
            )
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  )
}
