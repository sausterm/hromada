'use client'

import Link from 'next/link'
import { type Project, CATEGORY_CONFIG, URGENCY_CONFIG, STATUS_CONFIG, PROJECT_TYPE_CONFIG, formatCurrency } from '@/types'

interface ProjectCardProps {
  project: Project
  isHighlighted?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function ProjectCard({
  project,
  isHighlighted = false,
  onMouseEnter,
  onMouseLeave,
}: ProjectCardProps) {
  const categoryConfig = CATEGORY_CONFIG[project.category]
  const urgencyConfig = URGENCY_CONFIG[project.urgency]
  const statusConfig = STATUS_CONFIG[project.status]

  const mainPhoto = project.photos?.[0]

  return (
    <Link
      href={`/projects/${project.id}`}
      className={`block bg-[var(--cream-100)] rounded-xl overflow-hidden card-hover border-2 transition-all duration-200 ${
        isHighlighted
          ? 'border-[var(--navy-600)] shadow-lg ring-2 ring-[var(--navy-200)]'
          : 'border-[var(--cream-300)] shadow-sm hover:shadow-md hover:border-[var(--cream-400)]'
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] bg-[var(--cream-200)]">
        {mainPhoto ? (
          <img
            src={mainPhoto}
            alt={project.facilityName}
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
          <span>{categoryConfig.icon}</span>
          <span>{categoryConfig.label}</span>
        </div>

        {/* Urgency Badge (only show if high or critical) */}
        {(project.urgency === 'HIGH' || project.urgency === 'CRITICAL') && (
          <div
            className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium text-white shadow-sm"
            style={{ backgroundColor: urgencyConfig.color }}
          >
            {urgencyConfig.label}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 bg-[var(--cream-100)]">
        {/* Title - fixed 2-line height with truncation */}
        <h3 className="font-semibold text-[var(--navy-700)] text-lg leading-tight mb-1 line-clamp-2 min-h-[2.75rem]">
          {project.facilityName}
        </h3>

        {/* Municipality */}
        <p className="text-[var(--navy-500)] text-sm mb-1">
          {project.municipalityName}
        </p>

        {/* Project Type & Cost Row */}
        {(project.projectType || project.estimatedCostUsd) && (
          <div className="flex items-center gap-2 mb-2">
            {project.projectType && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                style={{
                  backgroundColor: `${PROJECT_TYPE_CONFIG[project.projectType].color}20`,
                  color: PROJECT_TYPE_CONFIG[project.projectType].color,
                }}
              >
                <span>{PROJECT_TYPE_CONFIG[project.projectType].icon}</span>
                <span>{PROJECT_TYPE_CONFIG[project.projectType].label}</span>
              </span>
            )}
            {project.estimatedCostUsd && (
              <span className="text-xs font-semibold text-[var(--navy-600)]">
                {formatCurrency(project.estimatedCostUsd)}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        <p className="text-[var(--navy-600)] text-sm line-clamp-2 mb-3">
          {project.briefDescription || project.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--cream-300)]">
          {/* Status Badge - using warm palette */}
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: `${statusConfig.color}20`,
              color: statusConfig.color,
            }}
          >
            {statusConfig.label}
          </span>

          {/* Learn More Link */}
          <span className="text-[var(--navy-700)] hover:text-[var(--navy-800)] text-sm font-medium">
            Learn more &rarr;
          </span>
        </div>
      </div>
    </Link>
  )
}
