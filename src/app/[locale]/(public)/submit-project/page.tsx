'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import {
  type Category,
  type Urgency,
  type ProjectType,
  CATEGORY_CONFIG,
  URGENCY_CONFIG,
  PROJECT_TYPE_CONFIG,
} from '@/types'
import { PublicImageUpload } from '@/components/forms/PublicImageUpload'

interface FormData {
  // Municipality info
  municipalityName: string
  municipalityEmail: string
  region: string
  // Project details
  facilityName: string
  category: Category
  projectType: string
  briefDescription: string
  fullDescription: string
  urgency: Urgency
  // Technical & financial
  estimatedCostUsd: string
  technicalPowerKw: string
  numberOfPanels: string
  cofinancingAvailable: string
  cofinancingDetails: string
  // Location
  cityName: string
  address: string
  cityLatitude: string
  cityLongitude: string
  // Contact
  contactName: string
  contactEmail: string
  contactPhone: string
  // Supporting info
  partnerOrganization: string
  projectSubtype: string
  additionalNotes: string
  // Photos
  photos: string[]
}

const initialFormData: FormData = {
  municipalityName: '',
  municipalityEmail: '',
  region: '',
  facilityName: '',
  category: 'OTHER',
  projectType: '',
  briefDescription: '',
  fullDescription: '',
  urgency: 'MEDIUM',
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
  partnerOrganization: '',
  projectSubtype: '',
  additionalNotes: '',
  photos: [],
}

