'use client'

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
import { formatCurrency, getLocalizedProject, type Project } from '@/types'
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

const LUTSKTEPLO_ID = 'cmkx2spy5001pv9rqtj76tfg6'

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
              <div className="rounded-xl overflow-hidden">
                <img
                  src={project.photos[0]}
                  alt={localized.facilityName}
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            {/* Tax Info */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Tax-Deductible</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Via POCACITO Network (EIN 99-0392258). Contact{' '}
                      <a href="mailto:donations@pocacito.org" className="text-[var(--navy-600)] hover:underline">
                        donations@pocacito.org
                      </a>{' '}
                      for tax receipts.
                    </p>
                  </div>
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
