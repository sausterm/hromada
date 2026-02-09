'use client'

import { useState, useEffect, useMemo, type ReactNode } from 'react'
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
const STEPS: { number: number; titleKey: string; descKey: string; color: string; bgColor: string; icon: ReactNode }[] = [
  {
    number: 1,
    titleKey: 'homepage.howItWorks.step1Title',
    descKey: 'homepage.howItWorks.step1Desc',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-500',
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
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-500',
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
    color: 'from-amber-500 to-amber-600',
    bgColor: 'bg-amber-500',
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
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-500',
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
    color: 'from-violet-500 to-violet-600',
    bgColor: 'bg-violet-500',
    icon: (
      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
        <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
      </svg>
    ),
  },
]

// Step component for How It Works
function HowItWorksStep({ step, isLast, t }: { step: typeof STEPS[0]; isLast: boolean; t: ReturnType<typeof useTranslations> }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="flex flex-col md:flex-row items-center">
      <div
        className="flex flex-col items-center text-center group cursor-default max-w-[120px]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative mb-3">
          <div
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} text-white flex items-center justify-center shadow-lg transition-all duration-300 ${isHovered ? 'scale-110 shadow-xl rotate-3' : ''}`}
          >
            {step.icon}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${step.bgColor} text-white text-xs font-bold flex items-center justify-center shadow-md ring-2 ring-[var(--cream-100)]`}>
            {step.number}
          </div>
        </div>

        <h3 className="font-bold text-[var(--navy-700)] text-lg">{t(step.titleKey)}</h3>
        <p className="text-[var(--navy-500)] text-sm mt-1">{t(step.descKey)}</p>
      </div>

      {!isLast && (
        <div className="hidden md:block px-2 lg:px-4">
          <svg className="w-5 h-5 text-[var(--cream-400)]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
          </svg>
        </div>
      )}

      {!isLast && (
        <div className="md:hidden py-3">
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
  return (
    <div className="bg-white rounded-xl border border-[var(--cream-200)] overflow-hidden shadow-sm">
      <div className="bg-[var(--cream-50)] px-4 py-3 border-b border-[var(--cream-200)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-[var(--navy-700)]">Live System Status</span>
        </div>
        <span className="text-xs text-[var(--navy-400)]">Kharkiv Hospital #5</span>
      </div>
      <div className="p-4 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-[var(--ukraine-blue)]">12.21</div>
          <div className="text-xs text-[var(--navy-400)]">kW Solar</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">100%</div>
          <div className="text-xs text-[var(--navy-400)]">Battery</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[var(--navy-700)]">18.28</div>
          <div className="text-xs text-[var(--navy-400)]">kW Load</div>
        </div>
      </div>
      <div className="px-4 py-2 bg-green-50 border-t border-green-100">
        <div className="flex items-center justify-center gap-2 text-green-700 text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">Operational during grid outage</span>
        </div>
      </div>
    </div>
  )
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
    <div className="min-h-screen flex flex-col bg-[var(--cream-100)]">
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

      {/* Featured Projects Section */}
      <section className="py-16 md:py-24 bg-[var(--cream-100)]">
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

      {/* How It Works Section */}
      <section id="how-it-works" className="pt-4 pb-16 md:pt-8 md:pb-24 bg-[var(--cream-100)]">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--navy-700)] mb-12">
            {t('homepage.howItWorks.title')}
          </h2>

          <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-0">
            {STEPS.map((step, index) => (
              <HowItWorksStep key={step.number} step={step} isLast={index === STEPS.length - 1} t={t} />
            ))}
          </div>

          <div className="mt-12 inline-flex items-center gap-3 bg-white px-8 py-4 rounded-2xl border border-[var(--cream-200)] shadow-lg">
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
        </div>
      </section>

      {/* Case Study Section */}
      <section className="pt-4 pb-16 md:pt-8 md:pb-24 px-4 bg-[var(--cream-100)]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-[var(--ukraine-blue)] text-sm font-medium mb-4">
              <div className="w-8 h-px bg-current" />
              REAL PROJECT
              <div className="w-8 h-px bg-current" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--navy-700)] mb-4">
              See It Happen
            </h2>
            <p className="text-[var(--navy-500)] max-w-xl mx-auto">
              This isn't a mockup. Here's an actual project funded through hromada,
              from donation to operational infrastructure.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <div>
              <DocumentaryPhoto
                src="/photos/1748586682092.jpeg"
                alt="Battery storage installation with Victron inverters"
                caption="48kWh battery bank with Victron inverters — keeps the hospital running during blackouts"
                location="Kharkiv, Ukraine"
              />
            </div>

            <div>
              <div className="mb-6">
                <span className="inline-block bg-[#C75B39] text-white text-xs px-2 py-1 rounded-full mb-3">
                  Hospital
                </span>
                <h3 className="text-2xl font-bold text-[var(--navy-700)] mb-2">
                  Kharkiv Regional Children's Hospital
                </h3>
                <p className="text-[var(--navy-500)]">
                  30kW solar + 48kWh battery backup for critical care wing
                </p>
              </div>

              <div className="mt-8">
                <TimelineEvent
                  date="November 15, 2024"
                  title="Fully funded"
                  description="47 donors contributed $127,000"
                />
                <TimelineEvent
                  date="November 22, 2024"
                  title="Wire transfer sent"
                  description="Funds arrive at Kharkiv municipal bank"
                />
                <TimelineEvent
                  date="December 3, 2024"
                  title="Equipment delivered"
                  description="Solar panels, inverters, batteries on site"
                />
                <TimelineEvent
                  date="December 18, 2024"
                  title="Installation complete"
                  description="System tested and commissioned"
                />
                <TimelineEvent
                  date="Today"
                  title="Operational"
                  description="47 grid outages survived and counting"
                  isComplete={true}
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <DocumentaryPhoto
              src="/photos/1748613965913.jpeg"
              alt="Solar inverter display showing live power data"
              caption="Real-time monitoring shows 12.21kW flowing from solar"
              location="Kharkiv, Ukraine"
            />
            <DocumentaryPhoto
              src="/photos/1748466071929.jpeg"
              alt="Ground-mounted solar array"
              caption="Ground-mounted array at water treatment facility"
              location="Poltava Oblast"
            />
            <div className="flex flex-col justify-center">
              <LiveStatsCard />
              <p className="text-xs text-[var(--navy-400)] mt-3 text-center">
                Data from actual system monitoring
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Photo Strip */}
      <section className="py-12 bg-[var(--cream-100)] overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 mb-8">
          <h3 className="text-[var(--navy-700)] text-xl font-semibold text-center">More Completed Projects</h3>
        </div>

        <div className="relative">
          <div className="flex gap-4 animate-scroll">
            {[
              { src: '/photos/1748613968183.jpeg', location: 'Lviv' },
              { src: '/photos/1748344588928.jpeg', location: 'Vinnytsia Oblast' },
              { src: '/photos/1748466070782.jpeg', location: 'Dnipro' },
              { src: '/photos/1748586681372.jpeg', location: 'Chernihiv' },
              { src: '/photos/1748549701944.jpeg', location: 'Kyiv' },
              { src: '/photos/1748466072957.jpeg', location: 'Sumy Oblast' },
              // Duplicate for seamless loop
              { src: '/photos/1748613968183.jpeg', location: 'Lviv' },
              { src: '/photos/1748344588928.jpeg', location: 'Vinnytsia Oblast' },
              { src: '/photos/1748466070782.jpeg', location: 'Dnipro' },
              { src: '/photos/1748586681372.jpeg', location: 'Chernihiv' },
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
      <section className="py-16 md:py-24 px-4 bg-[var(--cream-100)]">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-[var(--navy-700)] text-center mb-12">
            Common Questions
          </h2>

          <div className="space-y-6">
            {[
              {
                q: "How do I know my donation actually reaches Ukraine?",
                a: "We provide wire transfer confirmations, on-site photos during installation, and live monitoring data once systems are operational. Every project has a public transparency report."
              },
              {
                q: "Why wire transfers instead of credit cards?",
                a: "Wire transfers have lower fees and are more reliable for large international transfers. For donations over $1,000, this means more of your money funds the actual project."
              },
              {
                q: "Who are your partners in Ukraine?",
                a: "We work directly with municipal governments and licensed electrical contractors. All partners are vetted and have completed previous installations."
              },
              {
                q: "What happens if a project doesn't reach its funding goal?",
                a: "Partial funding still helps — many projects can be phased. If a project is cancelled, donors are contacted to redirect funds to similar projects."
              },
              {
                q: "Is my donation tax-deductible?",
                a: "Yes. Donations are made to CSBE, a registered 501(c)(3). You'll receive a tax receipt for your records."
              }
            ].map((faq, i) => (
              <details key={i} className="group bg-white rounded-lg border border-[var(--cream-200)]">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none">
                  <span className="font-medium text-[var(--navy-700)]">{faq.q}</span>
                  <svg className="w-5 h-5 text-[var(--navy-400)] transition-transform group-open:rotate-180 flex-shrink-0 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-4 text-[var(--navy-500)]">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-24 bg-[var(--cream-100)]">
        <div className="max-w-3xl mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--navy-700)] mb-4">
            {t('homepage.cta.title')}
          </h2>
          <p className="text-lg text-[var(--navy-500)] mb-8">
            {t('homepage.cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/projects">
              <Button variant="primary" size="lg">
                {t('homepage.cta.button')}
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" size="lg" className="border-[var(--navy-600)] text-[var(--navy-600)] hover:bg-[var(--navy-100)]">
                {t('homepage.hero.ctaHowItWorks')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
