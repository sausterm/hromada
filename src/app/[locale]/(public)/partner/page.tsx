'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { CATEGORY_CONFIG } from '@/types'

interface ProjectSubmission {
  id: string
  municipalityName: string
  facilityName: string
  category: string
  projectType: string
  briefDescription: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectionReason: string | null
  approvedProjectId: string | null
  createdAt: string
}

export default function PartnerDashboardPage() {
  const t = useTranslations()
  const router = useRouter()
  const { isAuthenticated, isLoading, isPartner, user, logout } = useAuth()

  const [submissions, setSubmissions] = useState<ProjectSubmission[]>([])
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true)

  // Redirect if not authenticated or not a partner
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    } else if (!isLoading && isAuthenticated && !isPartner()) {
      router.push('/')
    }
  }, [isLoading, isAuthenticated, isPartner, router])

  // Fetch partner's submissions
  useEffect(() => {
    async function fetchSubmissions() {
      try {
        const response = await fetch('/api/partner/projects')
        if (response.ok) {
          const data = await response.json()
          setSubmissions(data.submissions || [])
        }
      } catch (error) {
        console.error('Failed to fetch submissions:', error)
      } finally {
        setIsLoadingSubmissions(false)
      }
    }

    if (isAuthenticated && isPartner()) {
      fetchSubmissions()
    }
  }, [isAuthenticated, isPartner])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cream-100)]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated || !isPartner()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cream-100)]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const stats = {
    total: submissions.length,
    pending: submissions.filter((s) => s.status === 'PENDING').length,
    approved: submissions.filter((s) => s.status === 'APPROVED').length,
    rejected: submissions.filter((s) => s.status === 'REJECTED').length,
  }

  return (
    <div className="min-h-screen bg-[var(--cream-100)]">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold text-[var(--ukraine-600)]">
              Hromada
            </Link>
            <Badge variant="info">{t('partner.title')}</Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <p className="font-medium text-gray-900">{user?.name}</p>
              {user?.organization && (
                <p className="text-gray-500">{user.organization}</p>
              )}
            </div>
            <Button variant="ghost" onClick={logout}>
              {t('admin.nav.logout')}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">{t('partner.stats.totalSubmissions')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
              <p className="text-sm text-gray-500">{t('partner.stats.pending')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
              <p className="text-sm text-gray-500">{t('partner.stats.approved')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
              <p className="text-sm text-gray-500">{t('partner.stats.rejected')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Projects Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-semibold">{t('partner.projects.title')}</h2>
            <Link href="/partner/projects/new">
              <Button>{t('partner.projects.addNew')}</Button>
            </Link>
          </div>

          {isLoadingSubmissions ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : submissions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500 mb-4">{t('partner.projects.noProjects')}</p>
                <Link href="/partner/projects/new">
                  <Button>{t('partner.projects.addNew')}</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">
                        {t('partner.projects.table.facility')}
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">
                        {t('partner.projects.table.municipality')}
                      </th>
                      <th className="text-center p-4 text-sm font-medium text-gray-500">
                        {t('partner.projects.table.category')}
                      </th>
                      <th className="text-center p-4 text-sm font-medium text-gray-500">
                        {t('partner.projects.table.status')}
                      </th>
                      <th className="text-center p-4 text-sm font-medium text-gray-500">
                        {t('partner.projects.table.submitted')}
                      </th>
                      <th className="text-center p-4 text-sm font-medium text-gray-500">
                        {t('admin.projects.table.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {submissions.map((submission) => {
                      const categoryConfig = CATEGORY_CONFIG[submission.category as keyof typeof CATEGORY_CONFIG]

                      return (
                        <tr key={submission.id} className="hover:bg-gray-50">
                          <td className="p-4">
                            <p className="font-medium text-gray-900">{submission.facilityName}</p>
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {submission.briefDescription}
                            </p>
                          </td>
                          <td className="p-4 text-gray-600">{submission.municipalityName}</td>
                          <td className="p-4 text-center">
                            {categoryConfig ? (
                              <Badge dot dotColor={categoryConfig.color} size="sm">
                                {t(`categories.${submission.category}`)}
                              </Badge>
                            ) : (
                              <span className="text-gray-500">{submission.category}</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <Badge
                              variant={
                                submission.status === 'APPROVED'
                                  ? 'success'
                                  : submission.status === 'REJECTED'
                                  ? 'danger'
                                  : 'warning'
                              }
                              size="sm"
                            >
                              {t(`admin.submissions.${submission.status.toLowerCase()}`)}
                            </Badge>
                            {submission.status === 'REJECTED' && submission.rejectionReason && (
                              <p className="text-xs text-red-600 mt-1 max-w-[150px] truncate" title={submission.rejectionReason}>
                                {submission.rejectionReason}
                              </p>
                            )}
                          </td>
                          <td className="p-4 text-center text-gray-500 text-sm">
                            {new Date(submission.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex gap-2 justify-center">
                              {submission.status === 'APPROVED' && submission.approvedProjectId ? (
                                <Link href={`/projects/${submission.approvedProjectId}`}>
                                  <Button variant="ghost" size="sm">
                                    {t('partner.projects.viewDetails')}
                                  </Button>
                                </Link>
                              ) : submission.status === 'PENDING' ? (
                                <Link href={`/partner/projects/${submission.id}`}>
                                  <Button variant="ghost" size="sm">
                                    {t('partner.projects.edit')}
                                  </Button>
                                </Link>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
