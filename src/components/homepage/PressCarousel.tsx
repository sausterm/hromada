'use client'

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'

const mediaItems = [
  {
    name: 'Politico',
    logo: '/press/politico.png',
    url: 'https://www.politico.eu/article/ukraine-support-green-recovery-solar-wind-power/',
    height: 'h-10',
  },
  {
    name: 'Mother Jones',
    logo: '/press/motherjones.jpeg',
    url: 'https://www.motherjones.com/politics/2026/02/putin-tried-to-freeze-ukraine-instead-he-sparked-an-energy-revolution/',
  },
  {
    name: 'Euronews',
    logo: '/press/euronews.svg',
    url: 'https://www.euronews.com/my-europe/2023/03/23/ngos-push-for-green-reconstruction-of-ukraine-so-infrastructure-can-weather-war-and-climat',
  },
  {
    name: 'Stimson Center',
    logo: '/press/stimson.png',
    url: 'https://www.newsecuritybeat.org/2023/03/security-broadcast-ecoactions-kostiantyn-krynytskyi-securing-ukraines-energy-future/',
  },
  {
    name: 'NBC News',
    logo: '/press/nbcnews.svg',
    url: 'https://www.nbcnews.com/science/environment/energy-grid-fire-ukraine-turn-small-scale-renewables-rcna72903',
  },
  {
    name: 'Heinrich Böll Stiftung',
    logo: '/press/boell.png',
    url: 'https://us.boell.org/en/2024/11/01/investors-once-again-asked-buy-ukrainian-renewable-energy',
  },
  {
    name: 'The Washington Post',
    logo: '/press/wapologo.png',
    url: 'https://www.washingtonpost.com/climate-solutions/2023/05/20/ukraine-solar-hospitals-attack-russia/',
  },
  {
    name: 'Euromaidan Press',
    logo: '/press/euromaidanpress.png',
    url: 'https://euromaidanpress.com/2022/04/28/russian-fossil-fuel-exports-to-eu-finances-war-with-ukraine/',
  },
  {
    name: 'Louisiana Illuminator',
    logo: '/press/louisianailluminator.png',
    url: 'https://lailluminator.com/2025/03/25/ukraine-louisiana/',
  },
  {
    name: 'Thomson Reuters Foundation',
    logo: '/press/thomsonreuters.png',
    url: 'https://news.trust.org/item/20220412163221-dexaq/',
  },
]

const duplicatedItems = [...mediaItems, ...mediaItems, ...mediaItems]

export function PressCarousel() {
  const t = useTranslations()
  const trackRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const positionRef = useRef(0)
  const singleSetWidthRef = useRef(0)
  const isPausedRef = useRef(false)
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef(0)
  const dragStartPosRef = useRef(0)
  const hasDraggedRef = useRef(false)

  useEffect(() => {
    const track = trackRef.current
    const container = containerRef.current
    if (!track || !container) return

    const calculateWidth = () => {
      const first = track.children[0] as HTMLElement | undefined
      const boundary = track.children[mediaItems.length] as HTMLElement | undefined
      if (first && boundary) {
        singleSetWidthRef.current = boundary.offsetLeft - first.offsetLeft
      }
    }

    // Recalculate whenever images load or layout shifts
    const images = track.querySelectorAll('img')
    const onImageLoad = () => calculateWidth()
    images.forEach((img) => {
      if (!img.complete) img.addEventListener('load', onImageLoad)
    })

    // ResizeObserver catches layout shifts more reliably than a single rAF
    const resizeObserver = new ResizeObserver(() => calculateWidth())
    resizeObserver.observe(track)

    requestAnimationFrame(() => calculateWidth())
    window.addEventListener('resize', calculateWidth)

    const wrapPosition = () => {
      const w = singleSetWidthRef.current
      if (w > 0) {
        // Keep position in the range [-w, 0) for seamless looping
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

    container.addEventListener('wheel', handleWheel, { passive: false })
    container.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: true })
    container.addEventListener('touchend', handleTouchEnd)

    let animationId: number
    const speed = 0.5

    const animate = () => {
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
      resizeObserver.disconnect()
      images.forEach((img) => img.removeEventListener('load', onImageLoad))
      window.removeEventListener('resize', calculateWidth)
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  return (
    <section className="py-16 md:py-24 bg-[var(--cream-100)] overflow-hidden">
      <div className="container mx-auto px-4 mb-8">
        <h2 className="font-logo text-2xl md:text-3xl font-semibold tracking-tight text-[var(--navy-700)] text-center">
          {t('homepage.press.title')}
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
          {duplicatedItems.map((item, index) => (
            <a
              key={`${item.name}-${index}`}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 mx-8 flex items-center justify-center hover:opacity-50 transition-opacity select-none"
              style={{ minWidth: '160px' }}
              onClick={(e) => {
                if (hasDraggedRef.current) e.preventDefault()
              }}
              draggable={false}
            >
              <img
                src={item.logo}
                alt={item.name}
                className={`${(item as any).height || 'h-14'} w-auto object-contain pointer-events-none`}
                draggable={false}
              />
            </a>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-[var(--navy-300)] text-center mt-6 px-4">
        Logos are trademarks of their respective owners, used to identify coverage of our partners&apos; work.
      </p>
    </section>
  )
}
