'use client'

import dynamic from 'next/dynamic'
import { type Project } from '@/types'
import { type MapBounds } from './UkraineMap'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// Dynamic import with no SSR - Leaflet requires window
const UkraineMap = dynamic(
  () => import('./UkraineMap').then((mod) => mod.UkraineMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[var(--cream-100)] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-[var(--charcoal-500)]">Loading map...</p>
        </div>
      </div>
    ),
  }
)

interface MapWrapperProps {
  projects: Project[]
  highlightedProjectId?: string | null
  onProjectClick?: (project: Project) => void
  onProjectHover?: (project: Project | null) => void
  onBoundsChange?: (bounds: MapBounds, visibleProjects: Project[]) => void
  className?: string
}

export function MapWrapper({
  projects,
  highlightedProjectId,
  onProjectClick,
  onProjectHover,
  onBoundsChange,
  className = '',
}: MapWrapperProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <UkraineMap
        projects={projects}
        highlightedProjectId={highlightedProjectId}
        onProjectClick={onProjectClick}
        onProjectHover={onProjectHover}
        onBoundsChange={onBoundsChange}
      />
    </div>
  )
}

export type { MapBounds }
