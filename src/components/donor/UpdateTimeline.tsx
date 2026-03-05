'use client'

import { Badge } from '@/components/ui/Badge'
import { UPDATE_TYPE_CONFIG, formatDateTime } from '@/lib/donor-constants'

export interface TimelineUpdate {
  id: string
  title: string
  message: string
  createdAt: string
  type?: string
  metadata?: Record<string, unknown> | null
  source?: 'donation' | 'project'
  createdByName?: string
  createdByRole?: string
}

interface UpdateTimelineProps {
  updates: TimelineUpdate[]
  maxUpdates?: number
  onPhotoClick?: (src: string, alt: string) => void
  variant: 'compact' | 'full'
}

function TimelineDotIcon({ type, compact }: { type?: string; compact: boolean }) {
  const iconSize = compact ? 'w-2 h-2' : 'w-2.5 h-2.5'

  if (type === 'PROZORRO_STATUS') {
    return (
      <svg className={`${iconSize} text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
      </svg>
    )
  }
  if (type === 'PHOTO_ADDED') {
    return (
      <svg className={`${iconSize} text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  }
  return null
}

export function UpdateTimeline({ updates, maxUpdates, onPhotoClick, variant }: UpdateTimelineProps) {
  const isCompact = variant === 'compact'

  const displayUpdates = maxUpdates
    ? updates.slice(-maxUpdates).reverse()
    : [...updates].reverse()
  const hiddenCount = maxUpdates && updates.length > maxUpdates
    ? updates.length - maxUpdates
    : 0

  if (displayUpdates.length === 0) {
    return (
      <div className={`text-center ${isCompact ? 'py-8' : 'py-12'} text-${isCompact ? 'gray' : '[var(--navy-400)]'}-500`}>
        <svg className={`${isCompact ? 'w-12 h-12' : 'w-14 h-14'} mx-auto mb-3 ${isCompact ? 'text-gray-300' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className={`${isCompact ? 'text-sm' : 'font-medium'}`}>No updates yet</p>
        <p className="text-xs mt-1">We&apos;ll notify you when there&apos;s news about your donation.</p>
      </div>
    )
  }

  const pl = isCompact ? 'pl-6' : 'pl-8'
  const dotSize = isCompact ? 'w-3.5 h-3.5' : 'w-5 h-5'
  const dotLeft = isCompact ? 'left-0' : 'left-0'
  const lineLeft = isCompact ? 'left-[7px]' : 'left-[9px]'
  const lineColor = isCompact ? 'bg-gray-200' : 'bg-[var(--cream-300)]'

  return (
    <>
      <div className={isCompact ? 'space-y-4' : 'space-y-6'}>
        {displayUpdates.map((update, index) => {
          const updateType = update.type || (update.metadata?.type as string | undefined)
          const typeConfig = updateType ? UPDATE_TYPE_CONFIG[updateType] : undefined
          const isDonationSource = update.source === 'donation'

          return (
            <div key={update.id} className={`relative ${pl}`}>
              {/* Timeline line */}
              {index < displayUpdates.length - 1 && (
                <div className={`absolute ${lineLeft} ${isCompact ? 'top-6' : 'top-8'} bottom-0 w-0.5 ${lineColor}`} />
              )}
              {/* Timeline dot */}
              <div className={`absolute ${dotLeft} top-1${isCompact ? '.5' : ''} ${dotSize} rounded-full bg-[var(--navy-600)] border-2 border-white shadow flex items-center justify-center`}>
                <TimelineDotIcon type={updateType} compact={isCompact} />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-medium ${isCompact ? 'text-gray-900' : 'text-[var(--navy-700)]'}`}>
                    {update.title}
                  </span>
                  {typeConfig && !isDonationSource && (
                    <Badge size="sm" className={typeConfig.badgeClass}>
                      {typeConfig.label}
                    </Badge>
                  )}
                </div>
                <div className={`text-xs ${isCompact ? 'text-gray-500' : 'text-[var(--navy-400)]'} mt-0.5`}>
                  {formatDateTime(update.createdAt)}
                  {update.createdByName && (
                    <span className={`ml-1.5 ${isCompact ? 'text-gray-600' : 'text-[var(--navy-500)]'}`}>
                      — {update.createdByName} ({update.createdByRole})
                    </span>
                  )}
                </div>
                <p className={`text-sm ${isCompact ? 'text-gray-600' : 'text-[var(--navy-600)] leading-relaxed'} mt-2`}>
                  {update.message}
                </p>

                {/* Prozorro link */}
                {typeof update.metadata?.prozorroUrl === 'string' && (
                  <a
                    href={update.metadata.prozorroUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1${isCompact ? '' : '.5'} text-sm ${isCompact ? '' : 'font-medium '}text-[var(--ukraine-blue)] hover:underline mt-2`}
                  >
                    View on Prozorro
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}

                {/* Photos (full variant only) */}
                {!isCompact && (
                  <>
                    {Array.isArray(update.metadata?.photoUrls) && (update.metadata.photoUrls as string[]).length > 0 ? (
                      <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: (update.metadata!.photoUrls as string[]).length === 1 ? '1fr' : 'repeat(2, 1fr)' }}>
                        {(update.metadata!.photoUrls as string[]).map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt={`${update.title} ${i + 1}`}
                            className="w-full max-h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => onPhotoClick?.(url, `${update.title} ${i + 1}`)}
                          />
                        ))}
                      </div>
                    ) : typeof update.metadata?.photoUrl === 'string' && (
                      <div className="mt-3 rounded-lg overflow-hidden">
                        <img
                          src={update.metadata.photoUrl}
                          alt={update.title}
                          className="w-full max-h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => onPhotoClick?.(update.metadata!.photoUrl as string, update.title)}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {hiddenCount > 0 && (
        <p className="text-xs text-[var(--navy-400)] mt-3">
          + {hiddenCount} earlier update{hiddenCount !== 1 ? 's' : ''} — view full timeline below
        </p>
      )}
    </>
  )
}
