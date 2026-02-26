'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatCurrency } from '@/types'

// Types
interface DonationUpdate {
  id: string
  title: string
  message: string
  createdAt: string
  metadata?: Record<string, unknown> | null
  source?: 'donation' | 'project'
}

interface Donation {
  id: string
  projectId: string | null
  projectName: string
  amount: number | null
  paymentMethod: string
  status: string
  submittedAt: string
  receivedAt: string | null
  updates: DonationUpdate[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  PENDING_CONFIRMATION: {
    label: 'Awaiting Confirmation',
    color: 'bg-yellow-100 text-yellow-800',
    description: 'We are confirming receipt of your payment',
  },
  RECEIVED: {
    label: 'Received',
    color: 'bg-blue-100 text-blue-800',
    description: 'Your donation has been received and will be transferred soon',
  },
  ALLOCATED: {
    label: 'Allocated',
    color: 'bg-purple-100 text-purple-800',
    description: 'Your donation has been allocated for transfer',
  },
  FORWARDED: {
    label: 'Sent to Ukraine',
    color: 'bg-indigo-100 text-indigo-800',
    description: 'Funds have been sent to the municipality',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-green-100 text-green-800',
    description: 'Municipality has confirmed receipt',
  },
  FAILED: {
    label: 'Issue',
    color: 'bg-red-100 text-red-800',
    description: 'There was an issue with your donation',
  },
  REFUNDED: {
    label: 'Refunded',
    color: 'bg-gray-100 text-gray-800',
    description: 'Your donation has been refunded',
  },
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  WIRE: 'Wire Transfer',
  DAF: 'DAF Grant',
  CHECK: 'Check',
  ACH: 'Bank Transfer',
  OTHER: 'Other',
}

// Demo data for development — replaced by real API data when donations exist
const DEMO_DONATIONS: Donation[] = [
  {
    id: 'demo-1',
    projectId: 'cmkx2spy5001pv9rqtj76tfg6',
    projectName: 'Municipal enterprise Lutskteplo',
    amount: 345000,
    paymentMethod: 'WIRE',
    status: 'FORWARDED',
    submittedAt: '2026-01-10T10:00:00Z',
    receivedAt: '2026-01-13T14:00:00Z',
    updates: [
      {
        id: 'demo-u1',
        title: 'Funds Received',
        message: 'Your wire transfer has been confirmed and received by POCACITO Network.',
        createdAt: '2026-01-13T14:00:00Z',
      },
      {
        id: 'demo-u2',
        title: 'Funds Forwarded to Ukraine',
        message: 'Funds have been wired to the municipality. Estimated arrival: 2–3 business days.',
        createdAt: '2026-01-17T09:00:00Z',
      },
      {
        id: 'demo-u3',
        title: 'Municipality Confirmed Receipt',
        message: 'Lutsk municipality has confirmed receipt of funds. Procurement planning is underway.',
        createdAt: '2026-01-22T11:30:00Z',
      },
      {
        id: 'demo-u4',
        title: 'Posted to Prozorro for public procurement process',
        message: 'This project has been posted to Prozorro, Ukraine\'s official public procurement platform. Equipment and services will be competitively bid.',
        createdAt: '2026-02-05T08:00:00Z',
        metadata: { prozorroUrl: 'https://prozorro.gov.ua/tender/UA-2026-02-05-000123-a' },
        source: 'project',
      },
      {
        id: 'demo-u5',
        title: 'Procurement update: active.tendering',
        message: 'The tender is now open for bids. Suppliers have until March 5 to submit proposals for the heat pump installation.',
        createdAt: '2026-02-15T10:00:00Z',
        metadata: { prozorroUrl: 'https://prozorro.gov.ua/tender/UA-2026-02-05-000123-a' },
        source: 'project',
      },
      {
        id: 'demo-u6-photo',
        title: 'Photo update from partner',
        message: 'EcoAction partner shared new photos from the Lutskteplo facility showing the installation site being prepared for the heat pump system.',
        createdAt: '2026-02-22T14:30:00Z',
        metadata: { type: 'PHOTO_ADDED', photoUrl: 'https://images.unsplash.com/photo-1595437193398-f24279553f4f?w=1200&q=80' },
        source: 'project',
      },
    ],
  },
  {
    id: 'demo-2',
    projectId: 'cmkx21qkx0000fqrqx5q1iezv',
    projectName: 'Nizhyn Maternity Hospital',
    amount: 89000,
    paymentMethod: 'DAF',
    status: 'RECEIVED',
    submittedAt: '2026-02-08T14:20:00Z',
    receivedAt: '2026-02-11T10:00:00Z',
    updates: [
      {
        id: 'demo-u6',
        title: 'DAF Grant Received',
        message: 'Your donor-advised fund grant has been received by POCACITO Network. We will process the transfer to Ukraine shortly.',
        createdAt: '2026-02-11T10:00:00Z',
      },
    ],
  },
  {
    id: 'demo-3',
    projectId: 'cmkx2to460000n8rqipren42p',
    projectName: 'Mykolaiiv Regional Children\'s Hospital',
    amount: 62000,
    paymentMethod: 'CHECK',
    status: 'PENDING_CONFIRMATION',
    submittedAt: '2026-02-20T16:45:00Z',
    receivedAt: null,
    updates: [],
  },
]

function DonorDashboard() {
  const t = useTranslations()
  const { logout, user } = useAuth()
  const [donations, setDonations] = useState<Donation[]>([])
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null)
  const [isLoadingDonations, setIsLoadingDonations] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDonations() {
      try {
        const res = await fetch('/api/donor/donations')
        if (!res.ok) {
          throw new Error('Failed to load donations')
        }
        const data = await res.json()
        // Use real data if available, otherwise show demo data for development
        setDonations(data.donations.length > 0 ? data.donations : DEMO_DONATIONS)
      } catch (err) {
        console.error('Failed to fetch donations:', err)
        // Fall back to demo data on error too
        setDonations(DEMO_DONATIONS)
      } finally {
        setIsLoadingDonations(false)
      }
    }
    fetchDonations()
  }, [])

  // Calculate stats
  const totalDonated = donations.reduce((sum, d) => sum + (d.amount || 0), 0)
  const projectsSupported = new Set(donations.map(d => d.projectId)).size
  const pendingCount = donations.filter(d => d.status === 'PENDING_CONFIRMATION').length
  const completedCount = donations.filter(d => ['FORWARDED', 'COMPLETED'].includes(d.status)).length

  const handleLogout = async () => {
    await logout()
  }

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

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Donor Dashboard</h1>
            {user && (
              <p className="text-gray-600 mt-1">
                Welcome back, {user.name}
              </p>
            )}
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <Link href="/">
              <Button variant="outline">Browse Projects</Button>
            </Link>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600 mb-1">Total Contributed</div>
              <div className="text-2xl font-bold text-[var(--navy-700)]">
                {formatCurrency(totalDonated, { compact: true })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600 mb-1">Projects Supported</div>
              <div className="text-2xl font-bold text-[var(--navy-700)]">{projectsSupported}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600 mb-1">Pending</div>
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600 mb-1">Delivered</div>
              <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            </CardContent>
          </Card>
        </div>

        {isLoadingDonations ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : fetchError ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <p>{fetchError}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Donations List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Your Donations</CardTitle>
                </CardHeader>
                <CardContent>
                  {donations.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No donations yet</h3>
                      <p className="text-gray-600 mb-4">
                        Browse our projects and make your first contribution to support Ukrainian communities.
                      </p>
                      <Link href="/">
                        <Button>Browse Projects</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {donations.map((donation) => {
                        const statusConfig = STATUS_CONFIG[donation.status] || STATUS_CONFIG.PENDING_CONFIRMATION
                        const isSelected = selectedDonation?.id === donation.id

                        return (
                          <button
                            key={donation.id}
                            onClick={() => setSelectedDonation(isSelected ? null : donation)}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                              isSelected
                                ? 'border-[var(--navy-600)] bg-[var(--navy-50)]'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate">
                                  {donation.projectName}
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                  <span>{PAYMENT_METHOD_LABELS[donation.paymentMethod]}</span>
                                  <span>•</span>
                                  <span>{formatDate(donation.submittedAt)}</span>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="font-bold text-gray-900">
                                  {donation.amount ? formatCurrency(donation.amount, { compact: true }) : 'Amount TBD'}
                                </div>
                                <Badge className={`mt-1 ${statusConfig.color}`}>
                                  {statusConfig.label}
                                </Badge>
                              </div>
                            </div>

                            {/* Status description */}
                            <div className="mt-3 text-sm text-gray-600">
                              {statusConfig.description}
                            </div>

                            {/* Updates indicator */}
                            {donation.updates.length > 0 && (
                              <div className="mt-3 flex items-center gap-2 text-sm text-[var(--navy-600)]">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                {donation.updates.length} update{donation.updates.length !== 1 ? 's' : ''}
                                <svg className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Donation Details / Updates */}
            <div className="lg:col-span-1">
              {selectedDonation ? (
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle className="text-lg">Project Updates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 pb-4 border-b">
                      <div className="font-medium text-gray-900">{selectedDonation.projectName}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {selectedDonation.amount ? formatCurrency(selectedDonation.amount) : 'Amount TBD'} via {PAYMENT_METHOD_LABELS[selectedDonation.paymentMethod]}
                      </div>
                    </div>

                    {selectedDonation.updates.length > 0 ? (() => {
                      const recentUpdates = selectedDonation.updates.slice(-3).reverse()
                      const hasMore = selectedDonation.updates.length > 3
                      return (
                        <>
                          <div className="space-y-4">
                            {recentUpdates.map((update, index) => (
                              <div key={update.id} className="relative pl-6">
                                {/* Timeline line */}
                                {index < recentUpdates.length - 1 && (
                                  <div className="absolute left-[7px] top-6 bottom-0 w-0.5 bg-gray-200" />
                                )}
                                {/* Timeline dot */}
                                <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full bg-[var(--navy-600)] border-2 border-white shadow" />

                                <div>
                                  <div className="font-medium text-gray-900">{update.title}</div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {formatDateTime(update.createdAt)}
                                  </div>
                                  <p className="text-sm text-gray-600 mt-2">
                                    {update.message}
                                  </p>
                                  {typeof update.metadata?.prozorroUrl === 'string' && (
                                    <a
                                      href={update.metadata.prozorroUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-sm text-[var(--ukraine-blue)] hover:underline mt-2"
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
                          {hasMore && (
                            <p className="text-xs text-[var(--navy-400)] mt-3">
                              + {selectedDonation.updates.length - 3} earlier update{selectedDonation.updates.length - 3 !== 1 ? 's' : ''} — view full timeline below
                            </p>
                          )}
                        </>
                      )
                    })() : (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm">No updates yet</p>
                        <p className="text-xs mt-1">We&apos;ll notify you when there&apos;s news about your donation.</p>
                      </div>
                    )}

                    {/* View Project Link */}
                    {selectedDonation.projectId && (
                      <div className="mt-6 pt-4 border-t">
                        <Link href={`/donor/projects/${selectedDonation.projectId}`}>
                          <Button variant="outline" fullWidth>
                            View Project Progress →
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="sticky top-24">
                  <CardContent className="py-12">
                    <div className="text-center text-gray-500">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                      <p className="text-sm">Select a donation to view updates</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Tax Information */}
        <Card className="mt-8">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Tax-Deductible Donations</h3>
                <p className="text-sm text-gray-600 mt-1">
                  All donations are made through POCACITO Network, a registered 501(c)(3) nonprofit organization (EIN 99-0392258).
                  You will receive a tax receipt for your records. If you need a copy of your tax receipt,
                  please contact us at <a href="mailto:donations@pocacito.org" className="text-[var(--navy-600)] hover:underline">donations@pocacito.org</a>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default function DonorPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, hasRole } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login')
      } else if (!hasRole(['DONOR', 'ADMIN'])) {
        // Non-donors get redirected based on their role
        router.push('/')
      }
    }
  }, [isAuthenticated, isLoading, hasRole, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated || !hasRole(['DONOR', 'ADMIN'])) {
    return null
  }

  return <DonorDashboard />
}
