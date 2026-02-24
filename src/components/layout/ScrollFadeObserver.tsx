'use client'

import { useEffect } from 'react'

export function ScrollFadeObserver() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )

    function observeAll() {
      document.querySelectorAll('.fade-in-section:not(.is-visible)').forEach((el) => {
        observer.observe(el)
      })
    }

    observeAll()

    // Watch for new elements added during SPA navigation
    const mutationObserver = new MutationObserver(() => {
      observeAll()
    })

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      observer.disconnect()
      mutationObserver.disconnect()
    }
  }, [])

  return null
}
