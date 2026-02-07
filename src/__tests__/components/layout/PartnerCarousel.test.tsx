import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { PartnerCarousel } from '@/components/layout/PartnerCarousel'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'partners.title': 'Our Partners',
    }
    return translations[key] || key
  },
}))

// Track animation frame callbacks
let animationFrameCallback: (() => void) | null = null
let animationFrameId = 0

// Mock requestAnimationFrame and cancelAnimationFrame
const mockRequestAnimationFrame = jest.fn((callback: () => void) => {
  animationFrameCallback = callback
  animationFrameId++
  return animationFrameId
})

const mockCancelAnimationFrame = jest.fn()

// Store original window methods
const originalRequestAnimationFrame = window.requestAnimationFrame
const originalCancelAnimationFrame = window.cancelAnimationFrame

describe('PartnerCarousel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    animationFrameCallback = null
    animationFrameId = 0

    // Mock requestAnimationFrame
    window.requestAnimationFrame = mockRequestAnimationFrame
    window.cancelAnimationFrame = mockCancelAnimationFrame
  })

  afterEach(() => {
    // Restore original methods
    window.requestAnimationFrame = originalRequestAnimationFrame
    window.cancelAnimationFrame = originalCancelAnimationFrame
  })

  describe('Visibility based on hostname', () => {
    const originalLocation = window.location

    beforeEach(() => {
      // Reset location mock for each test
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true,
      })
    })

    afterEach(() => {
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
      })
    })

    it('renders on localhost', async () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true,
      })

      render(<PartnerCarousel />)

      await waitFor(() => {
        expect(screen.getByText('Our Partners')).toBeInTheDocument()
      })
    })

    it('renders on 127.0.0.1', async () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: '127.0.0.1' },
        writable: true,
      })

      render(<PartnerCarousel />)

      await waitFor(() => {
        expect(screen.getByText('Our Partners')).toBeInTheDocument()
      })
    })

    it('renders on hromadaproject.org', async () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'hromadaproject.org' },
        writable: true,
      })

      render(<PartnerCarousel />)

      await waitFor(() => {
        expect(screen.getByText('Our Partners')).toBeInTheDocument()
      })
    })

    it('renders on www.hromadaproject.org', async () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'www.hromadaproject.org' },
        writable: true,
      })

      render(<PartnerCarousel />)

      await waitFor(() => {
        expect(screen.getByText('Our Partners')).toBeInTheDocument()
      })
    })

    it('renders on demo subdomain', async () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'demo.hromadaproject.org' },
        writable: true,
      })

      render(<PartnerCarousel />)

      await waitFor(() => {
        expect(screen.getByText('Our Partners')).toBeInTheDocument()
      })
    })

    it('renders on v2 subdomain', async () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'v2.hromadaproject.org' },
        writable: true,
      })

      render(<PartnerCarousel />)

      await waitFor(() => {
        expect(screen.getByText('Our Partners')).toBeInTheDocument()
      })
    })

    it('does not render on other hostnames', async () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'example.com' },
        writable: true,
      })

      render(<PartnerCarousel />)

      await waitFor(() => {
        expect(screen.queryByText('Our Partners')).not.toBeInTheDocument()
      })
    })
  })

  describe('Rendering', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true,
      })
    })

    it('renders the section element', async () => {
      const { container } = render(<PartnerCarousel />)

      await waitFor(() => {
        const section = container.querySelector('section')
        expect(section).toBeInTheDocument()
      })
    })

    it('renders the title', async () => {
      render(<PartnerCarousel />)

      await waitFor(() => {
        expect(screen.getByText('Our Partners')).toBeInTheDocument()
      })
    })

    it('renders partner logos as links', async () => {
      render(<PartnerCarousel />)

      await waitFor(() => {
        // Should render multiple partner links (triplicated for seamless loop)
        const partnerLinks = screen.getAllByRole('link')
        expect(partnerLinks.length).toBeGreaterThan(0)
      })
    })

    it('renders partner images', async () => {
      render(<PartnerCarousel />)

      await waitFor(() => {
        const images = screen.getAllByRole('img')
        expect(images.length).toBeGreaterThan(0)
      })
    })

    it('partner links open in new tab', async () => {
      render(<PartnerCarousel />)

      await waitFor(() => {
        const partnerLinks = screen.getAllByRole('link')
        partnerLinks.forEach(link => {
          expect(link).toHaveAttribute('target', '_blank')
          expect(link).toHaveAttribute('rel', 'noopener noreferrer')
        })
      })
    })

    it('renders Ecoaction partner', async () => {
      render(<PartnerCarousel />)

      await waitFor(() => {
        const images = screen.getAllByAltText('Ecoaction')
        expect(images.length).toBeGreaterThan(0)
      })
    })

    it('renders Greenpeace partner', async () => {
      render(<PartnerCarousel />)

      await waitFor(() => {
        const images = screen.getAllByAltText('Greenpeace')
        expect(images.length).toBeGreaterThan(0)
      })
    })

    it('triplicates partners for seamless loop', async () => {
      render(<PartnerCarousel />)

      await waitFor(() => {
        // With 6 partners triplicated, we should have 18 links
        const partnerLinks = screen.getAllByRole('link')
        expect(partnerLinks.length).toBe(18)
      })
    })
  })

  describe('Styling', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true,
      })
    })

    it('has correct background color', async () => {
      const { container } = render(<PartnerCarousel />)

      await waitFor(() => {
        const section = container.querySelector('section')
        expect(section).toHaveClass('bg-[var(--cream-100)]')
      })
    })

    it('has border top', async () => {
      const { container } = render(<PartnerCarousel />)

      await waitFor(() => {
        const section = container.querySelector('section')
        expect(section).toHaveClass('border-t')
      })
    })

    it('has overflow hidden', async () => {
      const { container } = render(<PartnerCarousel />)

      await waitFor(() => {
        const section = container.querySelector('section')
        expect(section).toHaveClass('overflow-hidden')
      })
    })

    it('images have lazy loading', async () => {
      render(<PartnerCarousel />)

      await waitFor(() => {
        const images = screen.getAllByRole('img')
        images.forEach(img => {
          expect(img).toHaveAttribute('loading', 'lazy')
        })
      })
    })

    it('images are not draggable', async () => {
      render(<PartnerCarousel />)

      await waitFor(() => {
        const images = screen.getAllByRole('img')
        images.forEach(img => {
          expect(img).toHaveAttribute('draggable', 'false')
        })
      })
    })
  })

  describe('Interaction - Pause on hover', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true,
      })
    })

    it('has cursor grab style on container', async () => {
      const { container } = render(<PartnerCarousel />)

      await waitFor(() => {
        const carouselContainer = container.querySelector('.cursor-grab')
        expect(carouselContainer).toBeInTheDocument()
      })
    })
  })

  describe('Gradient masks', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true,
      })
    })

    it('renders left gradient mask', async () => {
      const { container } = render(<PartnerCarousel />)

      await waitFor(() => {
        const leftMask = container.querySelector('.bg-gradient-to-r')
        expect(leftMask).toBeInTheDocument()
        expect(leftMask).toHaveClass('left-0')
      })
    })

    it('renders right gradient mask', async () => {
      const { container } = render(<PartnerCarousel />)

      await waitFor(() => {
        const rightMask = container.querySelector('.bg-gradient-to-l')
        expect(rightMask).toBeInTheDocument()
        expect(rightMask).toHaveClass('right-0')
      })
    })

    it('gradient masks are not interactive', async () => {
      const { container } = render(<PartnerCarousel />)

      await waitFor(() => {
        // Check gradient masks specifically (they are inside the cursor-grab container)
        const carouselContainer = container.querySelector('.cursor-grab')
        const gradientMasks = carouselContainer?.querySelectorAll('.bg-gradient-to-r, .bg-gradient-to-l')
        expect(gradientMasks?.length).toBe(2)
        gradientMasks?.forEach(mask => {
          expect(mask).toHaveClass('pointer-events-none')
        })
      })
    })
  })

  describe('Partner links', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true,
      })
    })

    it('Ecoaction links to correct URL', async () => {
      render(<PartnerCarousel />)

      await waitFor(() => {
        const ecoactionLinks = screen.getAllByAltText('Ecoaction')
        const link = ecoactionLinks[0].closest('a')
        expect(link).toHaveAttribute('href', 'https://en.ecoaction.org.ua/')
      })
    })

    it('Greenpeace links to correct URL', async () => {
      render(<PartnerCarousel />)

      await waitFor(() => {
        const greenpeaceLinks = screen.getAllByAltText('Greenpeace')
        const link = greenpeaceLinks[0].closest('a')
        expect(link).toHaveAttribute('href', 'https://www.greenpeace.org/ukraine/en/')
      })
    })

    it('RePower Ukraine links to correct URL', async () => {
      render(<PartnerCarousel />)

      await waitFor(() => {
        const repowerLinks = screen.getAllByAltText('RePower Ukraine')
        const link = repowerLinks[0].closest('a')
        expect(link).toHaveAttribute('href', 'https://repowerua.org/')
      })
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true,
      })
    })

    it('all images have alt text', async () => {
      render(<PartnerCarousel />)

      await waitFor(() => {
        const images = screen.getAllByRole('img')
        images.forEach(img => {
          expect(img).toHaveAttribute('alt')
          expect(img.getAttribute('alt')).not.toBe('')
        })
      })
    })

    it('section contains heading', async () => {
      render(<PartnerCarousel />)

      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 2 })
        expect(heading).toHaveTextContent('Our Partners')
      })
    })
  })

  describe('Links prevent click when dragged', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true,
      })
    })

    it('links are not draggable', async () => {
      render(<PartnerCarousel />)

      await waitFor(() => {
        const links = screen.getAllByRole('link')
        links.forEach(link => {
          expect(link).toHaveAttribute('draggable', 'false')
        })
      })
    })
  })
})
