import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PartnershipInterestForm } from '@/components/forms/PartnershipInterestForm'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      communityName: 'Community Name',
      communityNamePlaceholder: 'e.g. Portland Rotary Club',
      contactName: 'Contact Name',
      contactNamePlaceholder: 'Your name',
      contactEmail: 'Email',
      contactEmailPlaceholder: 'you@example.com',
      communityType: 'Community Type',
      selectType: 'Select type...',
      'communityTypes.rotary': 'Rotary Club',
      'communityTypes.city_council': 'City Council',
      'communityTypes.faith': 'Faith Community',
      'communityTypes.school': 'School',
      'communityTypes.diaspora': 'Diaspora Org',
      'communityTypes.corporate': 'Corporate',
      'communityTypes.other': 'Other',
      approximateSize: 'Approximate Size',
      approximateSizePlaceholder: 'e.g. 50 members',
      message: 'Message',
      messagePlaceholder: 'Tell us about your community...',
      submit: 'Submit Interest',
      submitting: 'Submitting...',
      successTitle: 'Thank You!',
      successMessage: 'We will be in touch.',
      'validation.communityNameRequired': 'Community name is required',
      'validation.contactNameRequired': 'Contact name is required',
      'validation.emailRequired': 'Email is required',
      'validation.emailInvalid': 'Invalid email',
      'validation.communityTypeRequired': 'Community type is required',
    }
    return translations[key] || key
  },
}))

// Mock Button
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, disabled, ...props }: any) => (
    <button disabled={disabled} {...props}>{children}</button>
  ),
}))

describe('PartnershipInterestForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  it('renders all form fields', () => {
    render(<PartnershipInterestForm />)

    expect(screen.getByLabelText('Community Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Contact Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Community Type')).toBeInTheDocument()
    expect(screen.getByLabelText('Approximate Size')).toBeInTheDocument()
    expect(screen.getByLabelText('Message')).toBeInTheDocument()
  })

  it('renders submit button', () => {
    render(<PartnershipInterestForm />)
    expect(screen.getByText('Submit Interest')).toBeInTheDocument()
  })

  it('shows validation errors for empty required fields', async () => {
    render(<PartnershipInterestForm />)

    fireEvent.click(screen.getByText('Submit Interest'))

    await waitFor(() => {
      expect(screen.getByText('Community name is required')).toBeInTheDocument()
      expect(screen.getByText('Contact name is required')).toBeInTheDocument()
      expect(screen.getByText('Email is required')).toBeInTheDocument()
      expect(screen.getByText('Community type is required')).toBeInTheDocument()
    })
  })

  it('shows email required error when email is empty', async () => {
    render(<PartnershipInterestForm />)

    fireEvent.change(screen.getByLabelText('Community Name'), { target: { value: 'Test' } })
    fireEvent.change(screen.getByLabelText('Contact Name'), { target: { value: 'John' } })

    fireEvent.click(screen.getByText('Submit Interest'))

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument()
    })
  })

  it('clears field errors on change', async () => {
    render(<PartnershipInterestForm />)

    fireEvent.click(screen.getByText('Submit Interest'))

    await waitFor(() => {
      expect(screen.getByText('Community name is required')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('Community Name'), { target: { value: 'Test' } })

    await waitFor(() => {
      expect(screen.queryByText('Community name is required')).not.toBeInTheDocument()
    })
  })

  it('submits successfully and shows success message', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })

    render(<PartnershipInterestForm />)

    fireEvent.change(screen.getByLabelText('Community Name'), { target: { value: 'Portland Rotary' } })
    fireEvent.change(screen.getByLabelText('Contact Name'), { target: { value: 'John Smith' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@test.com' } })
    fireEvent.change(screen.getByLabelText('Community Type'), { target: { value: 'rotary' } })

    fireEvent.click(screen.getByText('Submit Interest'))

    await waitFor(() => {
      expect(screen.getByText('Thank You!')).toBeInTheDocument()
      expect(screen.getByText('We will be in touch.')).toBeInTheDocument()
    })
  })

  it('shows error on API failure', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    })

    render(<PartnershipInterestForm />)

    fireEvent.change(screen.getByLabelText('Community Name'), { target: { value: 'Test' } })
    fireEvent.change(screen.getByLabelText('Contact Name'), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@test.com' } })
    fireEvent.change(screen.getByLabelText('Community Type'), { target: { value: 'rotary' } })

    fireEvent.click(screen.getByText('Submit Interest'))

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument()
    })
  })

  it('shows generic error on network failure', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    render(<PartnershipInterestForm />)

    fireEvent.change(screen.getByLabelText('Community Name'), { target: { value: 'Test' } })
    fireEvent.change(screen.getByLabelText('Contact Name'), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@test.com' } })
    fireEvent.change(screen.getByLabelText('Community Type'), { target: { value: 'rotary' } })

    fireEvent.click(screen.getByText('Submit Interest'))

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })
})
