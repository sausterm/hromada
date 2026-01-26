'use client'

import dynamic from 'next/dynamic'
import { type Project } from '@/types'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// Dynamic import with no SSR - Leaflet requires window
const UkraineMap = dynamic(
  () => import('./UkraineMap').then((mod) => mod.UkraineMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-500">Loading map...</p>
        </div>
      </div>
    ),
  }
)

interface MapWrapperProps {
  projects: Project[]
  onProjectClick?: (project: Project) => void
}

export function MapWrapper({ projects, onProjectClick }: MapWrapperProps) {
  return (
    <div className="w-full h-[600px]">
      <UkraineMap projects={projects} onProjectClick={onProjectClick} />
    </div>
  )
}
