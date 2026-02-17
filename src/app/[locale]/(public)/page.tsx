'use client'

import { useState, useEffect, useRef, useMemo, useCallback, type ReactNode } from 'react'
import Image from 'next/image'
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

// Step data with colors for How It Works section
const STEPS: { number: number; titleKey: string; descKey: string; hexColor: string; icon: ReactNode }[] = [
  {
    number: 1,
    titleKey: 'homepage.howItWorks.step1Title',
    descKey: 'homepage.howItWorks.step1Desc',
    hexColor: '#5B8FA8', // Muted teal
    icon: (
      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
      </svg>
    ),
  },
  {
    number: 2,
    titleKey: 'homepage.howItWorks.step2Title',
    descKey: 'homepage.howItWorks.step2Desc',
    hexColor: '#7B9E6B', // Sage green
    icon: (
      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
      </svg>
    ),
  },
  {
    number: 3,
    titleKey: 'homepage.howItWorks.step3Title',
    descKey: 'homepage.howItWorks.step3Desc',
    hexColor: '#D4954A', // Warm amber
    icon: (
      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
      </svg>
    ),
  },
  {
    number: 4,
    titleKey: 'homepage.howItWorks.step4Title',
    descKey: 'homepage.howItWorks.step4Desc',
    hexColor: '#C75B39', // Deep terracotta
    icon: (
      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
        <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
      </svg>
    ),
  },
  {
    number: 5,
    titleKey: 'homepage.howItWorks.step5Title',
    descKey: 'homepage.howItWorks.step5Desc',
    hexColor: '#8B7355', // Warm taupe
    icon: (
      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
        <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
      </svg>
    ),
  },
]

// FAQ accordion item — matches about page style
function FAQItem({ question, children }: { question: string; children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState(0)

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [children])

  return (
    <div className="border-b border-[var(--cream-300)] last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left hover:text-[var(--navy-800)] transition-colors"
      >
        <span className="font-medium text-[var(--navy-700)] pr-4">{question}</span>
        <svg
          className={`w-5 h-5 flex-shrink-0 text-[var(--navy-400)] transition-transform duration-300 ease-out ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{
          maxHeight: isOpen ? `${contentHeight}px` : '0px',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div ref={contentRef} className="pb-4 text-[var(--navy-600)] leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  )
}

// Step component for How It Works
function HowItWorksStep({ step, isLast, index, t }: { step: typeof STEPS[0]; isLast: boolean; index: number; t: ReturnType<typeof useTranslations> }) {
  const [isHovered, setIsHovered] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), index * 300)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [index])

  return (
    <div
      ref={ref}
      className={`flex flex-col md:flex-row items-start transition-all duration-1000 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
    >
      <div
        className="flex flex-col items-center text-center group cursor-default w-[140px]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative mb-3">
          <div
            className={`w-14 h-14 rounded-2xl text-white flex items-center justify-center shadow-lg transition-all duration-300 ${isHovered ? 'scale-110 shadow-xl rotate-3' : ''}`}
            style={{ backgroundColor: step.hexColor }}
          >
            {step.icon}
          </div>
          <div
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-md ring-2 ring-[var(--cream-100)]"
            style={{ backgroundColor: step.hexColor }}
          >
            {step.number}
          </div>
        </div>

        <h3 className="font-bold text-[var(--navy-700)] text-sm leading-tight">{t(step.titleKey)}</h3>
        <p className="text-[var(--navy-500)] text-xs mt-1 leading-snug">{t(step.descKey)}</p>
      </div>

      {!isLast && (
        <div className="hidden md:flex items-center h-14 px-1 lg:px-3">
          <svg className="w-5 h-5 text-[var(--cream-400)]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
          </svg>
        </div>
      )}

      {!isLast && (
        <div className="md:hidden py-3 flex justify-center w-full">
          <div className="w-0.5 h-6 bg-[var(--cream-300)]" />
        </div>
      )}
    </div>
  )
}

// Timeline event
function TimelineEvent({
  date,
  title,
  description,
  isComplete = true
}: {
  date: string
  title: string
  description?: string
  isComplete?: boolean
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${isComplete ? 'bg-green-500' : 'bg-[var(--cream-300)]'} ring-4 ${isComplete ? 'ring-green-100' : 'ring-[var(--cream-100)]'}`} />
        <div className="w-0.5 h-full bg-[var(--cream-300)] mt-2" />
      </div>
      <div className="pb-8">
        <div className="text-xs text-[var(--navy-400)] font-medium mb-1">{date}</div>
        <div className="font-semibold text-[var(--navy-700)]">{title}</div>
        {description && <p className="text-sm text-[var(--navy-500)] mt-1">{description}</p>}
      </div>
    </div>
  )
}

// Photo with caption
function DocumentaryPhoto({
  src,
  alt,
  caption,
  location
}: {
  src: string
  alt: string
  caption: string
  location?: string
}) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <figure className="relative">
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[var(--cream-200)]">
        <Image
          src={src}
          alt={alt}
          fill
          className={`object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        {location && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
            <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            {location}
          </div>
        )}
      </div>
      <figcaption className="mt-3 text-sm text-[var(--navy-500)] italic">{caption}</figcaption>
    </figure>
  )
}

