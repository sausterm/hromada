import { render, screen, fireEvent } from '@testing-library/react'
import { DocumentaryPhoto } from '@/components/homepage/DocumentaryPhoto'

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill, ...props }: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img data-fill={fill ? 'true' : undefined} {...props} />
  },
}))

describe('DocumentaryPhoto', () => {
  const defaultProps = {
    src: '/photos/kharkiv-solar.jpg',
    alt: 'Solar panels on community center',
    caption: 'Newly installed solar panels in Kharkiv Oblast',
  }

  describe('Rendering', () => {
    it('renders the image with correct src and alt', () => {
      render(<DocumentaryPhoto {...defaultProps} />)

      const img = screen.getByAltText('Solar panels on community center')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', '/photos/kharkiv-solar.jpg')
    })

    it('renders the caption', () => {
      render(<DocumentaryPhoto {...defaultProps} />)

      expect(screen.getByText('Newly installed solar panels in Kharkiv Oblast')).toBeInTheDocument()
    })

    it('renders as a figure element', () => {
      const { container } = render(<DocumentaryPhoto {...defaultProps} />)

      const figure = container.querySelector('figure')
      expect(figure).toBeInTheDocument()
    })

    it('renders caption inside figcaption', () => {
      const { container } = render(<DocumentaryPhoto {...defaultProps} />)

      const figcaption = container.querySelector('figcaption')
      expect(figcaption).toBeInTheDocument()
      expect(figcaption).toHaveTextContent('Newly installed solar panels in Kharkiv Oblast')
    })
  })

  describe('Location badge', () => {
    it('renders location badge when location is provided', () => {
      render(
        <DocumentaryPhoto {...defaultProps} location="Kharkiv Oblast" />
      )

      expect(screen.getByText('Kharkiv Oblast')).toBeInTheDocument()
    })

    it('does not render location badge when location is not provided', () => {
      const { container } = render(<DocumentaryPhoto {...defaultProps} />)

      // The location badge container has the bg-black/60 class
      const locationBadge = container.querySelector('.bg-black\\/60')
      expect(locationBadge).not.toBeInTheDocument()
    })

    it('renders a map pin SVG icon with the location', () => {
      const { container } = render(
        <DocumentaryPhoto {...defaultProps} location="Odesa" />
      )

      const locationBadge = container.querySelector('.bg-black\\/60')
      expect(locationBadge).toBeInTheDocument()
      const svg = locationBadge?.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('location badge is positioned top-left', () => {
      const { container } = render(
        <DocumentaryPhoto {...defaultProps} location="Kyiv" />
      )

      const locationBadge = container.querySelector('.bg-black\\/60')
      expect(locationBadge).toHaveClass('absolute')
      expect(locationBadge).toHaveClass('top-3')
      expect(locationBadge).toHaveClass('left-3')
    })
  })

  describe('Image loading state', () => {
    it('starts with opacity-0 on the image', () => {
      render(<DocumentaryPhoto {...defaultProps} />)

      const img = screen.getByAltText('Solar panels on community center')
      expect(img).toHaveClass('opacity-0')
    })

    it('transitions to opacity-100 after image loads', () => {
      render(<DocumentaryPhoto {...defaultProps} />)

      const img = screen.getByAltText('Solar panels on community center')
      expect(img).toHaveClass('opacity-0')

      fireEvent.load(img)

      expect(img).toHaveClass('opacity-100')
      expect(img).not.toHaveClass('opacity-0')
    })

    it('has transition classes for smooth loading', () => {
      render(<DocumentaryPhoto {...defaultProps} />)

      const img = screen.getByAltText('Solar panels on community center')
      expect(img).toHaveClass('transition-opacity')
      expect(img).toHaveClass('duration-500')
    })
  })

  describe('Styling', () => {
    it('image container has correct aspect ratio', () => {
      const { container } = render(<DocumentaryPhoto {...defaultProps} />)

      const imageContainer = container.querySelector('.aspect-\\[4\\/3\\]')
      expect(imageContainer).toBeInTheDocument()
    })

    it('image container has rounded corners and overflow hidden', () => {
      const { container } = render(<DocumentaryPhoto {...defaultProps} />)

      const imageContainer = container.querySelector('.aspect-\\[4\\/3\\]')
      expect(imageContainer).toHaveClass('rounded-xl')
      expect(imageContainer).toHaveClass('overflow-hidden')
    })

    it('image uses object-cover', () => {
      render(<DocumentaryPhoto {...defaultProps} />)

      const img = screen.getByAltText('Solar panels on community center')
      expect(img).toHaveClass('object-cover')
    })

    it('caption has italic styling', () => {
      const { container } = render(<DocumentaryPhoto {...defaultProps} />)

      const figcaption = container.querySelector('figcaption')
      expect(figcaption).toHaveClass('italic')
      expect(figcaption).toHaveClass('text-sm')
      expect(figcaption).toHaveClass('text-[var(--navy-500)]')
    })

    it('image has fill prop', () => {
      render(<DocumentaryPhoto {...defaultProps} />)

      const img = screen.getByAltText('Solar panels on community center')
      // next/image fill prop is passed as a boolean; our mock maps it to data-fill
      expect(img).toHaveAttribute('data-fill', 'true')
    })

    it('image has sizes attribute', () => {
      render(<DocumentaryPhoto {...defaultProps} />)

      const img = screen.getByAltText('Solar panels on community center')
      expect(img).toHaveAttribute('sizes', '(max-width: 768px) 100vw, 50vw')
    })
  })
})
