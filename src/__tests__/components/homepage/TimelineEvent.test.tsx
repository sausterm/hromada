import { render, screen } from '@testing-library/react'
import { TimelineEvent } from '@/components/homepage/TimelineEvent'

describe('TimelineEvent', () => {
  const defaultProps = {
    date: 'March 2024',
    title: 'Solar panels installed',
  }

  describe('Rendering', () => {
    it('renders the date', () => {
      render(<TimelineEvent {...defaultProps} />)
      expect(screen.getByText('March 2024')).toBeInTheDocument()
    })

    it('renders the title', () => {
      render(<TimelineEvent {...defaultProps} />)
      expect(screen.getByText('Solar panels installed')).toBeInTheDocument()
    })

    it('renders description when provided', () => {
      render(
        <TimelineEvent
          {...defaultProps}
          description="50 panels were installed on the community center roof."
        />
      )

      expect(screen.getByText('50 panels were installed on the community center roof.')).toBeInTheDocument()
    })

    it('does not render description paragraph when not provided', () => {
      const { container } = render(<TimelineEvent {...defaultProps} />)

      const paragraphs = container.querySelectorAll('p')
      expect(paragraphs.length).toBe(0)
    })
  })

  describe('Complete state (default)', () => {
    it('defaults to isComplete true', () => {
      const { container } = render(<TimelineEvent {...defaultProps} />)

      const dot = container.querySelector('.rounded-full')
      expect(dot).toHaveClass('bg-green-500')
      expect(dot).toHaveClass('ring-green-100')
    })

    it('shows green dot when explicitly complete', () => {
      const { container } = render(
        <TimelineEvent {...defaultProps} isComplete={true} />
      )

      const dot = container.querySelector('.rounded-full')
      expect(dot).toHaveClass('bg-green-500')
    })

    it('shows green ring when complete', () => {
      const { container } = render(
        <TimelineEvent {...defaultProps} isComplete={true} />
      )

      const dot = container.querySelector('.rounded-full')
      expect(dot).toHaveClass('ring-4')
      expect(dot).toHaveClass('ring-green-100')
    })
  })

  describe('Incomplete state', () => {
    it('shows cream dot when incomplete', () => {
      const { container } = render(
        <TimelineEvent {...defaultProps} isComplete={false} />
      )

      const dot = container.querySelector('.rounded-full')
      expect(dot).toHaveClass('bg-[var(--cream-300)]')
    })

    it('shows cream ring when incomplete', () => {
      const { container } = render(
        <TimelineEvent {...defaultProps} isComplete={false} />
      )

      const dot = container.querySelector('.rounded-full')
      expect(dot).toHaveClass('ring-4')
      expect(dot).toHaveClass('ring-[var(--cream-100)]')
    })

    it('does not have green styling when incomplete', () => {
      const { container } = render(
        <TimelineEvent {...defaultProps} isComplete={false} />
      )

      const dot = container.querySelector('.rounded-full')
      expect(dot).not.toHaveClass('bg-green-500')
      expect(dot).not.toHaveClass('ring-green-100')
    })
  })

  describe('Styling', () => {
    it('uses flex layout with gap', () => {
      const { container } = render(<TimelineEvent {...defaultProps} />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('flex')
      expect(wrapper).toHaveClass('gap-4')
    })

    it('date has correct text styling', () => {
      render(<TimelineEvent {...defaultProps} />)

      const date = screen.getByText('March 2024')
      expect(date).toHaveClass('text-xs')
      expect(date).toHaveClass('text-[var(--navy-400)]')
      expect(date).toHaveClass('font-medium')
    })

    it('title has correct text styling', () => {
      render(<TimelineEvent {...defaultProps} />)

      const title = screen.getByText('Solar panels installed')
      expect(title).toHaveClass('font-semibold')
      expect(title).toHaveClass('text-[var(--navy-700)]')
    })

    it('description has correct text styling', () => {
      render(
        <TimelineEvent {...defaultProps} description="Some details here." />
      )

      const description = screen.getByText('Some details here.')
      expect(description).toHaveClass('text-sm')
      expect(description).toHaveClass('text-[var(--navy-500)]')
    })

    it('renders connecting line between events', () => {
      const { container } = render(<TimelineEvent {...defaultProps} />)

      const line = container.querySelector('.bg-\\[var\\(--cream-300\\)\\].mt-2')
      expect(line).toBeInTheDocument()
    })
  })
})
