import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SupportProjectCard } from '@/components/projects/SupportProjectCard'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
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
      expect(screen.getByText('Support This Project')).toBeInTheDocument()
    })

    it('displays estimated cost when provided', () => {
      render(<SupportProjectCard {...defaultProps} />)
      expect(screen.getByText('Estimated Cost')).toBeInTheDocument()
    })

    it('hides estimated cost section when not provided', () => {
      render(<SupportProjectCard {...defaultProps} estimatedCostUsd={undefined} />)
      expect(screen.queryByText('Estimated Cost')).not.toBeInTheDocument()
    })

    it('displays co-financing information when available', () => {
      render(
        <SupportProjectCard
          {...defaultProps}
          cofinancingAvailable="YES"
          cofinancingDetails="50% from local government"
        />
      )
      expect(screen.getByText('Co-financing Available')).toBeInTheDocument()
      expect(screen.getByText('50% from local government')).toBeInTheDocument()
      expect(screen.getByText('Funding Needed')).toBeInTheDocument()
    })

    it('hides co-financing when not available', () => {
      render(
        <SupportProjectCard
          {...defaultProps}
          cofinancingAvailable="NO"
          cofinancingDetails="Some details"
        />
      )
      expect(screen.queryByText('Co-financing Available')).not.toBeInTheDocument()
    })

    it('hides co-financing when details are missing', () => {
      render(
        <SupportProjectCard
          {...defaultProps}
          cofinancingAvailable="YES"
          cofinancingDetails={undefined}
        />
      )
      expect(screen.queryByText('Co-financing Available')).not.toBeInTheDocument()
    })

    it('renders all payment method options', () => {
      render(<SupportProjectCard {...defaultProps} />)
      expect(screen.getByText('Wire Transfer')).toBeInTheDocument()
      expect(screen.getByText('Donor Advised Fund')).toBeInTheDocument()
      expect(screen.getByText('Mail a Check')).toBeInTheDocument()
    })

    it('displays tax-deductible notice', () => {
      render(<SupportProjectCard {...defaultProps} />)
      expect(screen.getByText(/tax-deductible/i)).toBeInTheDocument()
    })
  })

  describe('Payment method selection', () => {
    it('navigates to wire transfer details when selected', async () => {
      render(<SupportProjectCard {...defaultProps} />)

      fireEvent.click(screen.getByText('Wire Transfer'))

      expect(screen.getByText('Wire Transfer Instructions')).toBeInTheDocument()
    })

    it('navigates to DAF details when selected', async () => {
      render(<SupportProjectCard {...defaultProps} />)

      fireEvent.click(screen.getByText('Donor Advised Fund'))

      expect(screen.getByText('DAF Grant Instructions')).toBeInTheDocument()
    })

    it('navigates to check details when selected', async () => {
      render(<SupportProjectCard {...defaultProps} />)

      fireEvent.click(screen.getByText('Mail a Check'))

      expect(screen.getByText('Check Instructions')).toBeInTheDocument()
    })
  })

  describe('Wire transfer details', () => {
    it('displays bank information', () => {
      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('Wire Transfer'))

      expect(screen.getByText('Bank')).toBeInTheDocument()
      expect(screen.getByText('Bank of America')).toBeInTheDocument()
      expect(screen.getByText('Account Name')).toBeInTheDocument()
      expect(screen.getByText('Routing Number')).toBeInTheDocument()
      expect(screen.getByText('Account Number')).toBeInTheDocument()
    })

    it('shows reference with project name', () => {
      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('Wire Transfer'))

      expect(screen.getByText('Reference')).toBeInTheDocument()
      expect(screen.getByText(`Hromada - ${defaultProps.projectName}`)).toBeInTheDocument()
    })

    it('copies routing number to clipboard', async () => {
      jest.useFakeTimers()
      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('Wire Transfer'))

      const copyButtons = screen.getAllByText('Copy')
      fireEvent.click(copyButtons[0]) // First copy button is for routing number

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('XXXXXXXXX')
      expect(screen.getByText('✓')).toBeInTheDocument()

      jest.advanceTimersByTime(2000)
      jest.useRealTimers()
    })

    it('has back button that returns to options', () => {
      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('Wire Transfer'))

      fireEvent.click(screen.getByText('Back'))

      expect(screen.getByText('Support This Project')).toBeInTheDocument()
    })
  })

  describe('DAF details', () => {
    it('displays EIN information', () => {
      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('Donor Advised Fund'))

      expect(screen.getByText('Organization')).toBeInTheDocument()
      expect(screen.getByText('POCACITO Network')).toBeInTheDocument()
      expect(screen.getByText('EIN')).toBeInTheDocument()
    })

    it('shows grant memo with project name', () => {
      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('Donor Advised Fund'))

      expect(screen.getByText('Grant Memo')).toBeInTheDocument()
    })

    it('copies EIN to clipboard', () => {
      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('Donor Advised Fund'))

      const copyButtons = screen.getAllByText('Copy')
      fireEvent.click(copyButtons[0])

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('XX-XXXXXXX')
    })
  })

  describe('Check details', () => {
    it('displays check instructions', () => {
      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('Mail a Check'))

      expect(screen.getByText('Pay to')).toBeInTheDocument()
      expect(screen.getByText('Memo')).toBeInTheDocument()
      expect(screen.getByText('Mail to')).toBeInTheDocument()
    })

    it('copies mailing address to clipboard', () => {
      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('Mail a Check'))

      const copyButtons = screen.getAllByText('Copy')
      fireEvent.click(copyButtons[1]) // Second copy button is for address

      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    })
  })

  describe('Confirmation flow', () => {
    it('navigates to confirmation form when clicking confirm button', () => {
      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('Wire Transfer'))
      fireEvent.click(screen.getByText("I've Sent My Contribution"))

      expect(screen.getByText('Confirm Your Contribution')).toBeInTheDocument()
      expect(screen.getByLabelText('Your Name *')).toBeInTheDocument()
      expect(screen.getByLabelText('Email *')).toBeInTheDocument()
    })

    it('renders all form fields', () => {
      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('Wire Transfer'))
      fireEvent.click(screen.getByText("I've Sent My Contribution"))

      expect(screen.getByLabelText('Your Name *')).toBeInTheDocument()
      expect(screen.getByLabelText('Email *')).toBeInTheDocument()
      expect(screen.getByLabelText('Organization')).toBeInTheDocument()
      expect(screen.getByLabelText('Amount (USD)')).toBeInTheDocument()
      expect(screen.getByLabelText('Reference/Confirmation Number')).toBeInTheDocument()
      expect(screen.getByLabelText('Message')).toBeInTheDocument()
    })

    it('back button returns to payment details from confirm', () => {
      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('Wire Transfer'))
      fireEvent.click(screen.getByText("I've Sent My Contribution"))
      fireEvent.click(screen.getByText('Back'))

      expect(screen.getByText('Wire Transfer Instructions')).toBeInTheDocument()
    })

    it('updates form fields on change', async () => {
      const user = userEvent.setup()
      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('Wire Transfer'))
      fireEvent.click(screen.getByText("I've Sent My Contribution"))

      const nameInput = screen.getByLabelText('Your Name *')
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
      fireEvent.click(screen.getByText('Wire Transfer'))
      fireEvent.click(screen.getByText("I've Sent My Contribution"))

      await user.type(screen.getByLabelText('Your Name *'), 'John Doe')
      await user.type(screen.getByLabelText('Email *'), 'john@example.com')
      await user.click(screen.getByText('Submit Confirmation'))

      await waitFor(() => {
        expect(screen.getByText('Thank You!')).toBeInTheDocument()
      })
    })

    it('shows new donor message when isNewDonor is true', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, isNewDonor: true }),
      })

      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('Wire Transfer'))
      fireEvent.click(screen.getByText("I've Sent My Contribution"))

      await user.type(screen.getByLabelText('Your Name *'), 'John Doe')
      await user.type(screen.getByLabelText('Email *'), 'john@example.com')
      await user.click(screen.getByText('Submit Confirmation'))

      await waitFor(() => {
        expect(screen.getByText(/created a donor account/i)).toBeInTheDocument()
        expect(screen.getByText(/Check your email for login details/i)).toBeInTheDocument()
      })
    })

    it('shows returning donor message when isNewDonor is false', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, isNewDonor: false }),
      })

      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('Wire Transfer'))
      fireEvent.click(screen.getByText("I've Sent My Contribution"))

      await user.type(screen.getByLabelText('Your Name *'), 'John Doe')
      await user.type(screen.getByLabelText('Email *'), 'john@example.com')
      await user.click(screen.getByText('Submit Confirmation'))

      await waitFor(() => {
        expect(screen.getByText(/Check your donor dashboard/i)).toBeInTheDocument()
      })
    })

    it('displays error message on API failure', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Server error occurred' }),
      })

      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('Wire Transfer'))
      fireEvent.click(screen.getByText("I've Sent My Contribution"))

      await user.type(screen.getByLabelText('Your Name *'), 'John Doe')
      await user.type(screen.getByLabelText('Email *'), 'john@example.com')
      await user.click(screen.getByText('Submit Confirmation'))

      await waitFor(() => {
        expect(screen.getByText('Server error occurred')).toBeInTheDocument()
      })
    })

    it('displays generic error on network failure', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('Wire Transfer'))
      fireEvent.click(screen.getByText("I've Sent My Contribution"))

      await user.type(screen.getByLabelText('Your Name *'), 'John Doe')
      await user.type(screen.getByLabelText('Email *'), 'john@example.com')
      await user.click(screen.getByText('Submit Confirmation'))

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })

    it('handles non-Error exception gracefully', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockRejectedValue('String error')

      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('Wire Transfer'))
      fireEvent.click(screen.getByText("I've Sent My Contribution"))

      await user.type(screen.getByLabelText('Your Name *'), 'John Doe')
      await user.type(screen.getByLabelText('Email *'), 'john@example.com')
      await user.click(screen.getByText('Submit Confirmation'))

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
      fireEvent.click(screen.getByText('Wire Transfer'))
      fireEvent.click(screen.getByText("I've Sent My Contribution"))

      await user.type(screen.getByLabelText('Your Name *'), 'John Doe')
      await user.type(screen.getByLabelText('Email *'), 'john@example.com')
      await user.type(screen.getByLabelText('Organization'), 'Acme Corp')
      await user.type(screen.getByLabelText('Amount (USD)'), '5000')
      await user.type(screen.getByLabelText('Reference/Confirmation Number'), 'REF123')
      await user.type(screen.getByLabelText('Message'), 'Thank you!')
      await user.click(screen.getByText('Submit Confirmation'))

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
      fireEvent.click(screen.getByText('Wire Transfer'))
      fireEvent.click(screen.getByText("I've Sent My Contribution"))

      await user.type(screen.getByLabelText('Your Name *'), 'John')
      await user.type(screen.getByLabelText('Email *'), 'john@test.com')
      await user.click(screen.getByText('Submit Confirmation'))

      await waitFor(() => {
        expect(screen.getByText(/wire transfer/i)).toBeInTheDocument()
      })
    })

    it('shows DAF grant message for DAF payment', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, isNewDonor: false }),
      })

      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('Donor Advised Fund'))
      fireEvent.click(screen.getByText("I've Sent My Contribution"))

      await user.type(screen.getByLabelText('Your Name *'), 'John')
      await user.type(screen.getByLabelText('Email *'), 'john@test.com')
      await user.click(screen.getByText('Submit Confirmation'))

      await waitFor(() => {
        expect(screen.getByText(/DAF grant/i)).toBeInTheDocument()
      })
    })

    it('shows check message for check payment', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, isNewDonor: false }),
      })

      render(<SupportProjectCard {...defaultProps} />)
      fireEvent.click(screen.getByText('Mail a Check'))
      fireEvent.click(screen.getByText("I've Sent My Contribution"))

      await user.type(screen.getByLabelText('Your Name *'), 'John')
      await user.type(screen.getByLabelText('Email *'), 'john@test.com')
      await user.click(screen.getByText('Submit Confirmation'))

      await waitFor(() => {
        expect(screen.getByText(/check/i)).toBeInTheDocument()
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
      fireEvent.click(screen.getByText('Wire Transfer'))
      fireEvent.click(screen.getByText("I've Sent My Contribution"))

      await user.type(screen.getByLabelText('Your Name *'), 'John')
      await user.type(screen.getByLabelText('Email *'), 'john@test.com')
      await user.click(screen.getByText('Submit Confirmation'))

      await waitFor(() => {
        expect(screen.getByText('Failed to submit confirmation')).toBeInTheDocument()
      })
    })
  })
})
