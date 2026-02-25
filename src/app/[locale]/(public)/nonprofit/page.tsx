'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatCurrency } from '@/types'

interface DonationRecord {
  id: string
  projectName: string
  projectId: string | null
  donorName: string
  donorEmail: string
  donorOrganization: string | null
  amount: number | null
  paymentMethod: string
  referenceNumber: string | null
  status: string
  submittedAt: string
  receivedAt: string | null
  forwardedAt: string | null
  taxReceiptUrl: string | null
}

interface WireTransferRecord {
  id: string
  referenceNumber: string
  recipientName: string
  projectName: string | null
  amount: number
  status: string
  sentAt: string | null
  confirmedAt: string | null
  createdAt: string
}

type DonationStatusKey = 'PENDING_CONFIRMATION' | 'RECEIVED' | 'FORWARDED' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
type WireStatusKey = 'PENDING' | 'INITIATED' | 'SENT' | 'IN_TRANSIT' | 'CONFIRMED' | 'FAILED' | 'CANCELLED'
type Tab = 'overview' | 'donations' | 'wire-transfers'

const STATUS_COLORS: Record<string, string> = {
  PENDING_CONFIRMATION: 'bg-yellow-100 text-yellow-800',
  RECEIVED: 'bg-blue-100 text-blue-800',
  FORWARDED: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
  PENDING: 'bg-gray-100 text-gray-800',
  INITIATED: 'bg-yellow-100 text-yellow-800',
  SENT: 'bg-blue-100 text-blue-800',
  IN_TRANSIT: 'bg-indigo-100 text-indigo-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_CONFIRMATION: 'Awaiting Confirmation',
  RECEIVED: 'Received',
  FORWARDED: 'Forwarded',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
  PENDING: 'Pending',
  INITIATED: 'Initiated',
  SENT: 'Sent',
  IN_TRANSIT: 'In Transit',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
}

// Next valid status transitions for action buttons
const NEXT_STATUS: Record<string, { status: string; label: string; variant?: 'primary' | 'outline' | 'danger' }> = {
  PENDING_CONFIRMATION: { status: 'RECEIVED', label: 'Mark Received' },
  RECEIVED: { status: 'FORWARDED', label: 'Mark Forwarded' },
}

