'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { ProjectForm, type ProjectFormData } from '@/components/admin/ProjectForm'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { type Project } from '@/types'

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const { isAuthenticated, isLoading: authLoading, getAuthHeader } = useAdminAuth()
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
      const authHeader = getAuthHeader()
      if (!authHeader) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
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
    if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const authHeader = getAuthHeader()
      if (!authHeader) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          Authorization: authHeader,
        },
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
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h1>
        <Link href="/admin">
          <Button>Back to Dashboard</Button>
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
            ← Back to Dashboard
          </Link>
          <Button variant="danger" size="sm" onClick={handleDelete} disabled={isSubmitting}>
            Delete Project
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
