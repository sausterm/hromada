'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'

interface ContactFormProps {
  projectId: string
  projectName: string
  onSuccess?: () => void
}

interface FormData {
  name: string
  email: string
  message: string
}

interface FormErrors {
  name?: string
  email?: string
  message?: string
}

const MAX_MESSAGE_LENGTH = 1000

export function ContactForm({ projectId, projectName, onSuccess }: ContactFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [municipalityEmail, setMunicipalityEmail] = useState<string | null>(null)

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
    } else if (formData.message.trim().length < 20) {
      newErrors.message = 'Please provide more details (at least 20 characters)'
    } else if (formData.message.length > MAX_MESSAGE_LENGTH) {
      newErrors.message = `Message must be ${MAX_MESSAGE_LENGTH} characters or less`
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
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          donorName: formData.name,
          donorEmail: formData.email,
          message: formData.message,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit contact form')
      }

      setMunicipalityEmail(data.municipalityEmail)
      setIsSubmitted(true)
      onSuccess?.()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  if (isSubmitted) {
    return (
      <Card variant="default" className="border-green-200 bg-green-50">
        <CardContent className="py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h3 className="text-lg font-semibold text-green-800 mb-2 text-center">
            Thank You!
          </h3>
          <p className="text-green-700 text-center mb-4">
            Your interest has been sent to our team.
          </p>
          {municipalityEmail && (
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <p className="text-sm text-gray-600 mb-2">
                You can also reach the municipality directly at:
              </p>
              <a
                href={`mailto:${municipalityEmail}`}
                className="text-[var(--ukraine-600)] hover:underline font-medium"
              >
                {municipalityEmail}
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Express Interest</CardTitle>
        <CardDescription>
          Interested in supporting {projectName}? Send a message to connect with our team.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Your Name *
            </label>
            <Input
              id="name"
              type="text"
              placeholder="John Smith"
              value={formData.name}
              onChange={handleChange('name')}
              error={errors.name}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange('email')}
              error={errors.email}
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Message *
            </label>
            <Textarea
              id="message"
              placeholder="Tell us how you'd like to help. What resources can you provide? Any questions about the project?"
              value={formData.message}
              onChange={handleChange('message')}
              error={errors.message}
              rows={5}
            />
            <div className="flex justify-end mt-1">
              <span className={`text-xs ${
                formData.message.length > MAX_MESSAGE_LENGTH
                  ? 'text-red-500'
                  : 'text-gray-400'
              }`}>
                {formData.message.length}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>
          </div>

          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {submitError}
            </div>
          )}

          <Button
            type="submit"
            fullWidth
            isLoading={isSubmitting}
            loadingText="Sending..."
          >
            Send Message
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Our team will review your message and connect you with the municipality.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
