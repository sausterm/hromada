import { render, screen } from '@testing-library/react'
import { Badge } from '@/components/ui/Badge'

describe('Badge', () => {
  it('renders children correctly', () => {
    render(<Badge>New</Badge>)
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('applies variant styles', () => {
    const { rerender } = render(<Badge variant="success">Success</Badge>)
    expect(screen.getByText('Success')).toHaveClass('bg-green-100', 'text-green-800')

    rerender(<Badge variant="danger">Danger</Badge>)
    expect(screen.getByText('Danger')).toHaveClass('bg-red-100', 'text-red-800')

    rerender(<Badge variant="warning">Warning</Badge>)
    expect(screen.getByText('Warning')).toHaveClass('bg-yellow-100', 'text-yellow-800')

    rerender(<Badge variant="info">Info</Badge>)
    expect(screen.getByText('Info')).toHaveClass('bg-blue-100', 'text-blue-800')
  })

  it('applies size styles', () => {
    const { rerender } = render(<Badge size="sm">Small</Badge>)
    expect(screen.getByText('Small')).toHaveClass('px-2', 'py-0.5')

    rerender(<Badge size="lg">Large</Badge>)
    expect(screen.getByText('Large')).toHaveClass('px-3', 'py-1')
  })

  it('renders status dot when dot prop is true', () => {
    render(<Badge dot dotColor="#ff0000">With Dot</Badge>)

    const badge = screen.getByText('With Dot')
    const dot = badge.querySelector('span')

    expect(dot).toBeInTheDocument()
    expect(dot).toHaveStyle({ backgroundColor: '#ff0000' })
  })

  it('does not render dot when dot prop is false', () => {
    render(<Badge>No Dot</Badge>)

    const badge = screen.getByText('No Dot')
    const dot = badge.querySelector('span.w-2.h-2')

    expect(dot).not.toBeInTheDocument()
  })
})
