'use client'

import { useState, useCallback, useEffect, useRef, memo } from 'react'
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
    popupclose: () => {
      // Delay zoom out to check if another popup is opening (e.g., clicking between markers)
      setTimeout(() => {
        // Only zoom out if map container still exists and no popup is currently open
        if (map.getContainer()) {
          try {
            // Check if any popup is currently open on the map
            let hasOpenPopup = false
            map.eachLayer((layer: any) => {
              if (layer.getPopup && layer.getPopup()?.isOpen()) {
                hasOpenPopup = true
              }
            })
            if (!hasOpenPopup) {
              map.flyTo(UKRAINE_CENTER, UKRAINE_ZOOM, { duration: 0.4 })
            }
          } catch {
            // Map may be unmounting, ignore
          }
        }
      }, 100)
    },
  })

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
        const lat = project.latitude || project.cityLatitude
        const lng = project.longitude || project.cityLongitude
        map.flyTo([lat, lng], 12, { duration: 0.4 })
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

  return (
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
      animate={true}
      animateAddingMarkers={false}
      spiderfyDistanceMultiplier={1.5}
    >
      {projects.map((project) => {
        const lat = project.latitude || project.cityLatitude
        const lng = project.longitude || project.cityLongitude

        if (!lat || !lng) return null

        return (
          <Marker
            key={project.id}
            position={[lat, lng]}
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
