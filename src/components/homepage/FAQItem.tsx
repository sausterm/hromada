'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'

export function FAQItem({ question, children }: { question: string; children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState(0)

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [children])

  return (
    <div className="border-b border-[var(--cream-300)] last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left hover:text-[var(--navy-800)] transition-colors"
      >
        <span className="font-medium text-[var(--navy-700)] pr-4">{question}</span>
        <svg
          className={`w-5 h-5 flex-shrink-0 text-[var(--navy-400)] transition-transform duration-300 ease-out ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{
          maxHeight: isOpen ? `${contentHeight}px` : '0px',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div ref={contentRef} className="pb-4 text-[var(--navy-600)] leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  )
}
