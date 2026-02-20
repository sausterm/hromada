import { render, screen, fireEvent } from '@testing-library/react'
import { PhotoDocumentaryGallery, PhotoStrip, FeaturedPhoto, LiveMonitoringDisplay } from '@/components/illustrations/PhotoDocumentary'

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, onLoad, ...props }: any) => {
    // Simulate image load
    if (onLoad) setTimeout(() => onLoad(), 0)
    return <img src={src} alt={alt} {...props} />
  },
}))

describe('PhotoDocumentary', () => {
  describe('PhotoDocumentaryGallery', () => {
    it('renders section header', () => {
      render(<PhotoDocumentaryGallery />)
      expect(screen.getByText('Real Projects. Real Impact.')).toBeInTheDocument()
    })

    it('renders documentary evidence label', () => {
      render(<PhotoDocumentaryGallery />)
      expect(screen.getByText('DOCUMENTARY EVIDENCE')).toBeInTheDocument()
    })

    it('renders impact stats', () => {
      render(<PhotoDocumentaryGallery />)
      expect(screen.getByText('Projects Documented')).toBeInTheDocument()
      expect(screen.getByText('Total Capacity')).toBeInTheDocument()
      expect(screen.getByText('People Served')).toBeInTheDocument()
      expect(screen.getByText('Operational')).toBeInTheDocument()
    })

    it('renders photo cards with alt text', () => {
      render(<PhotoDocumentaryGallery />)
      expect(screen.getByAltText('Large rooftop solar array overlooking Ukrainian city')).toBeInTheDocument()
      expect(screen.getByAltText('Community building with solar panels')).toBeInTheDocument()
    })

    it('handles photo card click to expand', () => {
      render(<PhotoDocumentaryGallery />)
      const photo = screen.getByAltText('Large rooftop solar array overlooking Ukrainian city').closest('div[class*="cursor-pointer"]')
      if (photo) fireEvent.click(photo)
      // Should not throw
    })
  })

  describe('PhotoStrip', () => {
    it('renders photos', () => {
      render(<PhotoStrip />)
      // Renders 5 photos + 5 duplicates for seamless loop
      const images = screen.getAllByRole('img')
      expect(images.length).toBe(10)
    })

    it('filters by category', () => {
      render(<PhotoStrip category="completed" />)
      const images = screen.getAllByRole('img')
      // Should render filtered photos + duplicates
      expect(images.length).toBeGreaterThan(0)
    })

    it('renders location text', () => {
      render(<PhotoStrip />)
      expect(screen.getAllByText('Lviv, Ukraine').length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('FeaturedPhoto', () => {
    it('renders default photo', () => {
      render(<FeaturedPhoto />)
      expect(screen.getByAltText('Large rooftop solar array overlooking Ukrainian city')).toBeInTheDocument()
    })

    it('renders with custom photo index', () => {
      render(<FeaturedPhoto photoIndex={1} />)
      expect(screen.getByAltText('Community building with solar panels')).toBeInTheDocument()
    })

    it('renders Actual Site Photo badge', () => {
      render(<FeaturedPhoto />)
      expect(screen.getByText('Actual Site Photo')).toBeInTheDocument()
    })

    it('renders stats when showStats is true', () => {
      render(<FeaturedPhoto showStats={true} />)
      // Stats for first photo
      expect(screen.getByText('45kW')).toBeInTheDocument()
    })

    it('renders location badge', () => {
      render(<FeaturedPhoto />)
      expect(screen.getByText('Lviv, Ukraine')).toBeInTheDocument()
    })
  })

  describe('LiveMonitoringDisplay', () => {
    it('renders Deye header', () => {
      render(<LiveMonitoringDisplay />)
      expect(screen.getByText('Deye')).toBeInTheDocument()
    })

    it('renders system status', () => {
      render(<LiveMonitoringDisplay progress={1} />)
      expect(screen.getByText('ON')).toBeInTheDocument()
    })

    it('renders OFF when progress is low', () => {
      render(<LiveMonitoringDisplay progress={0.3} />)
      expect(screen.getByText('OFF')).toBeInTheDocument()
    })

    it('renders battery level', () => {
      render(<LiveMonitoringDisplay progress={1} />)
      expect(screen.getByText('100%')).toBeInTheDocument()
    })

    it('renders live data badge', () => {
      render(<LiveMonitoringDisplay />)
      expect(screen.getByText('Live data from Kharkiv installation')).toBeInTheDocument()
    })

    it('renders solar and load values', () => {
      render(<LiveMonitoringDisplay progress={1} />)
      expect(screen.getByText('kW Solar')).toBeInTheDocument()
      expect(screen.getByText('kW Load')).toBeInTheDocument()
    })
  })
})
