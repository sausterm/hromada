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
  const prevHighlightedRef = useRef<string | null>(null)
  const highlightedClusterRef = useRef<HTMLElement | null>(null)
  const highlightedMarkerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
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

    // Add highlight to current marker
    if (highlightedProjectId && markerRefs.current[highlightedProjectId]) {
      const marker = markerRefs.current[highlightedProjectId]

      const applyHighlight = () => {
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
        setTimeout(applyHighlight, 50)
      }
      if (!highlightedMarkerRef.current) {
        setTimeout(applyHighlight, 150)
      }
    }

    // Handle cluster highlighting when marker is inside a cluster
    if (highlightedProjectId && clusterGroupRef.current) {
      let marker = markerRefs.current[highlightedProjectId]

      if (!marker) {
        clusterGroupRef.current.eachLayer((layer: any) => {
          if (layer.projectId === highlightedProjectId) {
            marker = layer
          }
        })
      }

      if (marker) {
        setTimeout(() => {
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
      }
    }

    prevHighlightedRef.current = highlightedProjectId ?? null
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
