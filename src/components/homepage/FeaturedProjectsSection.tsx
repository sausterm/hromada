'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { type Project } from '@/types'

interface FeaturedProjectsSectionProps {
  projects: Project[]
}

export function FeaturedProjectsSection({ projects }: FeaturedProjectsSectionProps) {
  const t = useTranslations()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const scrollLeft = el.scrollLeft
    const cardWidth = el.firstElementChild?.getBoundingClientRect().width ?? 280
    const gap = 16
    const index = Math.round(scrollLeft / (cardWidth + gap))
    setActiveIndex(Math.min(index, projects.length - 1))
  }, [projects.length])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const scrollTo = (index: number) => {
    const el = scrollRef.current
    if (!el) return
    const card = el.children[index] as HTMLElement | undefined
    if (!card) return
    const cardCenter = card.offsetLeft + card.offsetWidth / 2
    const scrollLeft = cardCenter - el.offsetWidth / 2
    el.scrollTo({ left: scrollLeft, behavior: 'smooth' })
  }

  return (
    <section id="featured-projects" className="fade-in-section py-8 md:py-12 bg-[var(--cream-100)] scroll-mt-20 shadow-[inset_0_8px_12px_-8px_rgba(0,0,0,0.08)]">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <h2 className="font-logo text-2xl md:text-3xl font-semibold tracking-tight text-[var(--navy-700)] mb-8 text-center">
          {t('homepage.featured.title')}
        </h2>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 sm:overflow-visible"
        >
          {projects.map((project) => (
            <div key={project.id} className="min-w-[280px] snap-center sm:min-w-0">
              <ProjectCard project={project} />
            </div>
          ))}
        </div>

        {/* Scroll dots - mobile only */}
        <div className="flex justify-center gap-2 mt-4 sm:hidden">
          {projects.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === activeIndex ? 'bg-[var(--navy-600)]' : 'bg-[var(--navy-200)]'
              }`}
              aria-label={`Go to project ${i + 1}`}
            />
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/projects" className="text-[var(--navy-600)] hover:text-[var(--navy-800)] font-medium inline-flex items-center gap-1">
            {t('homepage.featured.viewAll')}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
