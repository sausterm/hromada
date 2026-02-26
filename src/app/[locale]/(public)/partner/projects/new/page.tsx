'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { PublicImageUpload } from '@/components/forms/PublicImageUpload'
import {
  type Category,
  CATEGORY_CONFIG,
  PROJECT_TYPE_CONFIG,
} from '@/types'

interface FormData {
  municipalityName: string
  municipalityEmail: string
  region: string
  facilityName: string
  category: Category | ''
  projectType: string
  briefDescription: string
  fullDescription: string
  estimatedCostUsd: string
  technicalPowerKw: string
  numberOfPanels: string
  cofinancingAvailable: string
  cofinancingDetails: string
  cityName: string
  address: string
  cityLatitude: string
  cityLongitude: string
  contactName: string
  contactEmail: string
  contactPhone: string
  partnerOrganization: string
  edrpou: string
  projectSubtype: string
  additionalNotes: string
  photos: string[]
}

const initialFormData: FormData = {
  municipalityName: '',
  municipalityEmail: '',
  region: '',
  facilityName: '',
  category: '',
  projectType: '',
  briefDescription: '',
  fullDescription: '',
  estimatedCostUsd: '',
  technicalPowerKw: '',
  numberOfPanels: '',
  cofinancingAvailable: '',
  cofinancingDetails: '',
  cityName: '',
  address: '',
  cityLatitude: '',
  cityLongitude: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  edrpou: '',
  partnerOrganization: '',
  projectSubtype: '',
  additionalNotes: '',
  photos: [],
}

