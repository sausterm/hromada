'use client'

import Link from 'next/link'
import { type Project, CATEGORY_CONFIG, URGENCY_CONFIG, STATUS_CONFIG } from '@/types'

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
          ? 'border-[var(--warm-500)] shadow-lg ring-2 ring-[var(--warm-200)]'
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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
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
        {/* Title */}
        <h3 className="font-semibold text-[var(--navy-700)] text-lg leading-tight mb-1">
          {project.facilityName}
        </h3>

        {/* Municipality */}
        <p className="text-[var(--navy-500)] text-sm mb-2">
          {project.municipalityName}
        </p>

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
          <span className="text-[#0057B7] hover:text-[#004494] text-sm font-medium">
            Learn more &rarr;
          </span>
        </div>
      </div>
    </Link>
  )
}
