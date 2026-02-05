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
  const [isPaused, setIsPaused] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const positionRef = useRef(0)
  const dragStartRef = useRef(0)
  const dragStartPosRef = useRef(0)
  const hasDraggedRef = useRef(false)

  // Show on production site and localhost, but NOT on demo site
  useEffect(() => {
    const hostname = window.location.hostname
    const showCarousel = hostname === 'localhost' ||
                         hostname === '127.0.0.1' ||
                         (hostname === 'hromadaproject.org' || hostname === 'www.hromadaproject.org')
    // Explicitly hide on demo subdomain
    const isDemo = hostname.startsWith('demo.')
    setIsVisible(showCarousel && !isDemo)
  }, [])
  const singleSetWidthRef = useRef(0)

  // Triplicate for seamless loop (extra buffer prevents edge glitches)
  const duplicatedPartners = [...partners, ...partners, ...partners]

  useEffect(() => {
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

    // Handle manual scroll when paused
    const handleWheel = (e: WheelEvent) => {
      if (isPaused && singleSetWidthRef.current > 0) {
        e.preventDefault()
        // Use deltaX for horizontal scroll, or deltaY if no horizontal movement
        const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY
        positionRef.current -= delta

        // Wrap position seamlessly
        if (Math.abs(positionRef.current) >= singleSetWidthRef.current) {
          positionRef.current = positionRef.current % singleSetWidthRef.current
        }
        if (positionRef.current > 0) {
          positionRef.current = positionRef.current - singleSetWidthRef.current
        }

        track.style.transform = `translateX(${positionRef.current}px)`
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false })

    // Handle drag start (mouse)
    const handleMouseDown = (e: MouseEvent) => {
      setIsDragging(true)
      dragStartRef.current = e.clientX
      dragStartPosRef.current = positionRef.current
      hasDraggedRef.current = false
    }

    // Handle drag move (mouse)
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      e.preventDefault()
      const delta = e.clientX - dragStartRef.current
      if (Math.abs(delta) > 5) {
        hasDraggedRef.current = true
      }
      positionRef.current = dragStartPosRef.current + delta

      // Wrap position seamlessly
      if (singleSetWidthRef.current > 0) {
        if (Math.abs(positionRef.current) >= singleSetWidthRef.current) {
          positionRef.current = positionRef.current % singleSetWidthRef.current
        }
        if (positionRef.current > 0) {
          positionRef.current = positionRef.current - singleSetWidthRef.current
        }
      }

      track.style.transform = `translateX(${positionRef.current}px)`
    }

    // Handle drag end (mouse)
    const handleMouseUp = () => {
      setIsDragging(false)
    }

    // Handle drag start (touch)
    const handleTouchStart = (e: TouchEvent) => {
      setIsDragging(true)
      dragStartRef.current = e.touches[0].clientX
      dragStartPosRef.current = positionRef.current
      hasDraggedRef.current = false
    }

    // Handle drag move (touch)
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return
      const delta = e.touches[0].clientX - dragStartRef.current
      if (Math.abs(delta) > 5) {
        hasDraggedRef.current = true
      }
      positionRef.current = dragStartPosRef.current + delta

      // Wrap position seamlessly
      if (singleSetWidthRef.current > 0) {
        if (Math.abs(positionRef.current) >= singleSetWidthRef.current) {
          positionRef.current = positionRef.current % singleSetWidthRef.current
        }
        if (positionRef.current > 0) {
          positionRef.current = positionRef.current - singleSetWidthRef.current
        }
      }

      track.style.transform = `translateX(${positionRef.current}px)`
    }

    // Handle drag end (touch)
    const handleTouchEnd = () => {
      setIsDragging(false)
    }

    container.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: true })
    container.addEventListener('touchend', handleTouchEnd)

    let animationId: number
    const speed = 0.5 // pixels per frame

    const animate = () => {
      if (!isPaused && !isDragging && singleSetWidthRef.current > 0) {
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
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isPaused, isDragging, isVisible])

  // Don't render on production site
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
