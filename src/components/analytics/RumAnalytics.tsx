'use client'

import { useEffect } from 'react'

export function RumAnalytics() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    // Only run in production
    if (window.location.hostname === 'localhost') return

    async function initRum() {
      try {
        const { AwsRum } = await import('aws-rum-web')
        new AwsRum(
          '3a84872b-7a95-40af-91e3-2ee490bf1e11', // App Monitor ID
          '1.0.0',
          'us-east-1',
          {
            sessionSampleRate: 1,
            identityPoolId: 'us-east-1:2da183c4-068b-4ee9-b5a7-bf98db51a779',
            endpoint: 'https://dataplane.rum.us-east-1.amazonaws.com',
            telemetries: ['performance', 'errors', 'http'],
            allowCookies: false,
            enableXRay: false,
          }
        )
      } catch {
        // Silently fail — analytics should never break the site
      }
    }

    initRum()
  }, [])

  return null
}
