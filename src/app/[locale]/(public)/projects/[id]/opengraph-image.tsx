import { ImageResponse } from 'next/og'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const alt = 'hromada project'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

interface RouteProps {
  params: Promise<{ id: string; locale: string }>
}

export default async function OgImage({ params }: RouteProps) {
  const { id, locale } = await params

  let title = 'Community Project'
  let municipality = ''
  let cost = ''
  let category = ''
  let photoUrl: string | null = null

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        facilityName: true,
        facilityNameUk: true,
        municipalityName: true,
        municipalityNameUk: true,
        estimatedCostUsd: true,
        category: true,
        region: true,
        photos: {
          orderBy: { sortOrder: 'asc' },
          take: 1,
          select: { url: true },
        },
      },
    })

    if (project) {
      const isUk = locale === 'uk'
      title = (isUk ? project.facilityNameUk : null) || project.facilityName
      municipality = (isUk ? project.municipalityNameUk : null) || project.municipalityName
      if (project.region) {
        municipality = `${municipality}, ${project.region}`
      }
      if (project.estimatedCostUsd) {
        cost = `$${Number(project.estimatedCostUsd).toLocaleString('en-US')}`
      }
      category = project.category
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c: string) => c.toUpperCase())
      photoUrl = project.photos[0]?.url || null
    }
  } catch (error) {
    console.error('Error fetching project for OG image:', error)
  }

  // Fetch the project photo if available
  let photoData: ArrayBuffer | null = null
  if (photoUrl) {
    try {
      const res = await fetch(photoUrl)
      if (res.ok) {
        photoData = await res.arrayBuffer()
      }
    } catch {
      // Fall back to no photo
    }
  }

  // Truncate long titles
  const displayTitle = title.length > 60 ? title.slice(0, 57) + '...' : title

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundColor: '#F5F1E8',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* Left: Photo or placeholder */}
        <div
          style={{
            width: photoData ? '480px' : '0px',
            height: '100%',
            display: 'flex',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {photoData && (
            <img
              // @ts-expect-error - ImageResponse supports ArrayBuffer src
              src={photoData}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          )}
        </div>

        {/* Right: Content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '48px',
          }}
        >
          {/* Top: Category badge */}
          <div style={{ display: 'flex' }}>
            {category && (
              <div
                style={{
                  display: 'flex',
                  backgroundColor: '#005BBB20',
                  color: '#005BBB',
                  fontSize: '18px',
                  fontWeight: 600,
                  padding: '6px 16px',
                  borderRadius: '6px',
                }}
              >
                {category}
              </div>
            )}
          </div>

          {/* Middle: Title + Municipality */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div
              style={{
                fontSize: photoData ? '36px' : '44px',
                fontWeight: 700,
                color: '#2C3E50',
                lineHeight: 1.2,
                letterSpacing: '-0.025em',
              }}
            >
              {displayTitle}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7C8F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <div style={{ fontSize: '20px', color: '#6B7C8F' }}>
                {municipality}
              </div>
            </div>
            {cost && (
              <div
                style={{
                  display: 'flex',
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#2C3E50',
                }}
              >
                {cost}
              </div>
            )}
          </div>

          {/* Bottom: Hromada branding */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="48" fill="#005BBB" />
                <circle cx="50" cy="50" r="20" fill="#FFD500" />
              </svg>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 600,
                  color: '#2C3E50',
                  letterSpacing: '-0.025em',
                }}
              >
                hromada
              </div>
            </div>
            <div style={{ fontSize: '16px', color: '#6B7C8F' }}>
              hromadaproject.org
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
