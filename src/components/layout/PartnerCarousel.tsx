'use client'

import { useTranslations } from 'next-intl'
import { usePathname } from '@/i18n/navigation'
import { useEffect, useRef } from 'react'

const partners = [
  { name: 'Ecoaction', logo: '/partners/EcoactionLogo.png', url: 'https://en.ecoaction.org.ua/' },
  { name: 'Ecoclub', logo: '/partners/EcoclubLogo.png', url: 'https://ecoclubrivne.org/en/' },
  { name: 'RePower Ukraine', logo: '/partners/RePowerUkraineLogo.png', url: 'https://repowerua.org/' },
  { name: 'Greenpeace', logo: '/partners/greenpeacelogo.png', url: 'https://www.greenpeace.org/ukraine/en/' },
  { name: 'Energy Act For Ukraine', logo: '/partners/energyactukrainelogo.png', url: 'https://www.energyactua.com/', height: 'h-16', sectionHeight: 'h-18' },
  { name: 'POCACITO', logo: '/partners/pocacitologo.png', url: 'https://www.pocacito.org/' },
]

export function PartnerCarousel({ hideOnHomepage = false, variant = 'footer' }: { hideOnHomepage?: boolean; variant?: 'footer' | 'section' }) {
  const t = useTranslations()
  const pathname = usePathname()
  const trackRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const positionRef = useRef(0)
  const singleSetWidthRef = useRef(0)
  const isPausedRef = useRef(false)
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef(0)
  const dragStartPosRef = useRef(0)
  const hasDraggedRef = useRef(false)
  const animationIdRef = useRef<number>(0)
  const initializedRef = useRef(false)

  const duplicatedPartners = [...partners, ...partners, ...partners]

  const isHomepage = hideOnHomepage && pathname === '/'

  // Single effect that initializes when DOM is available
  useEffect(() => {
    if (isHomepage) {
      // Tear down if navigating back to homepage
      if (initializedRef.current) {
        cancelAnimationFrame(animationIdRef.current)
        initializedRef.current = false
        singleSetWidthRef.current = 0
        positionRef.current = 0
      }
      return
    }

    const track = trackRef.current
    const container = containerRef.current
    if (!track || !container) return

    // Already running — don't double-initialize
    if (initializedRef.current) return

    const calculateWidth = () => {
      const first = track.children[0] as HTMLElement | undefined
      const boundary = track.children[partners.length] as HTMLElement | undefined
      if (first && boundary) {
        singleSetWidthRef.current = boundary.offsetLeft - first.offsetLeft
      }
    }

    const wrapPosition = () => {
      const w = singleSetWidthRef.current
      if (w > 0) {
        while (positionRef.current <= -w) positionRef.current += w
        while (positionRef.current > 0) positionRef.current -= w
      }
    }

    const handleWheel = (e: WheelEvent) => {
      if (isPausedRef.current && singleSetWidthRef.current > 0 && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault()
        positionRef.current -= e.deltaX
        wrapPosition()
        track.style.transform = `translateX(${positionRef.current}px)`
      }
    }

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true
      dragStartRef.current = e.clientX
      dragStartPosRef.current = positionRef.current
      hasDraggedRef.current = false
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return
      e.preventDefault()
      const delta = e.clientX - dragStartRef.current
      if (Math.abs(delta) > 5) hasDraggedRef.current = true
      positionRef.current = dragStartPosRef.current + delta
      wrapPosition()
      track.style.transform = `translateX(${positionRef.current}px)`
    }

    const handleMouseUp = () => { isDraggingRef.current = false }

    const handleTouchStart = (e: TouchEvent) => {
      isDraggingRef.current = true
      dragStartRef.current = e.touches[0].clientX
      dragStartPosRef.current = positionRef.current
      hasDraggedRef.current = false
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return
      const delta = e.touches[0].clientX - dragStartRef.current
      if (Math.abs(delta) > 5) hasDraggedRef.current = true
      positionRef.current = dragStartPosRef.current + delta
      wrapPosition()
      track.style.transform = `translateX(${positionRef.current}px)`
    }

    const handleTouchEnd = () => { isDraggingRef.current = false }

    // Wait for layout to settle, then measure and start
    requestAnimationFrame(() => {
      calculateWidth()

      // If width still 0, retry once more after another frame
      if (singleSetWidthRef.current === 0) {
        requestAnimationFrame(() => {
          calculateWidth()
        })
      }
    })

    window.addEventListener('resize', calculateWidth)
    container.addEventListener('wheel', handleWheel, { passive: false })
    container.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: true })
    container.addEventListener('touchend', handleTouchEnd)

    const speed = 0.5
    const animate = () => {
      if (!isPausedRef.current && !isDraggingRef.current && singleSetWidthRef.current > 0) {
        positionRef.current -= speed
        wrapPosition()
        track.style.transform = `translateX(${positionRef.current}px)`
      }
      animationIdRef.current = requestAnimationFrame(animate)
    }
    animationIdRef.current = requestAnimationFrame(animate)
    initializedRef.current = true

    return () => {
      cancelAnimationFrame(animationIdRef.current)
      initializedRef.current = false
      window.removeEventListener('resize', calculateWidth)
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isHomepage])

  if (isHomepage) return null

  const isSection = variant === 'section'

  return (
    <section className={`bg-[var(--cream-100)] overflow-hidden ${isSection ? 'py-16 md:py-24' : 'py-6 border-t border-[var(--cream-300)]'}`}>
      <div className={`container mx-auto px-4 ${isSection ? 'mb-8' : 'mb-4'}`}>
        <h2 className={`text-center font-semibold text-[var(--navy-700)] ${isSection ? 'font-logo text-2xl md:text-3xl tracking-tight' : 'text-lg'}`}>
          {t('partners.title')}
        </h2>
      </div>

      <div
        ref={containerRef}
        className="relative cursor-grab active:cursor-grabbing"
        onMouseEnter={() => { isPausedRef.current = true }}
        onMouseLeave={() => { isPausedRef.current = false }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[var(--cream-100)] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[var(--cream-100)] to-transparent z-10 pointer-events-none" />

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
              className="flex-shrink-0 mx-8 flex items-center justify-center hover:opacity-70 transition-opacity select-none"
              style={{ minWidth: '180px' }}
              onClick={(e) => {
                if (hasDraggedRef.current) e.preventDefault()
              }}
              draggable={false}
            >
              <img
                src={partner.logo}
                alt={partner.name}
                className={`${isSection ? ((partner as any).sectionHeight || partner.height || 'h-14') : (partner.height || 'h-12')} w-auto object-contain pointer-events-none`}
                loading="lazy"
                draggable={false}
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
