'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import {
  type Category,
  type Urgency,
  CATEGORY_CONFIG,
  URGENCY_CONFIG,
} from '@/types'

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
}

const PROJECT_TYPES = [
  { value: 'SOLAR_PV', label: 'Solar PV Installation' },
  { value: 'HEAT_PUMP', label: 'Heat Pump System' },
  { value: 'WATER_TREATMENT', label: 'Water Treatment' },
  { value: 'GENERAL', label: 'General Infrastructure' },
  { value: 'OTHER', label: 'Other' },
]

export default function SubmitProjectPage() {
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

  const geocodeCity = async () => {
    if (!formData.cityName.trim()) {
      setErrors((prev) => ({ ...prev, cityName: 'Enter a city name first' }))
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
        setErrors((prev) => ({ ...prev, cityName: 'Could not find coordinates for this city' }))
      }
    } catch {
      setErrors((prev) => ({ ...prev, cityName: 'Geocoding failed. Please enter coordinates manually.' }))
    } finally {
      setIsGeocoding(false)
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}

    // Required fields
    if (!formData.municipalityName.trim()) newErrors.municipalityName = 'Required'
    if (!formData.municipalityEmail.trim()) {
      newErrors.municipalityEmail = 'Required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.municipalityEmail)) {
      newErrors.municipalityEmail = 'Invalid email format'
    }

    if (!formData.facilityName.trim()) newErrors.facilityName = 'Required'
    if (!formData.projectType) newErrors.projectType = 'Required'

    if (!formData.briefDescription.trim()) {
      newErrors.briefDescription = 'Required'
    } else if (formData.briefDescription.length > 150) {
      newErrors.briefDescription = 'Maximum 150 characters'
    }

    if (!formData.fullDescription.trim()) {
      newErrors.fullDescription = 'Required'
    } else if (formData.fullDescription.length > 2000) {
      newErrors.fullDescription = 'Maximum 2000 characters'
    }

    if (!formData.cityName.trim()) newErrors.cityName = 'Required'
    if (!formData.cityLatitude.trim()) newErrors.cityLatitude = 'Required'
    if (!formData.cityLongitude.trim()) newErrors.cityLongitude = 'Required'

    // Validate coordinates
    const lat = parseFloat(formData.cityLatitude)
    const lng = parseFloat(formData.cityLongitude)
    if (formData.cityLatitude && (isNaN(lat) || lat < -90 || lat > 90)) {
      newErrors.cityLatitude = 'Invalid latitude (-90 to 90)'
    }
    if (formData.cityLongitude && (isNaN(lng) || lng < -180 || lng > 180)) {
      newErrors.cityLongitude = 'Invalid longitude (-180 to 180)'
    }

    if (!formData.contactName.trim()) newErrors.contactName = 'Required'
    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Invalid email format'
    }

    // Optional numeric fields
    if (formData.estimatedCostUsd.trim()) {
      const cost = parseFloat(formData.estimatedCostUsd)
      if (isNaN(cost) || cost <= 0) {
        newErrors.estimatedCostUsd = 'Must be a positive number'
      }
    }
    if (formData.technicalPowerKw.trim()) {
      const power = parseFloat(formData.technicalPowerKw)
      if (isNaN(power) || power <= 0) {
        newErrors.technicalPowerKw = 'Must be a positive number'
      }
    }
    if (formData.numberOfPanels.trim()) {
      const panels = parseInt(formData.numberOfPanels)
      if (isNaN(panels) || panels <= 0) {
        newErrors.numberOfPanels = 'Must be a positive whole number'
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
        setSubmitError(data.error || 'Failed to submit project. Please try again.')
      }
    } catch {
      setSubmitError('Network error. Please check your connection and try again.')
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
        <header className="bg-[var(--cream-100)] border-b border-[var(--cream-300)] shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Link href="/" className="text-2xl font-bold text-[var(--navy-700)]">
              hromada <span className="opacity-60">|</span> громада
            </Link>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-[var(--cream-100)] rounded-xl p-8 border border-[var(--cream-300)]">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#7B9E6B20] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#5A7D4A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[var(--navy-700)] mb-4">
              Thank You for Your Submission!
            </h1>
            <p className="text-[var(--navy-600)] mb-6">
              Our team will review your project and contact you at <strong>{formData.contactEmail || 'your email'}</strong> within 3-5 business days.
              You will receive an email confirmation shortly.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/">
                <Button variant="primary" className="bg-[var(--navy-700)] hover:bg-[var(--navy-800)]">
                  Back to Home
                </Button>
              </Link>
              <Button variant="outline" onClick={() => setSubmitSuccess(false)}>
                Submit Another Project
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
      <header className="bg-[var(--cream-100)] border-b border-[var(--cream-300)] shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-[var(--navy-700)]">
            hromada <span className="opacity-60">|</span> громада
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              &larr; Back to Projects
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-[var(--navy-700)] text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Submit Your Infrastructure Project
          </h1>
          <p className="text-lg text-[var(--navy-100)] max-w-2xl mx-auto">
            Municipal leaders: Submit your infrastructure project to connect with American donors who want to help Ukrainian communities rebuild.
          </p>
        </div>
      </div>

      {/* Form Instructions */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)] mb-8">
          <h2 className="font-semibold text-[var(--navy-700)] mb-3">Before You Begin</h2>
          <ul className="text-[var(--navy-600)] space-y-2 text-sm">
            <li>• This form is for Ukrainian municipal officials to submit infrastructure projects that need donor support.</li>
            <li>• Projects are reviewed by our team before being published on the platform.</li>
            <li>• All fields marked with <span className="text-red-600">*</span> are required.</li>
            <li>• For security reasons, we only display city-level locations on the map - never exact facility addresses.</li>
          </ul>
          <p className="text-sm text-[var(--navy-500)] mt-4">
            Questions? Contact us at <a href="mailto:support@hromada.org" className="text-[var(--navy-700)] underline">support@hromada.org</a>
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
              Municipality Information
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                  Municipality Name <span className="text-red-600">*</span>
                </label>
                <Input
                  value={formData.municipalityName}
                  onChange={handleChange('municipalityName')}
                  placeholder="e.g., Kharkiv City Council"
                  error={errors.municipalityName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                  Municipality Email <span className="text-red-600">*</span>
                </label>
                <Input
                  type="email"
                  value={formData.municipalityEmail}
                  onChange={handleChange('municipalityEmail')}
                  placeholder="municipality@example.ua"
                  error={errors.municipalityEmail}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                  Region/Oblast
                </label>
                <Input
                  value={formData.region}
                  onChange={handleChange('region')}
                  placeholder="e.g., Kharkiv Oblast"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Project Details */}
          <section className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)]">
            <h2 className="text-lg font-semibold text-[var(--navy-700)] mb-4 pb-2 border-b border-[var(--cream-300)]">
              Project Details
            </h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                    Facility/Project Name <span className="text-red-600">*</span>
                  </label>
                  <Input
                    value={formData.facilityName}
                    onChange={handleChange('facilityName')}
                    placeholder="e.g., Regional Hospital #5"
                    error={errors.facilityName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                    Category <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={handleChange('category')}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--navy-200)] focus:border-[var(--navy-500)]"
                  >
                    {(Object.keys(CATEGORY_CONFIG) as Category[]).map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_CONFIG[cat].icon} {CATEGORY_CONFIG[cat].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                    Project Type <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.projectType}
                    onChange={handleChange('projectType')}
                    className={`w-full rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--navy-200)] focus:border-[var(--navy-500)] ${
                      errors.projectType ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">-- Select Type --</option>
                    {PROJECT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.projectType && <p className="mt-1 text-sm text-red-600">{errors.projectType}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                    Urgency <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.urgency}
                    onChange={handleChange('urgency')}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--navy-200)] focus:border-[var(--navy-500)]"
                  >
                    {(Object.keys(URGENCY_CONFIG) as Urgency[]).map((urg) => (
                      <option key={urg} value={urg}>
                        {URGENCY_CONFIG[urg].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                  Brief Description <span className="text-red-600">*</span>
                  <span className="text-[var(--navy-400)] font-normal ml-2">
                    ({formData.briefDescription.length}/150)
                  </span>
                </label>
                <Textarea
                  value={formData.briefDescription}
                  onChange={handleChange('briefDescription')}
                  placeholder="Short summary for project cards (max 150 characters)"
                  error={errors.briefDescription}
                  rows={2}
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                  Full Description <span className="text-red-600">*</span>
                  <span className="text-[var(--navy-400)] font-normal ml-2">
                    ({formData.fullDescription.length}/2000)
                  </span>
                </label>
                <Textarea
                  value={formData.fullDescription}
                  onChange={handleChange('fullDescription')}
                  placeholder="Detailed description of needs, what's required, how donors can help..."
                  error={errors.fullDescription}
                  rows={6}
                />
              </div>
            </div>
          </section>

          {/* Section 3: Technical & Financial Information */}
          <section className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)]">
            <h2 className="text-lg font-semibold text-[var(--navy-700)] mb-4 pb-2 border-b border-[var(--cream-300)]">
              Technical & Financial Information
            </h2>
            <p className="text-sm text-[var(--navy-500)] mb-4">
              These fields are optional but help donors understand the project scope.
            </p>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                    Estimated Cost (USD)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.estimatedCostUsd}
                    onChange={handleChange('estimatedCostUsd')}
                    placeholder="e.g., 50000"
                    error={errors.estimatedCostUsd}
                  />
                </div>
                {showTechnicalPower && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                      Technical Power (kW)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.technicalPowerKw}
                      onChange={handleChange('technicalPowerKw')}
                      placeholder="e.g., 100"
                      error={errors.technicalPowerKw}
                    />
                  </div>
                )}
                {showPanels && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                      Number of Solar Panels
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.numberOfPanels}
                      onChange={handleChange('numberOfPanels')}
                      placeholder="e.g., 200"
                      error={errors.numberOfPanels}
                    />
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                    Co-financing Available?
                  </label>
                  <select
                    value={formData.cofinancingAvailable}
                    onChange={handleChange('cofinancingAvailable')}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--navy-200)] focus:border-[var(--navy-500)]"
                  >
                    <option value="">-- Select --</option>
                    <option value="YES">Yes</option>
                    <option value="NO">No</option>
                    <option value="NEEDS_CLARIFICATION">Needs to be discussed</option>
                  </select>
                </div>
                {showCofinancingDetails && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                      Co-financing Details
                    </label>
                    <Input
                      value={formData.cofinancingDetails}
                      onChange={handleChange('cofinancingDetails')}
                      placeholder="e.g., Up to 20% or 500,000 UAH"
                    />
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section 4: Location */}
          <section className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)]">
            <h2 className="text-lg font-semibold text-[var(--navy-700)] mb-4 pb-2 border-b border-[var(--cream-300)]">
              Location
            </h2>
            <p className="text-sm text-[var(--navy-500)] mb-4">
              For security, we only show city-level locations on the map - never exact facility addresses.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                  City/Town Name <span className="text-red-600">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      value={formData.cityName}
                      onChange={handleChange('cityName')}
                      placeholder="e.g., Kharkiv"
                      error={errors.cityName}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={geocodeCity}
                    isLoading={isGeocoding}
                    loadingText="Finding..."
                  >
                    Get Coordinates
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                  Address/Region Description
                </label>
                <Input
                  value={formData.address}
                  onChange={handleChange('address')}
                  placeholder="e.g., Northern district (general area only)"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                    City Latitude <span className="text-red-600">*</span>
                  </label>
                  <Input
                    value={formData.cityLatitude}
                    onChange={handleChange('cityLatitude')}
                    placeholder="e.g., 49.9935"
                    error={errors.cityLatitude}
                  />
                  <p className="text-xs text-[var(--navy-400)] mt-1">City-level only, not exact facility location</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                    City Longitude <span className="text-red-600">*</span>
                  </label>
                  <Input
                    value={formData.cityLongitude}
                    onChange={handleChange('cityLongitude')}
                    placeholder="e.g., 36.2304"
                    error={errors.cityLongitude}
                  />
                  <p className="text-xs text-[var(--navy-400)] mt-1">City-level only, not exact facility location</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Contact Information */}
          <section className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)]">
            <h2 className="text-lg font-semibold text-[var(--navy-700)] mb-4 pb-2 border-b border-[var(--cream-300)]">
              Contact Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                  Contact Person Name <span className="text-red-600">*</span>
                </label>
                <Input
                  value={formData.contactName}
                  onChange={handleChange('contactName')}
                  placeholder="e.g., Dr. Olena Kovalenko"
                  error={errors.contactName}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                    Contact Email <span className="text-red-600">*</span>
                  </label>
                  <Input
                    type="email"
                    value={formData.contactEmail}
                    onChange={handleChange('contactEmail')}
                    placeholder="contact@example.ua"
                    error={errors.contactEmail}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                    Contact Phone
                  </label>
                  <Input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={handleChange('contactPhone')}
                    placeholder="+380..."
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Supporting Information */}
          <section className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)]">
            <h2 className="text-lg font-semibold text-[var(--navy-700)] mb-4 pb-2 border-b border-[var(--cream-300)]">
              Supporting Information <span className="text-[var(--navy-400)] font-normal">(Optional)</span>
            </h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                    Partner Organization
                  </label>
                  <Input
                    value={formData.partnerOrganization}
                    onChange={handleChange('partnerOrganization')}
                    placeholder="e.g., NGO Ecoclub"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                    Project Subtype
                  </label>
                  <Input
                    value={formData.projectSubtype}
                    onChange={handleChange('projectSubtype')}
                    placeholder="e.g., Building hybrid PV, District heating"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                  Additional Notes
                </label>
                <Textarea
                  value={formData.additionalNotes}
                  onChange={handleChange('additionalNotes')}
                  placeholder="Any other details you'd like to share..."
                  rows={3}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </section>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Link href="/">
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              className="bg-[var(--navy-700)] hover:bg-[var(--navy-800)]"
              isLoading={isSubmitting}
              loadingText="Submitting..."
            >
              Submit Project for Review
            </Button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-[var(--cream-300)] bg-[var(--cream-100)]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs text-[var(--navy-600)]">
            <span className="font-medium">hromada</span> connects American donors with Ukrainian communities.
          </p>
        </div>
      </footer>
    </div>
  )
}
