import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ForgotPasswordPage from '@/app/[locale]/(public)/forgot-password/page'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      title: 'Reset Password',
      subtitle: 'Enter your email to receive a reset code.',
      emailLabel: 'Email',
      emailPlaceholder: 'you@example.com',
      sendCode: 'Send Code',
      backToLogin: 'Back to Login',
      codeSent: 'We sent a code to your email.',
      codeLabel: 'Reset Code',
      codePlaceholder: '123456',
      newPassword: 'New Password',
      newPasswordPlaceholder: 'Enter new password',
      confirmPassword: 'Confirm Password',
      confirmPasswordPlaceholder: 'Confirm new password',
      resetButton: 'Reset Password',
      resendCode: 'Resend Code',
      passwordMismatch: 'Passwords do not match',
      genericError: 'Something went wrong',
      invalidCode: 'Invalid or expired code',
      success: 'Password Reset',
      successMessage: 'Your password has been reset successfully.',
    }
    return translations[key] || key
  },
}))

// Mock i18n navigation
jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// Mock UI components
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, isLoading, ...props }: any) => (
    <button {...props} disabled={isLoading || props.disabled}>
      {isLoading ? 'Loading...' : children}
    </button>
  ),
}))

jest.mock('@/components/ui/Input', () => ({
  Input: ({ error, rightAddon, ...props }: any) => (
    <div>
      <input {...props} />
      {rightAddon}
      {error && <span data-testid="input-error">{error}</span>}
    </div>
  ),
}))

jest.mock('@/components/ui/Card', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  describe('Email step', () => {
    it('renders the email form', () => {
      render(<ForgotPasswordPage />)

      expect(screen.getByText('Reset Password')).toBeInTheDocument()
      expect(screen.getByText('Enter your email to receive a reset code.')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
      expect(screen.getByText('Send Code')).toBeInTheDocument()
    })

    it('renders back to login link', () => {
      render(<ForgotPasswordPage />)

      expect(screen.getByText('Back to Login')).toBeInTheDocument()
    })

    it('submits email and advances to code step', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })

      render(<ForgotPasswordPage />)

      const emailInput = screen.getByPlaceholderText('you@example.com')
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } })
      fireEvent.click(screen.getByText('Send Code'))

      await waitFor(() => {
        expect(screen.getByText('We sent a code to your email.')).toBeInTheDocument()
      })
    })

    it('shows error on failed API call', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'User not found' }),
      })

      render(<ForgotPasswordPage />)

      const emailInput = screen.getByPlaceholderText('you@example.com')
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } })
      fireEvent.click(screen.getByText('Send Code'))

      await waitFor(() => {
        expect(screen.getByTestId('input-error')).toBeInTheDocument()
      })
    })
  })

  describe('Code step', () => {
    async function advanceToCodeStep() {
      ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })

      render(<ForgotPasswordPage />)

      const emailInput = screen.getByPlaceholderText('you@example.com')
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } })
      fireEvent.click(screen.getByText('Send Code'))

      await waitFor(() => {
        expect(screen.getByText('We sent a code to your email.')).toBeInTheDocument()
      })
    }

    it('renders code and password fields', async () => {
      await advanceToCodeStep()

      expect(screen.getByPlaceholderText('123456')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter new password')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Confirm new password')).toBeInTheDocument()
      // "Reset Password" appears as both heading and button
      expect(screen.getAllByText('Reset Password').length).toBeGreaterThanOrEqual(1)
    })

    it('shows resend code button', async () => {
      await advanceToCodeStep()

      expect(screen.getByText('Resend Code')).toBeInTheDocument()
    })

    it('shows error when passwords do not match', async () => {
      await advanceToCodeStep()

      fireEvent.change(screen.getByPlaceholderText('123456'), { target: { value: '123456' } })
      fireEvent.change(screen.getByPlaceholderText('Enter new password'), { target: { value: 'password123!' } })
      fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'different' } })

      fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }))

      await waitFor(() => {
        expect(screen.getByTestId('input-error')).toHaveTextContent('Passwords do not match')
      })
    })

    it('submits reset and shows success', async () => {
      await advanceToCodeStep()

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })

      fireEvent.change(screen.getByPlaceholderText('123456'), { target: { value: '123456' } })
      fireEvent.change(screen.getByPlaceholderText('Enter new password'), { target: { value: 'newpassword123!' } })
      fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'newpassword123!' } })

      fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }))

      await waitFor(() => {
        expect(screen.getByText('Your password has been reset successfully.')).toBeInTheDocument()
      })
    })
  })
})
