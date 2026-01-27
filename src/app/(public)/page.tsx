'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { MapWrapper, type MapBounds } from '@/components/map/MapWrapper'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { Button } from '@/components/ui/Button'
import {
  type Project,
  type Category,
  type Urgency,
  type Status,
  CATEGORY_CONFIG,
  URGENCY_CONFIG,
  STATUS_CONFIG,
} from '@/types'

// Mock data - replace with API call
const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    municipalityName: 'Kharkiv Oblast',
    municipalityEmail: 'contact@kharkiv-oblast.ua',
    facilityName: 'Regional Hospital #5',
    category: 'HOSPITAL',
    description: 'Critical need for medical equipment including ventilators, patient monitors, and surgical instruments. The hospital serves over 50,000 residents and was damaged during recent attacks.',
    briefDescription: 'Critical need for medical equipment including ventilators and patient monitors.',
    address: 'Kharkiv, Ukraine',
    cityLatitude: 49.9935,
    cityLongitude: 36.2304,
    contactName: 'Dr. Olena Kovalenko',
    contactEmail: 'hospital5@kharkiv.ua',
    contactPhone: '+380501234567',
    urgency: 'CRITICAL',
    status: 'OPEN',
    photos: ['https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    municipalityName: 'Kyiv Oblast',
    municipalityEmail: 'contact@kyiv-oblast.ua',
    facilityName: 'School #127',
    category: 'SCHOOL',
    description: 'Need educational supplies, computers, and repairs to damaged classrooms. 450 students attend this school.',
    briefDescription: 'Need educational supplies, computers, and classroom repairs for 450 students.',
    address: 'Bucha, Kyiv Oblast, Ukraine',
    cityLatitude: 50.5414,
    cityLongitude: 30.2131,
    contactName: 'Natalia Shevchenko',
    contactEmail: 'school127@bucha.ua',
    urgency: 'HIGH',
    status: 'OPEN',
    photos: ['https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    municipalityName: 'Odesa Oblast',
    municipalityEmail: 'contact@odesa-oblast.ua',
    facilityName: 'Municipal Water Treatment Plant',
    category: 'WATER',
    description: 'Urgent need for water filtration equipment and backup generators. Plant provides clean water to 30,000 residents.',
    briefDescription: 'Urgent need for water filtration equipment and backup generators.',
    address: 'Odesa, Ukraine',
    cityLatitude: 46.4825,
    cityLongitude: 30.7233,
    contactName: 'Viktor Bondarenko',
    contactEmail: 'water@odesa.ua',
    urgency: 'HIGH',
    status: 'IN_DISCUSSION',
    photos: ['https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    municipalityName: 'Lviv Oblast',
    municipalityEmail: 'contact@lviv-oblast.ua',
    facilityName: 'Power Substation East',
    category: 'ENERGY',
    description: 'Transformers and electrical equipment needed to restore power to residential area. Currently 2,000 homes without stable electricity.',
    briefDescription: 'Transformers needed to restore power to 2,000 homes.',
    address: 'Lviv, Ukraine',
    cityLatitude: 49.8397,
    cityLongitude: 24.0297,
    contactName: 'Andriy Melnyk',
    contactEmail: 'energy@lviv.ua',
    urgency: 'MEDIUM',
    status: 'OPEN',
    photos: ['https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '5',
    municipalityName: 'Dnipro Oblast',
    municipalityEmail: 'contact@dnipro-oblast.ua',
    facilityName: 'Community Center',
    category: 'OTHER',
    description: 'Heating system repairs needed before winter. Center serves as shelter for displaced families.',
    briefDescription: 'Heating system repairs needed for shelter serving displaced families.',
    address: 'Dnipro, Ukraine',
    cityLatitude: 48.4647,
    cityLongitude: 35.0462,
    contactName: 'Maria Tkachenko',
    contactEmail: 'community@dnipro.ua',
    urgency: 'HIGH',
    status: 'OPEN',
    photos: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export default function HomePage() {
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // State
  const [allProjects] = useState<Project[]>(MOCK_PROJECTS)
  const [visibleProjects, setVisibleProjects] = useState<Project[]>(MOCK_PROJECTS)
  const [highlightedProjectId, setHighlightedProjectId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<Set<Category>>(new Set())
  const [selectedUrgency, setSelectedUrgency] = useState<Urgency | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null)

  // Filtered projects based on search and filters
  const filteredProjects = useMemo(() => {
    let result = allProjects

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.facilityName.toLowerCase().includes(query) ||
          p.municipalityName.toLowerCase().includes(query)
      )
    }

    // Category filter
    if (selectedCategories.size > 0) {
      result = result.filter((p) => selectedCategories.has(p.category))
    }

    // Urgency filter
    if (selectedUrgency) {
      result = result.filter((p) => p.urgency === selectedUrgency)
    }

    // Status filter
    if (selectedStatus) {
      result = result.filter((p) => p.status === selectedStatus)
    }

    return result
  }, [allProjects, searchQuery, selectedCategories, selectedUrgency, selectedStatus])

  // Projects visible in current map bounds
  const projectsInView = useMemo(() => {
    return filteredProjects.filter((p) =>
      visibleProjects.some((vp) => vp.id === p.id)
    )
  }, [filteredProjects, visibleProjects])

  // Handle map bounds change
  const handleBoundsChange = useCallback(
    (_bounds: MapBounds, visible: Project[]) => {
      setVisibleProjects(visible)
    },
    []
  )

  // Handle card hover - highlight marker on map
  const handleCardHover = useCallback((projectId: string | null) => {
    setHighlightedProjectId(projectId)
  }, [])

  // Handle marker click - scroll to card in list
  const handleMarkerClick = useCallback((project: Project) => {
    setHighlightedProjectId(project.id)
    const cardElement = cardRefs.current[project.id]
    if (cardElement) {
      cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])

  // Handle marker hover
  const handleMarkerHover = useCallback((project: Project | null) => {
    setHighlightedProjectId(project?.id || null)
  }, [])

  // Toggle category filter
  const toggleCategory = useCallback((category: Category) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }, [])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setSelectedCategories(new Set())
    setSelectedUrgency(null)
    setSelectedStatus(null)
  }, [])

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (searchQuery.trim()) count++
    count += selectedCategories.size
    if (selectedUrgency) count++
    if (selectedStatus) count++
    return count
  }, [searchQuery, selectedCategories, selectedUrgency, selectedStatus])

  return (
    <div className="h-screen flex flex-col bg-[var(--cream-50)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--cream-100)] border-b border-[var(--cream-300)] shadow-sm">
        <div className="px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <span className="text-2xl font-bold text-[#0057B7]">
                hromada <span className="opacity-60">|</span> громада
              </span>
            </Link>

            {/* Search */}
            <div className="flex-1 max-w-md hidden md:block">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--navy-400)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search projects or municipalities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-full border border-[var(--cream-300)] bg-[var(--cream-50)] text-[var(--navy-700)] text-sm placeholder:text-[var(--navy-400)] focus:outline-none focus:ring-2 focus:ring-[var(--warm-300)] focus:border-transparent"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link href="/admin" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  Admin
                </Button>
              </Link>
              <Button
                variant="primary"
                size="sm"
                className="bg-[#0057B7] hover:bg-[#004494]"
              >
                Support a Project
              </Button>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {/* Category chips */}
            {(Object.keys(CATEGORY_CONFIG) as Category[]).map((category) => {
              const config = CATEGORY_CONFIG[category]
              const isActive = selectedCategories.has(category)
              return (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[var(--warm-500)] text-white'
                      : 'bg-[var(--cream-50)] border border-[var(--cream-300)] text-[var(--navy-600)] hover:border-[var(--warm-300)] hover:bg-[var(--warm-50)]'
                  }`}
                >
                  <span>{config.icon}</span>
                  <span className="hidden sm:inline">{config.label.split(' ')[0]}</span>
                </button>
              )
            })}

            {/* Urgency dropdown */}
            <select
              value={selectedUrgency || ''}
              onChange={(e) => setSelectedUrgency((e.target.value as Urgency) || null)}
              className="px-3 py-1.5 rounded-full text-sm font-medium bg-[var(--cream-50)] border border-[var(--cream-300)] text-[var(--navy-600)] focus:outline-none focus:ring-2 focus:ring-[var(--warm-300)]"
            >
              <option value="">Urgency</option>
              {(Object.keys(URGENCY_CONFIG) as Urgency[]).map((urgency) => (
                <option key={urgency} value={urgency}>
                  {URGENCY_CONFIG[urgency].label}
                </option>
              ))}
            </select>

            {/* Status dropdown */}
            <select
              value={selectedStatus || ''}
              onChange={(e) => setSelectedStatus((e.target.value as Status) || null)}
              className="px-3 py-1.5 rounded-full text-sm font-medium bg-[var(--cream-50)] border border-[var(--cream-300)] text-[var(--navy-600)] focus:outline-none focus:ring-2 focus:ring-[var(--warm-300)]"
            >
              <option value="">Status</option>
              {(Object.keys(STATUS_CONFIG) as Status[]).map((status) => (
                <option key={status} value={status}>
                  {STATUS_CONFIG[status].label}
                </option>
              ))}
            </select>

            {/* Clear filters */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 rounded-full text-sm font-medium text-[var(--warm-600)] hover:bg-[var(--warm-50)] transition-colors"
              >
                Clear ({activeFilterCount})
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content - Split Screen */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel - Project List */}
        <div className="w-full lg:w-1/2 xl:w-[45%] overflow-y-auto custom-scrollbar bg-[var(--cream-50)]">
          {/* Results Header */}
          <div className="sticky top-0 z-10 bg-[var(--cream-100)] px-4 py-3 border-b border-[var(--cream-300)]">
            <p className="text-[var(--navy-600)] text-sm">
              <span className="font-semibold text-[var(--navy-700)]">
                {projectsInView.length}
              </span>{' '}
              {projectsInView.length === 1 ? 'project' : 'projects'} in this area
              {filteredProjects.length !== allProjects.length && (
                <span className="text-[var(--navy-400)]">
                  {' '}• {filteredProjects.length} total matching filters
                </span>
              )}
            </p>
          </div>

          {/* Project Cards Grid */}
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
            {projectsInView.length > 0 ? (
              projectsInView.map((project) => (
                <div
                  key={project.id}
                  ref={(el) => {
                    cardRefs.current[project.id] = el
                  }}
                >
                  <ProjectCard
                    project={project}
                    isHighlighted={highlightedProjectId === project.id}
                    onMouseEnter={() => handleCardHover(project.id)}
                    onMouseLeave={() => handleCardHover(null)}
                  />
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center">
                <div className="text-[var(--navy-300)] mb-4">
                  <svg
                    className="h-16 w-16 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[var(--navy-700)] mb-2">
                  No projects found
                </h3>
                <p className="text-[var(--navy-500)] mb-4">
                  Try adjusting your filters or zoom out on the map.
                </p>
                {activeFilterCount > 0 && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear all filters
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[var(--cream-300)] bg-[var(--cream-100)]">
            <p className="text-xs text-[var(--navy-600)] text-center">
              <span className="font-medium">hromada</span> connects American donors with Ukrainian communities.
              <br />
              <span className="text-[var(--navy-400)]">
                No payment processing occurs on this platform.
              </span>
            </p>
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="hidden lg:block lg:w-1/2 xl:w-[55%] sticky top-0 h-full">
          <MapWrapper
            projects={filteredProjects}
            highlightedProjectId={highlightedProjectId}
            onProjectClick={handleMarkerClick}
            onProjectHover={handleMarkerHover}
            onBoundsChange={handleBoundsChange}
          />
        </div>
      </main>

      {/* Mobile Map Toggle */}
      <div className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <Button
          variant="primary"
          className="shadow-lg bg-[var(--navy-700)] hover:bg-[var(--navy-800)] rounded-full px-6"
          onClick={() => {
            alert('Mobile map view coming soon!')
          }}
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          View Map
        </Button>
      </div>
    </div>
  )
}
