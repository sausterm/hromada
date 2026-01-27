'use client'

import Link from 'next/link'
import { type Project, CATEGORY_CONFIG, URGENCY_CONFIG, STATUS_CONFIG, PROJECT_TYPE_CONFIG, formatCurrency } from '@/types'
import { Badge } from '@/components/ui/Badge'

interface ProjectPopupProps {
  project: Project
}

export function ProjectPopup({ project }: ProjectPopupProps) {
  const categoryConfig = CATEGORY_CONFIG[project.category]
  const urgencyConfig = URGENCY_CONFIG[project.urgency]
  const statusConfig = STATUS_CONFIG[project.status]

  return (
    <div className="w-72 p-0 bg-[var(--cream-100)]">
      {/* Photo */}
      {project.photos && project.photos.length > 0 && (
        <div className="w-full h-32 bg-[var(--cream-200)] rounded-t-lg overflow-hidden">
          <img
            src={project.photos[0]}
            alt={project.facilityName}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-3">
        {/* Category & Status badges */}
        <div className="flex items-center gap-2 mb-2">
          <Badge
            size="sm"
            dot
            dotColor={categoryConfig.color}
          >
            {categoryConfig.label}
          </Badge>
          <Badge
            size="sm"
            variant={project.status === 'OPEN' ? 'success' : 'default'}
          >
            {statusConfig.label}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-[var(--navy-700)] text-sm mb-1">
          {project.facilityName}
        </h3>

        {/* Municipality */}
        <p className="text-xs text-[var(--navy-500)] mb-2">
          {project.municipalityName}
        </p>

        {/* Description preview */}
        <p className="text-xs text-[var(--navy-600)] line-clamp-2 mb-3">
          {project.briefDescription || project.description}
        </p>

        {/* Project Type & Cost */}
        {(project.projectType || project.estimatedCostUsd) && (
          <div className="flex items-center gap-2 mb-3">
            {project.projectType && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium"
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

        {/* Urgency */}
        {project.urgency !== 'LOW' && (
          <div className="flex items-center gap-1 mb-3">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: urgencyConfig.color }}
            />
            <span className="text-xs font-medium" style={{ color: urgencyConfig.color }}>
              {urgencyConfig.label} Urgency
            </span>
          </div>
        )}

        {/* View details link */}
        <Link
          href={`/projects/${project.id}`}
          className="block w-full text-center py-2 px-4 bg-[var(--warm-500)] text-white text-sm font-medium rounded-lg hover:bg-[var(--warm-600)] transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  )
}
