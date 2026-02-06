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

// Mock data for development - will be replaced with API calls
const MOCK_DONATIONS = [
  {
    id: '1',
    projectName: 'Kharkiv Regional Hospital - Solar Installation',
    donorName: 'John Smith',
    donorEmail: 'john@example.com',
    donorOrganization: 'Smith Foundation',
    amount: 150000,
    paymentMethod: 'wire',
    status: 'pending_confirmation',
    submittedAt: '2026-02-05T10:30:00Z',
  },
  {
    id: '2',
    projectName: 'Odesa School #5 - Battery Storage',
    donorName: 'Acme Corporation',
    donorEmail: 'giving@acme.com',
    donorOrganization: 'Acme Corp',
    amount: 75000,
    paymentMethod: 'daf',
    status: 'pending_confirmation',
    submittedAt: '2026-02-04T14:20:00Z',
  },
  {
    id: '3',
    projectName: 'Lviv Community Center - Heat Pump',
    donorName: 'Jane Doe',
    donorEmail: 'jane@example.com',
    donorOrganization: null,
    amount: 50000,
    paymentMethod: 'wire',
    status: 'received',
    receivedAt: '2026-02-02T09:00:00Z',
    submittedAt: '2026-02-01T16:45:00Z',
  },
  {
    id: '4',
    projectName: 'Dnipro Hospital - Generator',
    donorName: 'Tech Corp',
    donorEmail: 'donations@techcorp.com',
    donorOrganization: 'Tech Corp',
    amount: 300000,
    paymentMethod: 'check',
    status: 'received',
    receivedAt: '2026-02-01T11:30:00Z',
    submittedAt: '2026-01-30T08:15:00Z',
  },
]

const MOCK_WIRE_TRANSFERS = [
  {
    id: '1',
    referenceNumber: 'WT-2026-001',
    recipientName: 'Zaporizhzhia City Administration',
    projectName: 'Zaporizhzhia School - Solar PV',
    amount: 100000,
    status: 'in_transit',
    sentAt: '2026-02-01T10:00:00Z',
    createdAt: '2026-01-31T14:00:00Z',
  },
  {
    id: '2',
    referenceNumber: 'WT-2026-002',
    recipientName: 'Poltava Regional Hospital',
    projectName: 'Poltava Clinic - Heat Pump',
    amount: 80000,
    status: 'confirmed',
    sentAt: '2026-01-28T09:00:00Z',
    confirmedAt: '2026-01-30T15:00:00Z',
    createdAt: '2026-01-27T11:00:00Z',
  },
]

type DonationStatus = 'pending_confirmation' | 'received' | 'allocated' | 'forwarded'
type WireStatus = 'pending' | 'initiated' | 'sent' | 'in_transit' | 'confirmed' | 'failed'
type Tab = 'overview' | 'donations' | 'wire-transfers'

const STATUS_COLORS: Record<DonationStatus | WireStatus, string> = {
  pending_confirmation: 'bg-yellow-100 text-yellow-800',
  received: 'bg-blue-100 text-blue-800',
  allocated: 'bg-purple-100 text-purple-800',
  forwarded: 'bg-green-100 text-green-800',
  pending: 'bg-gray-100 text-gray-800',
  initiated: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-blue-100 text-blue-800',
  in_transit: 'bg-indigo-100 text-indigo-800',
  confirmed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
}

const STATUS_LABELS: Record<DonationStatus | WireStatus, string> = {
  pending_confirmation: 'Awaiting Confirmation',
  received: 'Received',
  allocated: 'Allocated',
  forwarded: 'Forwarded',
  pending: 'Pending',
  initiated: 'Initiated',
  sent: 'Sent',
  in_transit: 'In Transit',
  confirmed: 'Confirmed',
  failed: 'Failed',
}

