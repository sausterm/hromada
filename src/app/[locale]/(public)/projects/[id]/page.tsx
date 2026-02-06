'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useParams } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { SupportProjectCard } from '@/components/projects/SupportProjectCard'
import {
  type Project,
  CATEGORY_CONFIG,
  STATUS_CONFIG,
  PROJECT_TYPE_CONFIG,
  COFINANCING_CONFIG,
  formatCurrency,
  formatPower,
  formatRelativeTime,
  getLocalizedProject,
} from '@/types'
import { ShareButton } from '@/components/ui/ShareButton'

// Partner organizations configuration with logos and links (white-background versions for specs)
const PARTNER_CONFIG: Record<string, { logo: string; url: string; name: string }> = {
  'ecoaction': {
    logo: '/partners/EcoactionLogo-white.png',
    url: 'https://en.ecoaction.org.ua/',
    name: 'NGO Ecoaction',
  },
  'ecoclub': {
    logo: '/partners/EcoclubLogo-white.png',
    url: 'https://ecoclubrivne.org/en/',
    name: 'NGO Ecoclub',
  },
  'energy act': {
    logo: '/partners/energyactukrainelogo-white.png',
    url: 'https://www.energyactua.com/',
    name: 'Energy Act For Ukraine',
  },
  'repower': {
    logo: '/partners/RePowerUkraineLogo-white.png',
    url: 'https://repowerua.org/',
    name: 'RePower Ukraine',
  },
  'greenpeace': {
    logo: '/partners/greenpeacelogo-white.png',
    url: 'https://www.greenpeace.org/ukraine/en/',
    name: 'Greenpeace Ukraine',
  },
}

// Helper to find partner config by organization name
function findPartnerConfig(orgName: string | undefined) {
  if (!orgName) return null
  const lowerName = orgName.toLowerCase()
  for (const [key, config] of Object.entries(PARTNER_CONFIG)) {
    if (lowerName.includes(key)) {
      return config
    }
  }
  return null
}

// Helper to transform API response to Project type
function transformProject(data: any): Project {
  return {
    ...data,
    description: data.fullDescription || data.description || '',
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    technicalPowerKw: data.technicalPowerKw ? Number(data.technicalPowerKw) : undefined,
    estimatedCostUsd: data.estimatedCostUsd ? Number(data.estimatedCostUsd) : undefined,
  }
}

