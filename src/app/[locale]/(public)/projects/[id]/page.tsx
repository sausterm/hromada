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
import { ContactForm } from '@/components/projects/ContactForm'
import {
  type Project,
  CATEGORY_CONFIG,
  URGENCY_CONFIG,
  STATUS_CONFIG,
  PROJECT_TYPE_CONFIG,
  COFINANCING_CONFIG,
  formatCurrency,
  formatPower,
  formatRelativeTime,
  getLocalizedProject,
} from '@/types'
import { ShareButton } from '@/components/ui/ShareButton'

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
      <div className="min-h-screen flex items-center justify-center">
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
  const urgencyConfig = URGENCY_CONFIG[project.urgency]
  const statusConfig = STATUS_CONFIG[project.status]
  const localized = getLocalizedProject(project, locale)

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      <div className="container mx-auto px-4 py-8">
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
                  {categoryConfig.icon} {t(`categories.${project.category}`)}
                </Badge>
                <Badge
                  variant={project.status === 'OPEN' ? 'success' : 'default'}
                >
                  {t(`status.${project.status}`)}
                </Badge>
                {project.urgency !== 'LOW' && (
                  <Badge
                    variant={project.urgency === 'CRITICAL' ? 'danger' : 'warning'}
                  >
                    {t('projectDetail.urgencyLabel', { level: t(`urgency.${project.urgency}`) })}
                  </Badge>
                )}
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
                  {t('projectDetail.postedTime', { time: formatRelativeTime(project.createdAt) })}
                </span>
              </div>

              {/* Description */}
              <div className="prose prose-gray max-w-none">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  {t('projectDetail.aboutProject')}
                </h2>
                <div className="text-gray-700 whitespace-pre-line">
                  {localized.fullDescription}
                </div>
              </div>
            </div>

            {/* Project Specifications - only show if any technical/financial fields exist */}
            {(project.projectType || project.estimatedCostUsd || project.technicalPowerKw ||
              project.numberOfPanels || project.cofinancingAvailable || project.partnerOrganization) && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {t('projectDetail.projectSpecifications')}
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Project Type */}
                    <div>
                      <p className="text-sm text-gray-500 mb-1">{t('projectDetail.specifications.projectType')}</p>
                      {project.projectType ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-sm font-medium"
                          style={{
                            backgroundColor: `${PROJECT_TYPE_CONFIG[project.projectType].color}20`,
                            color: PROJECT_TYPE_CONFIG[project.projectType].color,
                          }}
                        >
                          <span>{PROJECT_TYPE_CONFIG[project.projectType].icon}</span>
                          <span>{t(`projectTypes.${project.projectType}`)}</span>
                        </span>
                      ) : (
                        <p className="text-gray-400 text-sm">{t('common.notSpecified')}</p>
                      )}
                    </div>

                    {/* Project Subtype */}
                    {project.projectSubtype && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">{t('projectDetail.specifications.subtype')}</p>
                        <p className="font-medium text-gray-900">{project.projectSubtype}</p>
                      </div>
                    )}

                    {/* Estimated Cost */}
                    <div>
                      <p className="text-sm text-gray-500 mb-1">{t('projectDetail.specifications.estimatedCost')}</p>
                      {project.estimatedCostUsd ? (
                        <p className="font-bold text-xl text-[var(--navy-700)]">
                          {formatCurrency(project.estimatedCostUsd, { compact: true, showPrefix: true })}
                        </p>
                      ) : (
                        <p className="text-gray-400 text-sm">{t('common.notSpecified')}</p>
                      )}
                    </div>

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
                      <div className="sm:col-span-2">
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
                          <p className="text-gray-700 mt-1">{project.cofinancingDetails}</p>
                        )}
                      </div>
                    )}

                    {/* Partner Organization */}
                    {project.partnerOrganization && (
                      <div className="sm:col-span-2">
                        <p className="text-sm text-gray-500 mb-1">{t('projectDetail.specifications.partnerOrganization')}</p>
                        <p className="font-medium text-gray-900">{project.partnerOrganization}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Location */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{t('projectDetail.location')}</h3>
                <p className="text-gray-600">{project.address}</p>
                <a
                  href={`https://www.google.com/maps?q=${project.cityLatitude},${project.cityLongitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--ukraine-600)] hover:underline text-sm mt-2 inline-block"
                >
                  {t('projectDetail.viewOnMap')}
                </a>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4">{t('projectDetail.contact.title')}</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">{t('projectDetail.contact.contactPerson')}</p>
                    <p className="font-medium text-gray-900">{project.contactName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('projectDetail.contact.email')}</p>
                    <a
                      href={`mailto:${project.contactEmail}`}
                      className="font-medium text-[var(--ukraine-600)] hover:underline"
                    >
                      {project.contactEmail}
                    </a>
                  </div>
                  {project.contactPhone && (
                    <div>
                      <p className="text-sm text-gray-500">{t('projectDetail.contact.phone')}</p>
                      <a
                        href={`tel:${project.contactPhone}`}
                        className="font-medium text-[var(--ukraine-600)] hover:underline"
                      >
                        {project.contactPhone}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Form */}
            <ContactForm
              projectId={project.id}
              projectName={localized.facilityName}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            Hromada — {t('homepage.footer')}
          </p>
        </div>
      </footer>
    </main>
  )
}
