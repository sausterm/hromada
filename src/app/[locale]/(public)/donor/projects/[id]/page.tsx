'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Link, useRouter } from '@/i18n/navigation'
import { useLocale } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  formatCurrency,
  formatPower,
  getLocalizedProject,
  type Project,
  CATEGORY_CONFIG,
  PROJECT_TYPE_CONFIG,
  COFINANCING_CONFIG,
  type Category,
  type ProjectType,
  type CofinancingStatus,
} from '@/types'
import { DONATION_STATUS_CONFIG, PAYMENT_METHOD_LABELS, formatDate } from '@/lib/donor-constants'
import { JourneyStepper } from '@/components/donor/JourneyStepper'
import { UpdateTimeline, type TimelineUpdate } from '@/components/donor/UpdateTimeline'
import { PhotoLightbox } from '@/components/donor/PhotoLightbox'

interface ProjectUpdate {
  id: string
  type: string
  title: string
  message: string
  metadata: Record<string, unknown> | null
  createdAt: string
  createdByName?: string
  createdByRole?: string
}

interface DonorDonation {
  id: string
  amount: number | null
  paymentMethod: string
  status: string
  submittedAt: string
  receivedAt: string | null
}

function transformProject(data: Record<string, unknown>): Project {
  return {
    ...data,
    description: (data.fullDescription || data.description || '') as string,
    createdAt: new Date(data.createdAt as string),
    updatedAt: new Date(data.updatedAt as string),
    cityLatitude: data.cityLatitude ? Number(data.cityLatitude) : 0,
    cityLongitude: data.cityLongitude ? Number(data.cityLongitude) : 0,
    latitude: data.latitude ? Number(data.latitude) : undefined,
    longitude: data.longitude ? Number(data.longitude) : undefined,
    technicalPowerKw: data.technicalPowerKw ? Number(data.technicalPowerKw) : undefined,
    estimatedCostUsd: data.estimatedCostUsd ? Number(data.estimatedCostUsd) : undefined,
  } as Project
}

// Partner organizations configuration with logos and links
const PARTNER_CONFIG: Record<string, { logo: string; url: string; name: string }> = {
  'ecoaction': {
    logo: '/partners/EcoactionLogo.png',
    url: 'https://en.ecoaction.org.ua/',
    name: 'NGO Ecoaction',
  },
  'ecoclub': {
    logo: '/partners/EcoclubLogo.png',
    url: 'https://ecoclubrivne.org/en/',
    name: 'NGO Ecoclub',
  },
  'greenpeace': {
    logo: '/partners/greenpeacelogo.png',
    url: 'https://www.greenpeace.org/ukraine/en/',
    name: 'Greenpeace Ukraine',
  },
}

function findPartnerConfig(orgName: string | undefined) {
  if (!orgName) return null
  const lowerName = orgName.toLowerCase()
  for (const [key, config] of Object.entries(PARTNER_CONFIG)) {
    if (lowerName.includes(key)) return config
  }
  return null
}

const LUTSKTEPLO_ID = 'cmkx2spy5001pv9rqtj76tfg6'

// Demo project for when the real project doesn't exist in DB
const DEMO_PROJECT: Project = {
  id: LUTSKTEPLO_ID,
  municipalityName: 'Lutsk',
  municipalityNameUk: 'Луцьк',
  facilityName: 'Municipal enterprise Lutskteplo',
  facilityNameUk: 'Комунальне підприємство «Луцьктепло»',
  category: 'ENERGY',
  projectType: 'HEAT_PUMP',
  briefDescription: 'Heat pump modernization for the district heating system serving 12,000 residents in Lutsk',
  briefDescriptionUk: 'Модернізація теплонасосної системи централізованого теплопостачання для 12 000 мешканців Луцька',
  fullDescription: 'Installation of a modern heat pump system for the Lutskteplo district heating enterprise, replacing aging infrastructure and reducing energy consumption by 40%. The project serves approximately 12,000 residents across the municipality.',
  fullDescriptionUk: 'Встановлення сучасної теплонасосної системи для КП «Луцьктепло», що замінить застарілу інфраструктуру та зменшить споживання енергії на 40%.',
  estimatedCostUsd: 345000,
  technicalPowerKw: 200,
  region: 'Volyn Oblast',
  partnerOrganization: 'NGO Ecoaction',
  cofinancingAvailable: 'NO',
  urgency: 'MEDIUM',
  status: 'MATCHED',
  cityLatitude: 50.7472,
  cityLongitude: 25.3254,
  contactName: 'Kostiantyn Krynytskyi',
  contactEmail: 'kostiantyn@ecoaction.org',
  municipalityEmail: 'info@lutskteplo.gov.ua',
  description: 'Installation of a modern heat pump system for the Lutskteplo district heating enterprise, replacing aging infrastructure and reducing energy consumption by 40%.',
  address: 'Lutsk, Volyn Oblast',
  createdAt: new Date('2025-12-01'),
  updatedAt: new Date('2026-02-22'),
  photos: [],
} as Project

