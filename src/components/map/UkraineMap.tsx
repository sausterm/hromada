'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { type Project, type Category, CATEGORY_CONFIG } from '@/types'
import { ProjectPopup } from './ProjectPopup'
import 'leaflet/dist/leaflet.css'

// Ukraine center coordinates
const UKRAINE_CENTER: [number, number] = [48.3794, 31.1656]
const UKRAINE_ZOOM = 6

// Create custom icon for each category with highlight support
function createCategoryIcon(category: Category, isHighlighted: boolean = false): L.DivIcon {
  const config = CATEGORY_CONFIG[category]
  const size = isHighlighted ? 44 : 36
  const highlightClass = isHighlighted ? 'highlighted' : ''

  return L.divIcon({
    className: 'custom-marker-wrapper',
    html: `
      <div class="custom-marker ${category.toLowerCase()} ${highlightClass}" style="
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: ${isHighlighted
          ? '0 0 0 4px rgba(212, 117, 78, 0.4), 0 4px 16px rgba(58, 54, 51, 0.35)'
          : '0 3px 12px rgba(58, 54, 51, 0.25)'};
        font-size: ${isHighlighted ? '18px' : '16px'};
        background-color: ${config.color};
        transition: all 0.2s ease;
        ${isHighlighted ? 'transform: scale(1.1); z-index: 1000;' : ''}
      ">
        ${config.icon}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
}

// Pre-create normal icons
const categoryIcons: Record<Category, L.DivIcon> = {
  HOSPITAL: createCategoryIcon('HOSPITAL'),
  SCHOOL: createCategoryIcon('SCHOOL'),
  WATER: createCategoryIcon('WATER'),
  ENERGY: createCategoryIcon('ENERGY'),
  OTHER: createCategoryIcon('OTHER'),
}

// Pre-create highlighted icons
const highlightedIcons: Record<Category, L.DivIcon> = {
  HOSPITAL: createCategoryIcon('HOSPITAL', true),
  SCHOOL: createCategoryIcon('SCHOOL', true),
  WATER: createCategoryIcon('WATER', true),
  ENERGY: createCategoryIcon('ENERGY', true),
  OTHER: createCategoryIcon('OTHER', true),
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
  onProjectClick?: (project: Project) => void
  onProjectHover?: (project: Project | null) => void
  onBoundsChange?: (bounds: MapBounds, visibleProjects: Project[]) => void
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

// Component to fly to a project - only used for explicit navigation (click), not hover
function FlyToProject({ projectId, projects }: { projectId: string | null; projects: Project[] }) {
  const map = useMap()
  const prevProjectId = useRef<string | null>(null)

  useEffect(() => {
    if (projectId && projectId !== prevProjectId.current) {
      const project = projects.find((p) => p.id === projectId)
      if (project) {
        const lat = project.latitude || project.cityLatitude
        const lng = project.longitude || project.cityLongitude
        map.flyTo([lat, lng], Math.max(map.getZoom(), 8), {
          duration: 0.5,
        })
      }
      prevProjectId.current = projectId
    }
  }, [projectId, projects, map])

  return null
}

export function UkraineMap({
  projects,
  highlightedProjectId,
  onProjectClick,
  onProjectHover,
  onBoundsChange,
  showControls = false,
}: UkraineMapProps) {
  const markerRefs = useRef<Record<string, L.Marker>>({})

  // Get appropriate icon for a project
  const getIcon = useCallback(
    (project: Project) => {
      const isHighlighted = project.id === highlightedProjectId
      return isHighlighted
        ? highlightedIcons[project.category]
        : categoryIcons[project.category]
    },
    [highlightedProjectId]
  )

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

        {/* Note: FlyToProject removed to prevent auto-zoom on hover.
            Map stays at current zoom level, only marker highlighting occurs. */}

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
                if (ref) markerRefs.current[project.id] = ref
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
      </MapContainer>
    </div>
  )
}
