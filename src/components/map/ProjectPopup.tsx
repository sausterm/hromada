'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { type Project, CATEGORY_CONFIG, URGENCY_CONFIG, STATUS_CONFIG, PROJECT_TYPE_CONFIG, formatCurrency, getLocalizedProject } from '@/types'
import { Badge } from '@/components/ui/Badge'

interface ProjectPopupProps {
  project: Project
}

export function ProjectPopup({ project }: ProjectPopupProps) {
  const t = useTranslations()
  const locale = useLocale()
  const localized = getLocalizedProject(project, locale)
  const categoryConfig = CATEGORY_CONFIG[project.category]
  const urgencyConfig = URGENCY_CONFIG[project.urgency]
  const statusConfig = STATUS_CONFIG[project.status]

  return (
    <div className="w-72 p-0 bg-[var(--cream-100)]">
      {/* Photo */}
      <div className="w-full h-32 bg-[var(--cream-200)] rounded-t-lg overflow-hidden">
        {project.photos && project.photos.length > 0 ? (
          <img
            src={project.photos[0]}
            alt={localized.facilityName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {categoryConfig.icon}
          </div>
        )}
      </div>

      <div className="p-3">
        {/* Category & Status badges */}
        <div className="flex items-center gap-2 mb-2">
          <Badge
            size="sm"
            dot
            dotColor={categoryConfig.color}
          >
            {t(`categories.${project.category}`)}
          </Badge>
          <Badge
            size="sm"
            variant={project.status === 'OPEN' ? 'success' : 'default'}
          >
            {t(`status.${project.status}`)}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-[var(--navy-700)] text-sm leading-tight line-clamp-2 mb-1">
          {localized.facilityName}
        </h3>

        {/* Municipality */}
        <p className="text-xs text-[var(--navy-500)] mb-2">
          {localized.municipalityName}
        </p>

        {/* Description preview */}
        <p className="text-xs text-[var(--navy-600)] line-clamp-2 mb-3">
          {localized.briefDescription || localized.fullDescription}
        </p>

        {/* Project Type & Cost */}
        <div className="flex items-center gap-2 mb-2">
          {project.projectType && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium"
              style={{
                backgroundColor: `${PROJECT_TYPE_CONFIG[project.projectType].color}20`,
                color: PROJECT_TYPE_CONFIG[project.projectType].color,
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3 h-3"
                dangerouslySetInnerHTML={{ __html: PROJECT_TYPE_CONFIG[project.projectType].icon }}
              />
              <span>{t(`projectTypes.${project.projectType}`)}</span>
            </span>
          )}
          {project.estimatedCostUsd && (
            <span className="text-xs font-semibold text-[var(--navy-600)]">
              {formatCurrency(project.estimatedCostUsd)}
            </span>
          )}
        </div>

        {/* Urgency */}
        {project.urgency !== 'LOW' && (
          <div className="flex items-center gap-1 mb-3">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: urgencyConfig.color }}
            />
            <span className="text-xs font-medium" style={{ color: urgencyConfig.color }}>
              {t('projectDetail.urgencyLabel', { level: t(`urgency.${project.urgency}`) })}
            </span>
          </div>
        )}

        {/* View details link */}
        <Link
          href={`/projects/${project.id}`}
          className="block w-full text-center py-2 px-4 bg-[var(--navy-600)] text-sm font-medium rounded-lg hover:bg-[var(--navy-700)] transition-colors"
          style={{ color: '#F5F1E8' }}
        >
          {t('projectDetail.viewDetails')}
        </Link>
      </div>
    </div>
  )
}
