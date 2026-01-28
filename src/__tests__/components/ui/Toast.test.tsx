import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, useToast } from '@/components/ui/Toast'

// Test component to interact with toast context
function TestComponent() {
  const { addToast, toasts } = useToast()

  return (
    <div>
      <button onClick={() => addToast({ type: 'success', message: 'Success!' })}>
        Add Success
      </button>
      <button onClick={() => addToast({ type: 'error', message: 'Error!' })}>
        Add Error
      </button>
      <button onClick={() => addToast({ type: 'warning', message: 'Warning!' })}>
        Add Warning
      </button>
      <button onClick={() => addToast({ type: 'info', message: 'Info!' })}>
        Add Info
      </button>
      <div data-testid="toast-count">{toasts.length}</div>
    </div>
  )
}

describe('ToastProvider', () => {
  it('renders children correctly', () => {
    render(
      <ToastProvider>
        <div>Test content</div>
      </ToastProvider>
    )
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('adds success toast', async () => {
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    await user.click(screen.getByText('Add Success'))
    expect(screen.getByText('Success!')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('adds error toast', async () => {
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    await user.click(screen.getByText('Add Error'))
    expect(screen.getByText('Error!')).toBeInTheDocument()
  })

  it('adds warning toast', async () => {
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    await user.click(screen.getByText('Add Warning'))
    expect(screen.getByText('Warning!')).toBeInTheDocument()
  })

  it('adds info toast', async () => {
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    await user.click(screen.getByText('Add Info'))
    expect(screen.getByText('Info!')).toBeInTheDocument()
  })

  it('removes toast when dismiss button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    await user.click(screen.getByText('Add Success'))
    expect(screen.getByText('Success!')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Dismiss'))
    expect(screen.queryByText('Success!')).not.toBeInTheDocument()
  })

  it('can show multiple toasts', async () => {
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    await user.click(screen.getByText('Add Success'))
    await user.click(screen.getByText('Add Error'))

    expect(screen.getByText('Success!')).toBeInTheDocument()
    expect(screen.getByText('Error!')).toBeInTheDocument()
    expect(screen.getByTestId('toast-count')).toHaveTextContent('2')
  })
})

describe('useToast', () => {
  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    function BadComponent() {
      useToast()
      return null
    }

    expect(() => render(<BadComponent />)).toThrow(
      'useToast must be used within ToastProvider'
    )

    consoleSpy.mockRestore()
  })
})
