import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SiteAccessPage from '@/app/[locale]/(public)/site-access/page'

// Mock next/navigation
const mockSearchParams = new URLSearchParams()
jest.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}))

// Mock next-intl
jest.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

// Mock fetch
global.fetch = jest.fn()

// Mock window.location
const mockLocationHref = jest.fn()
Object.defineProperty(window, 'location', {
  value: {
    href: '',
  },
  writable: true,
})

describe('SiteAccessPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockReset()
    mockSearchParams.delete('redirect')
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    })
  })

  describe('Rendering', () => {
    it('renders the site access form', () => {
      render(<SiteAccessPage />)
      expect(screen.getByText('hromada')).toBeInTheDocument()
    })

    it('renders Ukrainian text in logo', () => {
      render(<SiteAccessPage />)
      expect(screen.getByText('hromada')).toBeInTheDocument()
    })

    it('renders the logo text', () => {
      render(<SiteAccessPage />)
      // The logo shows both English and Ukrainian text
      expect(screen.getByText('громада')).toBeInTheDocument()
    })

    it('renders password input field', () => {
      render(<SiteAccessPage />)
      expect(screen.getByLabelText('Enter site password')).toBeInTheDocument()
    })

    it('renders password input with correct type', () => {
      render(<SiteAccessPage />)
      const passwordInput = screen.getByLabelText('Enter site password')
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('renders submit button', () => {
      render(<SiteAccessPage />)
      expect(screen.getByRole('button', { name: 'Enter Site' })).toBeInTheDocument()
    })

    it('renders preview mode notice', () => {
      render(<SiteAccessPage />)
      expect(screen.getByText('This site is currently in preview mode.')).toBeInTheDocument()
    })

    it('renders password placeholder', () => {
      render(<SiteAccessPage />)
      const passwordInput = screen.getByLabelText('Enter site password')
      expect(passwordInput).toHaveAttribute('placeholder', 'Password')
    })
  })

  describe('Form Interactions', () => {
    it('updates password input on change', async () => {
      const user = userEvent.setup()
      render(<SiteAccessPage />)

      const passwordInput = screen.getByLabelText('Enter site password')
      await user.type(passwordInput, 'testpassword')

      expect(passwordInput).toHaveValue('testpassword')
    })

    it('submit button is disabled when password is empty', () => {
      render(<SiteAccessPage />)
      const submitButton = screen.getByRole('button', { name: 'Enter Site' })
      expect(submitButton).toBeDisabled()
    })

    it('submit button is enabled when password is entered', async () => {
      const user = userEvent.setup()
      render(<SiteAccessPage />)

      const passwordInput = screen.getByLabelText('Enter site password')
      await user.type(passwordInput, 'testpassword')

      const submitButton = screen.getByRole('button', { name: 'Enter Site' })
      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('Form Submission - Success', () => {
    it('calls API with correct password on submit', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(<SiteAccessPage />)

      const passwordInput = screen.getByLabelText('Enter site password')
      await user.type(passwordInput, 'correctpassword')

      const submitButton = screen.getByRole('button', { name: 'Enter Site' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/site-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: 'correctpassword' }),
        })
      })
    })

    it('shows loading state during submission', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockImplementation(() =>
        new Promise(resolve =>
          setTimeout(() => resolve({ ok: true, json: async () => ({ success: true }) }), 1000)
        )
      )

      render(<SiteAccessPage />)

      const passwordInput = screen.getByLabelText('Enter site password')
      await user.type(passwordInput, 'testpassword')

      const submitButton = screen.getByRole('button', { name: 'Enter Site' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Verifying...' })).toBeInTheDocument()
      })
    })

    it('redirects to home on successful submission', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(<SiteAccessPage />)

      const passwordInput = screen.getByLabelText('Enter site password')
      await user.type(passwordInput, 'correctpassword')

      const submitButton = screen.getByRole('button', { name: 'Enter Site' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(window.location.href).toBe('/')
      }, { timeout: 500 })
    })

    it('redirects to specified path when redirect param exists', async () => {
      const user = userEvent.setup()
      mockSearchParams.set('redirect', '/admin')
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(<SiteAccessPage />)

      const passwordInput = screen.getByLabelText('Enter site password')
      await user.type(passwordInput, 'correctpassword')

      const submitButton = screen.getByRole('button', { name: 'Enter Site' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(window.location.href).toBe('/admin')
      }, { timeout: 500 })
    })
  })

  describe('Form Submission - Error Handling', () => {
    it('shows error message on incorrect password', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Incorrect password' }),
      })

      render(<SiteAccessPage />)

      const passwordInput = screen.getByLabelText('Enter site password')
      await user.type(passwordInput, 'wrongpassword')

      const submitButton = screen.getByRole('button', { name: 'Enter Site' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Incorrect password')).toBeInTheDocument()
      })
    })

    it('shows default error message when API returns no error message', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({}),
      })

      render(<SiteAccessPage />)

      const passwordInput = screen.getByLabelText('Enter site password')
      await user.type(passwordInput, 'wrongpassword')

      const submitButton = screen.getByRole('button', { name: 'Enter Site' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Incorrect password')).toBeInTheDocument()
      })
    })

    it('shows generic error on network failure', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(<SiteAccessPage />)

      const passwordInput = screen.getByLabelText('Enter site password')
      await user.type(passwordInput, 'testpassword')

      const submitButton = screen.getByRole('button', { name: 'Enter Site' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
      })
    })

    it('clears error on new submission attempt', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Incorrect password' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })

      render(<SiteAccessPage />)

      const passwordInput = screen.getByLabelText('Enter site password')
      await user.type(passwordInput, 'wrongpassword')

      const submitButton = screen.getByRole('button', { name: 'Enter Site' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Incorrect password')).toBeInTheDocument()
      })

      // Clear and retry
      await user.clear(passwordInput)
      await user.type(passwordInput, 'correctpassword')
      await user.click(submitButton)

      // Error should be cleared while submitting
      await waitFor(() => {
        expect(screen.queryByText('Incorrect password')).not.toBeInTheDocument()
      })
    })

    it('re-enables button after error', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Incorrect password' }),
      })

      render(<SiteAccessPage />)

      const passwordInput = screen.getByLabelText('Enter site password')
      await user.type(passwordInput, 'wrongpassword')

      const submitButton = screen.getByRole('button', { name: 'Enter Site' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Enter Site' })).not.toBeDisabled()
      })
    })

    it('re-enables button after network failure', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(<SiteAccessPage />)

      const passwordInput = screen.getByLabelText('Enter site password')
      await user.type(passwordInput, 'testpassword')

      const submitButton = screen.getByRole('button', { name: 'Enter Site' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Enter Site' })).not.toBeDisabled()
      })
    })
  })

  describe('Suspense Fallback', () => {
    it('wraps form in Suspense', () => {
      // The Suspense boundary should render the form
      render(<SiteAccessPage />)
      expect(screen.getByLabelText('Enter site password')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('renders card container with proper styling', () => {
      render(<SiteAccessPage />)
      const card = screen.getByLabelText('Enter site password').closest('.rounded-2xl')
      expect(card).toBeInTheDocument()
    })

    it('password input has autofocus', () => {
      render(<SiteAccessPage />)
      const passwordInput = screen.getByLabelText('Enter site password')
      expect(passwordInput).toHaveFocus()
    })
  })

  describe('Accessibility', () => {
    it('has proper label for password input', () => {
      render(<SiteAccessPage />)
      const label = screen.getByText('Enter site password')
      expect(label).toHaveAttribute('for', 'password')
    })

    it('password input has id matching label', () => {
      render(<SiteAccessPage />)
      const passwordInput = screen.getByLabelText('Enter site password')
      expect(passwordInput).toHaveAttribute('id', 'password')
    })

    it('error messages are visible', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Password is required' }),
      })

      render(<SiteAccessPage />)

      const passwordInput = screen.getByLabelText('Enter site password')
      await user.type(passwordInput, 'test')

      const submitButton = screen.getByRole('button', { name: 'Enter Site' })
      await user.click(submitButton)

      await waitFor(() => {
        const errorMessage = screen.getByText('Password is required')
        expect(errorMessage).toBeVisible()
      })
    })
  })
})
