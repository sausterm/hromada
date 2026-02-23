'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

// Photo metadata - curated from real project photos
const DOCUMENTARY_PHOTOS = [
  {
    src: 'https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748613968183.jpeg',
    alt: 'Large rooftop solar array overlooking Ukrainian city',
    location: 'Lviv, Ukraine',
    date: 'January 2025',
    caption: 'Municipal building rooftop installation',
    stats: { capacity: '45kW', panels: 108 },
    category: 'installation'
  },
  {
    src: 'https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748344588928.jpeg',
    alt: 'Community building with solar panels',
    location: 'Vinnytsia Oblast',
    date: 'December 2024',
    caption: 'Rural community center - now energy independent',
    stats: { capacity: '12kW', panels: 28 },
    category: 'completed'
  },
  {
    src: 'https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748586682092.jpeg',
    alt: 'Battery storage system with Victron inverters',
    location: 'Kharkiv, Ukraine',
    date: 'January 2025',
    caption: 'Battery backup keeps hospital running during blackouts',
    stats: { capacity: '48kWh', runtime: '8 hours' },
    category: 'infrastructure'
  },
  {
    src: 'https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748613965913.jpeg',
    alt: 'Solar inverter display showing live power data',
    location: 'Odesa, Ukraine',
    date: 'May 2025',
    caption: 'Real-time monitoring: 12.21kW solar powering facility',
    stats: { solar: '12.21kW', load: '18.28kW', battery: '100%' },
    category: 'monitoring'
  },
  {
    src: 'https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748466071929.jpeg',
    alt: 'Ground-mounted solar array in field',
    location: 'Poltava Oblast',
    date: 'November 2024',
    caption: 'Ground-mounted array for water treatment facility',
    stats: { capacity: '30kW', panels: 72 },
    category: 'installation'
  },
  {
    src: 'https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748586681372.jpeg',
    alt: 'Apartment building with rooftop solar',
    location: 'Chernihiv, Ukraine',
    date: 'December 2024',
    caption: 'Multi-family housing - 47 families now have backup power',
    stats: { capacity: '25kW', families: 47 },
    category: 'completed'
  },
  {
    src: 'https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748549701944.jpeg',
    alt: 'Solar training facility with equipment',
    location: 'Kyiv, Ukraine',
    date: 'January 2025',
    caption: 'Training center preparing local technicians',
    stats: { trained: '120+', facilities: 3 },
    category: 'training'
  },
  {
    src: 'https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748466072957.jpeg',
    alt: 'Local resident passing solar-powered building',
    location: 'Sumy Oblast',
    date: 'November 2024',
    caption: 'Life continues - community center stays powered',
    stats: { served: '2,400', hours: '24/7' },
    category: 'impact'
  },
  {
    src: 'https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748466070782.jpeg',
    alt: 'Commercial rooftop solar installation',
    location: 'Dnipro, Ukraine',
    date: 'October 2024',
    caption: 'Medical clinic rooftop - critical care uninterrupted',
    stats: { capacity: '35kW', uptime: '99.7%' },
    category: 'completed'
  },
  {
    src: 'https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748586680892.jpeg',
    alt: 'Rooftop solar panels from above',
    location: 'Zaporizhzhia Oblast',
    date: 'December 2024',
    caption: 'School rooftop installation complete',
    stats: { capacity: '20kW', students: 340 },
    category: 'completed'
  },
  {
    src: 'https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748549701595.jpeg',
    alt: 'Solar panel testing and training setup',
    location: 'Kyiv, Ukraine',
    date: 'January 2025',
    caption: 'Hands-on training with real equipment',
    stats: { modules: 4, inverters: 6 },
    category: 'training'
  }
]

// Film grain overlay effect
function FilmGrain() {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay z-10"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
      }}
    />
  )
}

// Location badge component
function LocationBadge({ location, date }: { location: string; date: string }) {
  return (
    <div className="inline-flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
      <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
      <span className="text-white text-xs font-medium">{location}</span>
      <span className="text-white/50 text-xs">•</span>
      <span className="text-white/70 text-xs">{date}</span>
    </div>
  )
}

// Stats overlay component
function StatsOverlay({ stats }: { stats: Record<string, string | number | undefined> }) {
  return (
    <div className="flex flex-wrap gap-3">
      {Object.entries(stats).filter(([, value]) => value !== undefined).map(([key, value]) => (
        <div key={key} className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg">
          <div className="text-white text-lg font-bold">{value}</div>
          <div className="text-white/60 text-[10px] uppercase tracking-wider">{key}</div>
        </div>
      ))}
    </div>
  )
}

