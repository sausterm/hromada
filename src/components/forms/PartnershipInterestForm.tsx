'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'

interface FormData {
  communityName: string
  contactName: string
  contactEmail: string
  communityType: string
  approximateSize: string
  message: string
}

interface FormErrors {
  communityName?: string
  contactName?: string
  contactEmail?: string
  communityType?: string
}

const COMMUNITY_TYPES = [
  'rotary',
  'city_council',
  'faith',
  'school',
  'diaspora',
  'corporate',
  'other',
] as const

export function PartnershipInterestForm() {
  const t = useTranslations('partnership.form')
  const [formData, setFormData] = useState<FormData>({
    communityName: '',
    contactName: '',
    contactEmail: '',
    communityType: '',
    approximateSize: '',
    message: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')

  function validate(): FormErrors {
    const errs: FormErrors = {}
    if (!formData.communityName.trim()) errs.communityName = t('validation.communityNameRequired')
    if (!formData.contactName.trim()) errs.contactName = t('validation.contactNameRequired')
    if (!formData.contactEmail.trim()) {
      errs.contactEmail = t('validation.emailRequired')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      errs.contactEmail = t('validation.emailInvalid')
    }
    if (!formData.communityType) errs.communityType = t('validation.communityTypeRequired')
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const res = await fetch('/api/partnership-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Submission failed')
      }

      setIsSubmitted(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleChange(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  if (isSubmitted) {
    return (
      <div className="bg-white rounded-xl border border-[var(--cream-200)] p-8 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-[var(--navy-700)] mb-2">{t('successTitle')}</h3>
        <p className="text-[var(--navy-500)]">{t('successMessage')}</p>
      </div>
    )
  }

  const inputClass = 'w-full rounded-lg border border-[var(--cream-300)] bg-white px-4 py-2.5 text-sm text-[var(--navy-700)] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--ukraine-blue)]/30 focus:border-[var(--ukraine-blue)]'
  const labelClass = 'block text-sm font-medium text-[var(--navy-700)] mb-1'
  const errorClass = 'text-xs text-red-600 mt-1'

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-[var(--cream-200)] p-6 md:p-8 space-y-5">
      <div>
        <label htmlFor="communityName" className={labelClass}>{t('communityName')}</label>
        <input
          id="communityName"
          type="text"
          className={inputClass}
          placeholder={t('communityNamePlaceholder')}
          value={formData.communityName}
          onChange={(e) => handleChange('communityName', e.target.value)}
        />
        {errors.communityName && <p className={errorClass}>{errors.communityName}</p>}
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="contactName" className={labelClass}>{t('contactName')}</label>
          <input
            id="contactName"
            type="text"
            className={inputClass}
            placeholder={t('contactNamePlaceholder')}
            value={formData.contactName}
            onChange={(e) => handleChange('contactName', e.target.value)}
          />
          {errors.contactName && <p className={errorClass}>{errors.contactName}</p>}
        </div>
        <div>
          <label htmlFor="contactEmail" className={labelClass}>{t('contactEmail')}</label>
          <input
            id="contactEmail"
            type="email"
            className={inputClass}
            placeholder={t('contactEmailPlaceholder')}
            value={formData.contactEmail}
            onChange={(e) => handleChange('contactEmail', e.target.value)}
          />
          {errors.contactEmail && <p className={errorClass}>{errors.contactEmail}</p>}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="communityType" className={labelClass}>{t('communityType')}</label>
          <select
            id="communityType"
            className={inputClass}
            value={formData.communityType}
            onChange={(e) => handleChange('communityType', e.target.value)}
          >
            <option value="">{t('selectType')}</option>
            {COMMUNITY_TYPES.map((type) => (
              <option key={type} value={type}>{t(`communityTypes.${type}`)}</option>
            ))}
          </select>
          {errors.communityType && <p className={errorClass}>{errors.communityType}</p>}
        </div>
        <div>
          <label htmlFor="approximateSize" className={labelClass}>{t('approximateSize')}</label>
          <input
            id="approximateSize"
            type="text"
            className={inputClass}
            placeholder={t('approximateSizePlaceholder')}
            value={formData.approximateSize}
            onChange={(e) => handleChange('approximateSize', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label htmlFor="message" className={labelClass}>{t('message')}</label>
        <textarea
          id="message"
          className={`${inputClass} resize-none`}
          rows={4}
          placeholder={t('messagePlaceholder')}
          value={formData.message}
          onChange={(e) => handleChange('message', e.target.value)}
          maxLength={2000}
        />
      </div>

      {submitError && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{submitError}</p>
      )}

      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t('submitting') : t('submit')}
      </Button>
    </form>
  )
}
