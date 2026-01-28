'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { ProjectForm, type ProjectFormData } from '@/components/admin/ProjectForm'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function NewProjectPage() {
  const t = useTranslations()
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, getAuthHeader } = useAdminAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const authHeader = getAuthHeader()
      if (!authHeader) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to create project')
      }

      router.push('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/admin" className="text-[var(--ukraine-600)] hover:underline text-sm">
            {t('admin.projects.backToDashboard')}
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <ProjectForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/admin')}
          isLoading={isSubmitting}
          authHeader={getAuthHeader()}
        />
      </div>
    </div>
  )
}
