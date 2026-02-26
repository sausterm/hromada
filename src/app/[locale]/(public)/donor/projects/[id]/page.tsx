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

interface ProjectUpdate {
  id: string
  type: string
  title: string
  message: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

interface DonorDonation {
  id: string
  amount: number | null
  paymentMethod: string
  status: string
  submittedAt: string
  receivedAt: string | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING_CONFIRMATION: { label: 'Awaiting Confirmation', color: 'bg-yellow-100 text-yellow-800' },
  RECEIVED: { label: 'Received', color: 'bg-blue-100 text-blue-800' },
  ALLOCATED: { label: 'Allocated', color: 'bg-purple-100 text-purple-800' },
  FORWARDED: { label: 'Sent to Ukraine', color: 'bg-indigo-100 text-indigo-800' },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  FAILED: { label: 'Issue', color: 'bg-red-100 text-red-800' },
  REFUNDED: { label: 'Refunded', color: 'bg-gray-100 text-gray-800' },
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  WIRE: 'Wire Transfer',
  DAF: 'DAF Grant',
  CHECK: 'Check',
  ACH: 'Bank Transfer',
  OTHER: 'Other',
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
      } else if (!hasRole(['DONOR', 'ADMIN'])) {
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cream-100)]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated || !hasRole(['DONOR', 'ADMIN'])) {
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
                      const statusConfig = STATUS_CONFIG[donation.status] || STATUS_CONFIG.PENDING_CONFIRMATION
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
                </CardContent>
              </Card>
            )}

            {/* Project Updates Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Project Updates</CardTitle>
              </CardHeader>
              <CardContent>
                {updates.length > 0 ? (
                  <div className="space-y-6">
                    {updates.map((update, index) => (
                      <div key={update.id} className="relative pl-8">
                        {/* Timeline line */}
                        {index < updates.length - 1 && (
                          <div className="absolute left-[9px] top-8 bottom-0 w-0.5 bg-[var(--cream-300)]" />
                        )}
                        {/* Timeline dot */}
                        <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-[var(--navy-600)] border-2 border-white shadow flex items-center justify-center">
                          {update.type === 'PROZORRO_STATUS' && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                            </svg>
                          )}
                        </div>

                        <div>
                          <div className="font-medium text-[var(--navy-700)]">{update.title}</div>
                          <div className="text-xs text-[var(--navy-400)] mt-0.5">
                            {formatDateTime(update.createdAt)}
                          </div>
                          <p className="text-sm text-[var(--navy-600)] mt-2 leading-relaxed">
                            {update.message}
                          </p>
                          {typeof update.metadata?.prozorroUrl === 'string' && (
                            <a
                              href={update.metadata.prozorroUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ukraine-blue)] hover:underline mt-2"
                            >
                              View on Prozorro
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-[var(--navy-400)]">
                    <svg className="w-14 h-14 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-medium">No updates yet</p>
                    <p className="text-sm mt-1">We&apos;ll notify you by email when there&apos;s progress on this project.</p>
                  </div>
                )}
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

            {/* Project Summary */}
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold text-[var(--navy-700)] mb-3">About This Project</h3>
                <p className="text-sm text-[var(--navy-600)] leading-relaxed line-clamp-6">
                  {localized.briefDescription || localized.fullDescription}
                </p>
                <Link href={`/projects/${projectId}`} className="block mt-4">
                  <Button variant="outline" fullWidth>
                    View Full Project Page →
                  </Button>
                </Link>
              </CardContent>
            </Card>

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
    </main>
  )
}
