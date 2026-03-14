import { render, screen, waitFor } from '@testing-library/react'
import { PartnerCarousel } from '@/components/layout/PartnerCarousel'

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, fill, sizes, ...props }: any) => <img alt={alt} {...props} />,
}))

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'partners.title': 'Our Partners',
    }
    return translations[key] || key
  },
}))

// Mock @/i18n/navigation
jest.mock('@/i18n/navigation', () => ({
  usePathname: () => '/projects',
}))

// Mock requestAnimationFrame
const originalRAF = window.requestAnimationFrame
const originalCAF = window.cancelAnimationFrame

describe('PartnerCarousel - Directory Mode (single partner)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 0) as unknown as number)
    window.cancelAnimationFrame = jest.fn((id) => clearTimeout(id))
    Object.defineProperty(window, 'location', {
      value: { hostname: 'localhost' },
      writable: true,
    })
  })

  afterEach(() => {
    window.requestAnimationFrame = originalRAF
    window.cancelAnimationFrame = originalCAF
  })

  it('renders the title', async () => {
    render(<PartnerCarousel />)
    await waitFor(() => {
      expect(screen.getByText('Our Partners')).toBeInTheDocument()
    })
  })

  it('renders section element', async () => {
    const { container } = render(<PartnerCarousel />)
    await waitFor(() => {
      const section = container.querySelector('section')
      expect(section).toBeInTheDocument()
    })
  })

  it('renders only Ecoaction logo (single partner, static display)', async () => {
    render(<PartnerCarousel />)
    await waitFor(() => {
      const images = screen.getAllByAltText('Ecoaction')
      expect(images).toHaveLength(1)
    })
  })

  it('does not render Ecoclub, Greenpeace, or POCACITO (directory mode)', async () => {
    render(<PartnerCarousel />)
    await waitFor(() => {
      expect(screen.queryByAltText('Ecoclub')).not.toBeInTheDocument()
      expect(screen.queryByAltText('Greenpeace')).not.toBeInTheDocument()
      expect(screen.queryByAltText('POCACITO')).not.toBeInTheDocument()
    })
  })

  it('Ecoaction links to correct URL', async () => {
    render(<PartnerCarousel />)
    await waitFor(() => {
      const link = screen.getByAltText('Ecoaction').closest('a')
      expect(link).toHaveAttribute('href', 'https://en.ecoaction.org.ua/')
    })
  })

  it('partner link opens in new tab', async () => {
    render(<PartnerCarousel />)
    await waitFor(() => {
      const link = screen.getByAltText('Ecoaction').closest('a')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  it('renders heading', async () => {
    render(<PartnerCarousel />)
    await waitFor(() => {
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveTextContent('Our Partners')
    })
  })

  it('does not render carousel animation elements (single partner)', async () => {
    const { container } = render(<PartnerCarousel />)
    await waitFor(() => {
      // No gradient masks or cursor-grab for single partner
      expect(container.querySelector('.cursor-grab')).not.toBeInTheDocument()
      expect(container.querySelector('.bg-gradient-to-r')).not.toBeInTheDocument()
    })
  })

  it('returns null on homepage when hideOnHomepage is true', () => {
    jest.spyOn(require('@/i18n/navigation'), 'usePathname').mockReturnValue('/')
    const { container } = render(<PartnerCarousel hideOnHomepage />)
    expect(container.innerHTML).toBe('')
  })

  it('returns null on about page', () => {
    jest.spyOn(require('@/i18n/navigation'), 'usePathname').mockReturnValue('/about')
    const { container } = render(<PartnerCarousel />)
    expect(container.innerHTML).toBe('')
  })
})
