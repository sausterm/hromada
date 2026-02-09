'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { formatCurrency } from '@/types'

interface SupportProjectCardProps {
  projectId: string
  projectName: string
  estimatedCostUsd?: number
  cofinancingAvailable?: string
  cofinancingDetails?: string
}

type PaymentMethod = 'wire' | 'daf' | 'check' | null
type ViewState = 'options' | 'details' | 'confirm' | 'success'

// Placeholder values - will be replaced with real CSBE info
const PAYMENT_INFO = {
  bankName: 'Bank of America',
  accountName: 'CSBE',
  routingNumber: 'XXXXXXXXX',
  accountNumber: 'XXXXXXXXXXXX',
  swiftCode: 'BOFAUS3N',
  ein: 'XX-XXXXXXX',
  address: '123 Main Street\nCity, State 12345',
}

export function SupportProjectCard({
  projectId,
  projectName,
  estimatedCostUsd,
  cofinancingAvailable,
  cofinancingDetails,
}: SupportProjectCardProps) {
  const t = useTranslations()
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null)
  const [viewState, setViewState] = useState<ViewState>('options')
  const [copied, setCopied] = useState<string | null>(null)

  // Confirmation form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    amount: '',
    referenceNumber: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isNewDonor, setIsNewDonor] = useState(false)

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method)
    setViewState('details')
  }

  const handleConfirmPayment = () => {
    setViewState('confirm')
  }

  const handleBack = () => {
    if (viewState === 'confirm') {
      setViewState('details')
    } else if (viewState === 'details') {
      setViewState('options')
      setSelectedMethod(null)
    }
  }

  const handleSubmitConfirmation = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/donations/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          projectName,
          paymentMethod: selectedMethod,
          donorName: formData.name,
          donorEmail: formData.email,
          donorOrganization: formData.organization,
          amount: formData.amount ? parseFloat(formData.amount) : null,
          referenceNumber: formData.referenceNumber,
          message: formData.message,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit confirmation')
      }

      setIsNewDonor(data.isNewDonor || false)
      setViewState('success')
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
  }

  // Calculate funding needed if co-financing is available
  const fundingNeeded = estimatedCostUsd
  const hasCofinancing = cofinancingAvailable === 'YES' && cofinancingDetails

  // Success state
  if (viewState === 'success') {
    return (
      <Card variant="default" className="border-green-200 bg-green-50">
        <CardContent className="py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-green-800 mb-2 text-center">
            Thank You!
          </h3>
          {isNewDonor ? (
            <>
              <p className="text-green-700 text-center text-sm mb-4">
                We've created a donor account for you to track your contribution.
                Check your email for login details.
              </p>
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <p className="text-sm text-gray-600 text-center">
                  <strong>What's next:</strong><br />
                  1. Check your email for login credentials<br />
                  2. We'll confirm receipt of your {selectedMethod === 'wire' ? 'wire transfer' : selectedMethod === 'daf' ? 'DAF grant' : 'check'}<br />
                  3. Track updates as funds reach Ukraine
                </p>
              </div>
            </>
          ) : (
            <p className="text-green-700 text-center text-sm">
              We've received your notification. Check your donor dashboard to track
              your {selectedMethod === 'wire' ? 'wire transfer' : selectedMethod === 'daf' ? 'DAF grant' : 'check'} as
              it makes its way to Ukraine.
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  // Payment options view
  if (viewState === 'options') {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Support This Project</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Funding summary */}
          {estimatedCostUsd && (
            <div className="text-center py-2">
              <div className="text-3xl font-bold text-[var(--navy-700)]">
                {formatCurrency(estimatedCostUsd, { compact: true })}
              </div>
              <div className="text-sm text-gray-500">estimated cost</div>
              {hasCofinancing && (
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Co-financing available
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Primary CTA - Schedule a Call */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 mb-3">
              Interested in funding this project? Let's discuss how your contribution can make an impact.
            </p>
            <a
              href="https://calendly.com/hromada/donor-call"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-[var(--ukraine-blue)] hover:opacity-90 text-white font-medium py-3 px-4 rounded-lg transition-opacity"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Schedule a Call
            </a>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-500">Ready to give?</span>
            </div>
          </div>

          {/* Payment method options */}
          <div className="space-y-2">
            <button
              onClick={() => handleMethodSelect('wire')}
              className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 text-sm">Wire Transfer</div>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => handleMethodSelect('daf')}
              className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 text-sm">DAF Grant</div>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => handleMethodSelect('check')}
              className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 text-sm">Check</div>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            All donations are tax-deductible through CSBE, a 501(c)(3) organization.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Payment details view
  if (viewState === 'details') {
    return (
      <Card>
        <CardHeader className="pb-2">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <CardTitle className="text-lg">
            {selectedMethod === 'wire' && 'Wire Transfer Instructions'}
            {selectedMethod === 'daf' && 'DAF Grant Instructions'}
            {selectedMethod === 'check' && 'Check Instructions'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedMethod === 'wire' && (
            <>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Bank</span>
                  <span className="font-medium">{PAYMENT_INFO.bankName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Account Name</span>
                  <span className="font-medium">{PAYMENT_INFO.accountName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Routing Number</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">{PAYMENT_INFO.routingNumber}</span>
                    <button
                      onClick={() => handleCopy(PAYMENT_INFO.routingNumber, 'routing')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {copied === 'routing' ? '✓' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Account Number</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">{PAYMENT_INFO.accountNumber}</span>
                    <button
                      onClick={() => handleCopy(PAYMENT_INFO.accountNumber, 'account')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {copied === 'account' ? '✓' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">SWIFT (Int'l)</span>
                  <span className="font-mono font-medium">{PAYMENT_INFO.swiftCode}</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <span className="text-gray-600">Reference</span>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-white px-2 py-1 rounded border text-sm flex-1">
                      Hromada - {projectName}
                    </code>
                    <button
                      onClick={() => handleCopy(`Hromada - ${projectName}`, 'ref')}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {copied === 'ref' ? '✓' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Initiate a wire transfer from your bank using these details. Include the reference to help us match your donation.
              </p>
            </>
          )}

          {selectedMethod === 'daf' && (
            <>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Organization</span>
                  <span className="font-medium">{PAYMENT_INFO.accountName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">EIN</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">{PAYMENT_INFO.ein}</span>
                    <button
                      onClick={() => handleCopy(PAYMENT_INFO.ein, 'ein')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {copied === 'ein' ? '✓' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="border-t pt-3 mt-3">
                  <span className="text-gray-600">Grant Memo</span>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-white px-2 py-1 rounded border text-sm flex-1">
                      Hromada - {projectName}
                    </code>
                    <button
                      onClick={() => handleCopy(`Hromada - ${projectName}`, 'memo')}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {copied === 'memo' ? '✓' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Log into your DAF provider (Fidelity Charitable, Schwab Charitable, Vanguard, etc.) and recommend a grant to CSBE.
              </p>
            </>
          )}

          {selectedMethod === 'check' && (
            <>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Pay to</span>
                  <p className="font-medium mt-1">{PAYMENT_INFO.accountName}</p>
                </div>
                <div>
                  <span className="text-gray-600">Memo</span>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-white px-2 py-1 rounded border text-sm">
                      Hromada - {projectName}
                    </code>
                    <button
                      onClick={() => handleCopy(`Hromada - ${projectName}`, 'checkmemo')}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {copied === 'checkmemo' ? '✓' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="border-t pt-3 mt-3">
                  <span className="text-gray-600">Mail to</span>
                  <div className="flex items-start gap-2 mt-1">
                    <pre className="bg-white px-2 py-1 rounded border text-sm flex-1 whitespace-pre-wrap font-sans">
                      {PAYMENT_INFO.accountName}{'\n'}{PAYMENT_INFO.address}
                    </pre>
                    <button
                      onClick={() => handleCopy(`${PAYMENT_INFO.accountName}\n${PAYMENT_INFO.address}`, 'address')}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {copied === 'address' ? '✓' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          <Button onClick={handleConfirmPayment} fullWidth>
            I've Sent My Contribution
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Confirmation form view
  if (viewState === 'confirm') {
    return (
      <Card>
        <CardHeader className="pb-2">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <CardTitle className="text-lg">Confirm Your Contribution</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitConfirmation} className="space-y-4">
            <p className="text-sm text-gray-600">
              Let us know you've sent funds so we can track and confirm receipt.
            </p>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name *
              </label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={handleChange('name')}
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                required
              />
            </div>

            <div>
              <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
                Organization
              </label>
              <Input
                id="organization"
                type="text"
                value={formData.organization}
                onChange={handleChange('organization')}
                placeholder="Optional"
              />
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount (USD)
              </label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange('amount')}
                placeholder="Optional"
              />
            </div>

            <div>
              <label htmlFor="referenceNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Reference/Confirmation Number
              </label>
              <Input
                id="referenceNumber"
                type="text"
                value={formData.referenceNumber}
                onChange={handleChange('referenceNumber')}
                placeholder="Optional - helps us match your payment"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={handleChange('message')}
                placeholder="Any additional information..."
                rows={3}
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
              loadingText="Submitting..."
            >
              Submit Confirmation
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return null
}