// Live stats display
function LiveStatsCard() {
  const t = useTranslations()
  return (
    <div className="bg-white rounded-xl border border-[var(--cream-200)] overflow-hidden shadow-sm">
      <div className="bg-[var(--cream-50)] px-4 py-3 border-b border-[var(--cream-200)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-[var(--navy-700)]">{t('homepage.liveStats.title')}</span>
        </div>
        <span className="text-xs text-[var(--navy-400)]">{t('homepage.liveStats.location')}</span>
      </div>
      <div className="p-4 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-[var(--ukraine-blue)]">12.21</div>
          <div className="text-xs text-[var(--navy-400)]">{t('homepage.liveStats.solar')}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">100%</div>
          <div className="text-xs text-[var(--navy-400)]">{t('homepage.liveStats.battery')}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[var(--navy-700)]">18.28</div>
          <div className="text-xs text-[var(--navy-400)]">{t('homepage.liveStats.load')}</div>
        </div>
      </div>
      <div className="px-4 py-2 bg-green-50 border-t border-green-100">
        <div className="flex items-center justify-center gap-2 text-green-700 text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">{t('homepage.liveStats.status')}</span>
        </div>
      </div>
    </div>
  )
}

// Email capture form
function EmailCaptureForm({ t }: { t: ReturnType<typeof useTranslations> }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (res.ok) {
        setStatus('success')
        setEmail('')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center justify-center gap-2 text-green-700 bg-green-50 rounded-xl px-4 py-3">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm font-medium">{t('homepage.cta.emailSuccess')}</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t('homepage.cta.emailPlaceholder')}
        className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--cream-300)] bg-white text-[var(--navy-700)] text-sm placeholder:text-[var(--navy-400)] focus:outline-none focus:ring-2 focus:ring-[var(--navy-300)] focus:border-transparent"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-5 py-2.5 rounded-lg bg-[var(--navy-700)] text-white text-sm font-medium hover:bg-[var(--navy-800)] transition-colors disabled:opacity-50 whitespace-nowrap"
      >
        {status === 'loading' ? '...' : t('homepage.cta.emailButton')}
      </button>
      {status === 'error' && (
        <div className="absolute mt-12 text-xs text-red-600">{t('homepage.cta.emailError')}</div>
      )}
    </form>
  )
}

// Animated count-up for hero stats
function CountUp({ end, duration = 2500, prefix = '', suffix = '' }: { end: number; duration?: number; prefix?: string; suffix?: string }) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const start = performance.now()
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1)
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            setValue(Math.round(eased * end))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [end, duration])

  return <span ref={ref}>{prefix}{value.toLocaleString()}{suffix}</span>
}

