'use client'

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/Button'
import { CountUp, CountUpCurrency } from '@/components/homepage/CountUp'

interface HeroSectionProps {
  totalStats: {
    projectCount: number
    fundingNeeded: number
    communityCount: number
  }
}

export function HeroSection({ totalStats }: HeroSectionProps) {
  const t = useTranslations()
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

  return (
    <section className="relative h-[calc(100svh+4rem)] md:h-[calc(100vh+2rem)] -mt-24 pt-24 overflow-hidden">
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

      <button
        onClick={() => document.getElementById('featured-projects')?.scrollIntoView({ behavior: 'smooth' })}
        className="absolute bottom-10 md:bottom-12 left-1/2 -translate-x-1/2 animate-scroll-hint cursor-pointer p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-200"
        aria-label="Scroll to featured projects"
      >
        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </section>
  )
}
