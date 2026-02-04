'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

const partners = [
  { name: 'Ecoaction', logo: '/partners/EcoactionLogo.png', url: 'https://en.ecoaction.org.ua/' },
  { name: 'Ecoclub', logo: '/partners/EcoclubLogo.png', url: 'https://ecoclubrivne.org/en/' },
  { name: 'RePower Ukraine', logo: '/partners/RePowerUkraineLogo.png', url: 'https://repowerua.org/' },
  { name: 'Greenpeace', logo: '/partners/greenpeacelogo.png', url: 'https://www.greenpeace.org/ukraine/en/' },
  { name: 'Energy Act For Ukraine', logo: '/partners/energyactukrainelogo.png', url: 'https://www.energyactua.com/' },
  { name: 'POCACITO', logo: '/partners/pocacitologo.png', url: 'https://www.pocacito.org/' },
]

export function PartnerCarousel() {
  const t = useTranslations()
  const trackRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)
  const positionRef = useRef(0)
  const singleSetWidthRef = useRef(0)

  // Triplicate for seamless loop (extra buffer prevents edge glitches)
  const duplicatedPartners = [...partners, ...partners, ...partners]

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    // Calculate width of one set of partners
    const calculateWidth = () => {
      const children = track.children
      let width = 0
      for (let i = 0; i < partners.length; i++) {
        const child = children[i] as HTMLElement
        if (child) {
          width += child.offsetWidth + 64 // 64px = mx-8 (32px each side)
        }
      }
      singleSetWidthRef.current = width
    }

    calculateWidth()
    window.addEventListener('resize', calculateWidth)

    let animationId: number
    const speed = 0.5 // pixels per frame

    const animate = () => {
      if (!isPaused && singleSetWidthRef.current > 0) {
        positionRef.current -= speed

        // Reset position seamlessly using modulo for smoother wrapping
        // This avoids the "jump" that can happen with a hard reset to 0
        if (Math.abs(positionRef.current) >= singleSetWidthRef.current) {
          positionRef.current = positionRef.current % singleSetWidthRef.current
        }

        if (track) {
          track.style.transform = `translateX(${positionRef.current}px)`
        }
      }
      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', calculateWidth)
    }
  }, [isPaused])

  return (
    <section className="bg-[var(--cream-100)] py-6 border-t border-[var(--cream-300)] overflow-hidden">
      <div className="container mx-auto px-4 mb-4">
        <h2 className="text-center text-lg font-semibold text-[var(--navy-600)]">
          {t('partners.title')}
        </h2>
      </div>

      {/* Carousel container */}
      <div
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Gradient masks for smooth edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[var(--cream-100)] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[var(--cream-100)] to-transparent z-10 pointer-events-none" />

        {/* Scrolling track */}
        <div
          ref={trackRef}
          className="flex items-center will-change-transform"
        >
          {duplicatedPartners.map((partner, index) => (
            <a
              key={`${partner.name}-${index}`}
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 mx-8 flex items-center justify-center hover:opacity-70 transition-opacity"
              style={{ minWidth: '180px' }}
            >
              <img
                src={partner.logo}
                alt={partner.name}
                className="h-12 w-auto object-contain"
                loading="lazy"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
