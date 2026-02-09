'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ProjectCard } from '@/components/projects/ProjectCard'
import {
  type Project,
  formatCurrency,
} from '@/types'

// Helper to transform API response to Project type
function transformProject(data: any): Project {
  return {
    ...data,
    description: data.fullDescription || data.description || '',
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    technicalPowerKw: data.technicalPowerKw ? Number(data.technicalPowerKw) : undefined,
    estimatedCostUsd: data.estimatedCostUsd ? Number(data.estimatedCostUsd) : undefined,
  }
}

export default function HomePage() {
  const t = useTranslations()
  const locale = useLocale()

  const [allProjects, setAllProjects] = useState<Project[]>([])
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
    const totalPower = allProjects.reduce((sum, p) => sum + (p.technicalPowerKw || 0), 0)
    return {
      projectCount: allProjects.length,
      fundingNeeded: totalFunding,
      totalPowerKw: totalPower,
    }
  }, [allProjects])

  // Featured projects (newest 4)
  const featuredProjects = useMemo(() => {
    return [...allProjects]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4)
  }, [allProjects])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cream-100)]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--cream-50)]">
      <Header />

      {/* Hero Section */}
      <section className="relative h-[500px] md:h-[550px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/photos/1748466072957.jpeg)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--navy-900)]/80 via-[var(--navy-900)]/60 to-transparent" />
        </div>

        <div className="relative h-full max-w-7xl mx-auto px-4 lg:px-8 flex flex-col justify-center">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              {t('homepage.hero.headline')}
            </h1>
            <p className="text-lg md:text-xl text-[var(--cream-200)] mb-8 leading-relaxed">
              {t('homepage.hero.subheadline')}
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 md:gap-10 mb-8">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white">{totalStats.projectCount}</div>
                <div className="text-sm text-[var(--cream-300)]">{t('homepage.hero.statProjects')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white">{formatCurrency(totalStats.fundingNeeded, { compact: true })}</div>
                <div className="text-sm text-[var(--cream-300)]">{t('homepage.hero.statFunding')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white">{Math.round(totalStats.totalPowerKw).toLocaleString()}</div>
                <div className="text-sm text-[var(--cream-300)]">{t('homepage.hero.statPower')}</div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Link href="/projects">
                <Button variant="primary" size="lg" className="bg-white text-[var(--navy-700)] hover:bg-[var(--cream-100)]">
                  {t('homepage.hero.ctaBrowse')}
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                  {t('homepage.hero.ctaHowItWorks')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--navy-700)] text-center mb-12">
            {t('homepage.howItWorks.title')}
          </h2>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--navy-100)] flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--navy-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--navy-700)] mb-2">{t('homepage.howItWorks.step1Title')}</h3>
              <p className="text-[var(--navy-500)]">{t('homepage.howItWorks.step1Desc')}</p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--navy-100)] flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--navy-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--navy-700)] mb-2">{t('homepage.howItWorks.step2Title')}</h3>
              <p className="text-[var(--navy-500)]">{t('homepage.howItWorks.step2Desc')}</p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--navy-100)] flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--navy-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--navy-700)] mb-2">{t('homepage.howItWorks.step3Title')}</h3>
              <p className="text-[var(--navy-500)]">{t('homepage.howItWorks.step3Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="py-16 md:py-24 bg-[var(--cream-50)]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--navy-700)]">
              {t('homepage.featured.title')}
            </h2>
            <Link href="/projects" className="text-[var(--navy-600)] hover:text-[var(--navy-800)] font-medium flex items-center gap-1">
              {t('homepage.featured.viewAll')}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </section>

      {/* Trust/Impact Section */}
      <section className="py-16 md:py-24 bg-[var(--navy-700)]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {t('homepage.trust.title')}
          </h2>
          <p className="text-lg text-[var(--cream-200)] mb-12 max-w-2xl mx-auto">
            {t('homepage.trust.subtitle')}
          </p>

          <div className="grid sm:grid-cols-3 gap-8 mb-12">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">100%</div>
              <div className="text-[var(--cream-300)]">{t('homepage.trust.stat1')}</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">{totalStats.projectCount}</div>
              <div className="text-[var(--cream-300)]">{t('homepage.trust.stat2')}</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">{Math.round(totalStats.totalPowerKw).toLocaleString()} kW</div>
              <div className="text-[var(--cream-300)]">{t('homepage.trust.stat3')}</div>
            </div>
          </div>

          <Link href="/transparency">
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
              {t('homepage.trust.cta')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-24 bg-[var(--cream-100)]">
        <div className="max-w-3xl mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--navy-700)] mb-4">
            {t('homepage.cta.title')}
          </h2>
          <p className="text-lg text-[var(--navy-500)] mb-8">
            {t('homepage.cta.subtitle')}
          </p>
          <Link href="/projects">
            <Button variant="primary" size="lg">
              {t('homepage.cta.button')}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