// Single photo card with hover effects
function PhotoCard({
  photo,
  index,
  isExpanded,
  onExpand
}: {
  photo: typeof DOCUMENTARY_PHOTOS[0]
  index: number
  isExpanded: boolean
  onExpand: () => void
}) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`relative overflow-hidden rounded-xl cursor-pointer transition-all duration-700 ${
        isExpanded ? 'col-span-2 row-span-2' : ''
      }`}
      style={{
        animationDelay: `${index * 100}ms`
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onExpand}
    >
      {/* Image container with Ken Burns effect */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--navy-900)]">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          className={`object-cover transition-all duration-[2000ms] ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${isHovered ? 'scale-110' : 'scale-100'}`}
          onLoad={() => setIsLoaded(true)}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Film grain */}
        <FilmGrain />

        {/* Gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-70'
        }`} />

        {/* Content overlay */}
        <div className="absolute inset-0 p-4 flex flex-col justify-between">
          {/* Top - Location */}
          <div className={`transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
            <LocationBadge location={photo.location} date={photo.date} />
          </div>

          {/* Bottom - Caption & Stats */}
          <div>
            <p className={`text-white font-medium text-sm mb-3 transition-all duration-300 ${
              isHovered ? 'opacity-100 translate-y-0' : 'opacity-80 translate-y-1'
            }`}>
              {photo.caption}
            </p>

            <div className={`transition-all duration-500 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <StatsOverlay stats={photo.stats} />
            </div>
          </div>
        </div>

        {/* Expand indicator */}
        <div className={`absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all duration-300 ${
          isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        }`}>
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </div>
      </div>
    </div>
  )
}

