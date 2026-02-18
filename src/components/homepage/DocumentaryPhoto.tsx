'use client'

import { useState } from 'react'
import Image from 'next/image'

export function DocumentaryPhoto({
  src,
  alt,
  caption,
  location
}: {
  src: string
  alt: string
  caption: string
  location?: string
}) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <figure className="relative">
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[var(--cream-200)]">
        <Image
          src={src}
          alt={alt}
          fill
          className={`object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        {location && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
            <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            {location}
          </div>
        )}
      </div>
      <figcaption className="mt-3 text-sm text-[var(--navy-500)] italic">{caption}</figcaption>
    </figure>
  )
}
