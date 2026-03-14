import { render, screen, act } from '@testing-library/react'
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
const originalRAF = global.requestAnimationFrame
const originalCAF = global.cancelAnimationFrame

beforeEach(() => {
  global.requestAnimationFrame = jest.fn((cb) => {
    return setTimeout(cb, 0) as unknown as number
  })
  global.cancelAnimationFrame = jest.fn((id) => clearTimeout(id))
})

afterEach(() => {
  global.requestAnimationFrame = originalRAF
  global.cancelAnimationFrame = originalCAF
})

describe('PartnerCarousel', () => {
  it('renders partner section on localhost', async () => {
    await act(async () => {
      render(<PartnerCarousel />)
    })

    expect(screen.getByText('Our Partners')).toBeInTheDocument()
  })

  it('renders only Ecoaction (single partner, directory mode)', async () => {
    await act(async () => {
      render(<PartnerCarousel />)
    })

    const ecoactionImages = screen.getAllByAltText('Ecoaction')
    expect(ecoactionImages.length).toBe(1)
  })

  it('renders single partner link', async () => {
    await act(async () => {
      render(<PartnerCarousel />)
    })

    const links = screen.getAllByRole('link')
    expect(links.length).toBe(1)
    expect(links[0]).toHaveAttribute('target', '_blank')
    expect(links[0]).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('does not render hidden partners', async () => {
    await act(async () => {
      render(<PartnerCarousel />)
    })

    expect(screen.queryByAltText('Ecoclub')).not.toBeInTheDocument()
    expect(screen.queryByAltText('Greenpeace')).not.toBeInTheDocument()
    expect(screen.queryByAltText('POCACITO')).not.toBeInTheDocument()
  })
})
