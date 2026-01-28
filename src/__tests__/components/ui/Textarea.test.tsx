import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Textarea } from '@/components/ui/Textarea'

describe('Textarea', () => {
  it('renders correctly', () => {
    render(<Textarea placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('accepts user input', async () => {
    const user = userEvent.setup()
    render(<Textarea placeholder="Enter text" />)

    const textarea = screen.getByPlaceholderText('Enter text')
    await user.type(textarea, 'Hello world')

    expect(textarea).toHaveValue('Hello world')
  })

  it('applies default variant styles', () => {
    render(<Textarea data-testid="textarea" />)
    const textarea = screen.getByTestId('textarea')
    expect(textarea.className).toContain('border-gray-300')
  })

  it('applies error variant styles when error prop is provided', () => {
    render(<Textarea data-testid="textarea" error="This field is required" />)
    const textarea = screen.getByTestId('textarea')
    expect(textarea.className).toContain('border-red-500')
  })

  it('displays error message when provided', () => {
    render(<Textarea error="This field is required" />)
    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })

  it('does not display error message when not provided', () => {
    render(<Textarea placeholder="Enter text" />)
    expect(screen.queryByText('This field is required')).not.toBeInTheDocument()
  })

  it('can be disabled', () => {
    render(<Textarea placeholder="Enter text" disabled />)
    expect(screen.getByPlaceholderText('Enter text')).toBeDisabled()
  })

  it('applies custom className', () => {
    render(<Textarea data-testid="textarea" className="custom-class" />)
    const textarea = screen.getByTestId('textarea')
    expect(textarea.className).toContain('custom-class')
  })

  it('supports rows prop', () => {
    render(<Textarea data-testid="textarea" rows={10} />)
    const textarea = screen.getByTestId('textarea')
    expect(textarea).toHaveAttribute('rows', '10')
  })

  it('forwards ref correctly', () => {
    const ref = { current: null } as React.RefObject<HTMLTextAreaElement>
    render(<Textarea ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
  })
})