// Animated count-up for currency (handles $XXK / $X.XM formatting)
function CountUpCurrency({ end, duration = 2500 }: { end: number; duration?: number }) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const start = performance.now()
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setValue(Math.round(eased * end))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [end, duration])

  return <span ref={ref}>{formatCurrency(value, { compact: true })}</span>
}

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

  // Hero parallax + content fade
  const heroImageRef = useRef<HTMLDivElement>(null)
  const heroContentRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      if (heroImageRef.current) {
        heroImageRef.current.style.transform = `translateY(${scrollY * 0.4}px)`
      }
      if (heroContentRef.current) {
        const fade = Math.max(0, 1 - scrollY / (window.innerHeight * 0.5))
        heroContentRef.current.style.opacity = `${fade}`
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Scroll-triggered fade-in for sections
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
          }
        })
      },
      { threshold: 0.1 }
    )
    const sections = document.querySelectorAll('.fade-in-section')
    sections.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [isLoading])

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

      {/* Hero Section - generous negative margin ensures hero covers behind the transparent header */}
      <section className="relative h-[100svh] md:h-[calc(100vh+2rem)] -mt-24 pt-24 overflow-hidden">
        {/* Outer div handles parallax transform via JS — inner div handles fade animation separately */}
        <div
          ref={heroImageRef}
          className="absolute left-0 right-0 will-change-transform"
          style={{ top: '-20%', bottom: '-20%' }}
        >
          <div
            className="hero-photo-animate absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url(https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748466071929.jpeg)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--navy-900)]/80 via-[var(--navy-900)]/60 to-transparent" />
          </div>
        </div>

        <div ref={heroContentRef} className="relative h-full max-w-7xl mx-auto px-4 lg:px-8 flex flex-col justify-center pb-16 md:pb-0 will-change-[opacity]">
          <div className="max-w-2xl">
            {/* 100% promise badge */}
            <div className="hero-animate hero-animate-delay-1 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-3 md:mb-6 shimmer-badge">
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium text-white">{t('homepage.hero.promiseBadge')}</span>
            </div>

            <h1 className="hero-animate hero-animate-delay-2 font-logo text-2xl md:text-4xl lg:text-5xl font-semibold text-white mb-2 md:mb-4 leading-tight tracking-tight">
              {t('homepage.hero.headline')}
            </h1>
            <p className="hero-animate hero-animate-delay-3 text-base md:text-xl text-[var(--cream-200)] mb-5 md:mb-8 leading-relaxed max-w-xl">
              {t('homepage.hero.subheadline')}
            </p>

            {/* Stats */}
            <div className="hero-animate hero-animate-delay-4 flex flex-wrap gap-4 md:gap-10 mb-5 md:mb-8">
              <div className="text-center">
                <div className="font-logo text-2xl md:text-4xl font-bold tracking-tight text-white"><CountUp end={totalStats.communityCount} /></div>
                <div className="text-xs md:text-sm text-[var(--cream-300)]">{t('homepage.hero.statCommunities')}</div>
              </div>
              <div className="text-center">
                <div className="font-logo text-2xl md:text-4xl font-bold tracking-tight text-white"><CountUp end={totalStats.projectCount} /></div>
                <div className="text-xs md:text-sm text-[var(--cream-300)]">{t('homepage.hero.statProjects')}</div>
              </div>
              <div className="text-center">
                <div className="font-logo text-2xl md:text-4xl font-bold tracking-tight text-white"><CountUpCurrency end={totalStats.fundingNeeded} /></div>
                <div className="text-xs md:text-sm text-[var(--cream-300)]">{t('homepage.hero.statFunding')}</div>
              </div>
            </div>

            {/* CTAs */}
            <div className="hero-animate hero-animate-delay-5 flex flex-wrap gap-4 items-center">
              <Link href="/projects">
                <Button variant="primary" size="lg" className="px-8 py-3.5 text-base font-semibold bg-white text-[var(--navy-700)] hover:bg-[var(--cream-100)] hero-cta-pulse">
                  {t('homepage.hero.ctaBrowse')}
                </Button>
              </Link>
              <Link href="#how-it-works" className="text-white/80 hover:text-white text-sm font-medium underline underline-offset-4 transition-colors">
                {t('homepage.hero.ctaHowItWorks')}
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <button
          onClick={() => document.getElementById('featured-projects')?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-4 md:bottom-12 left-1/2 -translate-x-1/2 animate-scroll-hint cursor-pointer p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-200"
          aria-label="Scroll to featured projects"
        >
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </section>

      {/* Featured Projects Section */}
      <section id="featured-projects" className="fade-in-section py-16 md:py-24 bg-[var(--cream-100)] scroll-mt-20">
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
            {featuredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="fade-in-section pt-4 pb-16 md:pt-8 md:pb-24 bg-[var(--cream-100)]">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 text-center">
          <h2 className="font-logo text-2xl md:text-3xl font-semibold tracking-tight text-[var(--navy-700)] mb-12">
            {t('homepage.howItWorks.title')}
          </h2>

          <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-0">
            {STEPS.map((step, index) => (
              <HowItWorksStep key={step.number} step={step} isLast={index === STEPS.length - 1} index={index} t={t} />
            ))}
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="inline-flex items-center gap-3 bg-white px-8 py-4 rounded-2xl border border-[var(--cream-200)] shadow-lg">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-[var(--navy-700)] font-semibold">{t('homepage.howItWorks.promiseTitle')}</div>
                <div className="text-sm text-[var(--navy-500)]">{t('homepage.howItWorks.promiseDesc')}</div>
              </div>
            </div>

            <a
              href="https://app.candid.org/profile/16026326/pocacito-network/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-[var(--cream-200)] shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--ukraine-blue)]/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--ukraine-blue)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-[var(--navy-700)] font-semibold text-sm">501(c)(3) Fiscal Sponsor</div>
                <div className="text-xs text-[var(--navy-500)]">POCACITO Network · Candid Platinum Seal</div>
              </div>
            </a>
          </div>

          {/* Project Categories */}
          <div className="mt-16 max-w-2xl mx-auto text-left">
            <h3 className="text-xl font-semibold text-[var(--navy-700)] mb-2 text-center">
              {t('about.projectCategories')}
            </h3>
            <p className="text-sm text-[var(--navy-500)] mb-6 text-center">
              {t('about.categoryIntro')}
            </p>
            <ul className="space-y-3 text-base leading-relaxed text-[var(--navy-600)]">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(199, 91, 57, 0.15)' }}>
                  <svg className="w-3.5 h-3.5" style={{ color: '#C75B39' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>
                  </svg>
                </span>
                <span><strong>{t('categories.HOSPITAL')}</strong> — {t('about.categoryHospital')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(123, 158, 107, 0.15)' }}>
                  <svg className="w-3.5 h-3.5" style={{ color: '#7B9E6B' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>
                  </svg>
                </span>
                <span><strong>{t('categories.SCHOOL')}</strong> — {t('about.categorySchool')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(91, 143, 168, 0.15)' }}>
                  <svg className="w-3.5 h-3.5" style={{ color: '#5B8FA8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>
                  </svg>
                </span>
                <span><strong>{t('categories.WATER')}</strong> — {t('about.categoryWater')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(212, 149, 74, 0.15)' }}>
                  <svg className="w-3.5 h-3.5" style={{ color: '#D4954A' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                </span>
                <span><strong>{t('categories.ENERGY')}</strong> — {t('about.categoryEnergy')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(139, 115, 85, 0.15)' }}>
                  <svg className="w-3.5 h-3.5" style={{ color: '#8B7355' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/>
                  </svg>
                </span>
                <span><strong>{t('categories.OTHER')}</strong> — {t('about.categoryOther')}</span>
              </li>
            </ul>
            <div className="mt-6 pt-6 border-t border-[var(--cream-300)] flex items-start gap-2">
              <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 18v-7" /><path d="M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z" /><path d="M14 18v-7" /><path d="M18 18v-7" /><path d="M3 22h18" /><path d="M6 18v-7" />
              </svg>
              <p className="text-sm leading-relaxed text-[var(--navy-600)]">
                <strong className="text-[var(--navy-700)]">{t('transparency.civilianOnlyTitle')}:</strong> {t('transparency.civilianOnlyText')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Case Study Section */}
      <section className="fade-in-section pt-4 pb-16 md:pt-8 md:pb-24 bg-[var(--cream-100)]">
        <div className="max-w-4xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-[var(--ukraine-blue)] text-sm font-medium mb-4">
              <div className="w-8 h-px bg-current" />
              {t('homepage.caseStudy.label')}
              <div className="w-8 h-px bg-current" />
            </div>
            <h2 className="font-logo text-3xl md:text-4xl font-semibold tracking-tight text-[var(--navy-700)] mb-4">
              {t('homepage.caseStudy.title')}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <div>
              <DocumentaryPhoto
                src="https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748586682092.jpeg"
                alt="Battery storage installation with Victron inverters"
                caption={t('homepage.caseStudy.photoCaption1')}
                location="Kharkiv, Ukraine"
              />
            </div>

            <div>
              <div className="mb-6">
                <span className="inline-block bg-[#C75B39] text-white text-xs px-2 py-1 rounded-full mb-3">
                  {t('homepage.caseStudy.badge')}
                </span>
                <h3 className="text-2xl font-bold text-[var(--navy-700)] mb-2">
                  {t('homepage.caseStudy.projectName')}
                </h3>
                <p className="text-[var(--navy-500)]">
                  {t('homepage.caseStudy.projectDesc')}
                </p>
              </div>

              <div className="mt-8">
                <TimelineEvent
                  date={t('homepage.caseStudy.timeline1Date')}
                  title={t('homepage.caseStudy.timeline1Title')}
                  description={t('homepage.caseStudy.timeline1Desc')}
                />
                <TimelineEvent
                  date={t('homepage.caseStudy.timeline2Date')}
                  title={t('homepage.caseStudy.timeline2Title')}
                  description={t('homepage.caseStudy.timeline2Desc')}
                />
                <TimelineEvent
                  date={t('homepage.caseStudy.timeline3Date')}
                  title={t('homepage.caseStudy.timeline3Title')}
                  description={t('homepage.caseStudy.timeline3Desc')}
                />
                <TimelineEvent
                  date={t('homepage.caseStudy.timeline4Date')}
                  title={t('homepage.caseStudy.timeline4Title')}
                  description={t('homepage.caseStudy.timeline4Desc')}
                />
                <TimelineEvent
                  date={t('homepage.caseStudy.timeline5Date')}
                  title={t('homepage.caseStudy.timeline5Title')}
                  description={t('homepage.caseStudy.timeline5Desc')}
                  isComplete={true}
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <DocumentaryPhoto
              src="https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748613965913.jpeg"
              alt="Solar inverter display showing live power data"
              caption={t('homepage.caseStudy.photoCaption2')}
              location="Kharkiv, Ukraine"
            />
            <DocumentaryPhoto
              src="https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748466071929.jpeg"
              alt="Ground-mounted solar array"
              caption={t('homepage.caseStudy.photoCaption3')}
              location="Poltava Oblast"
            />
            <div className="flex flex-col justify-center">
              <LiveStatsCard />
              <p className="text-xs text-[var(--navy-400)] mt-3 text-center">
                {t('homepage.caseStudy.dataNote')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Photo Strip */}
      <section className="fade-in-section py-12 bg-[var(--cream-100)] overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 lg:px-8 mb-8">
          <h3 className="text-[var(--navy-700)] text-xl font-semibold text-center">{t('homepage.photoStrip.title')}</h3>
        </div>

        <div className="relative overflow-hidden overscroll-x-contain" style={{ touchAction: 'pan-y pinch-zoom' }}>
          <div className="flex gap-4 animate-scroll">
            {[
              { src: 'https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748613968183.jpeg', location: 'Lviv' },
              { src: 'https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748344588928.jpeg', location: 'Vinnytsia Oblast' },
              { src: 'https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748466070782.jpeg', location: 'Dnipro' },
              { src: 'https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748586681372.jpeg', location: 'Chernihiv' },
              { src: 'https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748549701944.jpeg', location: 'Kyiv' },
              { src: 'https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748466072957.jpeg', location: 'Sumy Oblast' },
              // Duplicate for seamless loop
              { src: 'https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748613968183.jpeg', location: 'Lviv' },
              { src: 'https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748344588928.jpeg', location: 'Vinnytsia Oblast' },
              { src: 'https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748466070782.jpeg', location: 'Dnipro' },
              { src: 'https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748586681372.jpeg', location: 'Chernihiv' },
            ].map((photo, i) => (
              <div key={i} className="relative flex-shrink-0 w-72 h-48 rounded-lg overflow-hidden group">
                <Image
                  src={photo.src}
                  alt={`Project in ${photo.location}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 text-white text-sm font-medium">
                  {photo.location}
                </div>
              </div>
            ))}
          </div>

          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[var(--cream-100)] to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[var(--cream-100)] to-transparent pointer-events-none" />
        </div>

        <style jsx>{`
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(calc(-304px * 6)); }
          }
          .animate-scroll {
            animation: scroll 40s linear infinite;
          }
          .animate-scroll:hover {
            animation-play-state: paused;
          }
        `}</style>
      </section>

      {/* FAQ Section */}
      <section className="fade-in-section py-16 md:py-24 bg-[var(--cream-100)]">
        <div className="max-w-3xl mx-auto px-4 lg:px-8">
          <h2 className="font-logo text-2xl md:text-3xl font-semibold tracking-tight text-[var(--navy-700)] text-center mb-12">
            {t('homepage.faq.title')}
          </h2>

          <div>
            <FAQItem question={t('homepage.faq.q1')}>
              {t('homepage.faq.a1')}
            </FAQItem>
            <FAQItem question={t('homepage.faq.q2')}>
              {t('homepage.faq.a2')}
            </FAQItem>
            <FAQItem question={t('homepage.faq.q3')}>
              {t('homepage.faq.a3')}
              <div className="flex flex-wrap items-center gap-6 mt-4">
                {[
                  { name: 'Ecoaction', logo: '/partners/EcoactionLogo.png', url: 'https://en.ecoaction.org.ua/' },
                  { name: 'Ecoclub', logo: '/partners/EcoclubLogo.png', url: 'https://ecoclubrivne.org/en/' },
                  { name: 'RePower Ukraine', logo: '/partners/RePowerUkraineLogo.png', url: 'https://repowerua.org/' },
                  { name: 'Greenpeace', logo: '/partners/greenpeacelogo.png', url: 'https://www.greenpeace.org/ukraine/en/' },
                  { name: 'Energy Act For Ukraine', logo: '/partners/energyactukrainelogo.png', url: 'https://www.energyactua.com/' },
                ].map((p) => (
                  <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" title={p.name} className="opacity-70 hover:opacity-100 transition-opacity">
                    <img src={p.logo} alt={p.name} className="h-8" />
                  </a>
                ))}
              </div>
            </FAQItem>
            <FAQItem question={t('homepage.faq.q4')}>
              {t('homepage.faq.a4')}
            </FAQItem>
            <FAQItem question={t('homepage.faq.q5')}>
              {t('homepage.faq.a5')}
            </FAQItem>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="fade-in-section py-16 md:py-24 bg-[var(--cream-100)]">
        <div className="max-w-3xl mx-auto px-4 lg:px-8 text-center">
          <h2 className="font-logo text-3xl md:text-4xl font-semibold tracking-tight text-[var(--navy-700)] mb-4">
            {t('homepage.cta.title')}
          </h2>
          <p className="text-lg text-[var(--navy-500)] mb-8">
            {t('homepage.cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link href="/projects">
              <Button variant="primary" size="lg" className="min-w-[200px]">
                {t('homepage.cta.button')}
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" size="lg" className="min-w-[200px]">
                {t('homepage.hero.ctaHowItWorks')}
              </Button>
            </Link>
          </div>

          {/* Email capture */}
          <div className="max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-[var(--cream-300)]" />
              <span className="text-sm text-[var(--navy-400)] font-medium">{t('homepage.cta.emailDivider')}</span>
              <div className="flex-1 h-px bg-[var(--cream-300)]" />
            </div>
            <EmailCaptureForm t={t} />
          </div>
        </div>
      </section>
    </div>
  )
}
