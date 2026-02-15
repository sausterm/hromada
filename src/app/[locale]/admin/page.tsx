'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { type Project, type ContactSubmission, CATEGORY_CONFIG, STATUS_CONFIG, URGENCY_CONFIG, PROJECT_TYPE_CONFIG } from '@/types'

// ProjectSubmission type for API responses
interface ProjectSubmission {
  id: string
  municipalityName: string
  municipalityEmail: string
  region: string | null
  facilityName: string
  category: string
  projectType: string
  briefDescription: string
  fullDescription: string
  urgency: string
  estimatedCostUsd: number | null
  technicalPowerKw: number | null
  numberOfPanels: number | null
  cofinancingAvailable: string | null
  cofinancingDetails: string | null
  cityName: string
  address: string | null
  cityLatitude: number
  cityLongitude: number
  contactName: string
  contactEmail: string
  contactPhone: string | null
  partnerOrganization: string | null
  projectSubtype: string | null
  additionalNotes: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewedAt: string | null
  reviewedBy: string | null
  rejectionReason: string | null
  approvedProjectId: string | null
  createdAt: string
  updatedAt: string
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

interface ContactSubmissionWithProject extends ContactSubmission {
  project: Pick<Project, 'id' | 'facilityName' | 'municipalityName' | 'contactEmail'>
}

type SortField = 'facilityName' | 'municipalityName' | 'region' | 'category' | 'projectType' | 'urgency' | 'status'
type SortDirection = 'asc' | 'desc'

// Sort options for submissions
type SubmissionSortField = 'recency' | 'status'
type ContactSortField = 'recency' | 'handled'

// User type for admin dashboard
interface User {
  id: string
  email: string
  name: string
  organization: string | null
  role: 'ADMIN' | 'PARTNER' | 'NONPROFIT_MANAGER'
  createdAt: string
  _count?: {
    projectSubmissions: number
  }
}

function Dashboard({ onLogout, userName }: { onLogout: () => void; userName?: string }) {
  const t = useTranslations()
  const [projects, setProjects] = useState<Project[]>([])
  const [contactSubmissions, setContactSubmissions] = useState<ContactSubmissionWithProject[]>([])
  const [projectSubmissions, setProjectSubmissions] = useState<ProjectSubmission[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true)
  const [isLoadingProjectSubmissions, setIsLoadingProjectSubmissions] = useState(true)
  const [activeTab, setActiveTab] = useState<'projects' | 'submissions' | 'contacts' | 'users' | 'mailingList'>('projects')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('facilityName')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedSubmission, setSelectedSubmission] = useState<ProjectSubmission | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Submissions search and sort
  const [submissionSearchQuery, setSubmissionSearchQuery] = useState('')
  const [submissionSortField, setSubmissionSortField] = useState<SubmissionSortField>('recency')
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL')

  // Contacts search and sort
  const [contactSearchQuery, setContactSearchQuery] = useState('')
  const [contactSortField, setContactSortField] = useState<ContactSortField>('recency')
  const [contactHandledFilter, setContactHandledFilter] = useState<'ALL' | 'HANDLED' | 'UNHANDLED'>('ALL')

  // Pagination
  const PAGE_SIZE_OPTIONS = [20, 50, 100] as const
  const [itemsPerPage, setItemsPerPage] = useState<number>(20)
  const [currentPage, setCurrentPage] = useState(1)

  // Multi-select for bulk actions
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

