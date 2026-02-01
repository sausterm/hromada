'use client'

import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { type Project, CATEGORY_CONFIG, URGENCY_CONFIG, STATUS_CONFIG, PROJECT_TYPE_CONFIG, formatCurrency, formatRelativeTime, getLocalizedProject } from '@/types'
import { ShareButton } from '@/components/ui/ShareButton'

interface ProjectCardProps {
  project: Project
  isHighlighted?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onClick?: () => void  // If provided, clicking card body zooms to map; detail link still navigates
}

export function ProjectCard({
  project,
  isHighlighted = false,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: ProjectCardProps) {
  const t = useTranslations()
  const locale = useLocale()
  const localized = getLocalizedProject(project, locale)
  const categoryConfig = CATEGORY_CONFIG[project.category]
  const urgencyConfig = URGENCY_CONFIG[project.urgency]
  const statusConfig = STATUS_CONFIG[project.status]

  const mainPhoto = project.photos?.[0]

  // Common class names for the card container
  const cardClassName = `flex flex-col h-full bg-[var(--cream-100)] rounded-xl overflow-hidden card-hover border-2 transition-all duration-200 ${
    isHighlighted
      ? 'border-[var(--navy-600)] shadow-lg ring-2 ring-[var(--navy-200)]'
      : 'border-[var(--cream-300)] shadow-sm hover:shadow-md hover:border-[var(--cream-400)]'
  }`

  // Card content - shared between both modes
  const cardContent = (
    <>
      {/* Image Section - fixed aspect ratio, never shrinks */}
      <div className="relative aspect-[16/10] bg-[var(--cream-200)] flex-shrink-0 overflow-hidden">
        {mainPhoto ? (
          <img
            src={mainPhoto}
            alt={localized.facilityName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--navy-400)]">
            {/* Category-specific placeholder icons */}
            {project.category === 'HOSPITAL' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            )}
            {project.category === 'SCHOOL' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" />
              </svg>
            )}
            {project.category === 'WATER' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3c-4 4-7 7.5-7 11a7 7 0 1014 0c0-3.5-3-7-7-11z" />
              </svg>
            )}
            {project.category === 'ENERGY' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
            {project.category === 'OTHER' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            )}
          </div>
        )}

        {/* Category Badge */}
        <div
          className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium text-white flex items-center gap-1.5 shadow-sm"
          style={{ backgroundColor: categoryConfig.color }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3.5 h-3.5"
            dangerouslySetInnerHTML={{ __html: categoryConfig.icon }}
          />
          <span>{t(`categories.${project.category}`)}</span>
        </div>

        {/* Urgency Badge (only show if high or critical) */}
        {(project.urgency === 'HIGH' || project.urgency === 'CRITICAL') && (
          <div
            className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium text-white shadow-sm"
            style={{ backgroundColor: urgencyConfig.color }}
          >
            {t(`urgency.${project.urgency}`)}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-1 p-3 bg-[var(--cream-100)]">
        {/* Title - fixed 2-line height, clickable to view project */}
        <h3 className="font-semibold text-base leading-tight mb-0.5 line-clamp-2 min-h-[2.5rem]">
          <Link
            href={`/projects/${project.id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-[var(--navy-700)] hover:text-[var(--ukraine-blue)] hover:underline transition-colors"
          >
            {localized.facilityName}
          </Link>
        </h3>

        {/* Municipality & Oblast */}
        <p className="text-[var(--navy-500)] text-sm mb-1.5 truncate">
          {localized.municipalityName}{project.region && `, ${project.region.replace(' Oblast', '')}`}
        </p>

        {/* Cost & Project Type Row - fixed height */}
        <div className="flex items-center gap-2 flex-wrap mb-2 min-h-[1.5rem]">
          {project.estimatedCostUsd && (
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-[var(--navy-100)] text-[var(--navy-700)] text-sm font-bold">
              {formatCurrency(project.estimatedCostUsd, { compact: true, showPrefix: true })}
            </span>
          )}
          {project.projectType && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
              style={{
                backgroundColor: `${PROJECT_TYPE_CONFIG[project.projectType].color}20`,
                color: PROJECT_TYPE_CONFIG[project.projectType].color,
              }}
            >
              <span>{PROJECT_TYPE_CONFIG[project.projectType].icon}</span>
              <span>{t(`projectTypes.${project.projectType}`)}</span>
            </span>
          )}
        </div>

        {/* Description - fixed 2-line height */}
        <p className="text-[var(--navy-600)] text-sm line-clamp-2 min-h-[2.5rem] mb-2">
          {localized.briefDescription}
        </p>

        {/* Spacer to push footer to bottom */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--cream-300)]">
          <div className="flex items-center gap-2">
            {/* Status Badge */}
            <span
              className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium text-center"
              style={{
                backgroundColor: `${statusConfig.color}20`,
                color: statusConfig.color,
              }}
            >
              {t(`status.${project.status}`)}
            </span>
            {/* Posted time */}
            <span className="text-xs text-[var(--navy-400)] whitespace-nowrap" suppressHydrationWarning>
              {t('projectCard.postedAgo', { time: formatRelativeTime(project.createdAt) })}
            </span>
          </div>

          {/* Share Button */}
          <ShareButton
            projectId={project.id}
            projectTitle={localized.facilityName}
            projectDescription={localized.briefDescription}
            variant="icon"
          />
        </div>
      </div>
    </>
  )

  // If onClick is provided, render as a clickable div that zooms to map
  if (onClick) {
    return (
      <div
        className={`${cardClassName} cursor-pointer`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick()
          }
        }}
      >
        {cardContent}
      </div>
    )
  }

  // Default: render as a Link that navigates to project detail page
  return (
    <Link
      href={`/projects/${project.id}`}
      className={cardClassName}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {cardContent}
    </Link>
  )
}
