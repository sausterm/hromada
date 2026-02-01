import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 180,
  height: 180,
}

export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f0e8',
          borderRadius: '20%',
        }}
      >
        {/* Solar panel icon */}
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          style={{ transform: 'rotate(-38deg)' }}
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
      </div>
    ),
    {
      ...size,
    }
  )
}
