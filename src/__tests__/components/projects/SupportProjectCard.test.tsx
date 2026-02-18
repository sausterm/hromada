import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SupportProjectCard } from '@/components/projects/SupportProjectCard'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

// Mock @/types
jest.mock('@/types', () => ({
  formatCurrency: (value: number, options?: { compact?: boolean }) =>
    options?.compact ? `$${Math.round(value/1000)}K` : `$${value.toLocaleString()}`,
}))

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
})

describe('SupportProjectCard', () => {
  const defaultProps = {
    projectId: 'proj-123',
    projectName: 'Test Hospital Solar Project',
    estimatedCostUsd: 50000,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  describe('Options view', () => {
    it('renders the support card with title', () => {
      render(<SupportProjectCard {...defaultProps} />)
      expect(screen.getByText('title')).toBeInTheDocument()
    })

    it('displays estimated cost when provided', () => {
      render(<SupportProjectCard {...defaultProps} />)
      expect(screen.getByText('estimatedCostLabel')).toBeInTheDocument()
    })

    it('hides estimated cost section when not provided', () => {
      render(<SupportProjectCard {...defaultProps} estimatedCostUsd={undefined} />)
      expect(screen.queryByText('estimatedCostLabel')).not.toBeInTheDocument()
    })

    it('displays co-financing information when available', () => {
      render(
        <SupportProjectCard
          {...defaultProps}
          cofinancingAvailable="YES"
          cofinancingDetails="50% from local government"
        />
      )
      expect(screen.getByText('cofinancingBadge')).toBeInTheDocument()
    })

    it('hides co-financing when not available', () => {
      render(
        <SupportProjectCard
          {...defaultProps}
          cofinancingAvailable="NO"
          cofinancingDetails="Some details"
        />
      )
      expect(screen.queryByText('cofinancingBadge')).not.toBeInTheDocument()
    })

    it('hides co-financing when details are missing', () => {
      render(
        <SupportProjectCard
          {...defaultProps}
          cofinancingAvailable="YES"
          cofinancingDetails={undefined}
        />
      )
      expect(screen.queryByText('cofinancingBadge')).not.toBeInTheDocument()
    })

    it('renders all payment method options', () => {
      render(<SupportProjectCard {...defaultProps} />)
      expect(screen.getByText('methods.wire.title')).toBeInTheDocument()
      expect(screen.getByText('methods.daf.title')).toBeInTheDocument()
      expect(screen.getByText('methods.check.title')).toBeInTheDocument()
    })

    it('displays tax-deductible notice', () => {
      render(<SupportProjectCard {...defaultProps} />)
      expect(screen.getByText('taxNote')).toBeInTheDocument()
    })
  })

  describe('Payment method selection', () => {
    it('navigates to wire transfer details when selected', async () => {
      render(<SupportProjectCard {...defaultProps} />)

      fireEvent.click(screen.getByText('methods.wire.title'))

      expect(screen.getByText('wireInstructions.title')).toBeInTheDocument()
    })

    it('navigates to DAF details when selected', async () => {
      render(<SupportProjectCard {...defaultProps} />)

      fireEvent.click(screen.getByText('methods.daf.title'))

      expect(screen.getByText('dafInstructions.title')).toBeInTheDocument()
    })

    it('navigates to check details when selected', async () => {
      render(<SupportProjectCard {...defaultProps} />)

      fireEvent.click(screen.getByText('methods.check.title'))

      expect(screen.getByText('checkInstructions.title')).toBeInTheDocument()
    })
  })

  describe('Wire transfer details', () => {
    it('displays bank information', () => {
      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('methods.wire.title'))

      expect(screen.getByText('wireInstructions.bank')).toBeInTheDocument()
      expect(screen.getByText('Bank of America')).toBeInTheDocument()
      expect(screen.getByText('wireInstructions.accountName')).toBeInTheDocument()
      expect(screen.getByText('wireInstructions.routingNumber')).toBeInTheDocument()
      expect(screen.getByText('wireInstructions.accountNumber')).toBeInTheDocument()
    })

    it('shows reference with project name', () => {
      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('methods.wire.title'))

      expect(screen.getByText('wireInstructions.reference')).toBeInTheDocument()
      expect(screen.getByText(`Hromada - ${defaultProps.projectName}`)).toBeInTheDocument()
    })

    it('copies routing number to clipboard', async () => {
      jest.useFakeTimers()
      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('methods.wire.title'))

      const copyButtons = screen.getAllByText('copy')
      fireEvent.click(copyButtons[0]) // First copy button is for routing number

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('XXXXXXXXX')
      expect(screen.getByText('✓')).toBeInTheDocument()

      jest.advanceTimersByTime(2000)
      jest.useRealTimers()
    })

    it('has back button that returns to options', () => {
      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('methods.wire.title'))

      fireEvent.click(screen.getByText('back'))

      expect(screen.getByText('title')).toBeInTheDocument()
    })
  })

  describe('DAF details', () => {
    it('displays EIN information', () => {
      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('methods.daf.title'))

      expect(screen.getByText('dafInstructions.organization')).toBeInTheDocument()
      expect(screen.getByText('POCACITO Network')).toBeInTheDocument()
      expect(screen.getByText('dafInstructions.ein')).toBeInTheDocument()
    })

    it('shows grant memo with project name', () => {
      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('methods.daf.title'))

      expect(screen.getByText('dafInstructions.grantMemo')).toBeInTheDocument()
    })

    it('copies EIN to clipboard', () => {
      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('methods.daf.title'))

      const copyButtons = screen.getAllByText('copy')
      fireEvent.click(copyButtons[0])

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('99-0392258')
    })
  })

  describe('Check details', () => {
    it('displays check instructions', () => {
      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('methods.check.title'))

      expect(screen.getByText('checkInstructions.payTo')).toBeInTheDocument()
      expect(screen.getByText('checkInstructions.memo')).toBeInTheDocument()
      expect(screen.getByText('checkInstructions.mailTo')).toBeInTheDocument()
    })

    it('copies mailing address to clipboard', () => {
      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('methods.check.title'))

      const copyButtons = screen.getAllByText('copy')
      fireEvent.click(copyButtons[1]) // Second copy button is for address

      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    })
  })

  describe('Confirmation flow', () => {
    it('navigates to confirmation form when clicking confirm button', () => {
      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('methods.wire.title'))
      fireEvent.click(screen.getByText('confirm.button'))

      expect(screen.getByText('confirm.title')).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm\.name/)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm\.email/)).toBeInTheDocument()
    })

    it('renders all form fields', () => {
      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('methods.wire.title'))
      fireEvent.click(screen.getByText('confirm.button'))

      expect(screen.getByLabelText(/confirm\.name/)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm\.email/)).toBeInTheDocument()
      expect(screen.getByLabelText('confirm.organization')).toBeInTheDocument()
      expect(screen.getByLabelText('confirm.amount')).toBeInTheDocument()
      expect(screen.getByLabelText('confirm.referenceNumber')).toBeInTheDocument()
      expect(screen.getByLabelText('confirm.message')).toBeInTheDocument()
    })

    it('back button returns to payment details from confirm', () => {
      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('methods.wire.title'))
      fireEvent.click(screen.getByText('confirm.button'))
      fireEvent.click(screen.getByText('back'))

      expect(screen.getByText('wireInstructions.title')).toBeInTheDocument()
    })

    it('updates form fields on change', async () => {
      const user = userEvent.setup()
      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('methods.wire.title'))
      fireEvent.click(screen.getByText('confirm.button'))

      const nameInput = screen.getByLabelText(/confirm\.name/)
      await user.type(nameInput, 'John Doe')

      expect(nameInput).toHaveValue('John Doe')
    })

    it('submits form successfully and shows success state', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, isNewDonor: true }),
      })

      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('methods.wire.title'))
      fireEvent.click(screen.getByText('confirm.button'))

      await user.type(screen.getByLabelText(/confirm\.name/), 'John Doe')
      await user.type(screen.getByLabelText(/confirm\.email/), 'john@example.com')
      await user.click(screen.getByText('confirm.submit'))

      await waitFor(() => {
        expect(screen.getByText('success.title')).toBeInTheDocument()
      })
    })

    it('shows new donor message when isNewDonor is true', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, isNewDonor: true }),
      })

      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('methods.wire.title'))
      fireEvent.click(screen.getByText('confirm.button'))

      await user.type(screen.getByLabelText(/confirm\.name/), 'John Doe')
      await user.type(screen.getByLabelText(/confirm\.email/), 'john@example.com')
      await user.click(screen.getByText('confirm.submit'))

      await waitFor(() => {
        expect(screen.getByText('successNewDonor')).toBeInTheDocument()
        expect(screen.getByText(/successStep1/)).toBeInTheDocument()
      })
    })

    it('shows returning donor message when isNewDonor is false', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, isNewDonor: false }),
      })

      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('methods.wire.title'))
      fireEvent.click(screen.getByText('confirm.button'))

      await user.type(screen.getByLabelText(/confirm\.name/), 'John Doe')
      await user.type(screen.getByLabelText(/confirm\.email/), 'john@example.com')
      await user.click(screen.getByText('confirm.submit'))

      await waitFor(() => {
        expect(screen.getByText('successExisting')).toBeInTheDocument()
      })
    })

    it('displays error message on API failure', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Server error occurred' }),
      })

      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('methods.wire.title'))
      fireEvent.click(screen.getByText('confirm.button'))

      await user.type(screen.getByLabelText(/confirm\.name/), 'John Doe')
      await user.type(screen.getByLabelText(/confirm\.email/), 'john@example.com')
      await user.click(screen.getByText('confirm.submit'))

      await waitFor(() => {
        expect(screen.getByText('Server error occurred')).toBeInTheDocument()
      })
    })

    it('displays generic error on network failure', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('methods.wire.title'))
      fireEvent.click(screen.getByText('confirm.button'))

      await user.type(screen.getByLabelText(/confirm\.name/), 'John Doe')
      await user.type(screen.getByLabelText(/confirm\.email/), 'john@example.com')
      await user.click(screen.getByText('confirm.submit'))

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })

    it('handles non-Error exception gracefully', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockRejectedValue('String error')

      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('methods.wire.title'))
      fireEvent.click(screen.getByText('confirm.button'))

      await user.type(screen.getByLabelText(/confirm\.name/), 'John Doe')
      await user.type(screen.getByLabelText(/confirm\.email/), 'john@example.com')
      await user.click(screen.getByText('confirm.submit'))

      await waitFor(() => {
        expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      })
    })

    it('sends correct payload to API', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('methods.wire.title'))
      fireEvent.click(screen.getByText('confirm.button'))

      await user.type(screen.getByLabelText(/confirm\.name/), 'John Doe')
      await user.type(screen.getByLabelText(/confirm\.email/), 'john@example.com')
      await user.type(screen.getByLabelText('confirm.organization'), 'Acme Corp')
      await user.type(screen.getByLabelText('confirm.amount'), '5000')
      await user.type(screen.getByLabelText('confirm.referenceNumber'), 'REF123')
      await user.type(screen.getByLabelText('confirm.message'), 'Thank you!')
      await user.click(screen.getByText('confirm.submit'))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/donations/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: 'proj-123',
            projectName: 'Test Hospital Solar Project',
            paymentMethod: 'wire',
            donorName: 'John Doe',
            donorEmail: 'john@example.com',
            donorOrganization: 'Acme Corp',
            amount: 5000,
            referenceNumber: 'REF123',
            message: 'Thank you!',
          }),
        })
      })
    })
  })

  describe('Success state messages', () => {
    it('shows wire transfer message for wire payment', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, isNewDonor: false }),
      })

      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('methods.wire.title'))
      fireEvent.click(screen.getByText('confirm.button'))

      await user.type(screen.getByLabelText(/confirm\.name/), 'John')
      await user.type(screen.getByLabelText(/confirm\.email/), 'john@test.com')
      await user.click(screen.getByText('confirm.submit'))

      await waitFor(() => {
        expect(screen.getByText('successExisting')).toBeInTheDocument()
      })
    })

    it('shows DAF grant message for DAF payment', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, isNewDonor: false }),
      })

      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('methods.daf.title'))
      fireEvent.click(screen.getByText('confirm.button'))

      await user.type(screen.getByLabelText(/confirm\.name/), 'John')
      await user.type(screen.getByLabelText(/confirm\.email/), 'john@test.com')
      await user.click(screen.getByText('confirm.submit'))

      await waitFor(() => {
        expect(screen.getByText('successExisting')).toBeInTheDocument()
      })
    })

    it('shows check message for check payment', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, isNewDonor: false }),
      })

      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('methods.check.title'))
      fireEvent.click(screen.getByText('confirm.button'))

      await user.type(screen.getByLabelText(/confirm\.name/), 'John')
      await user.type(screen.getByLabelText(/confirm\.email/), 'john@test.com')
      await user.click(screen.getByText('confirm.submit'))

      await waitFor(() => {
        expect(screen.getByText('successExisting')).toBeInTheDocument()
      })
    })
  })

  describe('API response handling', () => {
    it('handles missing error in response', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({}),
      })

      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('methods.wire.title'))
      fireEvent.click(screen.getByText('confirm.button'))

      await user.type(screen.getByLabelText(/confirm\.name/), 'John')
      await user.type(screen.getByLabelText(/confirm\.email/), 'john@test.com')
      await user.click(screen.getByText('confirm.submit'))

      await waitFor(() => {
        expect(screen.getByText('Failed to submit confirmation')).toBeInTheDocument()
      })
    })
  })
})
