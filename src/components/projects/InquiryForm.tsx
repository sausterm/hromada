'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'

interface InquiryFormProps {
  projectId: string
  projectName: string
  onSuccess?: () => void
}

interface FormData {
  name: string
  email: string
  organization: string
  message: string
}

interface FormErrors {
  name?: string
  email?: string
  message?: string
}

export function InquiryForm({ projectId, projectName, onSuccess }: InquiryFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    organization: '',
    message: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

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
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          ...formData,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit inquiry')
      }

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
        <CardContent className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Thank You!
          </h3>
          <p className="text-green-700">
            Your inquiry has been sent. The municipality contact will receive your message
            and reach out to you directly.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Express Interest</CardTitle>
        <CardDescription>
          Interested in supporting {projectName}? Send a message to connect directly
          with the municipality.
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
            <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
              Organization <span className="text-gray-400">(optional)</span>
            </label>
            <Input
              id="organization"
              type="text"
              placeholder="Company or nonprofit name"
              value={formData.organization}
              onChange={handleChange('organization')}
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
            Send Inquiry
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Your contact information will be shared with the municipality representative.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