const DEMO_UPDATES: ProjectUpdate[] = [
  {
    id: 'demo-u1',
    type: 'MANUAL',
    title: 'Funds Received',
    message: 'Your wire transfer has been confirmed and received by POCACITO Network.',
    metadata: null,
    createdAt: '2026-01-13T14:00:00Z',
  },
  {
    id: 'demo-u2',
    type: 'MANUAL',
    title: 'Funds Forwarded to Ukraine',
    message: 'Funds have been wired to the municipality. Estimated arrival: 2–3 business days.',
    metadata: null,
    createdAt: '2026-01-17T09:00:00Z',
  },
  {
    id: 'demo-u3',
    type: 'MANUAL',
    title: 'Municipality Confirmed Receipt',
    message: 'Lutsk municipality has confirmed receipt of funds. Procurement planning is underway.',
    metadata: null,
    createdAt: '2026-01-22T11:30:00Z',
  },
  {
    id: 'demo-u4',
    type: 'PROZORRO_STATUS',
    title: 'Posted to Prozorro for public procurement process',
    message: 'This project has been posted to Prozorro, Ukraine\'s official public procurement platform. Equipment and services will be competitively bid, ensuring transparency and best value.',
    metadata: { prozorroUrl: 'https://prozorro.gov.ua/tender/UA-2026-02-05-000123-a' },
    createdAt: '2026-02-05T08:00:00Z',
  },
  {
    id: 'demo-u5',
    type: 'PROZORRO_STATUS',
    title: 'Procurement update: active.tendering',
    message: 'The tender is now open for bids. Suppliers have until March 5 to submit proposals for the heat pump installation.',
    metadata: { prozorroUrl: 'https://prozorro.gov.ua/tender/UA-2026-02-05-000123-a' },
    createdAt: '2026-02-15T10:00:00Z',
  },
  {
    id: 'demo-u6-photo',
    type: 'PHOTO_ADDED',
    title: 'Photo update from partner',
    message: 'EcoAction partner shared new photos from the Lutskteplo facility showing the installation site being prepared for the heat pump system.',
    metadata: { photoUrl: 'https://images.unsplash.com/photo-1595437193398-f24279553f4f?w=1200&q=80' },
    createdAt: '2026-02-22T14:30:00Z',
    createdByName: 'EcoAction',
    createdByRole: 'Partner',
  },
]

const DEMO_DONATIONS: DonorDonation[] = [
  {
    id: 'demo-1',
    amount: 345000,
    paymentMethod: 'WIRE',
    status: 'FORWARDED',
    submittedAt: '2026-01-10T10:00:00Z',
    receivedAt: '2026-01-13T14:00:00Z',
  },
]

