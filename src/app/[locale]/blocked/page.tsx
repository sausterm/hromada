'use client'

import { useTranslations } from 'next-intl'

export default function BlockedPage() {
  const t = useTranslations('blocked')

  return (
    <div className="min-h-screen bg-[var(--cream-50)] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8 text-center border border-[var(--cream-300)]">
        {/* Icon */}
        <div className="mb-6">
          <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-[var(--navy-700)] mb-4">
          {t('title')}
        </h1>

        {/* Message */}
        <p className="text-lg text-[var(--navy-500)] mb-6">
          {t('message')}
        </p>

        {/* Additional info */}
        <div className="bg-[var(--cream-100)] rounded-lg p-6 text-left border border-[var(--cream-300)]">
          <h2 className="font-semibold text-[var(--navy-700)] mb-2">
            {t('reasonTitle')}
          </h2>
          <p className="text-sm text-[var(--navy-600)] mb-4">
            {t('reason')}
          </p>

          <h2 className="font-semibold text-[var(--navy-700)] mb-2">
            {t('vpnTitle')}
          </h2>
          <p className="text-sm text-[var(--navy-600)]">
            {t('vpnMessage')}
          </p>
        </div>
      </div>
    </div>
  )
}
