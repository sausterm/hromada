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
  type ProjectDocument,
  CATEGORY_CONFIG,
  STATUS_CONFIG,
  PROJECT_TYPE_CONFIG,
  COFINANCING_CONFIG,
  DOCUMENT_TYPE_LABELS,
  formatCurrency,
  formatPower,
  formatRelativeTime,
  getLocalizedProject,
} from '@/types'
import { ShareButton } from '@/components/ui/ShareButton'

// Partner organizations configuration with logos and links
const PARTNER_CONFIG: Record<string, { logo: string; url: string; name: string }> = {
  'ecoaction': {
    logo: '/partners/EcoactionLogo.png',
    url: 'https://en.ecoaction.org.ua/',
    name: 'NGO Ecoaction',
  },
  'ecoclub': {
    logo: '/partners/EcoclubLogo.png',
    url: 'https://ecoclubrivne.org/en/',
    name: 'NGO Ecoclub',
  },
  'energy act': {
    logo: '/partners/energyactukrainelogo.png',
    url: 'https://www.energyactua.com/',
    name: 'Energy Act For Ukraine',
  },
  'repower': {
    logo: '/partners/RePowerUkraineLogo.png',
    url: 'https://repowerua.org/',
    name: 'RePower Ukraine',
  },
  'greenpeace': {
    logo: '/partners/greenpeacelogo.png',
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
    cityLatitude: data.cityLatitude ? Number(data.cityLatitude) : 0,
    cityLongitude: data.cityLongitude ? Number(data.cityLongitude) : 0,
    latitude: data.latitude ? Number(data.latitude) : undefined,
    longitude: data.longitude ? Number(data.longitude) : undefined,
    technicalPowerKw: data.technicalPowerKw ? Number(data.technicalPowerKw) : undefined,
    estimatedCostUsd: data.estimatedCostUsd ? Number(data.estimatedCostUsd) : undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DocumentCard({ document: doc, locale, t }: { document: ProjectDocument; locale: string; t: any }) {
  const [showTranslation, setShowTranslation] = useState(false)
  const typeLabel = locale === 'uk'
    ? t(`projectDetail.documentation.types.${doc.documentType}`)
    : (DOCUMENT_TYPE_LABELS[doc.documentType as keyof typeof DOCUMENT_TYPE_LABELS] || 'Document')

  const fileSize = doc.fileSize
    ? doc.fileSize < 1024 * 1024
      ? `${(doc.fileSize / 1024).toFixed(0)} KB`
      : `${(doc.fileSize / (1024 * 1024)).toFixed(1)} MB`
    : null

  return (
    <div className="border border-[var(--cream-300)] rounded-lg p-4">
      <div className="flex items-start gap-3">
        {/* PDF icon */}
        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--cream-200)] text-[var(--navy-600)]">
              {typeLabel}
            </span>
            {fileSize && <span className="text-xs text-[var(--navy-400)]">{fileSize}</span>}
            {doc.extractionStatus === 'pending' && (
              <span className="text-xs text-amber-600 flex items-center gap-1">
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t('projectDetail.documentation.translationPending')}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-[var(--navy-700)] mt-1">
            {doc.label || doc.filename}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-2">
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-[var(--ukraine-blue)] hover:underline"
            >
              {t('projectDetail.documentation.downloadOriginal')}
            </a>
            {doc.translatedTextEn && locale === 'en' && (
              <button
                onClick={() => setShowTranslation(!showTranslation)}
                className="text-xs font-medium text-[var(--ukraine-blue)] hover:underline"
              >
                {showTranslation
                  ? t('projectDetail.documentation.hideTranslation')
                  : t('projectDetail.documentation.viewTranslation')}
              </button>
            )}
            {doc.originalTextUk && locale === 'uk' && (
              <button
                onClick={() => setShowTranslation(!showTranslation)}
                className="text-xs font-medium text-[var(--ukraine-blue)] hover:underline"
              >
                {showTranslation ? t('projectDetail.documentation.hideTranslation') : t('projectDetail.documentation.viewOriginalText')}
              </button>
            )}
          </div>

          {/* Expanded translation/text */}
          {showTranslation && (
            <div className="mt-3 p-3 bg-[var(--cream-100)] rounded-lg max-h-80 overflow-y-auto">
              <p className="text-sm text-[var(--navy-600)] whitespace-pre-line leading-relaxed">
                {locale === 'en' ? doc.translatedTextEn : doc.originalTextUk}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
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
        <h1 className="text-2xl font-bold text-[var(--navy-700)] mb-4">{t('projectDetail.notFound')}</h1>
        <p className="text-[var(--navy-500)] mb-6">{t('projectDetail.notFoundMessage')}</p>
        <Link href="/projects">
          <Button>{t('projectDetail.backToMap')}</Button>
        </Link>
      </div>
    )
  }

  const categoryConfig = CATEGORY_CONFIG[project.category]
  const statusConfig = STATUS_CONFIG[project.status]
  const localized = getLocalizedProject(project, locale)

  return (
    <main className="min-h-screen bg-[var(--cream-100)]">
      {/* Header */}
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/projects" className="inline-flex items-center gap-2 text-[var(--navy-600)] hover:text-[var(--navy-800)] mb-6 group">
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
                <div className="aspect-video bg-[var(--cream-200)] rounded-xl overflow-hidden">
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
              {/* Title with Share Button */}
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-3xl font-bold text-[var(--navy-700)]">
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
                <p className="text-lg text-[var(--navy-500)]">
                  {localized.municipalityName}
                </p>
                <span className="text-sm text-[var(--navy-400)]" suppressHydrationWarning>
                  {t('projectDetail.postedTime', { time: formatRelativeTime(project.createdAt, t) })}
                </span>
              </div>

            {/* About This Project - Combined description and specs */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-[var(--navy-700)] mb-4">
                  {t('projectDetail.aboutProject')}
                </h2>
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Sidebar - Specifications (left side) */}
                  {(project.category || project.projectType || project.technicalPowerKw ||
                    project.numberOfPanels || project.cofinancingAvailable || project.partnerOrganization) && (
                    <div className="lg:w-64 flex-shrink-0 lg:border-r lg:border-[var(--cream-300)] lg:pr-6 space-y-4 order-first">
                      {/* Category */}
                      <div>
                        <p className="text-sm text-[var(--navy-500)] mb-1">{t('projectDetail.specifications.category')}</p>
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-sm font-medium"
                          style={{
                            backgroundColor: `${categoryConfig.color}20`,
                            color: categoryConfig.color,
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
                            dangerouslySetInnerHTML={{ __html: categoryConfig.icon }}
                          />
                          {t(`categories.${project.category}`)}
                        </span>
                      </div>

                      {/* Project Type */}
                      {project.projectType && (
                        <div>
                          <p className="text-sm text-[var(--navy-500)] mb-1">{t('projectDetail.specifications.projectType')}</p>
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
                          <p className="text-sm text-[var(--navy-500)] mb-1">{t('projectDetail.specifications.subtype')}</p>
                          <p className="font-medium text-[var(--navy-700)]">{project.projectSubtype}</p>
                        </div>
                      )}

                      {/* Technical Power */}
                      {project.technicalPowerKw && (
                        <div>
                          <p className="text-sm text-[var(--navy-500)] mb-1">{t('projectDetail.specifications.technicalPower')}</p>
                          <p className="font-medium text-[var(--navy-700)]">{formatPower(project.technicalPowerKw)}</p>
                        </div>
                      )}

                      {/* Number of Panels */}
                      {project.numberOfPanels && (
                        <div>
                          <p className="text-sm text-[var(--navy-500)] mb-1">{t('projectDetail.specifications.numberOfPanels')}</p>
                          <p className="font-medium text-[var(--navy-700)]">{project.numberOfPanels.toLocaleString()}</p>
                        </div>
                      )}

                      {/* Co-financing Available */}
                      {project.cofinancingAvailable && (
                        <div>
                          <p className="text-sm text-[var(--navy-500)] mb-1">{t('projectDetail.specifications.cofinancing')}</p>
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
                            <p className="text-[var(--navy-500)] text-sm mt-1">{project.cofinancingDetails}</p>
                          )}
                        </div>
                      )}

                      {/* Partner Organization */}
                      {project.partnerOrganization && (() => {
                        const partnerConfig = findPartnerConfig(project.partnerOrganization)
                        return (
                          <div>
                            <p className="text-sm text-[var(--navy-500)] mb-2">{t('projectDetail.specifications.partnerOrganization')}</p>
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
                                <span className="font-medium text-[var(--navy-700)] text-sm group-hover:text-[var(--navy-600)] transition-colors">
                                  {project.partnerOrganization}
                                </span>
                                <svg className="w-3.5 h-3.5 flex-shrink-0 text-[var(--navy-400)] group-hover:text-[var(--navy-600)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            ) : (
                              <p className="font-medium text-[var(--navy-700)] text-sm">{project.partnerOrganization}</p>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  {/* Main content - Description */}
                  <div className="flex-1 prose prose-gray max-w-none">
                    <div className="text-[var(--navy-600)] whitespace-pre-line leading-relaxed">
                      {localized.fullDescription}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documentation Section */}
            {project.documents && project.documents.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-[var(--navy-700)] mb-1">
                    {t('projectDetail.documentation.title')}
                  </h2>
                  <p className="text-sm text-[var(--navy-500)] mb-4">
                    {t('projectDetail.documentation.subtitle')}
                  </p>
                  <div className="space-y-3">
                    {project.documents.map((doc: ProjectDocument) => (
                      <DocumentCard key={doc.id} document={doc} locale={locale} t={t} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
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
