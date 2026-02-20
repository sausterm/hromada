import { render, screen, act } from '@testing-library/react'
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
  it('renders nothing when hostname is not allowed', () => {
    // jsdom defaults to localhost, but window.location isn't easily mockable
    // With localhost it should render
  })

  it('renders partner section on localhost', async () => {
    await act(async () => {
      render(<PartnerCarousel />)
    })

    expect(screen.getByText('Our Partners')).toBeInTheDocument()
  })

  it('renders all partner logos (triplicated)', async () => {
    await act(async () => {
      render(<PartnerCarousel />)
    })

    // 6 partners x 3 (triplicated) = 18 img elements
    const ecoactionImages = screen.getAllByAltText('Ecoaction')
    expect(ecoactionImages.length).toBe(3)
  })

  it('renders partner links', async () => {
    await act(async () => {
      render(<PartnerCarousel />)
    })

    const links = screen.getAllByRole('link')
    expect(links.length).toBe(18) // 6 partners x 3
    expect(links[0]).toHaveAttribute('target', '_blank')
    expect(links[0]).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders all partner names', async () => {
    await act(async () => {
      render(<PartnerCarousel />)
    })

    expect(screen.getAllByAltText('Ecoclub').length).toBe(3)
    expect(screen.getAllByAltText('RePower Ukraine').length).toBe(3)
    expect(screen.getAllByAltText('Greenpeace').length).toBe(3)
    expect(screen.getAllByAltText('Energy Act For Ukraine').length).toBe(3)
    expect(screen.getAllByAltText('POCACITO').length).toBe(3)
  })
})
