'use client'

import { useState, useRef, useEffect } from 'react'
import { toast } from './Toast'

interface ShareButtonProps {
  projectId: string
  projectTitle: string
  projectDescription?: string
  variant?: 'icon' | 'button'
  className?: string
}

export function ShareButton({
  projectId,
  projectTitle,
  projectDescription,
  variant = 'icon',
  className = '',
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const [shareUrl, setShareUrl] = useState(`/projects/${projectId}`)

  useEffect(() => {
    setShareUrl(`${window.location.origin}/projects/${projectId}`)
  }, [projectId])

  const shareText = `${projectTitle} - Support this Ukrainian community project on Hromada`
  const shareDescription = projectDescription
    ? projectDescription.slice(0, 200) + (projectDescription.length > 200 ? '...' : '')
    : 'Help Ukrainian communities rebuild with direct infrastructure support.'

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied to clipboard!')
      setIsOpen(false)
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    window.open(url, '_blank', 'width=600,height=400')
    setIsOpen(false)
  }

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    window.open(url, '_blank', 'width=600,height=400')
    setIsOpen(false)
  }

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    window.open(url, '_blank', 'width=600,height=400')
    setIsOpen(false)
  }

  const handleShareEmail = () => {
    const subject = encodeURIComponent(shareText)
    const body = encodeURIComponent(`${shareDescription}\n\nLearn more: ${shareUrl}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className={`inline-flex items-center justify-center transition-colors ${
          variant === 'icon'
            ? 'h-8 w-8 rounded-full bg-[var(--cream-100)] hover:bg-[var(--cream-200)] text-[var(--navy-600)]'
            : 'gap-2 px-3 py-1.5 rounded-lg bg-[var(--navy-100)] hover:bg-[var(--navy-200)] text-[var(--navy-700)] text-sm font-medium'
        }`}
        aria-label="Share project"
        title="Share"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        {variant === 'button' && <span>Share</span>}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute right-0 bottom-full mb-2 w-48 rounded-lg bg-white shadow-lg border border-[var(--cream-300)] py-1 z-50"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCopyLink(); }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--navy-700)] hover:bg-[var(--cream-100)] transition-colors"
          >
            <svg className="h-4 w-4 text-[var(--navy-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
              />
            </svg>
            Copy link
          </button>

          <div className="border-t border-[var(--cream-200)] my-1" />

          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShareTwitter(); }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--navy-700)] hover:bg-[var(--cream-100)] transition-colors"
          >
            <svg className="h-4 w-4 text-[var(--navy-500)]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Share on X
          </button>

          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShareLinkedIn(); }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--navy-700)] hover:bg-[var(--cream-100)] transition-colors"
          >
            <svg className="h-4 w-4 text-[var(--navy-500)]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            Share on LinkedIn
          </button>

          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShareFacebook(); }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--navy-700)] hover:bg-[var(--cream-100)] transition-colors"
          >
            <svg className="h-4 w-4 text-[var(--navy-500)]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Share on Facebook
          </button>

          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShareEmail(); }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--navy-700)] hover:bg-[var(--cream-100)] transition-colors"
          >
            <svg className="h-4 w-4 text-[var(--navy-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Share via Email
          </button>
        </div>
      )}
    </div>
  )
}