export default function PartnerNewProjectPage() {
  const t = useTranslations()
  const router = useRouter()
  const { isAuthenticated, isLoading, isPartner, user } = useAuth()

  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Pre-fill partner organization from user
  useEffect(() => {
    if (user?.organization) {
      setFormData((prev) => ({ ...prev, partnerOrganization: user.organization || '' }))
    }
  }, [user])

  // Redirect if not authenticated or not a partner
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    } else if (!isLoading && isAuthenticated && !isPartner()) {
      router.push('/')
    }
  }, [isLoading, isAuthenticated, isPartner, router])

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handlePhotosChange = (photos: string[]) => {
    setFormData((prev) => ({ ...prev, photos }))
  }

  const geocodeCity = async () => {
    if (!formData.cityName.trim()) {
      setErrors((prev) => ({ ...prev, cityName: t('submitProject.validation.enterCityFirst') }))
      return
    }

    setIsGeocoding(true)
    try {
      const query = `${formData.cityName}, Ukraine`
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        { headers: { 'User-Agent': 'Hromada/1.0' } }
      )
      const data = await response.json()

      if (data && data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          cityLatitude: data[0].lat,
          cityLongitude: data[0].lon,
        }))
        setErrors((prev) => ({ ...prev, cityLatitude: undefined, cityLongitude: undefined }))
      } else {
        setErrors((prev) => ({ ...prev, cityName: t('submitProject.validation.coordinatesNotFound') }))
      }
    } catch {
      setErrors((prev) => ({ ...prev, cityName: t('submitProject.validation.geocodingFailed') }))
    } finally {
      setIsGeocoding(false)
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}

    if (!formData.municipalityName.trim()) newErrors.municipalityName = t('submitProject.validation.required')
    if (!formData.municipalityEmail.trim()) {
      newErrors.municipalityEmail = t('submitProject.validation.required')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.municipalityEmail)) {
      newErrors.municipalityEmail = t('submitProject.validation.invalidEmail')
    }
    if (!formData.facilityName.trim()) newErrors.facilityName = t('submitProject.validation.required')
    if (!formData.category) newErrors.category = t('submitProject.validation.required')
    if (!formData.projectType) newErrors.projectType = t('submitProject.validation.required')
    if (!formData.briefDescription.trim()) {
      newErrors.briefDescription = t('submitProject.validation.required')
    } else if (formData.briefDescription.length > 150) {
      newErrors.briefDescription = t('submitProject.validation.tooLong', { max: 150 })
    }
    if (!formData.fullDescription.trim()) {
      newErrors.fullDescription = t('submitProject.validation.required')
    } else if (formData.fullDescription.length > 2000) {
      newErrors.fullDescription = t('submitProject.validation.tooLong', { max: 2000 })
    }
    if (!formData.cityName.trim()) newErrors.cityName = t('submitProject.validation.required')
    if (!formData.cityLatitude.trim()) newErrors.cityLatitude = t('submitProject.validation.required')
    if (!formData.cityLongitude.trim()) newErrors.cityLongitude = t('submitProject.validation.required')

    const lat = parseFloat(formData.cityLatitude)
    const lng = parseFloat(formData.cityLongitude)
    if (formData.cityLatitude && (isNaN(lat) || lat < -90 || lat > 90)) {
      newErrors.cityLatitude = t('submitProject.validation.invalidLatitude')
    }
    if (formData.cityLongitude && (isNaN(lng) || lng < -180 || lng > 180)) {
      newErrors.cityLongitude = t('submitProject.validation.invalidLongitude')
    }

    if (!formData.contactName.trim()) newErrors.contactName = t('submitProject.validation.required')
    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = t('submitProject.validation.required')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = t('submitProject.validation.invalidEmail')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!validate()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/partner/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSubmitSuccess(true)
      } else {
        const data = await response.json()
        setSubmitError(data.error || t('partner.submission.error'))
      }
    } catch {
      setSubmitError(t('submitProject.error.network'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cream-100)]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated || !isPartner()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cream-100)]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-[var(--cream-100)]">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <Link href="/partner" className="text-xl font-bold text-[var(--ukraine-600)]">
              Hromada
            </Link>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          <Card>
            <CardContent className="p-8">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('partner.submission.success')}</h1>
              <div className="flex gap-4 justify-center">
                <Link href="/partner">
                  <Button variant="primary">{t('admin.projects.backToDashboard')}</Button>
                </Link>
                <Button variant="outline" onClick={() => {
                  setSubmitSuccess(false)
                  setFormData(initialFormData)
                }}>
                  {t('submitProject.buttons.submitAnother')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--cream-100)]">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/partner" className="text-xl font-bold text-[var(--ukraine-600)]">
              Hromada
            </Link>
            <Badge variant="info">{t('partner.title')}</Badge>
          </div>
          <Link href="/partner">
            <Button variant="ghost">{t('admin.projects.backToDashboard')}</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('partner.submission.title')}</h1>
        <p className="text-gray-600 mb-8">{t('partner.submission.description')}</p>

        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{submitError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Municipality Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t('submitProject.sections.municipalityInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('submitProject.fields.municipalityName')} *
                  </label>
                  <Input
                    value={formData.municipalityName}
                    onChange={handleChange('municipalityName')}
                    placeholder={t('submitProject.fields.municipalityNamePlaceholder')}
                    error={errors.municipalityName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('submitProject.fields.municipalityEmail')} *
                  </label>
                  <Input
                    type="email"
                    value={formData.municipalityEmail}
                    onChange={handleChange('municipalityEmail')}
                    placeholder={t('submitProject.fields.municipalityEmailPlaceholder')}
                    error={errors.municipalityEmail}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('submitProject.fields.region')}
                  </label>
                  <Input
                    value={formData.region}
                    onChange={handleChange('region')}
                    placeholder={t('submitProject.fields.regionPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    EDRPOU (ЄДРПОУ)
                  </label>
                  <Input
                    value={formData.edrpou}
                    onChange={handleChange('edrpou')}
                    placeholder="e.g. 04054866"
                    maxLength={8}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    8-digit municipality registry code. Found on official documents. If unknown, leave blank and contact us.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle>{t('submitProject.sections.projectDetails')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('submitProject.fields.facilityName')} *
                </label>
                <Input
                  value={formData.facilityName}
                  onChange={handleChange('facilityName')}
                  placeholder={t('submitProject.fields.facilityPlaceholder')}
                  error={errors.facilityName}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('submitProject.fields.category')} *
                  </label>
                  <select
                    value={formData.category}
                    onChange={handleChange('category')}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.category ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">-- {t('submitProject.fields.selectCategory')} --</option>
                    {(Object.keys(CATEGORY_CONFIG) as Category[]).map((cat) => (
                      <option key={cat} value={cat}>{t(`categories.${cat}`)}</option>
                    ))}
                  </select>
                  {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('submitProject.fields.projectType')} *
                  </label>
                  <select
                    value={formData.projectType}
                    onChange={handleChange('projectType')}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.projectType ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">{t('submitProject.fields.selectType')}</option>
                    {Object.keys(PROJECT_TYPE_CONFIG).map((type) => (
                      <option key={type} value={type}>{t(`projectTypes.${type}`)}</option>
                    ))}
                  </select>
                  {errors.projectType && <p className="text-red-500 text-xs mt-1">{errors.projectType}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('submitProject.fields.briefDescription')} *
                </label>
                <Input
                  value={formData.briefDescription}
                  onChange={handleChange('briefDescription')}
                  placeholder={t('submitProject.fields.briefDescriptionHelper')}
                  error={errors.briefDescription}
                  maxLength={150}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.briefDescription.length}/150</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('submitProject.fields.fullDescription')} *
                </label>
                <Textarea
                  value={formData.fullDescription}
                  onChange={handleChange('fullDescription')}
                  placeholder={t('submitProject.fields.fullDescriptionHelper')}
                  error={errors.fullDescription}
                  rows={5}
                  maxLength={2000}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.fullDescription.length}/2000</p>
              </div>
            </CardContent>
          </Card>

          {/* Technical & Financial */}
          <Card>
            <CardHeader>
              <CardTitle>{t('submitProject.sections.technicalFinancial')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('submitProject.fields.estimatedCost')}
                  </label>
                  <Input
                    value={formData.estimatedCostUsd}
                    onChange={handleChange('estimatedCostUsd')}
                    placeholder={t('submitProject.fields.costPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('submitProject.fields.technicalPower')}
                  </label>
                  <Input
                    value={formData.technicalPowerKw}
                    onChange={handleChange('technicalPowerKw')}
                    placeholder={t('submitProject.fields.technicalPowerPlaceholder')}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('submitProject.fields.numberOfPanels')}
                  </label>
                  <Input
                    value={formData.numberOfPanels}
                    onChange={handleChange('numberOfPanels')}
                    placeholder={t('submitProject.fields.numberOfPanelsPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('submitProject.fields.cofinancingAvailable')}
                  </label>
                  <select
                    value={formData.cofinancingAvailable}
                    onChange={handleChange('cofinancingAvailable')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('submitProject.fields.select')}</option>
                    <option value="YES">{t('cofinancing.YES')}</option>
                    <option value="NO">{t('cofinancing.NO')}</option>
                    <option value="NEEDS_CLARIFICATION">{t('cofinancing.NEEDS_CLARIFICATION')}</option>
                  </select>
                </div>
              </div>
              {formData.cofinancingAvailable === 'YES' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('submitProject.fields.cofinancingDetails')}
                  </label>
                  <Input
                    value={formData.cofinancingDetails}
                    onChange={handleChange('cofinancingDetails')}
                    placeholder={t('submitProject.fields.cofinancingPlaceholder')}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>{t('submitProject.sections.location')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('submitProject.fields.cityName')} *
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.cityName}
                      onChange={handleChange('cityName')}
                      placeholder={t('submitProject.fields.cityNamePlaceholder')}
                      error={errors.cityName}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={geocodeCity}
                      disabled={isGeocoding}
                      className="shrink-0"
                    >
                      {isGeocoding ? t('submitProject.fields.findingCoordinates') : t('submitProject.fields.getCoordinates')}
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('submitProject.fields.address')}
                  </label>
                  <Input
                    value={formData.address}
                    onChange={handleChange('address')}
                    placeholder={t('submitProject.fields.addressPlaceholder')}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('submitProject.fields.cityLatitude')} *
                  </label>
                  <Input
                    value={formData.cityLatitude}
                    onChange={handleChange('cityLatitude')}
                    placeholder={t('submitProject.fields.cityLatitudePlaceholder')}
                    error={errors.cityLatitude}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('submitProject.fields.cityLongitude')} *
                  </label>
                  <Input
                    value={formData.cityLongitude}
                    onChange={handleChange('cityLongitude')}
                    placeholder={t('submitProject.fields.cityLongitudePlaceholder')}
                    error={errors.cityLongitude}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">{t('submitProject.fields.coordinatesHelper')}</p>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t('submitProject.sections.contactInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('submitProject.fields.contactName')} *
                  </label>
                  <Input
                    value={formData.contactName}
                    onChange={handleChange('contactName')}
                    placeholder={t('submitProject.fields.contactNamePlaceholder')}
                    error={errors.contactName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('submitProject.fields.contactEmail')} *
                  </label>
                  <Input
                    type="email"
                    value={formData.contactEmail}
                    onChange={handleChange('contactEmail')}
                    placeholder={t('submitProject.fields.contactEmailPlaceholder')}
                    error={errors.contactEmail}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('submitProject.fields.contactPhone')}
                  </label>
                  <Input
                    value={formData.contactPhone}
                    onChange={handleChange('contactPhone')}
                    placeholder={t('submitProject.fields.phonePlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('submitProject.fields.partnerOrganization')}
                  </label>
                  <Input
                    value={formData.partnerOrganization}
                    onChange={handleChange('partnerOrganization')}
                    placeholder={t('submitProject.fields.partnerPlaceholder')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t('submitProject.sections.supportingInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('submitProject.fields.projectSubtype')}
                </label>
                <Input
                  value={formData.projectSubtype}
                  onChange={handleChange('projectSubtype')}
                  placeholder={t('submitProject.fields.subtypePlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('submitProject.fields.additionalNotes')}
                </label>
                <Textarea
                  value={formData.additionalNotes}
                  onChange={handleChange('additionalNotes')}
                  placeholder={t('submitProject.fields.notesPlaceholder')}
                  rows={3}
                  maxLength={1000}
                />
              </div>
            </CardContent>
          </Card>

          {/* Project Photos */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t('submitProject.photos.title')}{' '}
                <span className="text-gray-400 font-normal">({t('submitProject.sections.optional')})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                {t('submitProject.photos.description')}
              </p>
              <PublicImageUpload
                images={formData.photos}
                onChange={handlePhotosChange}
                maxImages={5}
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Link href="/partner">
              <Button type="button" variant="outline">
                {t('admin.projects.backToDashboard')}
              </Button>
            </Link>
            <Button type="submit" isLoading={isSubmitting} className="flex-1">
              {t('submitProject.buttons.submit')}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
