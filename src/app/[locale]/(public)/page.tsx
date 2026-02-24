'use client'

import { useState, useEffect, useMemo } from 'react'
import { Header } from '@/components/layout/Header'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { HeroSection } from '@/components/homepage/HeroSection'
import { FeaturedProjectsSection } from '@/components/homepage/FeaturedProjectsSection'
import { HowItWorksSection } from '@/components/homepage/HowItWorksSection'
import { CaseStudySection } from '@/components/homepage/CaseStudySection'
import { PhotoStripSection } from '@/components/homepage/PhotoStripSection'
import { FAQSection } from '@/components/homepage/FAQSection'
import { CTASection } from '@/components/homepage/CTASection'
import { type Project } from '@/types'

// Helper to transform API response to Project type
function transformProject(data: any): Project {
  return {
    ...data,
    description: data.fullDescription || data.description || '',
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    cityLatitude: data.cityLatitude ? Number(data.cityLatitude) : 0,
    cityLongitude: data.cityLongitude ? Number(data.cityLongitude) : 0,
    latitude: data.latitude ? Number(data.latitude) : undefined,
    longitude: data.longitude ? Number(data.longitude) : undefined,
    technicalPowerKw: data.technicalPowerKw ? Number(data.technicalPowerKw) : undefined,
    estimatedCostUsd: data.estimatedCostUsd ? Number(data.estimatedCostUsd) : undefined,
  }
}

export default function HomePage() {
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [featuredProjectIds, setFeaturedProjectIds] = useState<string[]>([])
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
          if (data.featuredProjectIds) {
            setFeaturedProjectIds(data.featuredProjectIds)
          }
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProjects()
  }, [])

  // Total stats for hero
  const totalStats = useMemo(() => {
    const totalFunding = allProjects.reduce((sum, p) => sum + (p.estimatedCostUsd || 0), 0)
    const uniqueCommunities = new Set(allProjects.map(p => p.municipalityName).filter(Boolean))
    return {
      projectCount: allProjects.length,
      fundingNeeded: totalFunding,
      communityCount: uniqueCommunities.size,
    }
  }, [allProjects])

  // Featured projects: admin-selected (in slot order), backfilled with newest
  const featuredProjects = useMemo(() => {
    if (featuredProjectIds.length > 0) {
      const projectMap = new Map(allProjects.map(p => [p.id, p]))
      const featured = featuredProjectIds
        .map(id => projectMap.get(id))
        .filter((p): p is Project => p !== undefined)

      if (featured.length < 4) {
        const featuredSet = new Set(featuredProjectIds)
        const fillers = [...allProjects]
          .filter(p => !featuredSet.has(p.id))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 4 - featured.length)
        return [...featured, ...fillers]
      }
      return featured
    }

    return [...allProjects]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4)
  }, [allProjects, featuredProjectIds])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cream-100)]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--cream-100)]">
      <Header transparent />
      <HeroSection totalStats={totalStats} />
      <FeaturedProjectsSection projects={featuredProjects} />
      <HowItWorksSection />
      <CaseStudySection />
      <PhotoStripSection />
      <FAQSection />
      <CTASection />
    </div>
  )
}
