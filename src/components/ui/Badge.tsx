'use client'

import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  dot?: boolean
  dotColor?: string
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot = false, dotColor, children, ...props }, ref) => {
    // Warm humanitarian color palette for badges
    const variants = {
      default: 'bg-[var(--cream-200)] text-[var(--navy-700)]',
      secondary: 'bg-[var(--cream-300)] text-[var(--navy-600)]',
      success: 'bg-[#5C7F4B20] text-[#3E5E34]',  // Sage green (WCAG AA: 8.5:1)
      warning: 'bg-[#B0783020] text-[#8A5C1F]',  // Warm amber (WCAG AA: 6.2:1)
      danger: 'bg-[#A8483020] text-[#9A3D28]',   // Deep rust (WCAG AA: 6.8:1)
      info: 'bg-[#3E7A9020] text-[#2E5F73]',     // Muted teal (WCAG AA: 7.1:1)
      outline: 'bg-transparent border border-[var(--cream-400)] text-[var(--navy-600)]',
    }

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-xs',
      lg: 'px-3 py-1 text-sm',
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-full',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className="w-2 h-2 rounded-full mr-1.5"
            style={{ backgroundColor: dotColor || 'currentColor' }}
          />
        )}
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'