export default function DonorProjectDetailPage() {
  const router = useRouter()
  const locale = useLocale()
  const params = useParams()
  const projectId = params.id as string
  const { isAuthenticated, isLoading: authLoading, hasRole } = useAuth()

  const [project, setProject] = useState<Project | null>(null)
  const [updates, setUpdates] = useState<ProjectUpdate[]>([])
  const [donations, setDonations] = useState<DonorDonation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Auth redirect
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login')
      } else if (!hasRole(['DONOR', 'ADMIN', 'PARTNER', 'NONPROFIT_MANAGER'])) {
        router.push('/')
      }
    }
  }, [isAuthenticated, authLoading, hasRole, router])

  // Fetch project + donor's donations for this project
  useEffect(() => {
    if (authLoading || !isAuthenticated) return

    async function fetchData() {
      try {
        const [projectRes, donationsRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch('/api/donor/donations'),
        ])

        if (projectRes.ok) {
          const projectData = await projectRes.json()
          setProject(transformProject(projectData.project))
          const realUpdates = (projectData.project.updates || []).map((u: Record<string, unknown>) => ({
            ...u,
            createdAt: u.createdAt as string,
          }))
          // Use demo updates for Lutskteplo if no real updates exist
          setUpdates(realUpdates.length > 0 ? realUpdates : (projectId === LUTSKTEPLO_ID ? DEMO_UPDATES : []))
        } else if (projectId === LUTSKTEPLO_ID) {
          // Demo project doesn't exist in DB — use hardcoded demo data
          setProject(DEMO_PROJECT)
          setUpdates(DEMO_UPDATES)
        }

        if (donationsRes.ok) {
          const donationsData = await donationsRes.json()
          // Filter to only donations for this project
          const projectDonations = donationsData.donations
            .filter((d: { projectId: string | null }) => d.projectId === projectId)
            .map((d: Record<string, unknown>) => ({
              id: d.id,
              amount: d.amount,
              paymentMethod: d.paymentMethod,
              status: d.status,
              submittedAt: d.submittedAt,
              receivedAt: d.receivedAt,
            }))
          // Use demo donation for Lutskteplo if no real donations exist
          setDonations(projectDonations.length > 0 ? projectDonations : (projectId === LUTSKTEPLO_ID ? DEMO_DONATIONS : []))
        }
      } catch (err) {
        console.error('Failed to fetch project data:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [projectId, authLoading, isAuthenticated])

  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [lightboxAlt, setLightboxAlt] = useState('')

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cream-100)]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated || !hasRole(['DONOR', 'ADMIN', 'PARTNER', 'NONPROFIT_MANAGER'])) {
    return null
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-[var(--cream-100)]">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-[var(--navy-700)] mb-4">Project not found</h1>
          <Link href="/donor">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </main>
    )
  }

  const localized = getLocalizedProject(project, locale)

  return (
    <main className="min-h-screen bg-[var(--cream-100)]">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Link href="/donor" className="inline-flex items-center gap-2 text-[var(--navy-600)] hover:text-[var(--navy-800)] mb-6 group">
          <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-medium">Back to Dashboard</span>
        </Link>

        {/* Project Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--navy-700)] mb-2">
            {localized.facilityName}
          </h1>
          <p className="text-lg text-[var(--navy-500)]">
            {localized.municipalityName}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content — Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Your Donation(s) */}
            {donations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Contribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {donations.map((donation) => {
                      const statusConfig = DONATION_STATUS_CONFIG[donation.status] || DONATION_STATUS_CONFIG.PENDING_CONFIRMATION
                      return (
                        <div key={donation.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--cream-50)] border border-[var(--cream-300)]">
                          <div>
                            <div className="font-medium text-[var(--navy-700)]">
                              {donation.amount ? formatCurrency(donation.amount) : 'Amount TBD'}
                            </div>
                            <div className="text-sm text-[var(--navy-500)]">
                              {PAYMENT_METHOD_LABELS[donation.paymentMethod]} — {formatDate(donation.submittedAt)}
                            </div>
                          </div>
                          <Badge className={statusConfig.color}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>

                  {/* Journey Stepper */}
                  <div className="mt-5 pt-5 border-t border-[var(--cream-300)]">
                    <JourneyStepper
                      status={donations[0].status}
                      hasProzorroUpdates={updates.some(u => u.type === 'PROZORRO_STATUS')}
                      hasPhotoUpdates={updates.some(u => u.type === 'PHOTO_ADDED')}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Project Updates Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Project Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <UpdateTimeline
                  updates={updates as TimelineUpdate[]}
                  variant="full"
                  onPhotoClick={(src, alt) => {
                    setLightboxSrc(src)
                    setLightboxAlt(alt)
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Photo */}
            {project.photos && project.photos.length > 0 && (
              <div className="relative rounded-xl overflow-hidden h-48">
                <Image
                  src={project.photos[0]}
                  alt={localized.facilityName}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
            )}

            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Category Badge */}
                  {project.category && CATEGORY_CONFIG[project.category as Category] && (() => {
                    const catConfig = CATEGORY_CONFIG[project.category as Category]
                    return (
                      <div>
                        <p className="text-sm text-[var(--navy-500)] mb-1">Category</p>
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-sm font-medium"
                          style={{ backgroundColor: `${catConfig.color}20`, color: catConfig.color }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" dangerouslySetInnerHTML={{ __html: catConfig.icon }} />
                          {catConfig.label}
                        </span>
                      </div>
                    )
                  })()}

                  {/* Project Type Badge */}
                  {project.projectType && PROJECT_TYPE_CONFIG[project.projectType as ProjectType] && (() => {
                    const typeConfig = PROJECT_TYPE_CONFIG[project.projectType as ProjectType]
                    return (
                      <div>
                        <p className="text-sm text-[var(--navy-500)] mb-1">Project Type</p>
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-sm font-medium"
                          style={{ backgroundColor: `${typeConfig.color}20`, color: typeConfig.color }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" dangerouslySetInnerHTML={{ __html: typeConfig.icon }} />
                          {typeConfig.label}
                        </span>
                      </div>
                    )
                  })()}

                  {/* Estimated Cost */}
                  {project.estimatedCostUsd && (
                    <div>
                      <p className="text-sm text-[var(--navy-500)] mb-1">Estimated Cost</p>
                      <p className="font-medium text-[var(--navy-700)]">{formatCurrency(project.estimatedCostUsd)}</p>
                    </div>
                  )}

                  {/* Technical Power */}
                  {project.technicalPowerKw && (
                    <div>
                      <p className="text-sm text-[var(--navy-500)] mb-1">System Capacity</p>
                      <p className="font-medium text-[var(--navy-700)]">{formatPower(project.technicalPowerKw)}</p>
                    </div>
                  )}

                  {/* Region */}
                  {project.region && (
                    <div>
                      <p className="text-sm text-[var(--navy-500)] mb-1">Region</p>
                      <p className="font-medium text-[var(--navy-700)]">{project.region}</p>
                    </div>
                  )}

                  {/* Co-financing */}
                  {project.cofinancingAvailable && COFINANCING_CONFIG[project.cofinancingAvailable as CofinancingStatus] && (
                    <div>
                      <p className="text-sm text-[var(--navy-500)] mb-1">Co-financing</p>
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium"
                        style={{
                          backgroundColor: `${COFINANCING_CONFIG[project.cofinancingAvailable as CofinancingStatus].color}20`,
                          color: COFINANCING_CONFIG[project.cofinancingAvailable as CofinancingStatus].color,
                        }}
                      >
                        {COFINANCING_CONFIG[project.cofinancingAvailable as CofinancingStatus].label}
                      </span>
                    </div>
                  )}

                  {/* Partner Organization with Logo */}
                  {project.partnerOrganization && (() => {
                    const partnerConfig = findPartnerConfig(project.partnerOrganization)
                    return (
                      <div>
                        <p className="text-sm text-[var(--navy-500)] mb-2">Partner</p>
                        {partnerConfig ? (
                          <a
                            href={partnerConfig.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 group"
                          >
                            <Image
                              src={partnerConfig.logo}
                              alt={partnerConfig.name}
                              width={64}
                              height={32}
                              className="h-8 w-auto object-contain"
                            />
                            <span className="font-medium text-[var(--navy-700)] text-sm group-hover:text-[var(--navy-600)] transition-colors">
                              {project.partnerOrganization}
                            </span>
                            <svg className="w-3.5 h-3.5 flex-shrink-0 text-[var(--navy-400)] group-hover:text-[var(--navy-600)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ) : (
                          <p className="font-medium text-[var(--navy-700)] text-sm">{project.partnerOrganization}</p>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <PhotoLightbox
        src={lightboxSrc}
        alt={lightboxAlt}
        onClose={() => setLightboxSrc(null)}
      />
    </main>
  )
}