function NonprofitDashboard() {
  const t = useTranslations()
  const { logout, user } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [donations, setDonations] = useState<DonationRecord[]>([])
  const [wireTransfers, setWireTransfers] = useState<WireTransferRecord[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [donationsRes, wiresRes] = await Promise.all([
        fetch('/api/donations/list'),
        fetch('/api/wire-transfers/list'),
      ])

      if (donationsRes.ok) {
        const data = await donationsRes.json()
        setDonations(data.donations)
      }

      if (wiresRes.ok) {
        const data = await wiresRes.json()
        setWireTransfers(data.wireTransfers)
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setError('Failed to load data. Please refresh.')
    } finally {
      setIsLoadingData(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleStatusUpdate = async (donationId: string, newStatus: string) => {
    setUpdatingIds(prev => new Set(prev).add(donationId))
    setError(null)

    try {
      const res = await fetch(`/api/donations/${donationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update status')
      }

      // Refresh data
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev)
        next.delete(donationId)
        return next
      })
    }
  }

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

  // Calculate stats
  const pendingConfirmations = donations.filter(d => d.status === 'PENDING_CONFIRMATION').length
  const receivedDonations = donations.filter(d => d.status === 'RECEIVED')
  const readyToForward = receivedDonations
  const totalReceived = receivedDonations.reduce((sum, d) => sum + (d.amount ?? 0), 0)
  const inTransitTransfers = wireTransfers.filter(w => w.status === 'IN_TRANSIT' || w.status === 'SENT').length
  const completedTransfers = wireTransfers.filter(w => w.status === 'CONFIRMED').length

  if (isLoadingData) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nonprofit Manager Dashboard</h1>
            {user && (
              <p className="text-gray-600 mt-1">
                Welcome, {user.name} {user.organization && `• ${user.organization}`}
              </p>
            )}
          </div>
          <div className="mt-4 md:mt-0">
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-4 underline">Dismiss</button>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-4">
            {(['overview', 'donations', 'wire-transfers'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-[var(--navy-600)] text-[var(--navy-600)]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'overview' && 'Overview'}
                {tab === 'donations' && `Donations (${donations.length})`}
                {tab === 'wire-transfers' && 'Wire Transfers'}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-600 mb-1">Pending Confirmation</div>
                  <div className="text-3xl font-bold text-yellow-600">{pendingConfirmations}</div>
                  <div className="text-xs text-gray-500 mt-1">Donors who said they sent funds</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-600 mb-1">Ready to Forward</div>
                  <div className="text-3xl font-bold text-blue-600">{readyToForward.length}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatCurrency(totalReceived, { compact: true })} total
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-600 mb-1">In Transit to Ukraine</div>
                  <div className="text-3xl font-bold text-indigo-600">{inTransitTransfers}</div>
                  <div className="text-xs text-gray-500 mt-1">Awaiting confirmation</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-600 mb-1">Completed Transfers</div>
                  <div className="text-3xl font-bold text-green-600">{completedTransfers}</div>
                  <div className="text-xs text-gray-500 mt-1">Successfully delivered</div>
                </CardContent>
              </Card>
            </div>

            {/* Pending Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Actions</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingConfirmations > 0 ? (
                  <div className="space-y-4">
                    {donations
                      .filter(d => d.status === 'PENDING_CONFIRMATION')
                      .map((donation) => (
                        <div
                          key={donation.id}
                          className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                        >
                          <div>
                            <div className="font-medium text-gray-900">{donation.donorName}</div>
                            <div className="text-sm text-gray-600">
                              {donation.amount ? formatCurrency(donation.amount) : 'Amount TBD'} via {donation.paymentMethod} &bull; {donation.projectName}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Submitted {formatDate(donation.submittedAt)}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(donation.id, 'RECEIVED')}
                            disabled={updatingIds.has(donation.id)}
                          >
                            {updatingIds.has(donation.id) ? 'Updating...' : 'Mark Received'}
                          </Button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No pending confirmations. All caught up!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Ready to Forward */}
            {readyToForward.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Ready to Forward to Ukraine</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {readyToForward.map((donation) => {
                      const nextAction = NEXT_STATUS[donation.status]
                      return (
                        <div
                          key={donation.id}
                          className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg"
                        >
                          <div>
                            <div className="font-medium text-gray-900">
                              {donation.amount ? formatCurrency(donation.amount) : 'Amount TBD'}
                            </div>
                            <div className="text-sm text-gray-600">{donation.projectName}</div>
                            <div className="text-xs text-gray-500">
                              From: {donation.donorName}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={STATUS_COLORS[donation.status] || ''}>
                              {STATUS_LABELS[donation.status] || donation.status}
                            </Badge>
                            {nextAction && (
                              <Button
                                size="sm"
                                variant={nextAction.variant || 'primary'}
                                onClick={() => handleStatusUpdate(donation.id, nextAction.status)}
                                disabled={updatingIds.has(donation.id)}
                              >
                                {updatingIds.has(donation.id) ? 'Updating...' : nextAction.label}
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Transfers */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Wire Transfers</CardTitle>
              </CardHeader>
              <CardContent>
                {wireTransfers.length > 0 ? (
                  <div className="space-y-3">
                    {wireTransfers.slice(0, 3).map((transfer) => (
                      <div
                        key={transfer.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-gray-900">
                            {transfer.referenceNumber} &bull; {formatCurrency(transfer.amount)}
                          </div>
                          <div className="text-sm text-gray-600">{transfer.recipientName}</div>
                          <div className="text-xs text-gray-500">{transfer.projectName}</div>
                        </div>
                        <Badge className={STATUS_COLORS[transfer.status] || ''}>
                          {STATUS_LABELS[transfer.status] || transfer.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No wire transfers yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Donations Tab */}
        {activeTab === 'donations' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Donations</CardTitle>
              </CardHeader>
              <CardContent>
                {donations.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No donations yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left text-sm text-gray-500">
                          <th className="pb-3 font-medium">Donor</th>
                          <th className="pb-3 font-medium">Project</th>
                          <th className="pb-3 font-medium">Amount</th>
                          <th className="pb-3 font-medium">Method</th>
                          <th className="pb-3 font-medium">Status</th>
                          <th className="pb-3 font-medium">Date</th>
                          <th className="pb-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {donations.map((donation) => {
                          const nextAction = NEXT_STATUS[donation.status]
                          return (
                            <tr key={donation.id} className="border-b">
                              <td className="py-4">
                                <div className="font-medium text-gray-900">{donation.donorName}</div>
                                <div className="text-xs text-gray-500">{donation.donorEmail}</div>
                              </td>
                              <td className="py-4 text-gray-600 max-w-xs truncate">
                                {donation.projectName}
                              </td>
                              <td className="py-4 font-medium">
                                {donation.amount ? formatCurrency(donation.amount) : 'TBD'}
                              </td>
                              <td className="py-4 uppercase text-xs font-medium text-gray-600">
                                {donation.paymentMethod}
                              </td>
                              <td className="py-4">
                                <Badge className={STATUS_COLORS[donation.status] || ''}>
                                  {STATUS_LABELS[donation.status] || donation.status}
                                </Badge>
                              </td>
                              <td className="py-4 text-gray-500">
                                {formatDate(donation.submittedAt)}
                              </td>
                              <td className="py-4">
                                {nextAction && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatusUpdate(donation.id, nextAction.status)}
                                    disabled={updatingIds.has(donation.id)}
                                  >
                                    {updatingIds.has(donation.id) ? '...' : nextAction.label}
                                  </Button>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Wire Transfers Tab */}
        {activeTab === 'wire-transfers' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Wire Transfers to Ukraine</h2>
              <Button>+ New Wire Transfer</Button>
            </div>

            <Card>
              <CardContent className="pt-6">
                {wireTransfers.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No wire transfers yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left text-sm text-gray-500">
                          <th className="pb-3 font-medium">Reference</th>
                          <th className="pb-3 font-medium">Recipient</th>
                          <th className="pb-3 font-medium">Project</th>
                          <th className="pb-3 font-medium">Amount</th>
                          <th className="pb-3 font-medium">Status</th>
                          <th className="pb-3 font-medium">Sent</th>
                          <th className="pb-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {wireTransfers.map((transfer) => (
                          <tr key={transfer.id} className="border-b">
                            <td className="py-4 font-mono font-medium">
                              {transfer.referenceNumber}
                            </td>
                            <td className="py-4 text-gray-900">
                              {transfer.recipientName}
                            </td>
                            <td className="py-4 text-gray-600 max-w-xs truncate">
                              {transfer.projectName}
                            </td>
                            <td className="py-4 font-medium">
                              {formatCurrency(transfer.amount)}
                            </td>
                            <td className="py-4">
                              <Badge className={STATUS_COLORS[transfer.status] || ''}>
                                {STATUS_LABELS[transfer.status] || transfer.status}
                              </Badge>
                            </td>
                            <td className="py-4 text-gray-500">
                              {transfer.sentAt ? formatDate(transfer.sentAt) : '-'}
                            </td>
                            <td className="py-4">
                              <Button size="sm" variant="outline">
                                View Details
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fee Comparison Helper */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transfer Fee Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Compare Wise vs. traditional wire transfer fees before sending:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="font-medium text-gray-900 mb-2">Wise Transfer</div>
                    <div className="text-sm text-gray-600">
                      ~0.5-0.7% fee + mid-market exchange rate
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Best for amounts under ~$50,000
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="font-medium text-gray-900 mb-2">Bank Wire (BoA)</div>
                    <div className="text-sm text-gray-600">
                      ~$45 flat fee + intermediary fees + exchange rate markup
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Better for very large amounts
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  )
}

export default function NonprofitPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, hasRole } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login')
      } else if (!hasRole(['NONPROFIT_MANAGER', 'ADMIN'])) {
        // Redirect non-nonprofit managers to home
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

  if (!isAuthenticated || !hasRole(['NONPROFIT_MANAGER', 'ADMIN'])) {
    return null
  }

  return <NonprofitDashboard />
}
