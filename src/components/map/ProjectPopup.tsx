'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { type Project, CATEGORY_CONFIG, URGENCY_CONFIG, PROJECT_TYPE_CONFIG, formatCurrency, getLocalizedProject } from '@/types'

interface ProjectPopupProps {
  project: Project
}

export function ProjectPopup({ project }: ProjectPopupProps) {
  const t = useTranslations()
  const locale = useLocale()
  const localized = getLocalizedProject(project, locale)
  const categoryConfig = CATEGORY_CONFIG[project.category]
  const urgencyConfig = URGENCY_CONFIG[project.urgency]

  return (
    <div className="w-64 bg-white rounded-xl overflow-hidden shadow-xl border border-gray-100">
      {/* Colored accent bar */}
      <div
        className="h-1.5"
        style={{ backgroundColor: categoryConfig.color }}
      />

      <div className="p-4">
        {/* Category & Project Type badges */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: categoryConfig.color }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-3 h-3"
              dangerouslySetInnerHTML={{ __html: categoryConfig.icon }}
            />
            {t(`categories.${project.category}`).split(' ')[0]}
          </span>
          {project.projectType && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${PROJECT_TYPE_CONFIG[project.projectType].color}15`,
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
              {t(`projectTypes.${project.projectType}`)}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-[var(--navy-800)] text-base leading-snug line-clamp-2 mb-1">
          {localized.facilityName}
        </h3>

        {/* Municipality */}
        <p className="text-sm text-[var(--navy-500)] mb-3">
          {localized.municipalityName}
        </p>

        {/* Divider */}
        <div className="border-t border-gray-100 my-3" />

        {/* Cost & Details Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {project.estimatedCostUsd && (
              <span className="text-lg font-bold text-[var(--navy-700)]">
                {formatCurrency(project.estimatedCostUsd, { compact: true })}
              </span>
            )}
          </div>
          {project.cofinancingAvailable === 'YES' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-200">
              {t('projectDetail.cofinancingAvailable')}
            </span>
          )}
        </div>

        {/* Urgency */}
        {project.urgency !== 'LOW' && (
          <div className="flex items-center gap-1.5 mb-3">
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
          className="block w-full text-center py-2.5 px-4 bg-[var(--navy-600)] text-sm font-medium rounded-lg hover:bg-[var(--navy-700)] transition-colors"
          style={{ color: '#F5F1E8' }}
        >
          {t('projectDetail.viewDetails')}
        </Link>
      </div>
    </div>
  )
}