export default function SubmitProjectPage() {
  const t = useTranslations()
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

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

    // Required fields
    if (!formData.municipalityName.trim()) newErrors.municipalityName = t('submitProject.validation.required')
    if (!formData.municipalityEmail.trim()) {
      newErrors.municipalityEmail = t('submitProject.validation.required')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.municipalityEmail)) {
      newErrors.municipalityEmail = t('submitProject.validation.invalidEmail')
    }

    if (!formData.facilityName.trim()) newErrors.facilityName = t('submitProject.validation.required')
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

    // Validate coordinates
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

    // Optional numeric fields
    if (formData.estimatedCostUsd.trim()) {
      const cost = parseFloat(formData.estimatedCostUsd)
      if (isNaN(cost) || cost <= 0) {
        newErrors.estimatedCostUsd = t('submitProject.validation.positiveNumber')
      }
    }
    if (formData.technicalPowerKw.trim()) {
      const power = parseFloat(formData.technicalPowerKw)
      if (isNaN(power) || power <= 0) {
        newErrors.technicalPowerKw = t('submitProject.validation.positiveNumber')
      }
    }
    if (formData.numberOfPanels.trim()) {
      const panels = parseInt(formData.numberOfPanels)
      if (isNaN(panels) || panels <= 0) {
        newErrors.numberOfPanels = t('submitProject.validation.positiveWholeNumber')
      }
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
      const response = await fetch('/api/projects/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSubmitSuccess(true)
        setFormData(initialFormData)
      } else {
        const data = await response.json()
        setSubmitError(data.error || t('submitProject.error.message'))
      }
    } catch {
      setSubmitError(t('submitProject.error.network'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const showTechnicalPower = formData.projectType === 'SOLAR_PV' || formData.projectType === 'HEAT_PUMP'
  const showPanels = formData.projectType === 'SOLAR_PV'
  const showCofinancingDetails = formData.cofinancingAvailable === 'YES'

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-[var(--cream-50)]">
        <Header />

        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-[var(--cream-100)] rounded-xl p-8 border border-[var(--cream-300)]">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#7B9E6B20] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#5A7D4A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[var(--navy-700)] mb-4">
              {t('submitProject.success.title')}
            </h1>
            <p className="text-[var(--navy-600)] mb-6">
              {t('submitProject.success.message', { email: formData.contactEmail || 'your email' })}
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/">
                <Button variant="primary" className="bg-[var(--navy-700)] hover:bg-[var(--navy-800)]">
                  {t('submitProject.buttons.backToHome')}
                </Button>
              </Link>
              <Button variant="outline" onClick={() => setSubmitSuccess(false)}>
                {t('submitProject.buttons.submitAnother')}
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--cream-50)]">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <div className="bg-[var(--navy-700)] text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {t('submitProject.title')}
          </h1>
          <p className="text-lg text-[var(--navy-100)] max-w-2xl mx-auto">
            {t('submitProject.subtitle')}
          </p>
        </div>
      </div>

      {/* Form Instructions */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)] mb-8">
          <h2 className="font-semibold text-[var(--navy-700)] mb-3">{t('submitProject.beforeYouBegin')}</h2>
          <ul className="text-[var(--navy-600)] space-y-2 text-sm">
            <li>• {t('submitProject.description')}</li>
            <li>• {t('submitProject.allFieldsRequired')}</li>
            <li>• {t('submitProject.securityNote')}</li>
          </ul>
          <p className="text-sm text-[var(--navy-500)] mt-4">
            {t('submitProject.questionsContact')} <a href="mailto:support@hromada.org" className="text-[var(--navy-700)] underline">support@hromada.org</a>
          </p>
        </div>

        {/* Error Alert */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
            <p className="text-red-700">{submitError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Municipality Information */}
          <section className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)]">
            <h2 className="text-lg font-semibold text-[var(--navy-700)] mb-4 pb-2 border-b border-[var(--cream-300)]">
              {t('submitProject.sections.municipalityInfo')}
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                  {t('submitProject.fields.municipalityName')} <span className="text-red-600">*</span>
                </label>
                <Input
                  value={formData.municipalityName}
                  onChange={handleChange('municipalityName')}
                  placeholder={t('submitProject.fields.municipalityNamePlaceholder')}
                  error={errors.municipalityName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                  {t('submitProject.fields.municipalityEmail')} <span className="text-red-600">*</span>
                </label>
                <Input
                  type="email"
                  value={formData.municipalityEmail}
                  onChange={handleChange('municipalityEmail')}
                  placeholder={t('submitProject.fields.municipalityEmailPlaceholder')}
                  error={errors.municipalityEmail}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                  {t('submitProject.fields.region')}
                </label>
                <Input
                  value={formData.region}
                  onChange={handleChange('region')}
                  placeholder={t('submitProject.fields.regionPlaceholder')}
                />
              </div>
            </div>
          </section>

          {/* Section 2: Project Details */}
          <section className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)]">
            <h2 className="text-lg font-semibold text-[var(--navy-700)] mb-4 pb-2 border-b border-[var(--cream-300)]">
              {t('submitProject.sections.projectDetails')}
            </h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                    {t('submitProject.fields.facilityName')} <span className="text-red-600">*</span>
                  </label>
                  <Input
                    value={formData.facilityName}
                    onChange={handleChange('facilityName')}
                    placeholder={t('submitProject.fields.facilityPlaceholder')}
                    error={errors.facilityName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                    {t('submitProject.fields.category')} <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={handleChange('category')}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--navy-200)] focus:border-[var(--navy-500)]"
                  >
                    {(Object.keys(CATEGORY_CONFIG) as Category[]).map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_CONFIG[cat].icon} {t(`categories.${cat}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                    {t('submitProject.fields.projectType')} <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.projectType}
                    onChange={handleChange('projectType')}
                    className={`w-full rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--navy-200)] focus:border-[var(--navy-500)] ${
                      errors.projectType ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">{t('submitProject.fields.selectType')}</option>
                    {(Object.keys(PROJECT_TYPE_CONFIG) as ProjectType[]).map((type) => (
                      <option key={type} value={type}>
                        {PROJECT_TYPE_CONFIG[type].icon} {t(`projectTypes.${type}`)}
                      </option>
                    ))}
                  </select>
                  {errors.projectType && <p className="mt-1 text-sm text-red-600">{errors.projectType}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                    {t('submitProject.fields.urgency')} <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.urgency}
                    onChange={handleChange('urgency')}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--navy-200)] focus:border-[var(--navy-500)]"
                  >
                    {(Object.keys(URGENCY_CONFIG) as Urgency[]).map((urg) => (
                      <option key={urg} value={urg}>
                        {t(`urgency.${urg}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                  {t('submitProject.fields.briefDescription')} <span className="text-red-600">*</span>
                  <span className="text-[var(--navy-400)] font-normal ml-2">
                    ({formData.briefDescription.length}/150)
                  </span>
                </label>
                <Textarea
                  value={formData.briefDescription}
                  onChange={handleChange('briefDescription')}
                  placeholder={t('submitProject.fields.briefDescriptionHelper')}
                  error={errors.briefDescription}
                  rows={2}
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                  {t('submitProject.fields.fullDescription')} <span className="text-red-600">*</span>
                  <span className="text-[var(--navy-400)] font-normal ml-2">
                    ({formData.fullDescription.length}/2000)
                  </span>
                </label>
                <Textarea
                  value={formData.fullDescription}
                  onChange={handleChange('fullDescription')}
                  placeholder={t('submitProject.fields.fullDescriptionHelper')}
                  error={errors.fullDescription}
                  rows={6}
                />
              </div>
            </div>
          </section>

          {/* Section 3: Technical & Financial Information */}
          <section className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)]">
            <h2 className="text-lg font-semibold text-[var(--navy-700)] mb-4 pb-2 border-b border-[var(--cream-300)]">
              {t('submitProject.sections.technicalFinancial')}
            </h2>
            <p className="text-sm text-[var(--navy-500)] mb-4">
              {t('submitProject.optionalFieldsNote')}
            </p>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                    {t('submitProject.fields.estimatedCost')}
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.estimatedCostUsd}
                    onChange={handleChange('estimatedCostUsd')}
                    placeholder={t('submitProject.fields.costPlaceholder')}
                    error={errors.estimatedCostUsd}
                  />
                </div>
                {showTechnicalPower && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                      {t('submitProject.fields.technicalPower')}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.technicalPowerKw}
                      onChange={handleChange('technicalPowerKw')}
                      placeholder={t('submitProject.fields.technicalPowerPlaceholder')}
                      error={errors.technicalPowerKw}
                    />
                  </div>
                )}
                {showPanels && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                      {t('submitProject.fields.numberOfPanels')}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.numberOfPanels}
                      onChange={handleChange('numberOfPanels')}
                      placeholder={t('submitProject.fields.numberOfPanelsPlaceholder')}
                      error={errors.numberOfPanels}
                    />
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                    {t('submitProject.fields.cofinancingAvailable')}
                  </label>
                  <select
                    value={formData.cofinancingAvailable}
                    onChange={handleChange('cofinancingAvailable')}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--navy-200)] focus:border-[var(--navy-500)]"
                  >
                    <option value="">{t('submitProject.fields.select')}</option>
                    <option value="YES">{t('cofinancing.YES')}</option>
                    <option value="NO">{t('cofinancing.NO')}</option>
                    <option value="NEEDS_CLARIFICATION">{t('submitProject.fields.needsDiscussion')}</option>
                  </select>
                </div>
                {showCofinancingDetails && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                      {t('submitProject.fields.cofinancingDetails')}
                    </label>
                    <Input
                      value={formData.cofinancingDetails}
                      onChange={handleChange('cofinancingDetails')}
                      placeholder={t('submitProject.fields.cofinancingPlaceholder')}
                    />
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section 4: Location */}
          <section className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)]">
            <h2 className="text-lg font-semibold text-[var(--navy-700)] mb-4 pb-2 border-b border-[var(--cream-300)]">
              {t('submitProject.sections.location')}
            </h2>
            <p className="text-sm text-[var(--navy-500)] mb-4">
              {t('submitProject.securityNote')}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                  {t('submitProject.fields.cityName')} <span className="text-red-600">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      value={formData.cityName}
                      onChange={handleChange('cityName')}
                      placeholder={t('submitProject.fields.cityNamePlaceholder')}
                      error={errors.cityName}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={geocodeCity}
                    isLoading={isGeocoding}
                    loadingText={t('submitProject.fields.findingCoordinates')}
                  >
                    {t('submitProject.fields.getCoordinates')}
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                  {t('submitProject.fields.address')}
                </label>
                <Input
                  value={formData.address}
                  onChange={handleChange('address')}
                  placeholder={t('submitProject.fields.addressPlaceholder')}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                    {t('submitProject.fields.cityLatitude')} <span className="text-red-600">*</span>
                  </label>
                  <Input
                    value={formData.cityLatitude}
                    onChange={handleChange('cityLatitude')}
                    placeholder={t('submitProject.fields.cityLatitudePlaceholder')}
                    error={errors.cityLatitude}
                  />
                  <p className="text-xs text-[var(--navy-400)] mt-1">{t('submitProject.fields.coordinatesHelper')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                    {t('submitProject.fields.cityLongitude')} <span className="text-red-600">*</span>
                  </label>
                  <Input
                    value={formData.cityLongitude}
                    onChange={handleChange('cityLongitude')}
                    placeholder={t('submitProject.fields.cityLongitudePlaceholder')}
                    error={errors.cityLongitude}
                  />
                  <p className="text-xs text-[var(--navy-400)] mt-1">{t('submitProject.fields.coordinatesHelper')}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Contact Information */}
          <section className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)]">
            <h2 className="text-lg font-semibold text-[var(--navy-700)] mb-4 pb-2 border-b border-[var(--cream-300)]">
              {t('submitProject.sections.contactInfo')}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                  {t('submitProject.fields.contactName')} <span className="text-red-600">*</span>
                </label>
                <Input
                  value={formData.contactName}
                  onChange={handleChange('contactName')}
                  placeholder={t('submitProject.fields.contactNamePlaceholder')}
                  error={errors.contactName}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                    {t('submitProject.fields.contactEmail')} <span className="text-red-600">*</span>
                  </label>
                  <Input
                    type="email"
                    value={formData.contactEmail}
                    onChange={handleChange('contactEmail')}
                    placeholder={t('submitProject.fields.contactEmailPlaceholder')}
                    error={errors.contactEmail}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                    {t('submitProject.fields.contactPhone')}
                  </label>
                  <Input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={handleChange('contactPhone')}
                    placeholder={t('submitProject.fields.phonePlaceholder')}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Supporting Information */}
          <section className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)]">
            <h2 className="text-lg font-semibold text-[var(--navy-700)] mb-4 pb-2 border-b border-[var(--cream-300)]">
              {t('submitProject.sections.supportingInfo')} <span className="text-[var(--navy-400)] font-normal">({t('submitProject.sections.optional')})</span>
            </h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                    {t('submitProject.fields.partnerOrganization')}
                  </label>
                  <Input
                    value={formData.partnerOrganization}
                    onChange={handleChange('partnerOrganization')}
                    placeholder={t('submitProject.fields.partnerPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                    {t('submitProject.fields.projectSubtype')}
                  </label>
                  <Input
                    value={formData.projectSubtype}
                    onChange={handleChange('projectSubtype')}
                    placeholder={t('submitProject.fields.subtypePlaceholder')}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                  {t('submitProject.fields.additionalNotes')}
                </label>
                <Textarea
                  value={formData.additionalNotes}
                  onChange={handleChange('additionalNotes')}
                  placeholder={t('submitProject.fields.notesPlaceholder')}
                  rows={3}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </section>

          {/* Section 7: Project Photos */}
          <section className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)]">
            <h2 className="text-lg font-semibold text-[var(--navy-700)] mb-4 pb-2 border-b border-[var(--cream-300)]">
              {t('submitProject.photos.title')} <span className="text-[var(--navy-400)] font-normal">({t('submitProject.sections.optional')})</span>
            </h2>
            <p className="text-sm text-[var(--navy-500)] mb-4">
              {t('submitProject.photos.description')}
            </p>
            <PublicImageUpload
              images={formData.photos}
              onChange={handlePhotosChange}
              maxImages={5}
            />
          </section>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Link href="/">
              <Button type="button" variant="ghost">
                {t('submitProject.buttons.cancel')}
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              className="bg-[var(--navy-700)] hover:bg-[var(--navy-800)]"
              isLoading={isSubmitting}
              loadingText={t('submitProject.buttons.submitting')}
            >
              {t('submitProject.buttons.submit')}
            </Button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-[var(--cream-300)] bg-[var(--cream-100)]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs text-[var(--navy-600)]">
            <span className="font-medium">hromada</span> {t('homepage.footer')}
          </p>
        </div>
      </footer>
    </div>
  )
}
