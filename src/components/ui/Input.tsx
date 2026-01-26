'use client'

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'error'
  inputSize?: 'sm' | 'md' | 'lg'
  leftAddon?: ReactNode
  rightAddon?: ReactNode
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant = 'default',
      inputSize = 'md',
      leftAddon,
      rightAddon,
      error,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'w-full rounded-lg border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0'

    const variants = {
      default:
        'border-gray-300 focus:border-[var(--ukraine-500)] focus:ring-[var(--ukraine-200)]',
      error:
        'border-red-500 focus:border-red-500 focus:ring-red-200',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-4 py-3 text-base',
    }

    const inputVariant = error ? 'error' : variant

    if (leftAddon || rightAddon) {
      return (
        <div className="relative">
          {leftAddon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              {leftAddon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              baseStyles,
              variants[inputVariant],
              sizes[inputSize],
              leftAddon && 'pl-10',
              rightAddon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightAddon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              {rightAddon}
            </div>
          )}
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
      )
    }

    return (
      <div>
        <input
          ref={ref}
          className={cn(baseStyles, variants[inputVariant], sizes[inputSize], className)}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