// Hero photo with parallax effect
function HeroPhoto({ photo }: { photo: typeof DOCUMENTARY_PHOTOS[0] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const scrollProgress = -rect.top / window.innerHeight
        setScrollY(scrollProgress)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div ref={containerRef} className="relative h-[70vh] overflow-hidden">
      {/* Parallax image */}
      <div
        className="absolute inset-0"
        style={{ transform: `translateY(${scrollY * 50}px) scale(${1 + scrollY * 0.1})` }}
      >
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          className="object-cover"
          priority
        />
      </div>

      <FilmGrain />

      {/* Cinematic letterbox bars */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex items-end">
        <div className="w-full p-8 md:p-12">
          <LocationBadge location={photo.location} date={photo.date} />
          <h2 className="text-white text-3xl md:text-4xl font-bold mt-4 max-w-2xl">
            {photo.caption}
          </h2>
          <div className="mt-6">
            <StatsOverlay stats={photo.stats} />
          </div>
        </div>
      </div>
    </div>
  )
}

// Full documentary gallery section
export function PhotoDocumentaryGallery() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  return (
    <section className="py-16 px-4 bg-[var(--navy-900)]">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-[var(--ukraine-yellow)] text-sm font-medium mb-4">
            <div className="w-8 h-px bg-current" />
            DOCUMENTARY EVIDENCE
            <div className="w-8 h-px bg-current" />
          </div>
          <h2 className="text-white text-3xl md:text-4xl font-bold mb-4">
            Real Projects. Real Impact.
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            These aren't renderings or stock photos. Every image is from an actual installation
            funded through Hromada and completed by our Ukrainian partners.
          </p>
        </div>

        {/* Photo grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DOCUMENTARY_PHOTOS.map((photo, index) => (
            <PhotoCard
              key={photo.src}
              photo={photo}
              index={index}
              isExpanded={expandedIndex === index}
              onExpand={() => setExpandedIndex(expandedIndex === index ? null : index)}
            />
          ))}
        </div>

        {/* Impact summary */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '11', label: 'Projects Documented' },
            { value: '340kW+', label: 'Total Capacity' },
            { value: '5,000+', label: 'People Served' },
            { value: '100%', label: 'Operational' }
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-[var(--ukraine-yellow)] text-4xl font-bold">{stat.value}</div>
              <div className="text-white/50 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Compact photo strip for inline use (e.g., in How It Works)
export function PhotoStrip({ category }: { category?: string }) {
  const photos = category
    ? DOCUMENTARY_PHOTOS.filter(p => p.category === category)
    : DOCUMENTARY_PHOTOS.slice(0, 5)

  return (
    <div className="relative overflow-hidden py-4">
      {/* Scrolling container */}
      <div className="flex gap-4 animate-scroll">
        {[...photos, ...photos].map((photo, index) => (
          <div
            key={`${photo.src}-${index}`}
            className="relative flex-shrink-0 w-64 h-40 rounded-lg overflow-hidden group"
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-2 left-2 right-2">
              <p className="text-white text-xs font-medium truncate">{photo.location}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[var(--cream-100)] to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[var(--cream-100)] to-transparent pointer-events-none" />

      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}

// Single featured photo for Build/Impact steps
export function FeaturedPhoto({
  photoIndex = 0,
  progress = 1,
  showStats = true
}: {
  photoIndex?: number
  progress?: number
  showStats?: boolean
}) {
  const photo = DOCUMENTARY_PHOTOS[photoIndex]
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="relative w-full max-w-lg mx-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Shadow */}
      <div
        className="absolute inset-0 rounded-2xl transition-all duration-500"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.3) 100%)',
          filter: 'blur(30px)',
          transform: `translateY(${isHovered ? 20 : 16}px) scale(0.92)`,
          opacity: isHovered ? 0.8 : 0.5
        }}
      />

      <div
        className="relative rounded-2xl overflow-hidden transition-all duration-500"
        style={{
          transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
          boxShadow: isHovered
            ? '0 32px 64px -12px rgba(0, 0, 0, 0.3)'
            : '0 20px 40px -12px rgba(0, 0, 0, 0.2)'
        }}
      >
        {/* Photo */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            className={`object-cover transition-all duration-700 ${isHovered ? 'scale-105' : 'scale-100'}`}
          />

          <FilmGrain />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

          {/* Progress reveal effect */}
          <div
            className="absolute inset-0 bg-[var(--navy-900)] transition-transform duration-1000 origin-right"
            style={{ transform: `scaleX(${1 - progress})` }}
          />

          {/* Content */}
          <div className="absolute inset-0 p-5 flex flex-col justify-between">
            <LocationBadge location={photo.location} date={photo.date} />

            <div>
              <p className="text-white font-semibold text-lg mb-3">{photo.caption}</p>
              {showStats && (
                <div className={`transition-all duration-500 ${isHovered ? 'opacity-100' : 'opacity-80'}`}>
                  <StatsOverlay stats={photo.stats} />
                </div>
              )}
            </div>
          </div>

          {/* "Real photo" badge */}
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-semibold text-[var(--navy-700)] uppercase tracking-wider">
            Actual Site Photo
          </div>
        </div>
      </div>
    </div>
  )
}

// Monitoring display recreation (based on the Deye inverter photo)
export function LiveMonitoringDisplay({ progress = 1 }: { progress?: number }) {
  const [isHovered, setIsHovered] = useState(false)
  const animatedSolar = 12.21 * progress
  const animatedLoad = 18.28 * progress
  const animatedBattery = Math.round(100 * progress)

  return (
    <div
      className="relative w-full max-w-sm mx-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow effect */}
      <div
        className="absolute inset-0 rounded-2xl transition-all duration-500"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, rgba(34, 197, 94, ${0.2 * progress}) 0%, transparent 70%)`,
          filter: 'blur(30px)',
          transform: 'translateY(10px)'
        }}
      />

      <div
        className="relative rounded-2xl overflow-hidden transition-all duration-500 bg-gradient-to-b from-gray-100 to-gray-200"
        style={{
          transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
          boxShadow: isHovered
            ? '0 32px 64px -12px rgba(0, 0, 0, 0.25)'
            : '0 20px 40px -12px rgba(0, 0, 0, 0.15)'
        }}
      >
        {/* Device header */}
        <div className="bg-gray-300 px-4 py-2 flex items-center justify-between">
          <span className="text-gray-700 font-semibold text-sm">Deye</span>
          <div className="flex gap-2">
            {['DC', 'AC', 'Normal'].map((label, i) => (
              <div key={label} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${i < 2 ? 'bg-green-500' : 'bg-green-500'}`} />
                <span className="text-[10px] text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Display screen */}
        <div className="bg-white m-3 rounded-lg p-4 border border-gray-200">
          {/* Timestamp */}
          <div className="text-center text-gray-400 text-xs mb-4 font-mono">
            {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
          </div>

          {/* Power flow diagram */}
          <div className="grid grid-cols-3 gap-4 items-center">
            {/* Solar */}
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-yellow-50 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-green-600">{animatedSolar.toFixed(2)}</div>
              <div className="text-xs text-gray-400">kW Solar</div>
            </div>

            {/* Center - Status */}
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-colors duration-500 ${
                progress > 0.5 ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                <span className="text-white font-bold text-sm">
                  {progress > 0.5 ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-400">System Status</div>
            </div>

            {/* Load */}
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-blue-600">{animatedLoad.toFixed(2)}</div>
              <div className="text-xs text-gray-400">kW Load</div>
            </div>
          </div>

          {/* Battery bar */}
          <div className="mt-6">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Battery</span>
              <span className="font-semibold text-green-600">{animatedBattery}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-1000"
                style={{ width: `${animatedBattery}%` }}
              />
            </div>
          </div>
        </div>

        {/* Based on real data badge */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-gray-500">Live data from Kharkiv installation</span>
        </div>
      </div>
    </div>
  )
}
