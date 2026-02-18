'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { type Project, CATEGORY_CONFIG, PROJECT_TYPE_CONFIG, formatCurrency, getLocalizedProject } from '@/types'

interface ProjectPopupProps {
  project: Project
}

export function ProjectPopup({ project }: ProjectPopupProps) {
  const t = useTranslations()
  const locale = useLocale()
  const localized = getLocalizedProject(project, locale)
  const categoryConfig = CATEGORY_CONFIG[project.category]

  return (
    <div className="w-[272px] bg-[var(--cream-50)] rounded-xl overflow-hidden shadow-xl border border-[var(--cream-200)]">
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
          {project.projectType && PROJECT_TYPE_CONFIG[project.projectType] && (
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
        <Link href={`/${locale}/projects/${project.id}`} className="block mb-1 group">
          <h3 className="font-semibold text-[var(--navy-800)] text-base leading-snug line-clamp-2 group-hover:text-[var(--ukraine-600)] group-hover:underline transition-colors">
            {localized.facilityName}
          </h3>
        </Link>

        {/* Municipality */}
        <p className="text-sm text-[var(--navy-500)] mb-3">
          {localized.municipalityName}
        </p>

        {/* Divider */}
        <div className="border-t border-[var(--cream-200)] my-3" />

        {/* Cost & Co-financing Row */}
        <div className="flex items-center gap-2 mb-3">
          {project.estimatedCostUsd && (
            <span className="text-lg font-bold text-[var(--navy-700)]">
              {formatCurrency(project.estimatedCostUsd, { compact: true })}
            </span>
          )}
          {project.cofinancingAvailable === 'YES' && (
            <span className="inline-flex items-center gap-1 h-6 rounded-full bg-green-100 text-green-600 px-2 text-xs font-medium whitespace-nowrap">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3.5 h-3.5 flex-shrink-0"
              >
                <path d="m11 17 2 2a1 1 0 1 0 3-3" />
                <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
                <path d="m21 3 1 11h-2" />
                <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
                <path d="M3 4h8" />
              </svg>
              {t('projectDetail.cofinancingAvailable')}
            </span>
          )}
        </div>

        {/* View details link */}
        <Link
          href={`/${locale}/projects/${project.id}`}
          className="block w-full text-center py-2.5 px-4 bg-[var(--navy-600)] text-sm font-medium rounded-lg hover:bg-[var(--navy-700)] transition-colors"
          style={{ color: '#F5F1E8' }}
        >
          {t('projectDetail.viewDetails')}
        </Link>
      </div>
    </div>
  )
}
