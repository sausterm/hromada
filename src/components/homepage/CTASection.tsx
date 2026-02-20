'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/Button'
import { EmailCaptureForm } from '@/components/homepage/EmailCaptureForm'

export function CTASection() {
  const t = useTranslations()

  return (
    <section className="fade-in-section py-16 md:py-24 bg-[var(--cream-100)]">
      <div className="max-w-3xl mx-auto px-4 lg:px-8 text-center">
        <h2 className="font-logo text-3xl md:text-4xl font-semibold tracking-tight text-[var(--navy-700)] mb-4">
          {t('homepage.cta.title')}
        </h2>
        <p className="text-lg text-[var(--navy-500)] mb-8">
          {t('homepage.cta.subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
          <Link href="/projects">
            <Button variant="primary" size="lg" className="min-w-[200px]">
              {t('homepage.cta.button')}
            </Button>
          </Link>
          <Link href="/about">
            <Button variant="outline" size="lg" className="min-w-[200px]">
              {t('homepage.hero.ctaHowItWorks')}
            </Button>
          </Link>
        </div>

        {/* Email capture */}
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[var(--cream-300)]" />
            <span className="text-sm text-[var(--navy-400)] font-medium">{t('homepage.cta.emailDivider')}</span>
            <div className="flex-1 h-px bg-[var(--cream-300)]" />
          </div>
          <EmailCaptureForm />
        </div>
      </div>
    </section>
  )
}
