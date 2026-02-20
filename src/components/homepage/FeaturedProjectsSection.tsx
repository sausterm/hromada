'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { type Project } from '@/types'

interface FeaturedProjectsSectionProps {
  projects: Project[]
}

export function FeaturedProjectsSection({ projects }: FeaturedProjectsSectionProps) {
  const t = useTranslations()

  return (
    <section id="featured-projects" className="fade-in-section py-16 md:py-24 bg-[var(--cream-100)] scroll-mt-20 shadow-[inset_0_8px_12px_-8px_rgba(0,0,0,0.08)]">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-logo text-2xl md:text-3xl font-semibold tracking-tight text-[var(--navy-700)]">
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
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  )
}
