'use client'

import { useState, useCallback, useMemo, useRef, useEffect, useId } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { MapWrapper, type MapBounds } from '@/components/map/MapWrapper'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  type Project,
  type Category,
  type Urgency,
  type Status,
  type CofinancingStatus,
  type ProjectType,
  CATEGORY_CONFIG,
  URGENCY_CONFIG,
  STATUS_CONFIG,
  COFINANCING_CONFIG,
  PROJECT_TYPE_CONFIG,
  formatCurrency,
  getLocalizedProject,
} from '@/types'

// Sort options type
type SortOption = 'newest' | 'oldest' | 'highestCost' | 'lowestCost' | 'mostUrgent' | 'alphabetical'

// Urgency priority for sorting
const URGENCY_PRIORITY: Record<Urgency, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
}

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
  const t = useTranslations()
  const locale = useLocale()
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const listContainerRef = useRef<HTMLDivElement | null>(null)

  // State
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [visibleProjects, setVisibleProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch projects from API
  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/projects?all=true')
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
  const [flyToProjectId, setFlyToProjectId] = useState<string | null>(null) // Separate state for zoom-on-click
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<Set<Category>>(new Set())
  const [selectedUrgency, setSelectedUrgency] = useState<Urgency | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null)
  const [selectedCofinancing, setSelectedCofinancing] = useState<CofinancingStatus | null>(null)
  const [selectedProjectType, setSelectedProjectType] = useState<ProjectType | null>(null)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000])
  const [powerRange, setPowerRange] = useState<[number, number]>([0, 500])
  const [isPriceDropdownOpen, setIsPriceDropdownOpen] = useState(false)
  const [isPowerDropdownOpen, setIsPowerDropdownOpen] = useState(false)
  const [isProjectTypeOpen, setIsProjectTypeOpen] = useState(false)
  const [isUrgencyOpen, setIsUrgencyOpen] = useState(false)
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [isCofinancingOpen, setIsCofinancingOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const priceDropdownId = useId()
  const powerDropdownId = useId()
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  // Refs for filter buttons to position dropdowns
  const priceButtonRef = useRef<HTMLButtonElement>(null)
  const powerButtonRef = useRef<HTMLButtonElement>(null)
  const projectTypeButtonRef = useRef<HTMLButtonElement>(null)
  const urgencyButtonRef = useRef<HTMLButtonElement>(null)
  const statusButtonRef = useRef<HTMLButtonElement>(null)
  const cofinancingButtonRef = useRef<HTMLButtonElement>(null)

  // Pagination for card list
  const ITEMS_PER_PAGE = 12
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE)

  // Track if map is visible (lg breakpoint = 1024px)
  const [isMapVisible, setIsMapVisible] = useState(false)

  useEffect(() => {
    const checkMapVisibility = () => {
      setIsMapVisible(window.innerWidth >= 1024)
    }
    checkMapVisibility()
    window.addEventListener('resize', checkMapVisibility)
    return () => window.removeEventListener('resize', checkMapVisibility)
  }, [])

  // Filtered projects based on search and filters
  const filteredProjects = useMemo(() => {
    let result = allProjects

    // Search filter - includes facility name, municipality, region/oblast, address
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((p) => {
        const localized = getLocalizedProject(p, locale)
        const searchableFields = [
          localized.facilityName,
          localized.municipalityName,
          p.region, // Oblast/region
          p.address, // Address field
          localized.briefDescription, // Also search in description
        ].filter(Boolean) // Remove undefined/null values

        return searchableFields.some((field) =>
          field!.toLowerCase().includes(query)
        )
      })
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

    // Project type filter
    if (selectedProjectType) {
      result = result.filter((p) => p.projectType === selectedProjectType)
    }

    // Price range filter
    const [minPrice, maxPrice] = priceRange
    if (minPrice > 0 || maxPrice < 500000) {
      result = result.filter((p) => {
        if (p.estimatedCostUsd === undefined || p.estimatedCostUsd === null) return true
        return p.estimatedCostUsd >= minPrice && p.estimatedCostUsd <= maxPrice
      })
    }

    // Power range filter
    const [minPower, maxPower] = powerRange
    if (minPower > 0 || maxPower < 500) {
      result = result.filter((p) => {
        if (p.technicalPowerKw === undefined || p.technicalPowerKw === null) return true
        return p.technicalPowerKw >= minPower && p.technicalPowerKw <= maxPower
      })
    }

    return result
  }, [allProjects, searchQuery, selectedCategories, selectedUrgency, selectedStatus, selectedCofinancing, selectedProjectType, priceRange, powerRange, locale])

  // Sorted projects
  const sortedProjects = useMemo(() => {
    const sorted = [...filteredProjects]

    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'oldest':
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case 'highestCost':
        sorted.sort((a, b) => {
          // Projects without cost go to the end
          if (a.estimatedCostUsd === undefined || a.estimatedCostUsd === null) return 1
          if (b.estimatedCostUsd === undefined || b.estimatedCostUsd === null) return -1
          return b.estimatedCostUsd - a.estimatedCostUsd
        })
        break
      case 'lowestCost':
        sorted.sort((a, b) => {
          // Projects without cost go to the end
          if (a.estimatedCostUsd === undefined || a.estimatedCostUsd === null) return 1
          if (b.estimatedCostUsd === undefined || b.estimatedCostUsd === null) return -1
          return a.estimatedCostUsd - b.estimatedCostUsd
        })
        break
      case 'mostUrgent':
        sorted.sort((a, b) => URGENCY_PRIORITY[b.urgency] - URGENCY_PRIORITY[a.urgency])
        break
      case 'alphabetical':
        sorted.sort((a, b) => {
          const localizedA = getLocalizedProject(a, locale)
          const localizedB = getLocalizedProject(b, locale)
          return localizedA.facilityName.localeCompare(localizedB.facilityName)
        })
        break
    }

    return sorted
  }, [filteredProjects, sortBy, locale])

  // Projects visible in current map bounds (uses sorted projects)
  // When map is not visible (mobile/narrow screens), show all projects
  const projectsInView = useMemo(() => {
    if (!isMapVisible) {
      return sortedProjects
    }
    return sortedProjects.filter((p) =>
      visibleProjects.some((vp) => vp.id === p.id)
    )
  }, [sortedProjects, visibleProjects, isMapVisible])

  // Paginated projects for the card list
  const paginatedProjects = useMemo(() => {
    return projectsInView.slice(0, displayCount)
  }, [projectsInView, displayCount])

  const hasMoreProjects = projectsInView.length > displayCount

  // Reset pagination when filters change
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE)
  }, [searchQuery, selectedCategories, selectedUrgency, selectedStatus, selectedCofinancing, priceRange])

  // Show more projects
  const showMoreProjects = useCallback(() => {
    setDisplayCount((prev) => prev + ITEMS_PER_PAGE)
  }, [])

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

  // Handle card hover - highlight corresponding marker on map
  const handleCardHover = useCallback((projectId: string | null) => {
    setHighlightedProjectId(projectId)
  }, [])

  // Handle marker click - scroll to card in list and zoom
  const handleMarkerClick = useCallback((project: Project) => {
    setHighlightedProjectId(project.id)
    setFlyToProjectId(project.id)
    const cardElement = cardRefs.current[project.id]
    const container = listContainerRef.current
    if (cardElement && container) {
      // Scroll within the list container only, not the page
      const containerRect = container.getBoundingClientRect()
      const cardRect = cardElement.getBoundingClientRect()
      const scrollTop = container.scrollTop + (cardRect.top - containerRect.top) - (containerRect.height / 2) + (cardRect.height / 2)
      container.scrollTo({ top: scrollTop, behavior: 'smooth' })
    }
  }, [])

  // Handle card click - zoom to project on map (for homepage split view)
  const handleCardClick = useCallback((project: Project) => {
    setHighlightedProjectId(project.id)
    setFlyToProjectId(project.id)
  }, [])

  // Handle marker hover - highlight corresponding card in list
  const handleMarkerHover = useCallback((project: Project | null) => {
    setHighlightedProjectId(project?.id || null)
  }, [])

  // Handle fly animation complete - reset state to allow re-trigger
  const handleFlyToComplete = useCallback(() => {
    setFlyToProjectId(null)
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

  // Clear search only
  const clearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setSelectedCategories(new Set())
    setSelectedUrgency(null)
    setSelectedStatus(null)
    setSelectedCofinancing(null)
    setSelectedProjectType(null)
    setPriceRange([0, 500000])
    setSortBy('newest')
  }, [])

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (searchQuery.trim()) count++
    count += selectedCategories.size
    if (selectedUrgency) count++
    if (selectedStatus) count++
    if (selectedCofinancing) count++
    if (selectedProjectType) count++
    if (priceRange[0] > 0 || priceRange[1] < 500000) count++
    return count
  }, [searchQuery, selectedCategories, selectedUrgency, selectedStatus, selectedCofinancing, selectedProjectType, priceRange])

  // Total funding needed for visible projects
  const totalFundingNeeded = useMemo(() => {
    return projectsInView.reduce((sum, p) => sum + (p.estimatedCostUsd || 0), 0)
  }, [projectsInView])

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--cream-50)]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--cream-50)]">
      {/* Header with Filter Bar */}
      <Header>
        <div className="px-4 lg:px-6 py-2 bg-[var(--cream-50)] border-t border-[var(--cream-200)] overflow-x-auto">
          <div className="flex items-center gap-2 flex-nowrap">
            {/* Price Range Dropdown */}
            <div
              className="relative shrink-0"
              onMouseEnter={() => setIsPriceDropdownOpen(true)}
              onMouseLeave={() => setIsPriceDropdownOpen(false)}
            >
              <button
                ref={priceButtonRef}
                aria-expanded={isPriceDropdownOpen}
                aria-controls={priceDropdownId}
                className={`inline-flex items-center justify-center gap-1.5 py-1 rounded-full text-sm font-medium transition-all shrink-0 whitespace-nowrap border-2 w-[130px] ${
                  priceRange[0] > 0 || priceRange[1] < 500000
                    ? 'bg-[var(--navy-600)] text-white border-[var(--navy-600)]'
                    : 'bg-white border-[var(--cream-300)] text-[var(--navy-600)] hover:border-[var(--navy-300)]'
                }`}
              >
                <span>
                  {priceRange[0] > 0 || priceRange[1] < 500000
                    ? `$${Math.round(priceRange[0] / 1000)}k - $${priceRange[1] >= 500000 ? '500k+' : `${Math.round(priceRange[1] / 1000)}k`}`
                    : t('homepage.filters.price')}
                </span>
                <svg className={`h-3.5 w-3.5 transition-transform ${isPriceDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown panel */}
              {isPriceDropdownOpen && priceButtonRef.current && (
                <div
                  className="fixed z-50 pt-2"
                  style={{
                    top: priceButtonRef.current.getBoundingClientRect().bottom,
                    left: priceButtonRef.current.getBoundingClientRect().left + priceButtonRef.current.getBoundingClientRect().width / 2 - 56,
                  }}
                  onMouseEnter={() => setIsPriceDropdownOpen(true)}
                  onMouseLeave={() => setIsPriceDropdownOpen(false)}
                >
                  <div
                    id={priceDropdownId}
                    className="bg-white rounded-lg shadow-lg border border-[var(--cream-300)] p-3 w-28"
                  >
                  <div className="flex flex-col gap-2 items-center">
                    {/* Max value */}
                    <span className="text-sm font-medium text-[var(--navy-700)]">
                      ${priceRange[1] >= 500000 ? '500k+' : priceRange[1] >= 1000 ? `${Math.round(priceRange[1] / 1000)}k` : priceRange[1]}
                    </span>

                    {/* Vertical slider container */}
                    <div className="relative h-32 flex justify-center">
                      {/* Track background */}
                      <div className="absolute w-1.5 h-full bg-[var(--cream-300)] rounded-full" />
                      {/* Active track */}
                      <div
                        className="absolute w-1.5 bg-[var(--navy-500)] rounded-full pointer-events-none"
                        style={{
                          top: `${(1 - priceRange[1] / 500000) * 100}%`,
                          bottom: `${(priceRange[0] / 500000) * 100}%`,
                        }}
                      />
                      {/* Max slider (top - higher values) */}
                      <input
                        type="range"
                        min={0}
                        max={500000}
                        step={10000}
                        value={priceRange[1]}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          if (val > priceRange[0]) {
                            setPriceRange([priceRange[0], val])
                          }
                        }}
                        className="absolute h-full w-32 appearance-none bg-transparent pointer-events-none cursor-pointer z-[4] origin-center -rotate-90 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--navy-600)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--navy-600)] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:cursor-grab"
                      />
                      {/* Min slider (bottom - lower values) */}
                      <input
                        type="range"
                        min={0}
                        max={500000}
                        step={10000}
                        value={priceRange[0]}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          if (val < priceRange[1]) {
                            setPriceRange([val, priceRange[1]])
                          }
                        }}
                        className="absolute h-full w-32 appearance-none bg-transparent pointer-events-none cursor-pointer z-[3] origin-center -rotate-90 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--navy-600)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--navy-600)] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:cursor-grab"
                      />
                    </div>

                    {/* Min value */}
                    <span className="text-sm font-medium text-[var(--navy-700)]">
                      ${priceRange[0] >= 1000000 ? `${(priceRange[0] / 1000000).toFixed(1)}M` : priceRange[0] >= 1000 ? `${Math.round(priceRange[0] / 1000)}k` : priceRange[0]}
                    </span>

                    {/* Reset button */}
                    <button
                      onClick={() => setPriceRange([0, 500000])}
                      className="text-xs text-[var(--navy-500)] hover:text-[var(--navy-700)] underline mt-1"
                    >
                      Reset
                    </button>
                  </div>
                  </div>
                </div>
              )}
            </div>

            {/* Project Type dropdown */}
            <div
              className="relative shrink-0"
              onMouseEnter={() => setIsProjectTypeOpen(true)}
              onMouseLeave={() => setIsProjectTypeOpen(false)}
            >
              <button
                ref={projectTypeButtonRef}
                className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-all whitespace-nowrap border-2 ${
                  selectedProjectType
                    ? 'bg-[var(--navy-600)] text-white border-[var(--navy-600)]'
                    : 'bg-white border-[var(--cream-300)] text-[var(--navy-600)] hover:border-[var(--navy-300)]'
                }`}
              >
                <span>{selectedProjectType ? t(`projectTypes.${selectedProjectType}`) : t('homepage.filters.projectType')}</span>
                <svg className={`h-3.5 w-3.5 transition-transform ${isProjectTypeOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isProjectTypeOpen && projectTypeButtonRef.current && (
                <div
                  className="fixed z-50 pt-2"
                  style={{
                    top: projectTypeButtonRef.current.getBoundingClientRect().bottom,
                    left: projectTypeButtonRef.current.getBoundingClientRect().left,
                  }}
                  onMouseEnter={() => setIsProjectTypeOpen(true)}
                  onMouseLeave={() => setIsProjectTypeOpen(false)}
                >
                  <div className="w-56 rounded-lg bg-white shadow-lg border border-[var(--cream-300)] py-2">
                    {(Object.keys(PROJECT_TYPE_CONFIG) as ProjectType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedProjectType(selectedProjectType === type ? null : type)}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${selectedProjectType === type ? 'bg-[var(--cream-100)] text-[var(--navy-800)] font-medium' : 'text-[var(--navy-600)] hover:bg-[var(--cream-100)]'}`}
                      >
                        {t(`projectTypes.${type}`)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Power Range Dropdown */}
            <div
              className="relative shrink-0"
              onMouseEnter={() => setIsPowerDropdownOpen(true)}
              onMouseLeave={() => setIsPowerDropdownOpen(false)}
            >
              <button
                ref={powerButtonRef}
                aria-expanded={isPowerDropdownOpen}
                aria-controls={powerDropdownId}
                className={`inline-flex items-center justify-center gap-1.5 py-1 rounded-full text-sm font-medium transition-all shrink-0 whitespace-nowrap border-2 w-[130px] ${
                  powerRange[0] > 0 || powerRange[1] < 500
                    ? 'bg-[var(--navy-600)] text-white border-[var(--navy-600)]'
                    : 'bg-white border-[var(--cream-300)] text-[var(--navy-600)] hover:border-[var(--navy-300)]'
                }`}
              >
                <span>
                  {powerRange[0] > 0 || powerRange[1] < 500
                    ? `${powerRange[0]} - ${powerRange[1] >= 500 ? '500+' : powerRange[1]} kW`
                    : t('homepage.filters.power')}
                </span>
                <svg className={`h-3.5 w-3.5 transition-transform ${isPowerDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown panel */}
              {isPowerDropdownOpen && powerButtonRef.current && (
                <div
                  className="fixed z-50 pt-2"
                  style={{
                    top: powerButtonRef.current.getBoundingClientRect().bottom,
                    left: powerButtonRef.current.getBoundingClientRect().left + powerButtonRef.current.getBoundingClientRect().width / 2 - 56,
                  }}
                  onMouseEnter={() => setIsPowerDropdownOpen(true)}
                  onMouseLeave={() => setIsPowerDropdownOpen(false)}
                >
                  <div
                    id={powerDropdownId}
                    className="bg-white rounded-lg shadow-lg border border-[var(--cream-300)] p-3 w-28"
                  >
                  <div className="flex flex-col gap-2 items-center">
                    {/* Max value */}
                    <span className="text-sm font-medium text-[var(--navy-700)]">
                      {powerRange[1] >= 500 ? '500+' : powerRange[1]} kW
                    </span>

                    {/* Vertical slider container */}
                    <div className="relative h-32 flex justify-center">
                      {/* Track background */}
                      <div className="absolute w-1.5 h-full bg-[var(--cream-300)] rounded-full" />
                      {/* Active track */}
                      <div
                        className="absolute w-1.5 bg-[var(--navy-500)] rounded-full pointer-events-none"
                        style={{
                          top: `${(1 - powerRange[1] / 500) * 100}%`,
                          bottom: `${(powerRange[0] / 500) * 100}%`,
                        }}
                      />
                      {/* Max slider (top - higher values) */}
                      <input
                        type="range"
                        min={0}
                        max={500}
                        step={10}
                        value={powerRange[1]}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          if (val > powerRange[0]) {
                            setPowerRange([powerRange[0], val])
                          }
                        }}
                        className="absolute h-full w-32 appearance-none bg-transparent pointer-events-none cursor-pointer z-[4] origin-center -rotate-90 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--navy-600)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--navy-600)] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:cursor-grab"
                      />
                      {/* Min slider (bottom - lower values) */}
                      <input
                        type="range"
                        min={0}
                        max={500}
                        step={10}
                        value={powerRange[0]}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          if (val < powerRange[1]) {
                            setPowerRange([val, powerRange[1]])
                          }
                        }}
                        className="absolute h-full w-32 appearance-none bg-transparent pointer-events-none cursor-pointer z-[3] origin-center -rotate-90 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--navy-600)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--navy-600)] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:cursor-grab"
                      />
                    </div>

                    {/* Min value */}
                    <span className="text-sm font-medium text-[var(--navy-700)]">
                      {powerRange[0]} kW
                    </span>

                    {/* Reset button */}
                    <button
                      onClick={() => setPowerRange([0, 500])}
                      className="text-xs text-[var(--navy-500)] hover:text-[var(--navy-700)] underline mt-1"
                    >
                      Reset
                    </button>
                  </div>
                  </div>
                </div>
              )}
            </div>

            {/* Status dropdown */}
            <div
              className="relative shrink-0"
              onMouseEnter={() => setIsStatusOpen(true)}
              onMouseLeave={() => setIsStatusOpen(false)}
            >
              <button
                ref={statusButtonRef}
                className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-all whitespace-nowrap border-2 ${
                  selectedStatus
                    ? 'bg-[var(--navy-600)] text-white border-[var(--navy-600)]'
                    : 'bg-white border-[var(--cream-300)] text-[var(--navy-600)] hover:border-[var(--navy-300)]'
                }`}
              >
                <span>{selectedStatus ? t(`status.${selectedStatus}`) : t('homepage.filters.status')}</span>
                <svg className={`h-3.5 w-3.5 transition-transform ${isStatusOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isStatusOpen && statusButtonRef.current && (
                <div
                  className="fixed z-50 pt-2"
                  style={{
                    top: statusButtonRef.current.getBoundingClientRect().bottom,
                    left: statusButtonRef.current.getBoundingClientRect().left,
                  }}
                  onMouseEnter={() => setIsStatusOpen(true)}
                  onMouseLeave={() => setIsStatusOpen(false)}
                >
                  <div className="w-48 rounded-lg bg-white shadow-lg border border-[var(--cream-300)] py-2">
                    {(Object.keys(STATUS_CONFIG) as Status[]).map((status) => (
                      <button
                        key={status}
                        onClick={() => setSelectedStatus(selectedStatus === status ? null : status)}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${selectedStatus === status ? 'bg-[var(--cream-100)] text-[var(--navy-800)] font-medium' : 'text-[var(--navy-600)] hover:bg-[var(--cream-100)]'}`}
                      >
                        {t(`status.${status}`)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Urgency dropdown */}
            <div
              className="relative shrink-0"
              onMouseEnter={() => setIsUrgencyOpen(true)}
              onMouseLeave={() => setIsUrgencyOpen(false)}
            >
              <button
                ref={urgencyButtonRef}
                className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-all whitespace-nowrap border-2 ${
                  selectedUrgency
                    ? 'bg-[var(--navy-600)] text-white border-[var(--navy-600)]'
                    : 'bg-white border-[var(--cream-300)] text-[var(--navy-600)] hover:border-[var(--navy-300)]'
                }`}
              >
                <span>{selectedUrgency ? t(`urgency.${selectedUrgency}`) : t('homepage.filters.urgency')}</span>
                <svg className={`h-3.5 w-3.5 transition-transform ${isUrgencyOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isUrgencyOpen && urgencyButtonRef.current && (
                <div
                  className="fixed z-50 pt-2"
                  style={{
                    top: urgencyButtonRef.current.getBoundingClientRect().bottom,
                    left: urgencyButtonRef.current.getBoundingClientRect().left,
                  }}
                  onMouseEnter={() => setIsUrgencyOpen(true)}
                  onMouseLeave={() => setIsUrgencyOpen(false)}
                >
                  <div className="w-48 rounded-lg bg-white shadow-lg border border-[var(--cream-300)] py-2">
                    {(Object.keys(URGENCY_CONFIG) as Urgency[]).map((urgency) => (
                      <button
                        key={urgency}
                        onClick={() => setSelectedUrgency(selectedUrgency === urgency ? null : urgency)}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${selectedUrgency === urgency ? 'bg-[var(--cream-100)] text-[var(--navy-800)] font-medium' : 'text-[var(--navy-600)] hover:bg-[var(--cream-100)]'}`}
                      >
                        {t(`urgency.${urgency}`)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cofinancing dropdown */}
            <div
              className="relative shrink-0"
              onMouseEnter={() => setIsCofinancingOpen(true)}
              onMouseLeave={() => setIsCofinancingOpen(false)}
            >
              <button
                ref={cofinancingButtonRef}
                className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-all whitespace-nowrap border-2 ${
                  selectedCofinancing
                    ? 'bg-[var(--navy-600)] text-white border-[var(--navy-600)]'
                    : 'bg-white border-[var(--cream-300)] text-[var(--navy-600)] hover:border-[var(--navy-300)]'
                }`}
              >
                <span>{selectedCofinancing ? t(`cofinancing.${selectedCofinancing}`) : t('homepage.filters.cofinancing')}</span>
                <svg className={`h-3.5 w-3.5 transition-transform ${isCofinancingOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isCofinancingOpen && cofinancingButtonRef.current && (
                <div
                  className="fixed z-50 pt-2"
                  style={{
                    top: cofinancingButtonRef.current.getBoundingClientRect().bottom,
                    left: cofinancingButtonRef.current.getBoundingClientRect().left,
                  }}
                  onMouseEnter={() => setIsCofinancingOpen(true)}
                  onMouseLeave={() => setIsCofinancingOpen(false)}
                >
                  <div className="w-56 rounded-lg bg-white shadow-lg border border-[var(--cream-300)] py-2">
                    {(Object.keys(COFINANCING_CONFIG) as CofinancingStatus[]).map((cofinancing) => (
                      <button
                        key={cofinancing}
                        onClick={() => setSelectedCofinancing(selectedCofinancing === cofinancing ? null : cofinancing)}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${selectedCofinancing === cofinancing ? 'bg-[var(--cream-100)] text-[var(--navy-800)] font-medium' : 'text-[var(--navy-600)] hover:bg-[var(--cream-100)]'}`}
                      >
                        {t(`cofinancing.${cofinancing}`)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Category chips */}
            {(Object.keys(CATEGORY_CONFIG) as Category[]).map((category) => {
              const config = CATEGORY_CONFIG[category]
              const isActive = selectedCategories.has(category)
              return (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-all shrink-0 border-2 ${
                    isActive
                      ? 'bg-[var(--navy-600)] text-white border-[var(--navy-600)]'
                      : 'bg-white border-[var(--cream-300)] text-[var(--navy-600)] hover:border-[var(--navy-300)] hover:bg-[var(--navy-50)]'
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                    dangerouslySetInnerHTML={{ __html: config.icon }}
                  />
                  <span className="hidden sm:inline">{t(`categories.${category}`).split(' ')[0]}</span>
                </button>
              )
            })}

            {/* Clear filters */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium bg-[var(--navy-100)] text-[var(--navy-700)] hover:bg-[var(--navy-200)] transition-colors border border-[var(--navy-200)] shrink-0"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {t('homepage.filters.clear')}
                <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-[var(--navy-600)] text-white text-xs font-bold">
                  {activeFilterCount}
                </span>
              </button>
            )}
          </div>
        </div>
      </Header>

      {/* Main Content - Split Screen */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel - Project List */}
        <div ref={listContainerRef} className="w-full lg:w-1/2 xl:w-[45%] overflow-y-auto custom-scrollbar bg-[var(--cream-50)]">
          {/* Results Header - Single Line */}
          <div className="sticky top-0 z-10 bg-[var(--cream-100)] px-4 py-2.5 border-b border-[var(--cream-300)]">
            <div className="flex items-center gap-3">
              {/* Search with clear button - fills available space */}
              <div className="flex-1 min-w-0">
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
                    placeholder={t('homepage.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-1.5 rounded-full border border-[var(--cream-300)] bg-[var(--cream-50)] text-[var(--navy-700)] text-sm placeholder:text-[var(--navy-400)] focus:outline-none focus:ring-2 focus:ring-[var(--navy-300)] focus:border-transparent"
                  />
                  {/* Clear search button */}
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--navy-400)] hover:text-[var(--navy-600)] transition-colors"
                      aria-label={t('homepage.searchClear')}
                    >
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Sort dropdown */}
              <div
                className="relative shrink-0"
                onMouseEnter={() => setIsSortOpen(true)}
                onMouseLeave={() => setIsSortOpen(false)}
              >
                <button
                  className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-[var(--cream-300)] text-[var(--navy-600)] hover:border-[var(--navy-300)] transition-all whitespace-nowrap"
                >
                  <span>{t(`homepage.sortOptions.${sortBy}`)}</span>
                  <svg className={`h-3 w-3 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isSortOpen && (
                  <div className="absolute right-0 top-full pt-2 z-50">
                    <div className="w-40 rounded-lg bg-white shadow-lg border border-[var(--cream-300)] py-2">
                      {(['newest', 'oldest', 'highestCost', 'lowestCost', 'mostUrgent', 'alphabetical'] as SortOption[]).map((option) => (
                        <button
                          key={option}
                          onClick={() => setSortBy(option)}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${sortBy === option ? 'bg-[var(--cream-100)] text-[var(--navy-800)] font-medium' : 'text-[var(--navy-600)] hover:bg-[var(--cream-100)]'}`}
                        >
                          {t(`homepage.sortOptions.${option}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Project count & funding - bold and visible */}
              <div className="shrink-0 whitespace-nowrap">
                <span className="text-[var(--navy-800)] text-sm font-bold">
                  {projectsInView.length}
                </span>
                <span className="text-[var(--navy-600)] text-sm font-medium">
                  {' '}{t('common.projects')}{' '}
                </span>
                <span className="text-[var(--navy-400)]">|</span>
                <span className="text-[var(--navy-800)] text-sm font-bold">
                  {' '}{formatCurrency(totalFundingNeeded, { compact: true })}
                </span>
                <span className="text-[var(--navy-600)] text-sm font-medium">
                  {' '}{t('common.needed')}
                </span>
              </div>
            </div>
          </div>

          {/* Project Cards Grid */}
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
            {paginatedProjects.length > 0 ? (
              <>
                {paginatedProjects.map((project) => (
                  <div
                    key={project.id}
                    ref={(el) => {
                      cardRefs.current[project.id] = el
                    }}
                    className="h-full"
                  >
                    <ProjectCard
                      project={project}
                      isHighlighted={highlightedProjectId === project.id}
                      onMouseEnter={() => handleCardHover(project.id)}
                      onMouseLeave={() => handleCardHover(null)}
                      onClick={() => handleCardClick(project)}
                    />
                  </div>
                ))}
                {/* Show More Button */}
                {hasMoreProjects && (
                  <div className="col-span-full flex justify-center py-4">
                    <Button
                      variant="outline"
                      onClick={showMoreProjects}
                      className="px-8"
                    >
                      Show More ({projectsInView.length - displayCount} remaining)
                    </Button>
                  </div>
                )}
              </>
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
                  {t('homepage.noProjectsFound')}
                </h3>
                <p className="text-[var(--navy-500)] mb-4">
                  {t('homepage.noProjectsHint')}
                </p>
                {activeFilterCount > 0 && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    {t('homepage.clearAllFilters')}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[var(--cream-300)] bg-[var(--cream-100)]">
            <p className="text-xs text-[var(--navy-600)] text-center">
              <span className="font-medium">hromada</span> {t('homepage.footer')}
              <br />
              <span className="text-[var(--navy-400)]">
                {t('homepage.noPaymentProcessing')}
              </span>
            </p>
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="hidden lg:block lg:w-1/2 xl:w-[55%] sticky top-0 h-full">
          <MapWrapper
            projects={sortedProjects}
            highlightedProjectId={highlightedProjectId}
            flyToProjectId={flyToProjectId}
            onProjectClick={handleMarkerClick}
            onProjectHover={handleMarkerHover}
            onBoundsChange={handleBoundsChange}
            onFlyToComplete={handleFlyToComplete}
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
          {t('homepage.viewMap')}
        </Button>
      </div>
    </div>
  )
}
