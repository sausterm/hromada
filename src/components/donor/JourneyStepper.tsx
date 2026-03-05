'use client'

import { JOURNEY_STEPS, getCompletedStepCount } from '@/lib/donor-constants'

interface JourneyStepperProps {
  status: string
  hasProzorroUpdates?: boolean
  hasPhotoUpdates?: boolean
  compact?: boolean
}

export function JourneyStepper({ status, hasProzorroUpdates, hasPhotoUpdates, compact }: JourneyStepperProps) {
  const completedCount = getCompletedStepCount(status, {
    hasProzorro: hasProzorroUpdates,
    hasPhotos: hasPhotoUpdates,
  })

  // Hide stepper for failed/refunded
  if (completedCount < 0) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        {status === 'REFUNDED'
          ? 'This donation has been refunded.'
          : 'There was an issue with this donation. Please contact us.'}
      </div>
    )
  }

  return (
    <div className={compact ? 'space-y-0' : 'space-y-0'}>
      {JOURNEY_STEPS.map((step, index) => {
        const isCompleted = step.number <= completedCount
        const isCurrent = step.number === completedCount + 1
        const isLast = index === JOURNEY_STEPS.length - 1

        const circleSize = compact ? 'w-6 h-6' : 'w-8 h-8'
        const fontSize = compact ? 'text-[10px]' : 'text-xs'

        return (
          <div key={step.number} className="flex items-start">
            {/* Circle + connector column */}
            <div className="flex flex-col items-center flex-shrink-0">
              {/* Circle */}
              <div
                className={`${circleSize} rounded-full flex items-center justify-center ${fontSize} font-semibold ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                      ? 'bg-[var(--navy-600)] text-white'
                      : 'bg-[var(--cream-300)] text-[var(--navy-400)]'
                }`}
              >
                {isCompleted ? (
                  <svg className={compact ? 'w-3 h-3' : 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              {/* Connector line */}
              {!isLast && (
                <div
                  className={`w-0.5 ${compact ? 'h-4' : 'h-6'} ${
                    isCompleted ? 'bg-green-500' : 'bg-[var(--cream-300)]'
                  }`}
                />
              )}
            </div>

            {/* Text */}
            <div className={`${compact ? 'ml-2 pb-4' : 'ml-3 pb-6'} ${isLast ? 'pb-0' : ''}`}>
              <div
                className={`${compact ? 'text-xs' : 'text-sm'} ${
                  isCompleted || isCurrent
                    ? 'font-semibold text-[var(--navy-700)]'
                    : 'text-[var(--navy-400)]'
                }`}
              >
                {step.title}
              </div>
              {!compact && (
                <div className="text-xs text-[var(--navy-400)] mt-0.5">
                  {step.description}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
