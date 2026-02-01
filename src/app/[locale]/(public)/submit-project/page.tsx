'use client'

import { useState, useRef, useEffect } from 'react'
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
  category: Category | ''
  projectType: string
  briefDescription: string
  fullDescription: string
  urgency: Urgency | ''
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
  category: '',
  projectType: '',
  briefDescription: '',
  fullDescription: '',
  urgency: '',
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

  // Dropdown states
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [isProjectTypeOpen, setIsProjectTypeOpen] = useState(false)
  const [isUrgencyOpen, setIsUrgencyOpen] = useState(false)
  const [isCofinancingOpen, setIsCofinancingOpen] = useState(false)

  // Dropdown refs
  const categoryButtonRef = useRef<HTMLButtonElement>(null)
  const projectTypeButtonRef = useRef<HTMLButtonElement>(null)
  const urgencyButtonRef = useRef<HTMLButtonElement>(null)
  const cofinancingButtonRef = useRef<HTMLButtonElement>(null)

  // Close dropdowns on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isCategoryOpen || isProjectTypeOpen || isUrgencyOpen || isCofinancingOpen) {
        setIsCategoryOpen(false)
        setIsProjectTypeOpen(false)
        setIsUrgencyOpen(false)
        setIsCofinancingOpen(false)
      }
    }

    window.addEventListener('scroll', handleScroll, true)
    return () => window.removeEventListener('scroll', handleScroll, true)
  }, [isCategoryOpen, isProjectTypeOpen, isUrgencyOpen, isCofinancingOpen])

  // Format number with commas (e.g., 50000 -> "50,000")
  const formatNumberWithCommas = (value: string): string => {
    const num = value.replace(/[^\d.]/g, '')
    const parts = num.split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return parts.join('.')
  }

  // Parse formatted number back to plain number string (e.g., "50,000" -> "50000")
  const parseFormattedNumber = (value: string): string => {
    return value.replace(/,/g, '')
  }

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  // Special handler for numeric fields with comma formatting
  const handleNumericChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const rawValue = parseFormattedNumber(e.target.value)
    // Only allow digits and one decimal point
    if (/^\d*\.?\d*$/.test(rawValue)) {
      setFormData((prev) => ({ ...prev, [field]: rawValue }))
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }))
      }
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
      <Header />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-[var(--navy-700)] mb-6">
          {t('submitProject.title')}
        </h1>

        <div className="text-[var(--navy-600)] space-y-8">
          <p className="text-xl leading-relaxed text-[var(--navy-500)]">
            {t('submitProject.subtitle')}
          </p>

          <div className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)]">
          <h2 className="font-semibold text-[var(--navy-700)] mb-3">{t('submitProject.beforeYouBegin')}</h2>
          <ul className="text-[var(--navy-600)] space-y-2 text-sm">
            <li>• {t('submitProject.description')}</li>
            <li>• {t('submitProject.allFieldsRequired')}</li>
            <li>• {t('submitProject.securityNote')}</li>
          </ul>
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
                  <div
                    className="relative"
                    onMouseEnter={() => setIsCategoryOpen(true)}
                    onMouseLeave={() => setIsCategoryOpen(false)}
                  >
                    <button
                      type="button"
                      ref={categoryButtonRef}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-[var(--ukraine-200)] focus:border-[var(--ukraine-500)] flex items-center justify-between transition-all duration-150"
                    >
                      <span className="flex items-center gap-2">
                        {formData.category ? (
                          <>
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="w-4 h-4"
                              dangerouslySetInnerHTML={{ __html: CATEGORY_CONFIG[formData.category].icon }}
                            />
                            {t(`categories.${formData.category}`)}
                          </>
                        ) : (
                          `-- ${t('submitProject.fields.selectCategory')} --`
                        )}
                      </span>
                      <svg className={`h-4 w-4 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isCategoryOpen && categoryButtonRef.current && (
                      <div
                        className="fixed z-50 pt-1"
                        style={{
                          top: categoryButtonRef.current.getBoundingClientRect().bottom,
                          left: categoryButtonRef.current.getBoundingClientRect().left,
                          width: categoryButtonRef.current.getBoundingClientRect().width,
                        }}
                        onMouseEnter={() => setIsCategoryOpen(true)}
                        onMouseLeave={() => setIsCategoryOpen(false)}
                      >
                        <div className="rounded-lg bg-white shadow-lg border border-[var(--cream-300)] py-2">
                          {(Object.keys(CATEGORY_CONFIG) as Category[]).map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, category: cat }))
                                setIsCategoryOpen(false)
                              }}
                              className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 ${formData.category === cat ? 'bg-[var(--cream-100)] text-[var(--navy-800)] font-medium' : 'text-[var(--navy-600)] hover:bg-[var(--cream-100)]'}`}
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-4 h-4"
                                dangerouslySetInnerHTML={{ __html: CATEGORY_CONFIG[cat].icon }}
                              />
                              {t(`categories.${cat}`)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                    {t('submitProject.fields.projectType')} <span className="text-red-600">*</span>
                  </label>
                  <div
                    className="relative"
                    onMouseEnter={() => setIsProjectTypeOpen(true)}
                    onMouseLeave={() => setIsProjectTypeOpen(false)}
                  >
                    <button
                      type="button"
                      ref={projectTypeButtonRef}
                      className={`w-full rounded-lg border px-4 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-[var(--ukraine-200)] focus:border-[var(--ukraine-500)] flex items-center justify-between transition-all duration-150 ${
                        errors.projectType ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <span>
                        {formData.projectType
                          ? `${PROJECT_TYPE_CONFIG[formData.projectType as ProjectType].icon} ${t(`projectTypes.${formData.projectType}`)}`
                          : t('submitProject.fields.selectType')}
                      </span>
                      <svg className={`h-4 w-4 transition-transform ${isProjectTypeOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isProjectTypeOpen && projectTypeButtonRef.current && (
                      <div
                        className="fixed z-50 pt-1"
                        style={{
                          top: projectTypeButtonRef.current.getBoundingClientRect().bottom,
                          left: projectTypeButtonRef.current.getBoundingClientRect().left,
                          width: projectTypeButtonRef.current.getBoundingClientRect().width,
                        }}
                        onMouseEnter={() => setIsProjectTypeOpen(true)}
                        onMouseLeave={() => setIsProjectTypeOpen(false)}
                      >
                        <div className="rounded-lg bg-white shadow-lg border border-[var(--cream-300)] py-2">
                          {(Object.keys(PROJECT_TYPE_CONFIG) as ProjectType[]).map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, projectType: type }))
                                if (errors.projectType) {
                                  setErrors((prev) => ({ ...prev, projectType: undefined }))
                                }
                                setIsProjectTypeOpen(false)
                              }}
                              className={`w-full text-left px-4 py-2 text-sm transition-colors ${formData.projectType === type ? 'bg-[var(--cream-100)] text-[var(--navy-800)] font-medium' : 'text-[var(--navy-600)] hover:bg-[var(--cream-100)]'}`}
                            >
                              {PROJECT_TYPE_CONFIG[type].icon} {t(`projectTypes.${type}`)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.projectType && <p className="mt-1 text-sm text-red-600">{errors.projectType}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                    {t('submitProject.fields.urgency')} <span className="text-red-600">*</span>
                  </label>
                  <div
                    className="relative"
                    onMouseEnter={() => setIsUrgencyOpen(true)}
                    onMouseLeave={() => setIsUrgencyOpen(false)}
                  >
                    <button
                      type="button"
                      ref={urgencyButtonRef}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-[var(--ukraine-200)] focus:border-[var(--ukraine-500)] flex items-center justify-between transition-all duration-150"
                    >
                      <span>
                        {formData.urgency
                          ? t(`urgency.${formData.urgency}`)
                          : `-- ${t('submitProject.fields.selectUrgency')} --`}
                      </span>
                      <svg className={`h-4 w-4 transition-transform ${isUrgencyOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isUrgencyOpen && urgencyButtonRef.current && (
                      <div
                        className="fixed z-50 pt-1"
                        style={{
                          top: urgencyButtonRef.current.getBoundingClientRect().bottom,
                          left: urgencyButtonRef.current.getBoundingClientRect().left,
                          width: urgencyButtonRef.current.getBoundingClientRect().width,
                        }}
                        onMouseEnter={() => setIsUrgencyOpen(true)}
                        onMouseLeave={() => setIsUrgencyOpen(false)}
                      >
                        <div className="rounded-lg bg-white shadow-lg border border-[var(--cream-300)] py-2">
                          {(Object.keys(URGENCY_CONFIG) as Urgency[]).map((urg) => (
                            <button
                              key={urg}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, urgency: urg }))
                                setIsUrgencyOpen(false)
                              }}
                              className={`w-full text-left px-4 py-2 text-sm transition-colors ${formData.urgency === urg ? 'bg-[var(--cream-100)] text-[var(--navy-800)] font-medium' : 'text-[var(--navy-600)] hover:bg-[var(--cream-100)]'}`}
                            >
                              {t(`urgency.${urg}`)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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
                    type="text"
                    inputMode="decimal"
                    value={formatNumberWithCommas(formData.estimatedCostUsd)}
                    onChange={handleNumericChange('estimatedCostUsd')}
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
                      type="text"
                      inputMode="decimal"
                      value={formatNumberWithCommas(formData.technicalPowerKw)}
                      onChange={handleNumericChange('technicalPowerKw')}
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
                      type="text"
                      inputMode="numeric"
                      value={formatNumberWithCommas(formData.numberOfPanels)}
                      onChange={handleNumericChange('numberOfPanels')}
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
                  <div
                    className="relative"
                    onMouseEnter={() => setIsCofinancingOpen(true)}
                    onMouseLeave={() => setIsCofinancingOpen(false)}
                  >
                    <button
                      type="button"
                      ref={cofinancingButtonRef}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-[var(--ukraine-200)] focus:border-[var(--ukraine-500)] flex items-center justify-between transition-all duration-150"
                    >
                      <span>
                        {formData.cofinancingAvailable === 'YES' ? t('cofinancing.YES')
                          : formData.cofinancingAvailable === 'NO' ? t('cofinancing.NO')
                          : formData.cofinancingAvailable === 'NEEDS_CLARIFICATION' ? t('submitProject.fields.needsDiscussion')
                          : t('submitProject.fields.select')}
                      </span>
                      <svg className={`h-4 w-4 transition-transform ${isCofinancingOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isCofinancingOpen && cofinancingButtonRef.current && (
                      <div
                        className="fixed z-50 pt-1"
                        style={{
                          top: cofinancingButtonRef.current.getBoundingClientRect().bottom,
                          left: cofinancingButtonRef.current.getBoundingClientRect().left,
                          width: cofinancingButtonRef.current.getBoundingClientRect().width,
                        }}
                        onMouseEnter={() => setIsCofinancingOpen(true)}
                        onMouseLeave={() => setIsCofinancingOpen(false)}
                      >
                        <div className="rounded-lg bg-white shadow-lg border border-[var(--cream-300)] py-2">
                          {[
                            { value: 'YES', label: t('cofinancing.YES') },
                            { value: 'NO', label: t('cofinancing.NO') },
                            { value: 'NEEDS_CLARIFICATION', label: t('submitProject.fields.needsDiscussion') },
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, cofinancingAvailable: option.value }))
                                setIsCofinancingOpen(false)
                              }}
                              className={`w-full text-left px-4 py-2 text-sm transition-colors ${formData.cofinancingAvailable === option.value ? 'bg-[var(--cream-100)] text-[var(--navy-800)] font-medium' : 'text-[var(--navy-600)] hover:bg-[var(--cream-100)]'}`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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
      </main>
    </div>
  )
}
