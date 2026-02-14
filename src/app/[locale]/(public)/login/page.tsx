'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function LoginPage() {
  const t = useTranslations()
  const router = useRouter()
  const { isAuthenticated, isLoading, role, login, getDashboardPath } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push(getDashboardPath())
    }
  }, [isAuthenticated, isLoading, router, getDashboardPath])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    if (!email.trim() || !password.trim()) {
      setError(t('login.emailPasswordRequired'))
      setIsSubmitting(false)
      return
    }

    const result = await login(email.trim(), password)

    if (result.success) {
      // Redirect based on role
      const dashboardPaths: Record<string, string> = {
        ADMIN: '/admin',
        NONPROFIT_MANAGER: '/nonprofit',
        PARTNER: '/partner',
        DONOR: '/donor',
      }
      router.push(dashboardPaths[result.role || ''] || '/')
    } else {
      setError(t('login.invalidCredentials'))
    }
    setIsSubmitting(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cream-100)]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--cream-100)] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('login.title')}</CardTitle>
          <p className="text-gray-500 text-sm mt-1">{t('login.subtitle')}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {t('login.email')}
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('login.emailPlaceholder')}
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                {t('login.password')}
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.passwordPlaceholder')}
                error={error}
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" fullWidth isLoading={isSubmitting}>
              {t('login.loginButton')}
            </Button>
          </form>
          <div className="mt-4 flex items-center justify-between">
            <Link href="/" className="text-sm text-[var(--ukraine-600)] hover:underline">
              {t('login.backToHome')}
            </Link>
            <Link href="/forgot-password" className="text-sm text-[var(--ukraine-600)] hover:underline">
              {t('login.forgotPassword')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
