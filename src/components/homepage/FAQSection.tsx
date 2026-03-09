'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { FAQItem } from '@/components/homepage/FAQItem'

export function FAQSection() {
  const t = useTranslations()

  return (
    <section className="fade-in-section py-16 md:py-24 bg-[var(--cream-100)]">
      <div className="max-w-3xl mx-auto px-4 lg:px-8">
        <h2 className="font-logo text-2xl md:text-3xl font-semibold tracking-tight text-[var(--navy-700)] text-center mb-12">
          {t('homepage.faq.title')}
        </h2>

        <div>
          <FAQItem question={t('homepage.faq.q1')}>
            {t('homepage.faq.a1')}
          </FAQItem>
          <FAQItem question={t('homepage.faq.q2')}>
            {t('homepage.faq.a2')}
            <div className="mt-4">
              <a href="https://prozorro.gov.ua" target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity inline-block">
                <Image src="/partners/prozorrologo.png" alt="Prozorro" width={112} height={28} className="h-7 w-auto" />
              </a>
            </div>
          </FAQItem>
          <FAQItem question={t('homepage.faq.q4')}>
            {t('homepage.faq.a4')}
          </FAQItem>
          <FAQItem question={t('homepage.faq.q5')}>
            {t('homepage.faq.a5')}
          </FAQItem>
        </div>
      </div>
    </section>
  )
}
