import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FAQItem } from '@/components/homepage/FAQItem'

describe('FAQItem', () => {
  const defaultProps = {
    question: 'How does Hromada work?',
  }

  describe('Rendering', () => {
    it('renders the question text', () => {
      render(
        <FAQItem {...defaultProps}>
          <p>Hromada connects donors with Ukrainian municipalities.</p>
        </FAQItem>
      )

      expect(screen.getByText('How does Hromada work?')).toBeInTheDocument()
    })

    it('renders the children content', () => {
      render(
        <FAQItem {...defaultProps}>
          <p>Hromada connects donors with Ukrainian municipalities.</p>
        </FAQItem>
      )

      expect(screen.getByText('Hromada connects donors with Ukrainian municipalities.')).toBeInTheDocument()
    })

    it('renders a toggle button', () => {
      render(
        <FAQItem {...defaultProps}>
          <p>Answer content</p>
        </FAQItem>
      )

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('renders the chevron SVG icon', () => {
      const { container } = render(
        <FAQItem {...defaultProps}>
          <p>Answer content</p>
        </FAQItem>
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('Expand and collapse', () => {
    it('starts collapsed with maxHeight 0px and opacity 0', () => {
      const { container } = render(
        <FAQItem {...defaultProps}>
          <p>Answer content</p>
        </FAQItem>
      )

      const contentWrapper = container.querySelector('.overflow-hidden')
      expect(contentWrapper).toHaveStyle({ maxHeight: '0px', opacity: 0 })
    })

    it('expands when the button is clicked', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <FAQItem {...defaultProps}>
          <p>Answer content</p>
        </FAQItem>
      )

      const button = screen.getByRole('button')
      await user.click(button)

      const contentWrapper = container.querySelector('.overflow-hidden')
      expect(contentWrapper).toHaveStyle({ opacity: 1 })
    })

    it('collapses when clicked again', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <FAQItem {...defaultProps}>
          <p>Answer content</p>
        </FAQItem>
      )

      const button = screen.getByRole('button')

      // Expand
      await user.click(button)
      const contentWrapper = container.querySelector('.overflow-hidden')
      expect(contentWrapper).toHaveStyle({ opacity: 1 })

      // Collapse
      await user.click(button)
      expect(contentWrapper).toHaveStyle({ maxHeight: '0px', opacity: 0 })
    })

    it('rotates the chevron icon when expanded', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <FAQItem {...defaultProps}>
          <p>Answer content</p>
        </FAQItem>
      )

      const svg = container.querySelector('svg')
      expect(svg).not.toHaveClass('rotate-180')

      await user.click(screen.getByRole('button'))
      expect(svg).toHaveClass('rotate-180')
    })

    it('removes rotation when collapsed again', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <FAQItem {...defaultProps}>
          <p>Answer content</p>
        </FAQItem>
      )

      const svg = container.querySelector('svg')

      await user.click(screen.getByRole('button'))
      expect(svg).toHaveClass('rotate-180')

      await user.click(screen.getByRole('button'))
      expect(svg).not.toHaveClass('rotate-180')
    })
  })

  describe('Content visibility', () => {
    it('content is in the DOM even when collapsed', () => {
      render(
        <FAQItem {...defaultProps}>
          <p>Hidden but present answer</p>
        </FAQItem>
      )

      // The content is rendered but hidden via maxHeight: 0 and opacity: 0
      expect(screen.getByText('Hidden but present answer')).toBeInTheDocument()
    })

    it('renders complex children correctly', () => {
      render(
        <FAQItem question="Can I donate to multiple projects?">
          <p>Yes, you can support multiple projects.</p>
          <ul>
            <li>Project A</li>
            <li>Project B</li>
          </ul>
        </FAQItem>
      )

      expect(screen.getByText('Yes, you can support multiple projects.')).toBeInTheDocument()
      expect(screen.getByText('Project A')).toBeInTheDocument()
      expect(screen.getByText('Project B')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('has bottom border class', () => {
      const { container } = render(
        <FAQItem {...defaultProps}>
          <p>Answer</p>
        </FAQItem>
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('border-b')
      expect(wrapper).toHaveClass('border-[var(--cream-300)]')
    })

    it('button takes full width', () => {
      render(
        <FAQItem {...defaultProps}>
          <p>Answer</p>
        </FAQItem>
      )

      const button = screen.getByRole('button')
      expect(button).toHaveClass('w-full')
    })

    it('question text has proper styling', () => {
      render(
        <FAQItem {...defaultProps}>
          <p>Answer</p>
        </FAQItem>
      )

      const questionSpan = screen.getByText('How does Hromada work?')
      expect(questionSpan).toHaveClass('font-medium')
      expect(questionSpan).toHaveClass('text-[var(--navy-700)]')
    })
  })
})
