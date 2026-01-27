'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { type Project, type Inquiry, type ContactSubmission, CATEGORY_CONFIG, STATUS_CONFIG, URGENCY_CONFIG } from '@/types'

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

function LoginForm({ onLogin }: { onLogin: (password: string) => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Simple validation - in production, verify against API
    if (!password.trim()) {
      setError('Password is required')
      setIsLoading(false)
      return
    }

    // Simulate verification delay
    await new Promise((r) => setTimeout(r, 500))
    onLogin(password)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <p className="text-gray-500 text-sm mt-1">Enter the admin password to continue</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                error={error}
              />
            </div>
            <Button type="submit" fullWidth isLoading={isLoading}>
              Login
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-[var(--ukraine-600)] hover:underline">
              ← Back to Map
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface ContactSubmissionWithProject extends ContactSubmission {
  project: Pick<Project, 'id' | 'facilityName' | 'municipalityName' | 'contactEmail'>
}

function Dashboard({ onLogout, authHeader }: { onLogout: () => void; authHeader: string | null }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [inquiries, setInquiries] = useState<(Inquiry & { project: Pick<Project, 'id' | 'facilityName'> })[]>([])
  const [contactSubmissions, setContactSubmissions] = useState<ContactSubmissionWithProject[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true)
  const [activeTab, setActiveTab] = useState<'projects' | 'inquiries' | 'contacts'>('projects')

  // Fetch projects from API
  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/projects')
        if (response.ok) {
          const data = await response.json()
          setProjects(data.projects.map(transformProject))
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error)
      } finally {
        setIsLoadingProjects(false)
      }
    }
    fetchProjects()
  }, [])

  // Fetch contact submissions
  useEffect(() => {
    async function fetchSubmissions() {
      if (!authHeader) return

      try {
        const response = await fetch('/api/contact', {
          headers: { Authorization: authHeader },
        })
        if (response.ok) {
          const data = await response.json()
          setContactSubmissions(data.submissions || [])
        }
      } catch (error) {
        console.error('Failed to fetch contact submissions:', error)
      } finally {
        setIsLoadingSubmissions(false)
      }
    }
    fetchSubmissions()
  }, [authHeader])

  const handleMarkAsHandled = async (submissionId: string, handled: boolean) => {
    if (!authHeader) return

    try {
      const response = await fetch(`/api/contact/${submissionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({ handled }),
      })

      if (response.ok) {
        setContactSubmissions((prev) =>
          prev.map((s) => (s.id === submissionId ? { ...s, handled } : s))
        )
      }
    } catch (error) {
      console.error('Failed to update submission:', error)
    }
  }

  const unhandledCount = contactSubmissions.filter((s) => !s.handled).length

  const stats = {
    totalProjects: projects.length,
    openProjects: projects.filter((p) => p.status === 'OPEN').length,
    criticalProjects: projects.filter((p) => p.urgency === 'CRITICAL').length,
    totalInquiries: inquiries.length,
    contactSubmissions: contactSubmissions.length,
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold text-[var(--ukraine-600)]">
              Hromada
            </Link>
            <Badge variant="secondary">Admin</Badge>
          </div>
          <Button variant="ghost" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-gray-900">{stats.totalProjects}</p>
              <p className="text-sm text-gray-500">Total Projects</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.openProjects}</p>
              <p className="text-sm text-gray-500">Open Projects</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{stats.criticalProjects}</p>
              <p className="text-sm text-gray-500">Critical Urgency</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-[var(--ukraine-600)]">{stats.totalInquiries}</p>
              <p className="text-sm text-gray-500">Inquiries</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'projects' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('projects')}
          >
            Projects
          </Button>
          <Button
            variant={activeTab === 'inquiries' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('inquiries')}
          >
            Inquiries
            {inquiries.length > 0 && (
              <Badge variant="danger" size="sm" className="ml-2">
                {inquiries.length}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === 'contacts' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('contacts')}
          >
            Contact Submissions
            {unhandledCount > 0 && (
              <Badge variant="danger" size="sm" className="ml-2">
                {unhandledCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Content */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Projects</h2>
              <Link href="/admin/projects/new">
                <Button>+ Add Project</Button>
              </Link>
            </div>

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Facility</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Municipality</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Category</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Urgency</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {projects.map((project) => {
                      const categoryConfig = CATEGORY_CONFIG[project.category]
                      const urgencyConfig = URGENCY_CONFIG[project.urgency]
                      const statusConfig = STATUS_CONFIG[project.status]

                      return (
                        <tr key={project.id} className="hover:bg-gray-50">
                          <td className="p-4">
                            <p className="font-medium text-gray-900">{project.facilityName}</p>
                          </td>
                          <td className="p-4 text-gray-600">{project.municipalityName}</td>
                          <td className="p-4">
                            <Badge dot dotColor={categoryConfig.color} size="sm">
                              {categoryConfig.label}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge
                              variant={project.urgency === 'CRITICAL' ? 'danger' : project.urgency === 'HIGH' ? 'warning' : 'default'}
                              size="sm"
                            >
                              {urgencyConfig.label}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge
                              variant={project.status === 'OPEN' ? 'success' : 'default'}
                              size="sm"
                            >
                              {statusConfig.label}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Link href={`/projects/${project.id}`}>
                                <Button variant="ghost" size="sm">View</Button>
                              </Link>
                              <Link href={`/admin/projects/${project.id}`}>
                                <Button variant="ghost" size="sm">Edit</Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'inquiries' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Recent Inquiries</h2>

            <div className="space-y-4">
              {inquiries.map((inquiry) => (
                <Card key={inquiry.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-medium text-gray-900">{inquiry.name}</p>
                        <p className="text-sm text-gray-500">{inquiry.email}</p>
                        {inquiry.organization && (
                          <p className="text-sm text-gray-500">{inquiry.organization}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge size="sm" variant="info">
                          {inquiry.project.facilityName}
                        </Badge>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(inquiry.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">
                      {inquiry.message}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="primary">
                        Reply
                      </Button>
                      <Button size="sm" variant="ghost">
                        Mark as Read
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Contact Submissions</h2>

            {isLoadingSubmissions ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : contactSubmissions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">No contact submissions yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {contactSubmissions.map((submission) => (
                  <Card
                    key={submission.id}
                    className={submission.handled ? 'opacity-60' : ''}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">
                              {submission.donorName}
                            </p>
                            {submission.handled && (
                              <Badge size="sm" variant="success">
                                Handled
                              </Badge>
                            )}
                          </div>
                          <a
                            href={`mailto:${submission.donorEmail}`}
                            className="text-sm text-[var(--ukraine-600)] hover:underline"
                          >
                            {submission.donorEmail}
                          </a>
                        </div>
                        <div className="text-right">
                          <Badge size="sm" variant="info">
                            {submission.project.facilityName}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {submission.project.municipalityName}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(submission.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm whitespace-pre-wrap">
                        {submission.message}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <a href={`mailto:${submission.donorEmail}`}>
                          <Button size="sm" variant="primary">
                            Reply to Donor
                          </Button>
                        </a>
                        <a href={`mailto:${submission.project.contactEmail}`}>
                          <Button size="sm" variant="outline">
                            Contact Municipality
                          </Button>
                        </a>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleMarkAsHandled(submission.id, !submission.handled)
                          }
                        >
                          {submission.handled ? 'Mark as Unhandled' : 'Mark as Handled'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const { isAuthenticated, isLoading, login, logout, getAuthHeader } = useAdminAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />
  }

  return <Dashboard onLogout={logout} authHeader={getAuthHeader()} />
}
