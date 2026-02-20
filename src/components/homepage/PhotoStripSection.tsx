'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'

const PHOTOS = [
  { src: 'https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748613968183.jpeg', location: 'Lviv' },
  { src: 'https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748344588928.jpeg', location: 'Vinnytsia Oblast' },
  { src: 'https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748466070782.jpeg', location: 'Dnipro' },
  { src: 'https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748586681372.jpeg', location: 'Chernihiv' },
  { src: 'https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748549701944.jpeg', location: 'Kyiv' },
  { src: 'https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748466072957.jpeg', location: 'Sumy Oblast' },
]

export function PhotoStripSection() {
  const t = useTranslations()

  // Duplicate for seamless loop
  const allPhotos = [...PHOTOS, ...PHOTOS.slice(0, 4)]

  return (
    <section className="fade-in-section py-12 bg-[var(--cream-100)] overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 lg:px-8 mb-8">
        <h3 className="text-[var(--navy-700)] text-xl font-semibold text-center">{t('homepage.photoStrip.title')}</h3>
      </div>

      <div className="relative overflow-hidden overscroll-x-contain" style={{ touchAction: 'pan-y pinch-zoom' }}>
        <div className="flex gap-4 animate-scroll">
          {allPhotos.map((photo, i) => (
            <div key={i} className="relative flex-shrink-0 w-72 h-48 rounded-lg overflow-hidden group">
              <Image
                src={photo.src}
                alt={`Project in ${photo.location}`}
                fill
                sizes="288px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-3 text-white text-sm font-medium">
                {photo.location}
              </div>
            </div>
          ))}
        </div>

        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[var(--cream-100)] to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[var(--cream-100)] to-transparent pointer-events-none" />
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-304px * 6)); }
        }
        .animate-scroll {
          animation: scroll 40s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  )
}
