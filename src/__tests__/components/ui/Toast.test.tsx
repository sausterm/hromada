import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, useToast, toast } from '@/components/ui/Toast'

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

describe('Toast auto-removal', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('auto-removes toast after default duration', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    await user.click(screen.getByText('Add Success'))
    expect(screen.getByText('Success!')).toBeInTheDocument()

    // Fast-forward past the default 5000ms duration
    act(() => {
      jest.advanceTimersByTime(5100)
    })

    expect(screen.queryByText('Success!')).not.toBeInTheDocument()
  })

  it('auto-removes toast after custom duration', async () => {
    // Create a component that uses a custom duration
    function CustomDurationComponent() {
      const { addToast, toasts } = useToast()
      return (
        <div>
          <button onClick={() => addToast({ type: 'info', message: 'Quick toast', duration: 1000 })}>
            Add Quick Toast
          </button>
          <div data-testid="count">{toasts.length}</div>
        </div>
      )
    }

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(
      <ToastProvider>
        <CustomDurationComponent />
      </ToastProvider>
    )

    await user.click(screen.getByText('Add Quick Toast'))
    expect(screen.getByText('Quick toast')).toBeInTheDocument()

    // Fast-forward past the custom 1000ms duration
    act(() => {
      jest.advanceTimersByTime(1100)
    })

    expect(screen.queryByText('Quick toast')).not.toBeInTheDocument()
  })
})

describe('Toast styles', () => {
  it('applies success styling', async () => {
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    await user.click(screen.getByText('Add Success'))
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800')
  })

  it('applies error styling', async () => {
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    await user.click(screen.getByText('Add Error'))
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800')
  })

  it('applies warning styling', async () => {
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    await user.click(screen.getByText('Add Warning'))
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('bg-yellow-50', 'border-yellow-200', 'text-yellow-800')
  })

  it('applies info styling', async () => {
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    await user.click(screen.getByText('Add Info'))
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('bg-blue-50', 'border-blue-200', 'text-blue-800')
  })
})

describe('toast convenience methods', () => {
  it('toast.success dispatches custom event', async () => {
    render(
      <ToastProvider>
        <div>Test</div>
      </ToastProvider>
    )

    act(() => {
      toast.success('Success message')
    })

    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeInTheDocument()
    })
  })

  it('toast.error dispatches custom event', async () => {
    render(
      <ToastProvider>
        <div>Test</div>
      </ToastProvider>
    )

    act(() => {
      toast.error('Error message')
    })

    await waitFor(() => {
      expect(screen.getByText('Error message')).toBeInTheDocument()
    })
  })

  it('toast.warning dispatches custom event', async () => {
    render(
      <ToastProvider>
        <div>Test</div>
      </ToastProvider>
    )

    act(() => {
      toast.warning('Warning message')
    })

    await waitFor(() => {
      expect(screen.getByText('Warning message')).toBeInTheDocument()
    })
  })

  it('toast.info dispatches custom event', async () => {
    render(
      <ToastProvider>
        <div>Test</div>
      </ToastProvider>
    )

    act(() => {
      toast.info('Info message')
    })

    await waitFor(() => {
      expect(screen.getByText('Info message')).toBeInTheDocument()
    })
  })
})
