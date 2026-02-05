'use client'

import { useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'

// Redirect /transparency to /about since the pages have been merged
export default function TransparencyPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/about')
  }, [router])

  return null
}
