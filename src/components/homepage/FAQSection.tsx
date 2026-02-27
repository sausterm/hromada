'use client'

import { useTranslations } from 'next-intl'
import { FAQItem } from '@/components/homepage/FAQItem'

const PARTNERS = [
  { name: 'Ecoaction', logo: '/partners/EcoactionLogo.png', url: 'https://en.ecoaction.org.ua/' },
  { name: 'Ecoclub', logo: '/partners/EcoclubLogo.png', url: 'https://ecoclubrivne.org/en/' },
  { name: 'RePower Ukraine', logo: '/partners/RePowerUkraineLogo.png', url: 'https://repowerua.org/' },
  { name: 'Greenpeace', logo: '/partners/greenpeacelogo.png', url: 'https://www.greenpeace.org/ukraine/en/' },
  { name: 'Energy Act For Ukraine', logo: '/partners/energyactukrainelogo.png', url: 'https://www.energyactua.com/' },
]

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
                <img src="/partners/prozorrologo.png" alt="Prozorro" className="h-7" />
              </a>
            </div>
          </FAQItem>
          <FAQItem question={t('homepage.faq.q3')}>
            {t('homepage.faq.a3')}
          </FAQItem>
          <FAQItem question={t('homepage.faq.q4')}>
            {t('homepage.faq.a4')}
            <div className="flex flex-wrap items-center gap-6 mt-4">
              {PARTNERS.map((p) => (
                <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" title={p.name} className="opacity-70 hover:opacity-100 transition-opacity">
                  <img src={p.logo} alt={p.name} className="h-8" />
                </a>
              ))}
            </div>
          </FAQItem>
          <FAQItem question={t('homepage.faq.q5')}>
            {t('homepage.faq.a5')}
          </FAQItem>
          <FAQItem question={t('homepage.faq.q6')}>
            {t('homepage.faq.a6')}
          </FAQItem>
        </div>
      </div>
    </section>
  )
}
