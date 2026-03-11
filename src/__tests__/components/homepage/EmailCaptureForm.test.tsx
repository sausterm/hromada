import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmailCaptureForm } from '@/components/homepage/EmailCaptureForm'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'homepage.cta.namePlaceholder': 'Your name',
      'homepage.cta.emailPlaceholder': 'Enter your email',
      'homepage.cta.emailButton': 'Stay Updated',
      'homepage.cta.emailSuccess': 'Thanks for subscribing!',
      'homepage.cta.emailError': 'Something went wrong. Please try again.',
    }
    return translations[key] || key
  },
}))

// Mock fetch
global.fetch = jest.fn()

describe('EmailCaptureForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockReset()
  })

  describe('Rendering', () => {
    it('renders the email input', () => {
      render(<EmailCaptureForm />)

      const input = screen.getByPlaceholderText('Enter your email')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'email')
    })

    it('renders the name input', () => {
      render(<EmailCaptureForm />)

      const input = screen.getByPlaceholderText('Your name')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'text')
    })

    it('renders the submit button', () => {
      render(<EmailCaptureForm />)

      const button = screen.getByRole('button', { name: 'Stay Updated' })
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('type', 'submit')
    })

    it('renders as a form element', () => {
      const { container } = render(<EmailCaptureForm />)

      const form = container.querySelector('form')
      expect(form).toBeInTheDocument()
    })

    it('email input is required', () => {
      render(<EmailCaptureForm />)

      const input = screen.getByPlaceholderText('Enter your email')
      expect(input).toHaveAttribute('required')
    })

    it('input starts empty', () => {
      render(<EmailCaptureForm />)

      const input = screen.getByPlaceholderText('Enter your email') as HTMLInputElement
      expect(input.value).toBe('')
    })
  })

  describe('Form submission - success', () => {
    it('calls fetch with correct endpoint and data', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true })

      render(<EmailCaptureForm />)

      await user.type(screen.getByPlaceholderText('Your name'), 'Test Donor')
      await user.type(screen.getByPlaceholderText('Enter your email'), 'donor@example.com')
      await user.click(screen.getByRole('button', { name: 'Stay Updated' }))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'donor@example.com', name: 'Test Donor' }),
        })
      })
    })

    it('shows success message after successful submission', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true })

      render(<EmailCaptureForm />)

      await user.type(screen.getByPlaceholderText('Your name'), 'Test Donor')
      await user.type(screen.getByPlaceholderText('Enter your email'), 'donor@example.com')
      await user.click(screen.getByRole('button', { name: 'Stay Updated' }))

      await waitFor(() => {
        expect(screen.getByText('Thanks for subscribing!')).toBeInTheDocument()
      })
    })

    it('hides the form after successful submission', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true })

      render(<EmailCaptureForm />)

      await user.type(screen.getByPlaceholderText('Your name'), 'Test Donor')
      await user.type(screen.getByPlaceholderText('Enter your email'), 'donor@example.com')
      await user.click(screen.getByRole('button', { name: 'Stay Updated' }))

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Enter your email')).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Stay Updated' })).not.toBeInTheDocument()
      })
    })

    it('trims whitespace from email before sending', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true })

      render(<EmailCaptureForm />)

      await user.type(screen.getByPlaceholderText('Your name'), 'Test Donor')
      await user.type(screen.getByPlaceholderText('Enter your email'), '  donor@example.com  ')
      await user.click(screen.getByRole('button', { name: 'Stay Updated' }))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/newsletter', expect.objectContaining({
          body: JSON.stringify({ email: 'donor@example.com', name: 'Test Donor' }),
        }))
      })
    })
  })

  describe('Form submission - loading state', () => {
    it('shows loading indicator during submission', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 200))
      )

      render(<EmailCaptureForm />)

      await user.type(screen.getByPlaceholderText('Your name'), 'Test Donor')
      await user.type(screen.getByPlaceholderText('Enter your email'), 'donor@example.com')
      await user.click(screen.getByRole('button', { name: 'Stay Updated' }))

      expect(screen.getByText('...')).toBeInTheDocument()
    })

    it('disables submit button during loading', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 200))
      )

      render(<EmailCaptureForm />)

      await user.type(screen.getByPlaceholderText('Your name'), 'Test Donor')
      await user.type(screen.getByPlaceholderText('Enter your email'), 'donor@example.com')
      await user.click(screen.getByRole('button', { name: 'Stay Updated' }))

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })
  })

  describe('Form submission - error states', () => {
    it('shows error message when API returns non-ok response', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false })

      render(<EmailCaptureForm />)

      await user.type(screen.getByPlaceholderText('Your name'), 'Test Donor')
      await user.type(screen.getByPlaceholderText('Enter your email'), 'donor@example.com')
      await user.click(screen.getByRole('button', { name: 'Stay Updated' }))

      await waitFor(() => {
        expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
      })
    })

    it('shows error message when fetch throws network error', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(<EmailCaptureForm />)

      await user.type(screen.getByPlaceholderText('Your name'), 'Test Donor')
      await user.type(screen.getByPlaceholderText('Enter your email'), 'donor@example.com')
      await user.click(screen.getByRole('button', { name: 'Stay Updated' }))

      await waitFor(() => {
        expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
      })
    })

    it('keeps the form visible on error', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false })

      render(<EmailCaptureForm />)

      await user.type(screen.getByPlaceholderText('Your name'), 'Test Donor')
      await user.type(screen.getByPlaceholderText('Enter your email'), 'donor@example.com')
      await user.click(screen.getByRole('button', { name: 'Stay Updated' }))

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Stay Updated' })).toBeInTheDocument()
      })
    })
  })

  describe('Empty email prevention', () => {
    it('does not submit when email is empty whitespace', async () => {
      render(<EmailCaptureForm />)

      // Set name but email to whitespace only
      const nameInput = screen.getByPlaceholderText('Your name')
      fireEvent.change(nameInput, { target: { value: 'Test' } })
      const input = screen.getByPlaceholderText('Enter your email')
      fireEvent.change(input, { target: { value: '   ' } })

      // Manually trigger form submit
      const form = input.closest('form')!
      fireEvent.submit(form)

      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('does not submit when name is empty whitespace', async () => {
      render(<EmailCaptureForm />)

      // Set email but name to whitespace only
      const nameInput = screen.getByPlaceholderText('Your name')
      fireEvent.change(nameInput, { target: { value: '   ' } })
      const input = screen.getByPlaceholderText('Enter your email')
      fireEvent.change(input, { target: { value: 'donor@example.com' } })

      const form = input.closest('form')!
      fireEvent.submit(form)

      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('Styling', () => {
    it('form has flex layout', () => {
      const { container } = render(<EmailCaptureForm />)

      const form = container.querySelector('form')
      expect(form).toHaveClass('flex')
    })

    it('submit button has navy background', () => {
      render(<EmailCaptureForm />)

      const button = screen.getByRole('button', { name: 'Stay Updated' })
      expect(button).toHaveClass('bg-[var(--navy-700)]')
      expect(button).toHaveClass('text-white')
    })

    it('success message has green styling', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true })

      render(<EmailCaptureForm />)

      await user.type(screen.getByPlaceholderText('Your name'), 'Test Donor')
      await user.type(screen.getByPlaceholderText('Enter your email'), 'donor@example.com')
      await user.click(screen.getByRole('button', { name: 'Stay Updated' }))

      await waitFor(() => {
        const successDiv = screen.getByText('Thanks for subscribing!').closest('div')
        expect(successDiv).toHaveClass('text-green-700')
        expect(successDiv).toHaveClass('bg-green-50')
      })
    })

    it('error message has red text', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false })

      render(<EmailCaptureForm />)

      await user.type(screen.getByPlaceholderText('Your name'), 'Test Donor')
      await user.type(screen.getByPlaceholderText('Enter your email'), 'donor@example.com')
      await user.click(screen.getByRole('button', { name: 'Stay Updated' }))

      await waitFor(() => {
        const errorDiv = screen.getByText('Something went wrong. Please try again.')
        expect(errorDiv).toHaveClass('text-red-600')
      })
    })
  })
})
