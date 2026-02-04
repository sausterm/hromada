'use client'

import { useTranslations } from 'next-intl'

const partners = [
  { name: 'Ecoaction', logo: '/partners/EcoactionLogo.png' },
  { name: 'Ecoclub', logo: '/partners/EcoclubLogo.png' },
  { name: 'RePower Ukraine', logo: '/partners/RePowerUkraineLogo.png' },
  { name: 'Greenpeace', logo: '/partners/greenpeacelogo.png' },
]

export function PartnerCarousel() {
  const t = useTranslations()

  // Duplicate partners array for seamless infinite scroll
  const duplicatedPartners = [...partners, ...partners, ...partners, ...partners]

  return (
    <section className="bg-[var(--cream-100)] py-12 border-t border-[var(--cream-300)] overflow-hidden">
      <div className="container mx-auto px-4 mb-8">
        <h2 className="text-center text-lg font-semibold text-[var(--navy-600)]">
          {t('partners.title')}
        </h2>
      </div>

      {/* Carousel container */}
      <div className="relative">
        {/* Gradient masks for smooth edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[var(--cream-100)] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[var(--cream-100)] to-transparent z-10 pointer-events-none" />

        {/* Scrolling track */}
        <div className="flex animate-scroll">
          {duplicatedPartners.map((partner, index) => (
            <div
              key={`${partner.name}-${index}`}
              className="flex-shrink-0 mx-8 flex items-center justify-center"
              style={{ minWidth: '180px' }}
            >
              <img
                src={partner.logo}
                alt={partner.name}
                className="h-12 w-auto object-contain partner-logo-navy"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll {
          animation: scroll 30s linear infinite;
        }

        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  )
}