  // Users management
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [subscribers, setSubscribers] = useState<{ id: string; email: string; subscribedAt: string; unsubscribed: boolean }[]>([])
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(true)
  const [newSubscriberEmail, setNewSubscriberEmail] = useState('')
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    organization: '',
    role: 'PARTNER' as 'ADMIN' | 'PARTNER' | 'NONPROFIT_MANAGER',
  })
  const [userFormError, setUserFormError] = useState('')
  const [isSubmittingUser, setIsSubmittingUser] = useState(false)

  // Fetch projects from API
  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/projects?all=true')
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

  // Fetch contact submissions (cookies sent automatically)
  useEffect(() => {
    async function fetchSubmissions() {
      try {
        const response = await fetch('/api/contact')
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
  }, [])

  // Fetch project submissions (cookies sent automatically)
  useEffect(() => {
    async function fetchProjectSubmissions() {
      try {
        const response = await fetch('/api/projects/submissions')
        if (response.ok) {
          const data = await response.json()
          setProjectSubmissions(data.submissions || [])
        }
      } catch (error) {
        console.error('Failed to fetch project submissions:', error)
      } finally {
        setIsLoadingProjectSubmissions(false)
      }
    }
    fetchProjectSubmissions()
  }, [])

  // Fetch users (admin only)
  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch('/api/admin/users')
        if (response.ok) {
          const data = await response.json()
          setUsers(data.users || [])
        }
      } catch (error) {
        console.error('Failed to fetch users:', error)
      } finally {
        setIsLoadingUsers(false)
      }
    }
    fetchUsers()
  }, [])

  // Fetch subscribers
  useEffect(() => {
    async function fetchSubscribers() {
      try {
        const response = await fetch('/api/admin/subscribers')
        if (response.ok) {
          const data = await response.json()
          setSubscribers(data.subscribers || [])
        }
      } catch (error) {
        console.error('Failed to fetch subscribers:', error)
      } finally {
        setIsLoadingSubscribers(false)
      }
    }
    fetchSubscribers()
  }, [])

  const handleAddSubscriber = async () => {
    if (!newSubscriberEmail || !newSubscriberEmail.includes('@')) return
    try {
      const response = await fetch('/api/admin/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newSubscriberEmail }),
      })
      if (response.ok) {
        const data = await response.json()
        setSubscribers((prev) => [data.subscriber, ...prev.filter(s => s.id !== data.subscriber.id)])
        setNewSubscriberEmail('')
      }
    } catch (error) {
      console.error('Failed to add subscriber:', error)
    }
  }

  const handleRemoveSubscriber = async (id: string) => {
    try {
      const response = await fetch('/api/admin/subscribers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (response.ok) {
        setSubscribers((prev) => prev.filter(s => s.id !== id))
      }
    } catch (error) {
      console.error('Failed to remove subscriber:', error)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setUserFormError('')
    setIsSubmittingUser(true)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userFormData),
      })

      if (response.ok) {
        const data = await response.json()
        setUsers((prev) => [data.user, ...prev])
        setShowUserForm(false)
        setUserFormData({ name: '', email: '', password: '', organization: '', role: 'PARTNER' })
        alert(t('users.createSuccess'))
      } else {
        const data = await response.json()
        setUserFormError(data.error || 'Failed to create user')
      }
    } catch (error) {
      console.error('Failed to create user:', error)
      setUserFormError('Failed to create user')
    } finally {
      setIsSubmittingUser(false)
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    setUserFormError('')
    setIsSubmittingUser(true)

    try {
      const updateData: Record<string, unknown> = {
        name: userFormData.name,
        organization: userFormData.organization,
        role: userFormData.role,
      }
      if (userFormData.password) {
        updateData.password = userFormData.password
      }

      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        const data = await response.json()
        setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? data.user : u)))
        setEditingUser(null)
        setShowUserForm(false)
        setUserFormData({ name: '', email: '', password: '', organization: '', role: 'PARTNER' })
        alert(t('users.updateSuccess'))
      } else {
        const data = await response.json()
        setUserFormError(data.error || 'Failed to update user')
      }
    } catch (error) {
      console.error('Failed to update user:', error)
      setUserFormError('Failed to update user')
    } finally {
      setIsSubmittingUser(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(t('users.deleteConfirm'))) return

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId))
        alert(t('users.deleteSuccess'))
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  const openEditUser = (user: User) => {
    setEditingUser(user)
    setUserFormData({
      name: user.name,
      email: user.email,
      password: '',
      organization: user.organization || '',
      role: user.role,
    })
    setShowUserForm(true)
  }

  const handleApproveSubmission = async (submissionId: string) => {
    setIsProcessing(true)

    try {
      const response = await fetch(`/api/projects/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', reviewedBy: 'admin' }),
      })

      if (response.ok) {
        const data = await response.json()
        // Update submissions list
        setProjectSubmissions((prev) =>
          prev.map((s) =>
            s.id === submissionId
              ? { ...s, status: 'APPROVED' as const, approvedProjectId: data.projectId }
              : s
          )
        )
        // Refetch projects to include the new one
        const projectsResponse = await fetch('/api/projects?all=true')
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json()
          setProjects(projectsData.projects.map(transformProject))
        }
        setSelectedSubmission(null)
        alert(t('admin.submissions.approveSuccess'))
      } else {
        const data = await response.json()
        alert(data.error || t('admin.submissions.approveSuccess'))
      }
    } catch (error) {
      console.error('Failed to approve submission:', error)
      alert(t('admin.submissions.approveSuccess'))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRejectSubmission = async (submissionId: string) => {
    if (!rejectionReason.trim()) {
      alert(t('admin.submissions.provideReason'))
      return
    }
    setIsProcessing(true)

    try {
      const response = await fetch(`/api/projects/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          rejectionReason: rejectionReason.trim(),
          reviewedBy: 'admin',
        }),
      })

      if (response.ok) {
        setProjectSubmissions((prev) =>
          prev.map((s) =>
            s.id === submissionId
              ? { ...s, status: 'REJECTED' as const, rejectionReason: rejectionReason.trim() }
              : s
          )
        )
        setSelectedSubmission(null)
        setRejectionReason('')
        alert(t('admin.submissions.rejectSuccess'))
      } else {
        const data = await response.json()
        alert(data.error || t('admin.submissions.rejectSuccess'))
      }
    } catch (error) {
      console.error('Failed to reject submission:', error)
      alert(t('admin.submissions.rejectSuccess'))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMarkAsHandled = async (submissionId: string, handled: boolean) => {
    try {
      const response = await fetch(`/api/contact/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
  const pendingSubmissionsCount = projectSubmissions.filter((s) => s.status === 'PENDING').length

  // Filter and sort projects
  const filteredAndSortedProjects = projects
    .filter((p) => {
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      return (
        p.facilityName.toLowerCase().includes(query) ||
        p.municipalityName.toLowerCase().includes(query) ||
        CATEGORY_CONFIG[p.category].label.toLowerCase().includes(query) ||
        STATUS_CONFIG[p.status].label.toLowerCase().includes(query)
      )
    })
    .sort((a, b) => {
      let aVal: string
      let bVal: string

      switch (sortField) {
        case 'facilityName':
          aVal = a.facilityName
          bVal = b.facilityName
          break
        case 'municipalityName':
          aVal = a.municipalityName
          bVal = b.municipalityName
          break
        case 'region':
          aVal = a.region || ''
          bVal = b.region || ''
          break
        case 'category':
          aVal = CATEGORY_CONFIG[a.category].label
          bVal = CATEGORY_CONFIG[b.category].label
          break
        case 'projectType':
          aVal = a.projectType ? PROJECT_TYPE_CONFIG[a.projectType].label : ''
          bVal = b.projectType ? PROJECT_TYPE_CONFIG[b.projectType].label : ''
          break
        case 'urgency':
          aVal = URGENCY_CONFIG[a.urgency].label
          bVal = URGENCY_CONFIG[b.urgency].label
          break
        case 'status':
          aVal = STATUS_CONFIG[a.status].label
          bVal = STATUS_CONFIG[b.status].label
          break
        default:
          aVal = a.facilityName
          bVal = b.facilityName
      }

      const comparison = aVal.localeCompare(bVal)
      return sortDirection === 'asc' ? comparison : -comparison
    })

  // Paginate the filtered projects
  const totalPages = Math.ceil(filteredAndSortedProjects.length / itemsPerPage)
  const paginatedProjects = filteredAndSortedProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset to page 1 when search or page size changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, itemsPerPage])

  // Filter and sort project submissions
  const filteredAndSortedSubmissions = projectSubmissions
    .filter((s) => {
      // Status filter
      if (submissionStatusFilter !== 'ALL' && s.status !== submissionStatusFilter) {
        return false
      }
      // Search filter
      if (!submissionSearchQuery.trim()) return true
      const query = submissionSearchQuery.toLowerCase()
      return (
        s.facilityName.toLowerCase().includes(query) ||
        s.municipalityName.toLowerCase().includes(query) ||
        s.contactName.toLowerCase().includes(query) ||
        s.contactEmail.toLowerCase().includes(query) ||
        s.cityName.toLowerCase().includes(query)
      )
    })
    .sort((a, b) => {
      if (submissionSortField === 'status') {
        // PENDING first, then APPROVED, then REJECTED
        const statusOrder = { PENDING: 0, APPROVED: 1, REJECTED: 2 }
        const statusDiff = statusOrder[a.status] - statusOrder[b.status]
        if (statusDiff !== 0) return statusDiff
        // Then by recency within same status
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      // Default: recency (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  // Filter and sort contact submissions
  const filteredAndSortedContacts = contactSubmissions
    .filter((s) => {
      // Handled filter
      if (contactHandledFilter === 'HANDLED' && !s.handled) return false
      if (contactHandledFilter === 'UNHANDLED' && s.handled) return false
      // Search filter
      if (!contactSearchQuery.trim()) return true
      const query = contactSearchQuery.toLowerCase()
      return (
        s.donorName.toLowerCase().includes(query) ||
        s.donorEmail.toLowerCase().includes(query) ||
        s.message.toLowerCase().includes(query) ||
        s.project.facilityName.toLowerCase().includes(query) ||
        s.project.municipalityName.toLowerCase().includes(query)
      )
    })
    .sort((a, b) => {
      if (contactSortField === 'handled') {
        // Unhandled first
        if (a.handled !== b.handled) return a.handled ? 1 : -1
        // Then by recency
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      // Default: recency (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Multi-select handlers
  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjectIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(projectId)) {
        newSet.delete(projectId)
      } else {
        newSet.add(projectId)
      }
      return newSet
    })
  }

  const toggleAllOnPage = () => {
    const pageProjectIds = paginatedProjects.map((p) => p.id)
    const allSelected = pageProjectIds.every((id) => selectedProjectIds.has(id))

    if (allSelected) {
      // Deselect all on page
      setSelectedProjectIds((prev) => {
        const newSet = new Set(prev)
        pageProjectIds.forEach((id) => newSet.delete(id))
        return newSet
      })
    } else {
      // Select all on page
      setSelectedProjectIds((prev) => {
        const newSet = new Set(prev)
        pageProjectIds.forEach((id) => newSet.add(id))
        return newSet
      })
    }
  }

  const clearSelection = () => {
    setSelectedProjectIds(new Set())
  }

  const handleBulkDelete = async () => {
    if (selectedProjectIds.size === 0) return

    const confirmMessage = t('admin.projects.confirmBulkDelete', { count: selectedProjectIds.size })
    if (!confirm(confirmMessage)) return

    setIsDeleting(true)

    try {
      const deletePromises = Array.from(selectedProjectIds).map((id) =>
        fetch(`/api/projects/${id}`, { method: 'DELETE' })
      )

      const results = await Promise.all(deletePromises)
      const failedCount = results.filter((r) => !r.ok).length

      if (failedCount > 0) {
        alert(t('admin.projects.bulkDeletePartialFail', { failed: failedCount, total: selectedProjectIds.size }))
      } else {
        alert(t('admin.projects.bulkDeleteSuccess', { count: selectedProjectIds.size }))
      }

      // Remove deleted projects from state
      setProjects((prev) => prev.filter((p) => !selectedProjectIds.has(p.id)))
      clearSelection()
    } catch (error) {
      console.error('Bulk delete failed:', error)
      alert(t('admin.projects.bulkDeleteFail'))
    } finally {
      setIsDeleting(false)
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="inline-flex flex-col ml-1">
      <svg
        className={`w-3 h-3 -mb-1 ${sortField === field && sortDirection === 'asc' ? 'text-gray-900' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 5l-8 8h16l-8-8z" />
      </svg>
      <svg
        className={`w-3 h-3 ${sortField === field && sortDirection === 'desc' ? 'text-gray-900' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 19l8-8H4l8 8z" />
      </svg>
    </span>
  )

  const stats = {
    totalProjects: projects.length,
    openProjects: projects.filter((p) => p.status === 'OPEN').length,
    criticalProjects: projects.filter((p) => p.urgency === 'CRITICAL').length,
    contactSubmissions: contactSubmissions.length,
    pendingSubmissions: pendingSubmissionsCount,
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold text-[var(--ukraine-600)]">
              hromada
            </Link>
            <Badge variant="secondary">{t('nav.admin')}</Badge>
          </div>
          <div className="flex items-center gap-4">
            {userName && (
              <span className="text-sm text-gray-500">
                {t('admin.loggedInAs')}: <span className="font-medium text-gray-700">{userName}</span>
              </span>
            )}
            <Button variant="ghost" onClick={onLogout}>
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
              <p className="text-3xl font-bold text-gray-900">{stats.totalProjects}</p>
              <p className="text-sm text-gray-500">{t('admin.stats.totalProjects')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.openProjects}</p>
              <p className="text-sm text-gray-500">{t('admin.stats.openProjects')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{stats.criticalProjects}</p>
              <p className="text-sm text-gray-500">{t('admin.stats.criticalProjects')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-amber-600">{stats.pendingSubmissions}</p>
              <p className="text-sm text-gray-500">{t('admin.stats.pendingSubmissions')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={activeTab === 'projects' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('projects')}
          >
            {t('admin.nav.projects')}
          </Button>
          <Button
            variant={activeTab === 'submissions' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('submissions')}
          >
            {t('admin.nav.submissions')}
            {pendingSubmissionsCount > 0 && (
              <Badge variant="warning" size="sm" className="ml-2">
                {pendingSubmissionsCount}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === 'contacts' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('contacts')}
          >
            {t('admin.nav.contacts')}
            {unhandledCount > 0 && (
              <Badge variant="danger" size="sm" className="ml-2">
                {unhandledCount}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === 'users' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('users')}
          >
            {t('admin.nav.users')}
          </Button>
          <Button
            variant={activeTab === 'mailingList' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('mailingList')}
          >
            Mailing List
            {subscribers.filter(s => !s.unsubscribed).length > 0 && (
              <Badge variant="info" size="sm" className="ml-2">
                {subscribers.filter(s => !s.unsubscribed).length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Content */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold">{t('admin.projects.title')} ({filteredAndSortedProjects.length})</h2>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder={t('admin.projects.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                  />
                </div>
                <Link href="/admin/projects/new">
                  <Button>{t('admin.projects.addNew')}</Button>
                </Link>
              </div>
            </div>

            {/* Bulk Actions Toolbar */}
            {selectedProjectIds.size > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-blue-800">
                    {t('admin.projects.selectedCount', { count: selectedProjectIds.size })}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearSelection}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {t('admin.projects.clearSelection')}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={handleBulkDelete}
                    disabled={isDeleting}
                    isLoading={isDeleting}
                  >
                    {t('admin.projects.deleteSelected')}
                  </Button>
                </div>
              </div>
            )}

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-4 w-12">
                        <input
                          type="checkbox"
                          checked={paginatedProjects.length > 0 && paginatedProjects.every((p) => selectedProjectIds.has(p.id))}
                          onChange={toggleAllOnPage}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th
                        className="text-left p-4 text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('facilityName')}
                      >
                        <span className="flex items-center">
                          {t('admin.projects.table.facility')}
                          <SortIcon field="facilityName" />
                        </span>
                      </th>
                      <th
                        className="text-left p-4 text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('municipalityName')}
                      >
                        <span className="flex items-center">
                          {t('admin.projects.table.municipality')}
                          <SortIcon field="municipalityName" />
                        </span>
                      </th>
                      <th
                        className="text-left p-4 text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('region')}
                      >
                        <span className="flex items-center">
                          {t('admin.projects.table.oblast')}
                          <SortIcon field="region" />
                        </span>
                      </th>
                      <th
                        className="text-center p-4 text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('category')}
                      >
                        <span className="flex items-center justify-center">
                          {t('admin.projects.table.category')}
                          <SortIcon field="category" />
                        </span>
                      </th>
                      <th
                        className="text-center p-4 text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('projectType')}
                      >
                        <span className="flex items-center justify-center">
                          {t('admin.projects.table.type')}
                          <SortIcon field="projectType" />
                        </span>
                      </th>
                      <th
                        className="text-center p-4 text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('urgency')}
                      >
                        <span className="flex items-center justify-center">
                          {t('admin.projects.table.urgency')}
                          <SortIcon field="urgency" />
                        </span>
                      </th>
                      <th
                        className="text-center p-4 text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('status')}
                      >
                        <span className="flex items-center justify-center">
                          {t('admin.projects.table.status')}
                          <SortIcon field="status" />
                        </span>
                      </th>
                      <th className="text-center p-4 text-sm font-medium text-gray-500">{t('admin.projects.table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paginatedProjects.map((project) => {
                      const categoryConfig = CATEGORY_CONFIG[project.category]
                      const urgencyConfig = URGENCY_CONFIG[project.urgency]
                      const statusConfig = STATUS_CONFIG[project.status]

                      return (
                        <tr key={project.id} className={`hover:bg-gray-50 ${selectedProjectIds.has(project.id) ? 'bg-blue-50' : ''}`}>
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedProjectIds.has(project.id)}
                              onChange={() => toggleProjectSelection(project.id)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="p-4">
                            <p className="font-medium text-gray-900">{project.facilityName}</p>
                          </td>
                          <td className="p-4 text-gray-600">{project.municipalityName}</td>
                          <td className="p-4 text-gray-500 text-sm">{project.region || '-'}</td>
                          <td className="p-4 text-center">
                            <Badge dot dotColor={categoryConfig.color} size="sm">
                              {t(`categories.${project.category}`)}
                            </Badge>
                          </td>
                          <td className="p-4 text-center">
                            {project.projectType ? (
                              <Badge size="sm" dot dotColor={PROJECT_TYPE_CONFIG[project.projectType].color}>
                                {t(`projectTypes.${project.projectType}`)}
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <Badge
                              variant={project.urgency === 'CRITICAL' ? 'danger' : project.urgency === 'HIGH' ? 'warning' : 'default'}
                              size="sm"
                            >
                              {t(`urgency.${project.urgency}`)}
                            </Badge>
                          </td>
                          <td className="p-4 text-center">
                            <Badge
                              variant={project.status === 'OPEN' ? 'success' : 'default'}
                              size="sm"
                            >
                              {t(`status.${project.status}`)}
                            </Badge>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex gap-2 justify-center">
                              <Link href={`/projects/${project.id}`}>
                                <Button variant="ghost" size="sm">{t('admin.projects.view')}</Button>
                              </Link>
                              <Link href={`/admin/projects/${project.id}`}>
                                <Button variant="ghost" size="sm">{t('admin.projects.edit')}</Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {paginatedProjects.length === 0 && (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-gray-500">
                          {searchQuery ? t('admin.projects.noMatch') : t('admin.projects.noProjects')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="px-4 py-3 border-t flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-gray-500">
                    Showing {filteredAndSortedProjects.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
                    {Math.min(currentPage * itemsPerPage, filteredAndSortedProjects.length)} of{' '}
                    {filteredAndSortedProjects.length} projects
                  </p>
                  <div className="flex items-center gap-2">
                    <label htmlFor="pageSize" className="text-sm text-gray-500">
                      Per page:
                    </label>
                    <select
                      id="pageSize"
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                      className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {totalPages > 1 && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Show pages around current page
                        let pageNum: number
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 rounded text-sm font-medium ${
                              currentPage === pageNum
                                ? 'bg-[var(--ukraine-600)] text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold">
                {t('admin.submissions.title')} ({filteredAndSortedSubmissions.length})
              </h2>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {/* Search */}
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search submissions..."
                    value={submissionSearchQuery}
                    onChange={(e) => setSubmissionSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-48"
                  />
                </div>
                {/* Status Filter */}
                <select
                  value={submissionStatusFilter}
                  onChange={(e) => setSubmissionStatusFilter(e.target.value as typeof submissionStatusFilter)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
                {/* Sort */}
                <select
                  value={submissionSortField}
                  onChange={(e) => setSubmissionSortField(e.target.value as SubmissionSortField)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="recency">Newest First</option>
                  <option value="status">By Status</option>
                </select>
              </div>
            </div>

            {isLoadingProjectSubmissions ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredAndSortedSubmissions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">
                    {projectSubmissions.length === 0
                      ? t('admin.submissions.noSubmissions')
                      : 'No submissions match your filters'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredAndSortedSubmissions.map((submission) => (
                    <Card
                      key={submission.id}
                      className={submission.status !== 'PENDING' ? 'opacity-60' : ''}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-900">
                                {submission.facilityName}
                              </p>
                              <Badge
                                size="sm"
                                variant={
                                  submission.status === 'PENDING'
                                    ? 'warning'
                                    : submission.status === 'APPROVED'
                                    ? 'success'
                                    : 'danger'
                                }
                              >
                                {submission.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {submission.municipalityName}
                              {submission.region && ` • ${submission.region}`}
                            </p>
                            <p className="text-sm text-gray-500">
                              {submission.cityName}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge size="sm" dot dotColor={CATEGORY_CONFIG[submission.category as keyof typeof CATEGORY_CONFIG]?.color || '#888'}>
                              {CATEGORY_CONFIG[submission.category as keyof typeof CATEGORY_CONFIG]?.label || submission.category}
                            </Badge>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(submission.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Brief description */}
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg mb-3">
                          {submission.briefDescription}
                        </p>

                        {/* Details grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                          <div>
                            <span className="text-gray-500">{t('admin.submissions.labels.type')}:</span>{' '}
                            <span className="font-medium">{t(`projectTypes.${submission.projectType}`)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">{t('admin.submissions.labels.urgency')}:</span>{' '}
                            <span className="font-medium">{t(`urgency.${submission.urgency}`)}</span>
                          </div>
                          {submission.estimatedCostUsd && (
                            <div>
                              <span className="text-gray-500">{t('admin.submissions.labels.cost')}:</span>{' '}
                              <span className="font-medium">
                                ${Number(submission.estimatedCostUsd).toLocaleString()}
                              </span>
                            </div>
                          )}
                          {submission.cofinancingAvailable && (
                            <div>
                              <span className="text-gray-500">{t('admin.submissions.labels.cofinancing')}:</span>{' '}
                              <span className="font-medium">{t(`cofinancing.${submission.cofinancingAvailable}`)}</span>
                            </div>
                          )}
                        </div>

                        {/* Contact info */}
                        <div className="text-sm text-gray-600 mb-3">
                          <span className="font-medium">{t('admin.submissions.labels.contact')}:</span> {submission.contactName} •{' '}
                          <a href={`mailto:${submission.contactEmail}`} className="text-blue-600 hover:underline">
                            {submission.contactEmail}
                          </a>
                          {submission.contactPhone && ` • ${submission.contactPhone}`}
                        </div>

                        {/* Rejection reason if rejected */}
                        {submission.status === 'REJECTED' && submission.rejectionReason && (
                          <div className="text-sm text-red-600 bg-red-50 p-2 rounded mb-3">
                            <strong>{t('admin.submissions.labels.rejectionReasonLabel')}:</strong> {submission.rejectionReason}
                          </div>
                        )}

                        {/* Approved project link */}
                        {submission.status === 'APPROVED' && submission.approvedProjectId && (
                          <div className="text-sm text-green-600 bg-green-50 p-2 rounded mb-3">
                            <Link href={`/projects/${submission.approvedProjectId}`} className="hover:underline">
                              {t('admin.submissions.viewApproved')}
                            </Link>
                          </div>
                        )}

                        {/* Actions for pending submissions */}
                        {submission.status === 'PENDING' && (
                          <div className="flex flex-wrap gap-2 pt-3 border-t">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => setSelectedSubmission(submission)}
                            >
                              {t('admin.submissions.reviewDetails')}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-600 hover:bg-green-50"
                              onClick={() => handleApproveSubmission(submission.id)}
                              disabled={isProcessing}
                            >
                              {t('admin.submissions.approve')}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => {
                                setSelectedSubmission(submission)
                                setRejectionReason('')
                              }}
                              disabled={isProcessing}
                            >
                              {t('admin.submissions.reject')}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}

            {/* Review/Reject Modal */}
            {selectedSubmission && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <CardHeader>
                    <CardTitle>{t('admin.submissions.reviewSubmission')}: {selectedSubmission.facilityName}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Full details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">{t('admin.submissions.labels.municipality')}</p>
                        <p className="font-medium">{selectedSubmission.municipalityName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">{t('admin.submissions.labels.municipalityEmail')}</p>
                        <p className="font-medium">{selectedSubmission.municipalityEmail}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">{t('admin.submissions.labels.category')}</p>
                        <p className="font-medium">{t(`categories.${selectedSubmission.category}`)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">{t('admin.submissions.labels.projectType')}</p>
                        <p className="font-medium">{t(`projectTypes.${selectedSubmission.projectType}`)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">{t('admin.submissions.labels.urgency')}</p>
                        <p className="font-medium">{t(`urgency.${selectedSubmission.urgency}`)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">{t('admin.submissions.labels.location')}</p>
                        <p className="font-medium">
                          {selectedSubmission.cityName}
                          {selectedSubmission.address && ` - ${selectedSubmission.address}`}
                        </p>
                      </div>
                      {selectedSubmission.estimatedCostUsd && (
                        <div>
                          <p className="text-gray-500">{t('admin.submissions.labels.estimatedCost')}</p>
                          <p className="font-medium">
                            ${Number(selectedSubmission.estimatedCostUsd).toLocaleString()}
                          </p>
                        </div>
                      )}
                      {selectedSubmission.technicalPowerKw && (
                        <div>
                          <p className="text-gray-500">{t('admin.submissions.labels.technicalPower')}</p>
                          <p className="font-medium">{selectedSubmission.technicalPowerKw} kW</p>
                        </div>
                      )}
                      {selectedSubmission.numberOfPanels && (
                        <div>
                          <p className="text-gray-500">{t('admin.submissions.labels.numberOfPanels')}</p>
                          <p className="font-medium">{selectedSubmission.numberOfPanels}</p>
                        </div>
                      )}
                      {selectedSubmission.cofinancingAvailable && (
                        <div>
                          <p className="text-gray-500">{t('admin.submissions.labels.cofinancing')}</p>
                          <p className="font-medium">
                            {t(`cofinancing.${selectedSubmission.cofinancingAvailable}`)}
                            {selectedSubmission.cofinancingDetails && ` - ${selectedSubmission.cofinancingDetails}`}
                          </p>
                        </div>
                      )}
                      {selectedSubmission.partnerOrganization && (
                        <div>
                          <p className="text-gray-500">{t('admin.submissions.labels.partnerOrganization')}</p>
                          <p className="font-medium">{selectedSubmission.partnerOrganization}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-gray-500 text-sm mb-1">{t('admin.submissions.labels.briefDescription')}</p>
                      <p className="bg-gray-50 p-3 rounded text-sm">{selectedSubmission.briefDescription}</p>
                    </div>

                    <div>
                      <p className="text-gray-500 text-sm mb-1">{t('admin.submissions.labels.fullDescription')}</p>
                      <p className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap">
                        {selectedSubmission.fullDescription}
                      </p>
                    </div>

                    {selectedSubmission.additionalNotes && (
                      <div>
                        <p className="text-gray-500 text-sm mb-1">{t('admin.submissions.labels.additionalNotes')}</p>
                        <p className="bg-gray-50 p-3 rounded text-sm">{selectedSubmission.additionalNotes}</p>
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <p className="text-gray-500 text-sm mb-1">{t('admin.submissions.labels.contactInfo')}</p>
                      <p className="font-medium">{selectedSubmission.contactName}</p>
                      <p className="text-sm">
                        <a href={`mailto:${selectedSubmission.contactEmail}`} className="text-blue-600 hover:underline">
                          {selectedSubmission.contactEmail}
                        </a>
                        {selectedSubmission.contactPhone && ` • ${selectedSubmission.contactPhone}`}
                      </p>
                    </div>

                    {/* Rejection reason input */}
                    <div className="border-t pt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('admin.submissions.rejectionReason')}
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                        rows={3}
                        placeholder={t('admin.submissions.rejectionReasonPlaceholder')}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        variant="primary"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApproveSubmission(selectedSubmission.id)}
                        disabled={isProcessing}
                        isLoading={isProcessing}
                      >
                        {t('admin.submissions.approvePublish')}
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleRejectSubmission(selectedSubmission.id)}
                        disabled={isProcessing || !rejectionReason.trim()}
                        isLoading={isProcessing}
                      >
                        {t('admin.submissions.reject')}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSelectedSubmission(null)
                          setRejectionReason('')
                        }}
                        disabled={isProcessing}
                      >
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold">
                {t('admin.contacts.title')} ({filteredAndSortedContacts.length})
              </h2>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {/* Search */}
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={contactSearchQuery}
                    onChange={(e) => setContactSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-48"
                  />
                </div>
                {/* Handled Filter */}
                <select
                  value={contactHandledFilter}
                  onChange={(e) => setContactHandledFilter(e.target.value as typeof contactHandledFilter)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All</option>
                  <option value="UNHANDLED">Unhandled</option>
                  <option value="HANDLED">Handled</option>
                </select>
                {/* Sort */}
                <select
                  value={contactSortField}
                  onChange={(e) => setContactSortField(e.target.value as ContactSortField)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="recency">Newest First</option>
                  <option value="handled">Unhandled First</option>
                </select>
              </div>
            </div>

            {isLoadingSubmissions ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredAndSortedContacts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">
                    {contactSubmissions.length === 0
                      ? t('admin.contacts.noContacts')
                      : 'No contacts match your filters'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredAndSortedContacts.map((submission) => (
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
                                {t('admin.contacts.handled')}
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
                            {t('admin.contacts.replyToDonor')}
                          </Button>
                        </a>
                        <a href={`mailto:${submission.project.contactEmail}`}>
                          <Button size="sm" variant="outline">
                            {t('admin.contacts.contactMunicipality')}
                          </Button>
                        </a>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleMarkAsHandled(submission.id, !submission.handled)
                          }
                        >
                          {submission.handled ? t('admin.contacts.markUnhandled') : t('admin.contacts.markHandled')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold">{t('users.title')} ({users.length})</h2>
              <Button onClick={() => {
                setEditingUser(null)
                setUserFormData({ name: '', email: '', password: '', organization: '', role: 'PARTNER' })
                setShowUserForm(true)
              }}>
                {t('users.addNew')}
              </Button>
            </div>

            {/* User Form Modal */}
            {showUserForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <CardTitle>{editingUser ? t('users.form.editTitle') : t('users.form.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('users.form.name')} *
                        </label>
                        <Input
                          value={userFormData.name}
                          onChange={(e) => setUserFormData((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder={t('users.form.namePlaceholder')}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('users.form.email')} *
                        </label>
                        <Input
                          type="email"
                          value={userFormData.email}
                          onChange={(e) => setUserFormData((prev) => ({ ...prev, email: e.target.value }))}
                          placeholder={t('users.form.emailPlaceholder')}
                          required
                          disabled={!!editingUser}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('users.form.password')} {!editingUser && '*'}
                        </label>
                        <Input
                          type="password"
                          value={userFormData.password}
                          onChange={(e) => setUserFormData((prev) => ({ ...prev, password: e.target.value }))}
                          placeholder={t('users.form.passwordPlaceholder')}
                          required={!editingUser}
                        />
                        {editingUser && (
                          <p className="text-xs text-gray-500 mt-1">Leave blank to keep current password</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('users.form.organization')}
                        </label>
                        <Input
                          value={userFormData.organization}
                          onChange={(e) => setUserFormData((prev) => ({ ...prev, organization: e.target.value }))}
                          placeholder={t('users.form.organizationPlaceholder')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('users.form.role')} *
                        </label>
                        <select
                          value={userFormData.role}
                          onChange={(e) => setUserFormData((prev) => ({ ...prev, role: e.target.value as 'ADMIN' | 'PARTNER' | 'NONPROFIT_MANAGER' }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="PARTNER">{t('users.roles.PARTNER')}</option>
                          <option value="NONPROFIT_MANAGER">{t('users.roles.NONPROFIT_MANAGER')}</option>
                          <option value="ADMIN">{t('users.roles.ADMIN')}</option>
                        </select>
                      </div>

                      {userFormError && (
                        <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{userFormError}</p>
                      )}

                      <div className="flex gap-3 pt-4">
                        <Button type="submit" isLoading={isSubmittingUser}>
                          {editingUser ? t('users.form.updateButton') : t('users.form.createButton')}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setShowUserForm(false)
                            setEditingUser(null)
                            setUserFormError('')
                          }}
                        >
                          {t('users.form.cancel')}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}

            {isLoadingUsers ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : users.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">{t('users.noUsers')}</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium text-gray-500">{t('users.table.name')}</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-500">{t('users.table.email')}</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-500">{t('users.table.organization')}</th>
                        <th className="text-center p-4 text-sm font-medium text-gray-500">{t('users.table.role')}</th>
                        <th className="text-center p-4 text-sm font-medium text-gray-500">{t('users.table.created')}</th>
                        <th className="text-center p-4 text-sm font-medium text-gray-500">{t('users.table.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="p-4">
                            <p className="font-medium text-gray-900">{user.name}</p>
                            {user._count?.projectSubmissions ? (
                              <p className="text-xs text-gray-500">{user._count.projectSubmissions} submissions</p>
                            ) : null}
                          </td>
                          <td className="p-4 text-gray-600">{user.email}</td>
                          <td className="p-4 text-gray-500">{user.organization || '-'}</td>
                          <td className="p-4 text-center">
                            <Badge
                              variant={user.role === 'ADMIN' ? 'danger' : user.role === 'PARTNER' ? 'info' : 'success'}
                              size="sm"
                            >
                              {t(`users.roles.${user.role}`)}
                            </Badge>
                          </td>
                          <td className="p-4 text-center text-gray-500 text-sm">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex gap-2 justify-center">
                              <Button variant="ghost" size="sm" onClick={() => openEditUser(user)}>
                                {t('common.edit')}
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleDeleteUser(user.id)}>
                                {t('common.delete')}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'mailingList' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold">Mailing List ({subscribers.filter(s => !s.unsubscribed).length})</h2>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={newSubscriberEmail}
                  onChange={(e) => setNewSubscriberEmail(e.target.value)}
                  placeholder="Add email..."
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubscriber()}
                />
                <Button onClick={handleAddSubscriber}>Add</Button>
              </div>
            </div>

            {isLoadingSubscribers ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : subscribers.filter(s => !s.unsubscribed).length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">No subscribers yet.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium text-gray-500">Email</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-500">Subscribed</th>
                        <th className="text-center p-4 text-sm font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {subscribers.filter(s => !s.unsubscribed).map((sub) => (
                        <tr key={sub.id} className="hover:bg-gray-50">
                          <td className="p-4 font-medium text-gray-900">{sub.email}</td>
                          <td className="p-4 text-gray-500 text-sm">
                            {new Date(sub.subscribedAt).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => handleRemoveSubscriber(sub.id)}
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const { isAuthenticated, isLoading, login, logout, isAdmin, role, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    } else if (!isLoading && isAuthenticated && !isAdmin()) {
      // Redirect non-admins to appropriate dashboard
      if (role === 'PARTNER' || role === 'NONPROFIT_MANAGER') {
        router.push('/partner')
      } else {
        router.push('/')
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, role, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cream-100)]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated || !isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cream-100)]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return <Dashboard onLogout={logout} userName={user?.name} />
}
