'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { MapWrapper, type MapBounds } from '@/components/map/MapWrapper'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  type Project,
  type Category,
  type Urgency,
  type Status,
  type CofinancingStatus,
  CATEGORY_CONFIG,
  URGENCY_CONFIG,
  STATUS_CONFIG,
  COFINANCING_CONFIG,
} from '@/types'

// Helper to transform API response to Project type
function transformProject(data: any): Project {
  return {
    ...data,
    // Map fullDescription to description for display
    description: data.fullDescription || data.description || '',
    // Ensure dates are Date objects
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    // Convert Decimal strings to numbers
    technicalPowerKw: data.technicalPowerKw ? Number(data.technicalPowerKw) : undefined,
    estimatedCostUsd: data.estimatedCostUsd ? Number(data.estimatedCostUsd) : undefined,
  }
}

export default function HomePage() {
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // State
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [visibleProjects, setVisibleProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch projects from API
  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/projects')
        if (response.ok) {
          const data = await response.json()
          const projects = data.projects.map(transformProject)
          setAllProjects(projects)
          setVisibleProjects(projects)
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProjects()
  }, [])
  const [highlightedProjectId, setHighlightedProjectId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<Set<Category>>(new Set())
  const [selectedUrgency, setSelectedUrgency] = useState<Urgency | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null)
  const [selectedCofinancing, setSelectedCofinancing] = useState<CofinancingStatus | null>(null)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000000])

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

    // Cofinancing filter
    if (selectedCofinancing) {
      result = result.filter((p) => p.cofinancingAvailable === selectedCofinancing)
    }

    // Price range filter
    const [minPrice, maxPrice] = priceRange
    if (minPrice > 0 || maxPrice < 3000000) {
      result = result.filter((p) => {
        if (p.estimatedCostUsd === undefined || p.estimatedCostUsd === null) return true
        return p.estimatedCostUsd >= minPrice && p.estimatedCostUsd <= maxPrice
      })
    }

    return result
  }, [allProjects, searchQuery, selectedCategories, selectedUrgency, selectedStatus, selectedCofinancing, priceRange])

  // Projects visible in current map bounds
  const projectsInView = useMemo(() => {
    return filteredProjects.filter((p) =>
      visibleProjects.some((vp) => vp.id === p.id)
    )
  }, [filteredProjects, visibleProjects])

  // Handle map bounds change - only update if visible projects actually changed
  const handleBoundsChange = useCallback(
    (_bounds: MapBounds, visible: Project[]) => {
      setVisibleProjects((prev) => {
        // Compare IDs to avoid unnecessary state updates
        const prevIds = new Set(prev.map((p) => p.id))
        const newIds = new Set(visible.map((p) => p.id))
        if (prevIds.size === newIds.size && [...prevIds].every((id) => newIds.has(id))) {
          return prev // No change, return same reference
        }
        return visible
      })
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

  // Handle marker hover - only update if different
  const handleMarkerHover = useCallback((project: Project | null) => {
    const newId = project?.id || null
    setHighlightedProjectId((prev) => (prev === newId ? prev : newId))
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
    setSelectedCofinancing(null)
    setPriceRange([0, 3000000])
  }, [])

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (searchQuery.trim()) count++
    count += selectedCategories.size
    if (selectedUrgency) count++
    if (selectedStatus) count++
    if (selectedCofinancing) count++
    if (priceRange[0] > 0 || priceRange[1] < 3000000) count++
    return count
  }, [searchQuery, selectedCategories, selectedUrgency, selectedStatus, selectedCofinancing, priceRange])

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--cream-50)]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--cream-50)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--cream-100)] border-b border-[var(--cream-300)] shadow-sm">
        <div className="px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left - Admin */}
            <div className="flex-1">
              <Link href="/admin" className="hidden sm:inline-block">
                <Button variant="ghost" size="sm">
                  Admin
                </Button>
              </Link>
            </div>

            {/* Center - Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <span className="text-2xl font-bold text-[var(--navy-700)]">
                hromada <span className="opacity-60">|</span> громада
              </span>
            </Link>

            {/* Right - About & Submit */}
            <div className="flex-1 flex items-center justify-end gap-3">
              <Link href="/about" className="hidden sm:inline-block">
                <Button variant="ghost" size="sm">
                  About Us
                </Button>
              </Link>
              <Link href="/submit-project">
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-[var(--navy-700)] hover:bg-[var(--navy-800)]"
                >
                  Submit a Project
                </Button>
              </Link>
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
                      ? 'bg-[var(--navy-600)] text-white'
                      : 'bg-[var(--cream-50)] border border-[var(--cream-300)] text-[var(--navy-600)] hover:border-[var(--navy-300)] hover:bg-[var(--navy-50)]'
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
              className="px-3 py-1.5 rounded-full text-sm font-medium bg-[var(--cream-50)] border border-[var(--cream-300)] text-[var(--navy-600)] focus:outline-none focus:ring-2 focus:ring-[var(--navy-300)]"
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
              className="px-3 py-1.5 rounded-full text-sm font-medium bg-[var(--cream-50)] border border-[var(--cream-300)] text-[var(--navy-600)] focus:outline-none focus:ring-2 focus:ring-[var(--navy-300)]"
            >
              <option value="">Status</option>
              {(Object.keys(STATUS_CONFIG) as Status[]).map((status) => (
                <option key={status} value={status}>
                  {STATUS_CONFIG[status].label}
                </option>
              ))}
            </select>

            {/* Cofinancing dropdown */}
            <select
              value={selectedCofinancing || ''}
              onChange={(e) => setSelectedCofinancing((e.target.value as CofinancingStatus) || null)}
              className="px-3 py-1.5 rounded-full text-sm font-medium bg-[var(--cream-50)] border border-[var(--cream-300)] text-[var(--navy-600)] focus:outline-none focus:ring-2 focus:ring-[var(--navy-300)]"
            >
              <option value="">Co-financing</option>
              {(Object.keys(COFINANCING_CONFIG) as CofinancingStatus[]).map((status) => (
                <option key={status} value={status}>
                  {COFINANCING_CONFIG[status].label}
                </option>
              ))}
            </select>

            {/* Price Range Slider */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--cream-50)] border border-[var(--cream-300)]">
              <span className="text-xs text-[var(--navy-600)] font-medium whitespace-nowrap">
                ${priceRange[0] >= 1000000 ? `${(priceRange[0] / 1000000).toFixed(1)}M` : `${Math.round(priceRange[0] / 1000)}k`}
              </span>
              <div className="relative w-28 h-5 flex items-center">
                {/* Track background */}
                <div className="absolute w-full h-1.5 bg-[var(--cream-300)] rounded-full" />
                {/* Active track */}
                <div
                  className="absolute h-1.5 bg-[var(--navy-500)] rounded-full pointer-events-none"
                  style={{
                    left: `${(priceRange[0] / 3000000) * 100}%`,
                    right: `${100 - (priceRange[1] / 3000000) * 100}%`,
                  }}
                />
                {/* Min slider */}
                <input
                  type="range"
                  min={0}
                  max={3000000}
                  step={50000}
                  value={priceRange[0]}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    if (val < priceRange[1]) {
                      setPriceRange([val, priceRange[1]])
                    }
                  }}
                  className="absolute w-full h-full appearance-none bg-transparent pointer-events-none z-[3] [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--navy-600)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--navy-600)] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:cursor-grab"
                />
                {/* Max slider */}
                <input
                  type="range"
                  min={0}
                  max={3000000}
                  step={50000}
                  value={priceRange[1]}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    if (val > priceRange[0]) {
                      setPriceRange([priceRange[0], val])
                    }
                  }}
                  className="absolute w-full h-full appearance-none bg-transparent pointer-events-none z-[4] [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--navy-600)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--navy-600)] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:cursor-grab"
                />
              </div>
              <span className="text-xs text-[var(--navy-600)] font-medium whitespace-nowrap">
                ${priceRange[1] >= 1000000 ? `${(priceRange[1] / 1000000).toFixed(1)}M` : `${Math.round(priceRange[1] / 1000)}k`}
              </span>
            </div>

            {/* Clear filters */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 rounded-full text-sm font-medium text-[var(--navy-600)] hover:bg-[var(--navy-50)] transition-colors"
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
            <div className="flex items-center justify-between gap-4">
              {/* Search */}
              <div className="flex-1 max-w-xs">
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
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-full border border-[var(--cream-300)] bg-[var(--cream-50)] text-[var(--navy-700)] text-sm placeholder:text-[var(--navy-400)] focus:outline-none focus:ring-2 focus:ring-[var(--navy-300)] focus:border-transparent"
                  />
                </div>
              </div>
              <p className="text-[var(--navy-600)] text-sm whitespace-nowrap">
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
