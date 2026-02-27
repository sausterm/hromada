'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Link, useRouter } from '@/i18n/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { PublicImageUpload } from '@/components/forms/PublicImageUpload'

export default function PartnerPostUpdatePage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const { isAuthenticated, isLoading: authLoading, isPartner } = useAuth()

  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState<'MANUAL' | 'PHOTO_ADDED'>('MANUAL')
  const [photos, setPhotos] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  // Auth redirect
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login')
      } else if (!isPartner()) {
        router.push('/')
      }
    }
  }, [authLoading, isAuthenticated, isPartner, router])

  // Verify partner has access to this project
  useEffect(() => {
    if (authLoading || !isAuthenticated || !isPartner()) return

    async function verifyAccess() {
      try {
        const res = await fetch('/api/partner/projects')
        if (res.ok) {
          const data = await res.json()
          const hasSubmission = (data.submissions || []).some(
            (s: { approvedProjectId: string | null }) => s.approvedProjectId === projectId
          )
          setHasAccess(hasSubmission)
        }
      } catch {
        setHasAccess(false)
      } finally {
        setIsVerifying(false)
      }
    }
    verifyAccess()
  }, [authLoading, isAuthenticated, isPartner, projectId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim() || !message.trim()) {
      setError('Title and message are required.')
      return
    }

    setIsSubmitting(true)
    try {
      const body: Record<string, string> = { title, message, type }
      if (type === 'PHOTO_ADDED' && photos[0]) {
        body.photoUrl = photos[0]
      }

      const res = await fetch(`/api/projects/${projectId}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to post update')
      }

      router.push('/partner')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading || isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cream-100)]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated || !isPartner()) return null

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[var(--cream-100)] flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600 mb-4">You do not have access to post updates for this project.</p>
            <Link href="/partner">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--cream-100)]">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-[var(--ukraine-600)]">
            hromada
          </Link>
          <Link href="/partner">
            <Button variant="ghost">Back to Dashboard</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Post Project Update</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Type selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Update Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as 'MANUAL' | 'PHOTO_ADDED')}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ukraine-200)] focus:border-[var(--ukraine-500)]"
                >
                  <option value="MANUAL">Status Update</option>
                  <option value="PHOTO_ADDED">Photo Update</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title * <span className="text-gray-400 font-normal">({title.length}/200)</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Equipment delivered to site"
                  maxLength={200}
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message * <span className="text-gray-400 font-normal">({message.length}/2000)</span>
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe the update for donors..."
                  rows={5}
                  maxLength={2000}
                />
              </div>

              {/* Photo upload (only for photo updates) */}
              {type === 'PHOTO_ADDED' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                  <PublicImageUpload
                    images={photos}
                    onChange={setPhotos}
                    maxImages={1}
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="submit" isLoading={isSubmitting} loadingText="Posting...">
                  Post Update
                </Button>
                <Link href="/partner">
                  <Button type="button" variant="ghost">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
