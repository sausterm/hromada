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
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const positionRef = useRef(0)
  const singleSetWidthRef = useRef(0)
  // Use refs instead of state to avoid closure issues in animation loop
  const isPausedRef = useRef(false)
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef(0)
  const dragStartPosRef = useRef(0)
  const hasDraggedRef = useRef(false)

  // Show on production site, demo site, and localhost
  useEffect(() => {
    const hostname = window.location.hostname
    const showCarousel = hostname === 'localhost' ||
                         hostname === '127.0.0.1' ||
                         hostname === 'hromadaproject.org' ||
                         hostname === 'www.hromadaproject.org' ||
                         hostname === 'demo.hromadaproject.org'
    setIsVisible(showCarousel)
  }, [])

  // Triplicate for seamless loop (extra buffer prevents edge glitches)
  const duplicatedPartners = [...partners, ...partners, ...partners]

  useEffect(() => {
    if (!isVisible) return

    const track = trackRef.current
    const container = containerRef.current
    if (!track || !container) return

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

    // Wrap position helper
    const wrapPosition = () => {
      if (singleSetWidthRef.current > 0) {
        if (Math.abs(positionRef.current) >= singleSetWidthRef.current) {
          positionRef.current = positionRef.current % singleSetWidthRef.current
        }
        if (positionRef.current > 0) {
          positionRef.current = positionRef.current - singleSetWidthRef.current
        }
      }
    }

    // Handle manual scroll when paused
    const handleWheel = (e: WheelEvent) => {
      if (isPausedRef.current && singleSetWidthRef.current > 0) {
        e.preventDefault()
        const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY
        positionRef.current -= delta
        wrapPosition()
        track.style.transform = `translateX(${positionRef.current}px)`
      }
    }

    // Handle drag start (mouse)
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true
      dragStartRef.current = e.clientX
      dragStartPosRef.current = positionRef.current
      hasDraggedRef.current = false
    }

    // Handle drag move (mouse)
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return
      e.preventDefault()
      const delta = e.clientX - dragStartRef.current
      if (Math.abs(delta) > 5) {
        hasDraggedRef.current = true
      }
      positionRef.current = dragStartPosRef.current + delta
      wrapPosition()
      track.style.transform = `translateX(${positionRef.current}px)`
    }

    // Handle drag end (mouse)
    const handleMouseUp = () => {
      isDraggingRef.current = false
    }

    // Handle drag start (touch)
    const handleTouchStart = (e: TouchEvent) => {
      isDraggingRef.current = true
      dragStartRef.current = e.touches[0].clientX
      dragStartPosRef.current = positionRef.current
      hasDraggedRef.current = false
    }

    // Handle drag move (touch)
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return
      const delta = e.touches[0].clientX - dragStartRef.current
      if (Math.abs(delta) > 5) {
        hasDraggedRef.current = true
      }
      positionRef.current = dragStartPosRef.current + delta
      wrapPosition()
      track.style.transform = `translateX(${positionRef.current}px)`
    }

    // Handle drag end (touch)
    const handleTouchEnd = () => {
      isDraggingRef.current = false
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    container.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: true })
    container.addEventListener('touchend', handleTouchEnd)

    let animationId: number
    const speed = 0.5 // pixels per frame

    const animate = () => {
      // Use refs so we always read the latest values
      if (!isPausedRef.current && !isDraggingRef.current && singleSetWidthRef.current > 0) {
        positionRef.current -= speed
        wrapPosition()
        track.style.transform = `translateX(${positionRef.current}px)`
      }
      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', calculateWidth)
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <section className="bg-[var(--cream-100)] py-6 border-t border-[var(--cream-300)] overflow-hidden">
      <div className="container mx-auto px-4 mb-4">
        <h2 className="text-center text-lg font-semibold text-[var(--navy-600)]">
          {t('partners.title')}
        </h2>
      </div>

      {/* Carousel container */}
      <div
        ref={containerRef}
        className="relative cursor-grab active:cursor-grabbing"
        onMouseEnter={() => { isPausedRef.current = true }}
        onMouseLeave={() => { isPausedRef.current = false }}
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
              className="flex-shrink-0 mx-8 flex items-center justify-center hover:opacity-70 transition-opacity select-none"
              style={{ minWidth: '180px' }}
              onClick={(e) => {
                if (hasDraggedRef.current) {
                  e.preventDefault()
                }
              }}
              draggable={false}
            >
              <img
                src={partner.logo}
                alt={partner.name}
                className="h-12 w-auto object-contain pointer-events-none"
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
