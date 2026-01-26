'use client'

import { useState, useCallback, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { type Project, type Category, CATEGORY_CONFIG } from '@/types'
import { CategoryFilter } from './CategoryFilter'
import { ProjectPopup } from './ProjectPopup'
import 'leaflet/dist/leaflet.css'

// Ukraine center coordinates
const UKRAINE_CENTER: [number, number] = [48.3794, 31.1656]
const UKRAINE_ZOOM = 6

// Create custom icon for each category
function createCategoryIcon(category: Category): L.DivIcon {
  const config = CATEGORY_CONFIG[category]
  return L.divIcon({
    className: 'custom-marker-wrapper',
    html: `
      <div class="custom-marker ${category.toLowerCase()}" style="
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-size: 16px;
        background-color: ${config.color};
      ">
        ${config.icon}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  })
}

// Memoized icons
const categoryIcons: Record<Category, L.DivIcon> = {
  HOSPITAL: createCategoryIcon('HOSPITAL'),
  SCHOOL: createCategoryIcon('SCHOOL'),
  WATER: createCategoryIcon('WATER'),
  ENERGY: createCategoryIcon('ENERGY'),
  OTHER: createCategoryIcon('OTHER'),
}

interface UkraineMapProps {
  projects: Project[]
  onProjectClick?: (project: Project) => void
}

// Component to handle map bounds
function MapBounds({ projects }: { projects: Project[] }) {
  const map = useMap()

  useMemo(() => {
    if (projects.length > 0) {
      const bounds = L.latLngBounds(
        projects.map((p) => [p.latitude, p.longitude] as [number, number])
      )
      // Only fit bounds if there are projects, otherwise stay on Ukraine
      if (projects.length > 1) {
        map.fitBounds(bounds, { padding: [50, 50] })
      }
    }
  }, [map, projects])

  return null
}

export function UkraineMap({ projects, onProjectClick }: UkraineMapProps) {
  // All categories active by default
  const [activeCategories, setActiveCategories] = useState<Set<Category>>(
    new Set(['HOSPITAL', 'SCHOOL', 'WATER', 'ENERGY', 'OTHER'])
  )

  const toggleCategory = useCallback((category: Category) => {
    setActiveCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }, [])

  // Filter projects by active categories
  const filteredProjects = useMemo(
    () => projects.filter((p) => activeCategories.has(p.category)),
    [projects, activeCategories]
  )

  return (
    <div className="relative w-full h-full">
      {/* Map */}
      <MapContainer
        center={UKRAINE_CENTER}
        zoom={UKRAINE_ZOOM}
        className="w-full h-full rounded-xl"
        scrollWheelZoom={true}
        style={{ minHeight: '500px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBounds projects={filteredProjects} />

        {filteredProjects.map((project) => (
          <Marker
            key={project.id}
            position={[project.latitude, project.longitude]}
            icon={categoryIcons[project.category]}
            eventHandlers={{
              click: () => onProjectClick?.(project),
            }}
          >
            <Popup maxWidth={300} minWidth={280}>
              <ProjectPopup project={project} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Category filter overlay */}
      <div className="absolute top-4 left-4 z-[1000]">
        <CategoryFilter
          activeCategories={activeCategories}
          onToggle={toggleCategory}
        />
      </div>

      {/* Project count */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white px-4 py-2 rounded-lg shadow-lg">
        <span className="text-sm text-gray-600">
          Showing <strong>{filteredProjects.length}</strong> of{' '}
          <strong>{projects.length}</strong> projects
        </span>
      </div>
    </div>
  )
}
