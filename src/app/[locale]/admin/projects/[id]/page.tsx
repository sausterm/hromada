'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { ProjectForm, type ProjectFormData } from '@/components/admin/ProjectForm'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { type Project } from '@/types'

export default function EditProjectPage() {
  const t = useTranslations()
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const { isAuthenticated, isLoading: authLoading } = useAdminAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`)
        if (!response.ok) {
          throw new Error('Project not found')
        }
        const data = await response.json()
        setProject(data.project)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load project')
      } finally {
        setIsLoading(false)
      }
    }

    if (projectId) {
      fetchProject()
    }
  }, [projectId])

  const handleSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Cookies are sent automatically for authentication
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to update project')
      }

      router.push('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(t('admin.projects.confirmDelete'))) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Cookies are sent automatically for authentication
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to delete project')
      }

      router.push('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    router.push('/admin')
    return null
  }

  if (!project && !isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('admin.projects.notFound')}</h1>
        <Link href="/admin">
          <Button>{t('admin.projects.backToDashboard')}</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/admin" className="text-[var(--ukraine-600)] hover:underline text-sm">
            {t('admin.projects.backToDashboard')}
          </Link>
          <Button variant="danger" size="sm" onClick={handleDelete} disabled={isSubmitting}>
            {t('admin.projects.deleteProject')}
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <ProjectForm
          project={project}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/admin')}
          isLoading={isSubmitting}
        />
      </div>
    </div>
  )
}
