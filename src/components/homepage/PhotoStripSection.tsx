'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'

const PHOTOS = [
  'https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748613968183.jpeg',
  'https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748466070782.jpeg',
  'https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748586681372.jpeg',
  'https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748549701944.jpeg',
  'https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748466072957.jpeg',
]

export function PhotoStripSection() {
  const t = useTranslations()

  // Duplicate for seamless loop
  const allPhotos = [...PHOTOS, ...PHOTOS.slice(0, 4)]

  return (
    <section className="fade-in-section py-16 md:py-24 bg-[var(--cream-100)] overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 lg:px-8 mb-8">
        <h2 className="text-[var(--navy-700)] text-xl font-semibold text-center">{t('homepage.photoStrip.title')}</h2>
      </div>

      <div className="relative overflow-hidden overscroll-x-contain" style={{ touchAction: 'pan-y pinch-zoom' }}>
        <div className="flex gap-4 animate-scroll">
          {allPhotos.map((src, i) => (
            <div key={i} className="relative flex-shrink-0 w-72 h-48 rounded-lg overflow-hidden group">
              <Image
                src={src}
                alt="Completed project"
                fill
                sizes="288px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          ))}
        </div>

        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[var(--cream-100)] to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[var(--cream-100)] to-transparent pointer-events-none" />
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-304px * 5)); }
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
