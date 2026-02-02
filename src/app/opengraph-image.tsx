import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'hromada - Support Ukrainian renewable infrastructure'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f0e8',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Solar panel icon */}
        <svg
          width="200"
          height="200"
          viewBox="0 0 120 120"
          style={{ transform: 'rotate(-38deg)', marginBottom: '30px' }}
        >
          <rect x="12" y="30" width="96" height="60" rx="6" fill="#1a2744" />
          {/* Vertical lines */}
          <line x1="44" y1="30" x2="44" y2="90" stroke="#f5f0e8" strokeWidth="3" />
          <line x1="76" y1="30" x2="76" y2="90" stroke="#f5f0e8" strokeWidth="3" />
          {/* Horizontal line */}
          <line x1="12" y1="60" x2="108" y2="60" stroke="#f5f0e8" strokeWidth="3" />
          {/* Center nodes */}
          <circle cx="44" cy="60" r="5" fill="#f5f0e8" />
          <circle cx="76" cy="60" r="5" fill="#f5f0e8" />
          {/* Corner nodes */}
          <circle cx="12" cy="30" r="5" fill="#f5f0e8" />
          <circle cx="108" cy="30" r="5" fill="#f5f0e8" />
          <circle cx="12" cy="90" r="5" fill="#f5f0e8" />
          <circle cx="108" cy="90" r="5" fill="#f5f0e8" />
        </svg>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            fontSize: '72px',
            fontWeight: 700,
            color: '#1a2744',
            marginBottom: '20px',
          }}
        >
          hromada | громада
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: 'flex',
            fontSize: '32px',
            color: '#4a5568',
            textAlign: 'center',
            maxWidth: '900px',
          }}
        >
          Support Ukrainian renewable infrastructure recovery
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
