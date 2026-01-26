'use client'

import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'error'
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant = 'default', error, ...props }, ref) => {
    const baseStyles =
      'w-full rounded-lg border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 resize-none'

    const variants = {
      default:
        'border-gray-300 focus:border-[var(--ukraine-500)] focus:ring-[var(--ukraine-200)]',
      error: 'border-red-500 focus:border-red-500 focus:ring-red-200',
    }

    const inputVariant = error ? 'error' : variant

    return (
      <div>
        <textarea
          ref={ref}
          className={cn(
            baseStyles,
            variants[inputVariant],
            'px-4 py-3 text-sm min-h-[120px]',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