function NonprofitDashboard() {
  const t = useTranslations()
  const { logout, user } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [donations, setDonations] = useState(MOCK_DONATIONS)
  const [wireTransfers, setWireTransfers] = useState(MOCK_WIRE_TRANSFERS)

  // Calculate stats
  const pendingConfirmations = donations.filter(d => d.status === 'pending_confirmation').length
  const receivedDonations = donations.filter(d => d.status === 'received')
  const totalReceived = receivedDonations.reduce((sum, d) => sum + d.amount, 0)
  const pendingForward = receivedDonations.length
  const inTransitTransfers = wireTransfers.filter(w => w.status === 'in_transit').length
  const completedTransfers = wireTransfers.filter(w => w.status === 'confirmed').length

  const handleMarkReceived = (donationId: string) => {
    setDonations(prev => prev.map(d =>
      d.id === donationId
        ? { ...d, status: 'received' as DonationStatus, receivedAt: new Date().toISOString() }
        : d
    ))
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
                {tab === 'donations' && 'Donations'}
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
                  <div className="text-3xl font-bold text-blue-600">{pendingForward}</div>
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
                      .filter(d => d.status === 'pending_confirmation')
                      .map((donation) => (
                        <div
                          key={donation.id}
                          className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                        >
                          <div>
                            <div className="font-medium text-gray-900">{donation.donorName}</div>
                            <div className="text-sm text-gray-600">
                              {formatCurrency(donation.amount)} via {donation.paymentMethod.toUpperCase()} • {donation.projectName}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Submitted {formatDate(donation.submittedAt)}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleMarkReceived(donation.id)}
                          >
                            Mark Received
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
            {pendingForward > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Ready to Forward to Ukraine</CardTitle>
                  <Button size="sm">
                    Create Wire Transfer
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {receivedDonations.map((donation) => (
                      <div
                        key={donation.id}
                        className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <input type="checkbox" className="w-4 h-4" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {formatCurrency(donation.amount)}
                            </div>
                            <div className="text-sm text-gray-600">{donation.projectName}</div>
                            <div className="text-xs text-gray-500">
                              From: {donation.donorName}
                            </div>
                          </div>
                        </div>
                        <Badge className={STATUS_COLORS.received}>
                          {STATUS_LABELS.received}
                        </Badge>
                      </div>
                    ))}
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
                <div className="space-y-3">
                  {wireTransfers.slice(0, 3).map((transfer) => (
                    <div
                      key={transfer.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {transfer.referenceNumber} • {formatCurrency(transfer.amount)}
                        </div>
                        <div className="text-sm text-gray-600">{transfer.recipientName}</div>
                        <div className="text-xs text-gray-500">{transfer.projectName}</div>
                      </div>
                      <Badge className={STATUS_COLORS[transfer.status as WireStatus]}>
                        {STATUS_LABELS[transfer.status as WireStatus]}
                      </Badge>
                    </div>
                  ))}
                </div>
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
                      {donations.map((donation) => (
                        <tr key={donation.id} className="border-b">
                          <td className="py-4">
                            <div className="font-medium text-gray-900">{donation.donorName}</div>
                            <div className="text-xs text-gray-500">{donation.donorEmail}</div>
                          </td>
                          <td className="py-4 text-gray-600 max-w-xs truncate">
                            {donation.projectName}
                          </td>
                          <td className="py-4 font-medium">
                            {formatCurrency(donation.amount)}
                          </td>
                          <td className="py-4 uppercase text-xs font-medium text-gray-600">
                            {donation.paymentMethod}
                          </td>
                          <td className="py-4">
                            <Badge className={STATUS_COLORS[donation.status as DonationStatus]}>
                              {STATUS_LABELS[donation.status as DonationStatus]}
                            </Badge>
                          </td>
                          <td className="py-4 text-gray-500">
                            {formatDate(donation.submittedAt)}
                          </td>
                          <td className="py-4">
                            {donation.status === 'pending_confirmation' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkReceived(donation.id)}
                              >
                                Mark Received
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                            <Badge className={STATUS_COLORS[transfer.status as WireStatus]}>
                              {STATUS_LABELS[transfer.status as WireStatus]}
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
