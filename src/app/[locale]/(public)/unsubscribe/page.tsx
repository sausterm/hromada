'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/Header'

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success') === 'true'

  return (
    <main className="flex-1 max-w-2xl mx-auto px-4 py-16 text-center">
      {success ? (
        <>
          <h1 className="font-logo text-3xl font-semibold tracking-tight text-[var(--navy-700)] mb-6">
            You&apos;ve been unsubscribed
          </h1>
          <p className="text-[var(--navy-600)] text-lg">
            You will no longer receive newsletter emails from Hromada. If this was a mistake, you can re-subscribe at any time on our homepage.
          </p>
        </>
      ) : (
        <>
          <h1 className="font-logo text-3xl font-semibold tracking-tight text-[var(--navy-700)] mb-6">
            Unsubscribe
          </h1>
          <p className="text-[var(--navy-600)] text-lg">
            If you arrived here without clicking an unsubscribe link from an email, no action was taken. Check your email for a valid unsubscribe link.
          </p>
        </>
      )}
    </main>
  )
}

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen bg-[var(--cream-50)] flex flex-col">
      <Header />
      <Suspense fallback={
        <main className="flex-1 max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-[var(--navy-600)]">Loading...</p>
        </main>
      }>
        <UnsubscribeContent />
      </Suspense>
    </div>
  )
}
