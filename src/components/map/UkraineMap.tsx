'use client'

import { useState, useCallback, useEffect, useRef, memo, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import { type Project, type Category, CATEGORY_CONFIG } from '@/types'
import { ProjectPopup } from './ProjectPopup'
import 'leaflet/dist/leaflet.css'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css'

// Ukraine center coordinates
const UKRAINE_CENTER: [number, number] = [48.3794, 31.1656]
const UKRAINE_ZOOM = 6

// Store previous view for restoring after popup close
let savedMapView: { center: [number, number]; zoom: number } | null = null

// Create custom icon for each category
function createCategoryIcon(category: Category): L.DivIcon {
  const config = CATEGORY_CONFIG[category]
  const size = 36

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
        box-shadow: 0 3px 12px rgba(58, 54, 51, 0.25);
        font-size: 16px;
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

// Create cluster icon with count
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
  flyToProjectId?: string | null
  onProjectClick?: (project: Project) => void
  onProjectHover?: (project: Project | null) => void
  onBoundsChange?: (bounds: MapBounds, visibleProjects: Project[]) => void
  onFlyToComplete?: () => void
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
  const zoomOutTimeoutRef = useRef<number | null>(null)
  const popupOpenTimeRef = useRef<number | null>(null)

  const updateBounds = useCallback(() => {
    if (!onBoundsChange) return

    const bounds = map.getBounds()
    const mapBounds: MapBounds = {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    }

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
    popupopen: () => {
      // Track when popup opened
      popupOpenTimeRef.current = Date.now()
      // Cancel any pending zoom-out when a new popup opens
      if (zoomOutTimeoutRef.current) {
        clearTimeout(zoomOutTimeoutRef.current)
        zoomOutTimeoutRef.current = null
      }
    },
    popupclose: () => {
      // Cancel any existing timeout
      if (zoomOutTimeoutRef.current) {
        clearTimeout(zoomOutTimeoutRef.current)
      }

      // Only zoom out if popup was open for at least 500ms
      // This prevents zoom-out when quickly switching between markers
      const popupWasOpenLongEnough = popupOpenTimeRef.current &&
        (Date.now() - popupOpenTimeRef.current) > 500

      if (!popupWasOpenLongEnough) {
        popupOpenTimeRef.current = null
        return
      }

      popupOpenTimeRef.current = null

      // Capture the saved view and clear it
      const viewToRestore = savedMapView
      savedMapView = null

      // Delay zoom out to allow new popup to open first
      zoomOutTimeoutRef.current = window.setTimeout(() => {
        zoomOutTimeoutRef.current = null
        // Only zoom out if map container still exists
        if (map.getContainer()) {
          try {
            // Return to previous view, or default to Ukraine if no saved view
            if (viewToRestore) {
              map.flyTo(viewToRestore.center, viewToRestore.zoom, { duration: 0.4 })
            } else {
              map.flyTo(UKRAINE_CENTER, UKRAINE_ZOOM, { duration: 0.4 })
            }
          } catch {
            // Map may be unmounting, ignore
          }
        }
      }, 150)
    },
  })

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (zoomOutTimeoutRef.current) {
        clearTimeout(zoomOutTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(updateBounds, 100)
    return () => clearTimeout(timer)
  }, [updateBounds])

  return null
}

// Component to fly to a project
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
        // Save current view before flying
        const currentCenter = map.getCenter()
        savedMapView = {
          center: [currentCenter.lat, currentCenter.lng],
          zoom: map.getZoom(),
        }

        const lat = project.latitude || project.cityLatitude
        const lng = project.longitude || project.cityLongitude
        // Offset south so popup (which appears above marker) is fully visible
        // The popup card is tall (~350px), so we need a larger offset at zoom 12
        const offsetLat = lat - 0.045
        map.flyTo([offsetLat, lng], 12, { duration: 0.4 })
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

// Memoized markers component - ONLY re-renders when projects change, NOT on highlight changes
interface ProjectMarkersProps {
  projects: Project[]
  markerRefs: React.MutableRefObject<Record<string, L.Marker>>
  clusterGroupRef: React.MutableRefObject<L.MarkerClusterGroup | null>
  onProjectClick?: (project: Project) => void
  onProjectHover?: (project: Project | null) => void
}

// Calculate offset positions for markers sharing the same coordinates
function getOffsetPositions(projects: Project[]): Map<string, [number, number]> {
  const positionMap = new Map<string, [number, number]>()

  // Group projects by their coordinates
  const coordGroups = new Map<string, Project[]>()
  projects.forEach((project) => {
    const lat = project.latitude || project.cityLatitude
    const lng = project.longitude || project.cityLongitude
    if (!lat || !lng) return

    const key = `${lat},${lng}`
    const group = coordGroups.get(key) || []
    group.push(project)
    coordGroups.set(key, group)
  })

  // Marker size is 36px, need ~45px between centers for buffer
  // At zoom 12 (where clustering disables), ~26m per pixel at Ukraine's latitude
  // So need ~1170m (0.0105 degrees) between marker centers
  // For circular arrangement, radius = distance / 2 for 2 markers
  // Use larger offset to ensure no overlap at any zoom level after disaggregation
  const baseOffsetDistance = 0.006 // ~670m, gives ~1340m between opposite markers

  coordGroups.forEach((group, key) => {
    const [baseLat, baseLng] = key.split(',').map(Number)

    if (group.length === 1) {
      // Single marker, no offset needed
      positionMap.set(group[0].id, [baseLat, baseLng])
    } else {
      // Multiple markers, spread them in a circle
      // Increase radius for larger groups to maintain spacing
      const offsetDistance = baseOffsetDistance * (group.length > 2 ? 1 + (group.length - 2) * 0.3 : 1)
      const angleStep = (2 * Math.PI) / group.length
      group.forEach((project, index) => {
        const angle = angleStep * index - Math.PI / 2 // Start from top
        const offsetLat = baseLat + offsetDistance * Math.cos(angle)
        // Adjust longitude offset for latitude (Mercator projection)
        const lngAdjustment = 1 / Math.cos(baseLat * Math.PI / 180)
        const offsetLng = baseLng + offsetDistance * Math.sin(angle) * lngAdjustment
        positionMap.set(project.id, [offsetLat, offsetLng])
      })
    }
  })

  return positionMap
}

const ProjectMarkers = memo(function ProjectMarkers({
  projects,
  markerRefs,
  clusterGroupRef,
  onProjectClick,
  onProjectHover,
}: ProjectMarkersProps) {
  const clusterGroupCallback = useCallback((node: L.MarkerClusterGroup | null) => {
    if (node) {
      clusterGroupRef.current = node
    }
  }, [clusterGroupRef])

  // Calculate offset positions for markers with shared coordinates
  const offsetPositions = useMemo(() => getOffsetPositions(projects), [projects])

  return (
    <MarkerClusterGroup
      ref={clusterGroupCallback}
      chunkedLoading
      iconCreateFunction={createClusterIcon}
      maxClusterRadius={60}
      spiderfyOnMaxZoom={false}
      showCoverageOnHover={false}
      zoomToBoundsOnClick={true}
      disableClusteringAtZoom={12}
      removeOutsideVisibleBounds={true}
      animate={true}
      animateAddingMarkers={false}
    >
      {projects.map((project) => {
        const position = offsetPositions.get(project.id)
        if (!position) return null

        return (
          <Marker
            key={project.id}
            position={position}
            icon={categoryIcons[project.category]}
            ref={(ref) => {
              if (ref) {
                markerRefs.current[project.id] = ref
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
  )
})

// Component to add a reset view button
function ResetViewControl() {
  const map = useMap()

  useEffect(() => {
    // Create custom control
    const ResetControl = L.Control.extend({
      options: {
        position: 'topleft' as L.ControlPosition,
      },
      onAdd: function () {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control')
        const button = L.DomUtil.create('a', '', container)
        button.href = '#'
        button.title = 'Reset view to Ukraine'
        button.setAttribute('role', 'button')
        button.setAttribute('aria-label', 'Reset view to Ukraine')
        button.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px; display: block; margin: 7px;">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        `
        button.style.width = '30px'
        button.style.height = '30px'
        button.style.lineHeight = '30px'
        button.style.display = 'flex'
        button.style.alignItems = 'center'
        button.style.justifyContent = 'center'
        button.style.color = '#333'
        button.style.backgroundColor = '#fff'
        button.style.cursor = 'pointer'

        L.DomEvent.disableClickPropagation(container)
        L.DomEvent.on(button, 'click', function (e) {
          L.DomEvent.preventDefault(e)
          map.flyTo(UKRAINE_CENTER, UKRAINE_ZOOM, { duration: 0.4 })
        })

        return container
      },
    })

    const control = new ResetControl()
    map.addControl(control)

    return () => {
      map.removeControl(control)
    }
  }, [map])

  return null
}

// Component to handle highlighting via DOM manipulation (no re-renders)
function HighlightHandler({
  highlightedProjectId,
  markerRefs,
  clusterGroupRef,
}: {
  highlightedProjectId: string | null | undefined
  markerRefs: React.MutableRefObject<Record<string, L.Marker>>
  clusterGroupRef: React.MutableRefObject<L.MarkerClusterGroup | null>
}) {
  const highlightedClusterRef = useRef<HTMLElement | null>(null)
  const highlightedMarkerRef = useRef<HTMLElement | null>(null)
  const timeoutIdsRef = useRef<number[]>([])

  useEffect(() => {
    // Cancel any pending timeouts from previous effect
    timeoutIdsRef.current.forEach(id => clearTimeout(id))
    timeoutIdsRef.current = []

    // Remove highlight from previous marker element
    if (highlightedMarkerRef.current) {
      highlightedMarkerRef.current.classList.remove('highlighted')
      // Reset z-index on parent
      const parent = highlightedMarkerRef.current.parentElement
      if (parent) {
        parent.style.zIndex = ''
      }
      highlightedMarkerRef.current = null
    }

    // Remove previous cluster highlight
    if (highlightedClusterRef.current) {
      highlightedClusterRef.current.classList.remove('cluster-highlighted')
      highlightedClusterRef.current = null
    }

    // Capture the current highlightedProjectId for closure
    const currentProjectId = highlightedProjectId

    // Add highlight to current marker
    if (currentProjectId && markerRefs.current[currentProjectId]) {
      const marker = markerRefs.current[currentProjectId]

      const applyHighlight = () => {
        // Check if still the current highlighted project
        if (highlightedMarkerRef.current) return // Already applied

        const el = marker.getElement()
        if (el) {
          // Find the .custom-marker div inside and add highlighted class directly
          const customMarker = el.querySelector('.custom-marker') as HTMLElement
          if (customMarker) {
            customMarker.classList.add('highlighted')
            highlightedMarkerRef.current = customMarker
            // Also set z-index on parent for proper layering
            el.style.zIndex = '1000'
          }
        }
      }

      // Try immediately, then retry after delay if needed
      applyHighlight()
      if (!highlightedMarkerRef.current) {
        const id1 = window.setTimeout(applyHighlight, 50)
        timeoutIdsRef.current.push(id1)
      }
      if (!highlightedMarkerRef.current) {
        const id2 = window.setTimeout(applyHighlight, 150)
        timeoutIdsRef.current.push(id2)
      }
    }

    // Handle cluster highlighting when marker is inside a cluster
    if (currentProjectId && clusterGroupRef.current) {
      let marker = markerRefs.current[currentProjectId]

      if (!marker) {
        clusterGroupRef.current.eachLayer((layer: any) => {
          if (layer.projectId === currentProjectId) {
            marker = layer
          }
        })
      }

      if (marker) {
        const clusterId = window.setTimeout(() => {
          try {
            const visibleParent = clusterGroupRef.current?.getVisibleParent(marker!)
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
        timeoutIdsRef.current.push(clusterId)
      }
    }

    // Cleanup on unmount or before next effect
    return () => {
      timeoutIdsRef.current.forEach(id => clearTimeout(id))
      timeoutIdsRef.current = []
    }
  }, [highlightedProjectId, markerRefs, clusterGroupRef])

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
}: UkraineMapProps) {
  const markerRefs = useRef<Record<string, L.Marker>>({})
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null)

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={UKRAINE_CENTER}
        zoom={UKRAINE_ZOOM}
        className="w-full h-full"
        scrollWheelZoom={true}
        style={{ minHeight: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapEventHandler projects={projects} onBoundsChange={onBoundsChange} />
        <ResetViewControl />

        {flyToProjectId && (
          <FlyToProject
            projectId={flyToProjectId}
            projects={projects}
            markerRefs={markerRefs}
            onComplete={onFlyToComplete}
          />
        )}

        <ProjectMarkers
          projects={projects}
          markerRefs={markerRefs}
          clusterGroupRef={clusterGroupRef}
          onProjectClick={onProjectClick}
          onProjectHover={onProjectHover}
        />

        <HighlightHandler
          highlightedProjectId={highlightedProjectId}
          markerRefs={markerRefs}
          clusterGroupRef={clusterGroupRef}
        />
      </MapContainer>
    </div>
  )
}
