import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '@/components/ui/Input'

describe('Input', () => {
  it('renders correctly', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('handles value changes', () => {
    const handleChange = jest.fn()
    render(<Input onChange={handleChange} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'test' } })

    expect(handleChange).toHaveBeenCalled()
  })

  it('displays error message', () => {
    render(<Input error="This field is required" />)

    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })

  it('applies error variant styles when error is present', () => {
    render(<Input error="Error" data-testid="input" />)

    const input = screen.getByTestId('input')
    expect(input).toHaveClass('border-red-500')
  })

  it('renders with left addon', () => {
    render(<Input leftAddon={<span data-testid="left-addon">$</span>} />)

    expect(screen.getByTestId('left-addon')).toBeInTheDocument()
  })

  it('renders with right addon', () => {
    render(<Input rightAddon={<span data-testid="right-addon">@</span>} />)

    expect(screen.getByTestId('right-addon')).toBeInTheDocument()
  })

  it('applies size styles', () => {
    const { rerender } = render(<Input inputSize="sm" />)
    expect(screen.getByRole('textbox')).toHaveClass('px-3', 'py-1.5')

    rerender(<Input inputSize="lg" />)
    expect(screen.getByRole('textbox')).toHaveClass('px-4', 'py-3')
  })

  it('forwards ref correctly', () => {
    const ref = { current: null }
    render(<Input ref={ref} />)

    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })
})