export default function ProjectDetailPage() {
  const t = useTranslations()
  const locale = useLocale()
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState(0)

  useEffect(() => {
    async function fetchProject() {
      try {
        const response = await fetch(`/api/projects/${projectId}`)
        if (response.ok) {
          const data = await response.json()
          setProject(transformProject(data.project))
        } else {
          setProject(null)
        }
      } catch (error) {
        console.error('Failed to fetch project:', error)
        setProject(null)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProject()
  }, [projectId])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cream-100)]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('projectDetail.notFound')}</h1>
        <p className="text-gray-600 mb-6">{t('projectDetail.notFoundMessage')}</p>
        <Link href="/">
          <Button>{t('projectDetail.backToMap')}</Button>
        </Link>
      </div>
    )
  }

  const categoryConfig = CATEGORY_CONFIG[project.category]
  const statusConfig = STATUS_CONFIG[project.status]
  const localized = getLocalizedProject(project, locale)

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center gap-2 text-[var(--navy-600)] hover:text-[var(--navy-800)] mb-6 group">
          <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-medium">{t('projectDetail.backToMap')}</span>
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo Gallery */}
            {project.photos && project.photos.length > 0 && (
              <div className="space-y-3">
                <div className="aspect-video bg-gray-200 rounded-xl overflow-hidden">
                  <img
                    src={project.photos[selectedPhoto]}
                    alt={localized.facilityName}
                    className="w-full h-full object-cover"
                  />
                </div>
                {project.photos.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {project.photos.map((photo, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedPhoto(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedPhoto === index
                            ? 'border-[var(--ukraine-600)]'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={photo}
                          alt={`${localized.facilityName} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Project Info */}
            <div>
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge dot dotColor={categoryConfig.color}>
                  <span className="inline-flex items-center gap-1.5">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4"
                      dangerouslySetInnerHTML={{ __html: categoryConfig.icon }}
                    />
                    {t(`categories.${project.category}`)}
                  </span>
                </Badge>
                <Badge
                  variant={project.status === 'OPEN' ? 'success' : 'default'}
                >
                  {t(`status.${project.status}`)}
                </Badge>
              </div>

              {/* Title with Share Button */}
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {localized.facilityName}
                </h1>
                <ShareButton
                  projectId={project.id}
                  projectTitle={localized.facilityName}
                  projectDescription={localized.briefDescription || localized.fullDescription}
                  variant="button"
                />
              </div>

              {/* Municipality and Posted Time */}
              <div className="flex items-center gap-3 mb-6">
                <p className="text-lg text-gray-600">
                  {localized.municipalityName}
                </p>
                <span className="text-sm text-gray-400" suppressHydrationWarning>
                  {t('projectDetail.postedTime', { time: formatRelativeTime(project.createdAt, t) })}
                </span>
              </div>

            {/* About This Project - Combined description and specs */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {t('projectDetail.aboutProject')}
                </h2>
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Sidebar - Specifications (left side) */}
                  {(project.projectType || project.estimatedCostUsd || project.technicalPowerKw ||
                    project.numberOfPanels || project.cofinancingAvailable || project.partnerOrganization) && (
                    <div className="lg:w-64 flex-shrink-0 lg:border-r lg:border-gray-200 lg:pr-6 space-y-4 order-first">
                      {/* Estimated Cost - Featured */}
                      {project.estimatedCostUsd && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">{t('projectDetail.specifications.estimatedCost')}</p>
                          <p className="font-bold text-2xl text-[var(--navy-700)]">
                            {formatCurrency(project.estimatedCostUsd, { compact: true })}
                          </p>
                        </div>
                      )}

                      {/* Project Type */}
                      {project.projectType && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">{t('projectDetail.specifications.projectType')}</p>
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-sm font-medium"
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
                              className="w-4 h-4"
                              dangerouslySetInnerHTML={{ __html: PROJECT_TYPE_CONFIG[project.projectType].icon }}
                            />
                            <span>{t(`projectTypes.${project.projectType}`)}</span>
                          </span>
                        </div>
                      )}

                      {/* Project Subtype */}
                      {project.projectSubtype && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">{t('projectDetail.specifications.subtype')}</p>
                          <p className="font-medium text-gray-900">{project.projectSubtype}</p>
                        </div>
                      )}

                      {/* Technical Power */}
                      {project.technicalPowerKw && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">{t('projectDetail.specifications.technicalPower')}</p>
                          <p className="font-medium text-gray-900">{formatPower(project.technicalPowerKw)}</p>
                        </div>
                      )}

                      {/* Number of Panels */}
                      {project.numberOfPanels && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">{t('projectDetail.specifications.numberOfPanels')}</p>
                          <p className="font-medium text-gray-900">{project.numberOfPanels.toLocaleString()}</p>
                        </div>
                      )}

                      {/* Co-financing Available */}
                      {project.cofinancingAvailable && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">{t('projectDetail.specifications.cofinancing')}</p>
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium"
                            style={{
                              backgroundColor: `${COFINANCING_CONFIG[project.cofinancingAvailable].color}20`,
                              color: COFINANCING_CONFIG[project.cofinancingAvailable].color,
                            }}
                          >
                            {t(`cofinancing.${project.cofinancingAvailable}`)}
                          </span>
                          {project.cofinancingDetails && (
                            <p className="text-gray-600 text-sm mt-1">{project.cofinancingDetails}</p>
                          )}
                        </div>
                      )}

                      {/* Partner Organization */}
                      {project.partnerOrganization && (() => {
                        const partnerConfig = findPartnerConfig(project.partnerOrganization)
                        return (
                          <div>
                            <p className="text-sm text-gray-500 mb-2">{t('projectDetail.specifications.partnerOrganization')}</p>
                            {partnerConfig ? (
                              <a
                                href={partnerConfig.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 group"
                              >
                                <img
                                  src={partnerConfig.logo}
                                  alt={partnerConfig.name}
                                  className="h-8 w-auto object-contain"
                                />
                                <span className="font-medium text-gray-900 text-sm group-hover:text-[var(--navy-600)] transition-colors">
                                  {project.partnerOrganization}
                                </span>
                                <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-400 group-hover:text-[var(--navy-600)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            ) : (
                              <p className="font-medium text-gray-900 text-sm">{project.partnerOrganization}</p>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  {/* Main content - Description */}
                  <div className="flex-1 prose prose-gray max-w-none">
                    <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                      {localized.fullDescription}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>

          </div>

          {/* Sidebar - Sticky support card */}
          <div className="lg:sticky lg:top-24 lg:self-start space-y-6">
            {/* Support This Project */}
            <SupportProjectCard
              projectId={project.id}
              projectName={localized.facilityName}
              estimatedCostUsd={project.estimatedCostUsd}
              cofinancingAvailable={project.cofinancingAvailable}
              cofinancingDetails={project.cofinancingDetails}
            />
          </div>
        </div>
      </div>

    </main>
  )
}
