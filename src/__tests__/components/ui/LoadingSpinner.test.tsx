import { render, screen } from '@testing-library/react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

describe('LoadingSpinner', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<LoadingSpinner />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('renders spinning animation element', () => {
      const { container } = render(<LoadingSpinner />)
      const spinningElement = container.querySelector('.animate-spin')
      expect(spinningElement).toBeInTheDocument()
    })
  })

  describe('Size variations', () => {
    it('renders small size correctly', () => {
      const { container } = render(<LoadingSpinner size="sm" />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('w-4', 'h-4')
    })

    it('renders medium size correctly (default)', () => {
      const { container } = render(<LoadingSpinner />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('w-6', 'h-6')
    })

    it('renders large size correctly', () => {
      const { container } = render(<LoadingSpinner size="lg" />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('w-10', 'h-10')
    })
  })

  describe('Custom className', () => {
    it('applies custom className', () => {
      const { container } = render(<LoadingSpinner className="custom-class" />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('custom-class')
    })

    it('combines size class with custom className', () => {
      const { container } = render(<LoadingSpinner size="lg" className="my-spinner" />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('w-10', 'h-10', 'my-spinner')
    })
  })

  describe('Styling', () => {
    it('has rounded border style', () => {
      const { container } = render(<LoadingSpinner />)
      const spinningElement = container.querySelector('.animate-spin')
      expect(spinningElement).toHaveClass('rounded-full')
    })

    it('has border styling for spinner effect', () => {
      const { container } = render(<LoadingSpinner />)
      const spinningElement = container.querySelector('.animate-spin')
      expect(spinningElement).toHaveClass('border-2')
    })
  })
})
