'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

export function EmailCaptureForm() {
  const t = useTranslations()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (res.ok) {
        setStatus('success')
        setEmail('')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center justify-center gap-2 text-green-700 bg-green-50 rounded-xl px-4 py-3">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm font-medium">{t('homepage.cta.emailSuccess')}</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t('homepage.cta.emailPlaceholder')}
        className="flex-1 min-w-0 px-4 py-2.5 rounded-lg border border-[var(--cream-300)] bg-white text-[var(--navy-700)] text-sm placeholder:text-[var(--navy-400)] focus:outline-none focus:ring-2 focus:ring-[var(--navy-300)] focus:border-transparent"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-5 py-2.5 rounded-lg bg-[var(--navy-700)] text-white text-sm font-medium hover:bg-[var(--navy-800)] transition-colors disabled:opacity-50 whitespace-nowrap"
      >
        {status === 'loading' ? '...' : t('homepage.cta.emailButton')}
      </button>
      {status === 'error' && (
        <div className="absolute mt-12 text-xs text-red-600">{t('homepage.cta.emailError')}</div>
      )}
    </form>
  )
}
