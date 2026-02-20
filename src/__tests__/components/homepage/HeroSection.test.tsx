import { render, screen, fireEvent } from '@testing-library/react'
import { HeroSection } from '@/components/homepage/HeroSection'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'homepage.hero.promiseBadge': '100% of donations fund projects',
      'homepage.hero.headline': 'Power Ukrainian Communities',
      'homepage.hero.subheadline': 'Connect with Ukrainian municipalities',
      'homepage.hero.statCommunities': 'Communities',
      'homepage.hero.statProjects': 'Projects',
      'homepage.hero.statFunding': 'Funding Needed',
      'homepage.hero.ctaBrowse': 'Browse Projects',
      'homepage.hero.ctaHowItWorks': 'How It Works',
    }
    return translations[key] || key
  },
}))

// Mock @/i18n/navigation
jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className} data-testid={`link-${href}`}>
      {children}
    </a>
  ),
}))

// Mock Button
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

// Mock CountUp components
jest.mock('@/components/homepage/CountUp', () => ({
  CountUp: ({ end, prefix, suffix }: { end: number; prefix?: string; suffix?: string }) => (
    <span>{prefix}{end}{suffix}</span>
  ),
  CountUpCurrency: ({ end }: { end: number }) => <span>${end}</span>,
}))

const defaultStats = {
  projectCount: 42,
  fundingNeeded: 500000,
  communityCount: 15,
}

describe('HeroSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the headline', () => {
    render(<HeroSection totalStats={defaultStats} />)
    expect(screen.getByText('Power Ukrainian Communities')).toBeInTheDocument()
  })

  it('renders the subheadline', () => {
    render(<HeroSection totalStats={defaultStats} />)
    expect(screen.getByText('Connect with Ukrainian municipalities')).toBeInTheDocument()
  })

  it('renders the promise badge', () => {
    render(<HeroSection totalStats={defaultStats} />)
    expect(screen.getByText('100% of donations fund projects')).toBeInTheDocument()
  })

  it('renders stat labels', () => {
    render(<HeroSection totalStats={defaultStats} />)
    expect(screen.getByText('Communities')).toBeInTheDocument()
    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('Funding Needed')).toBeInTheDocument()
  })

  it('renders stat values from props', () => {
    render(<HeroSection totalStats={defaultStats} />)
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('$500000')).toBeInTheDocument()
  })

  it('renders Browse Projects CTA', () => {
    render(<HeroSection totalStats={defaultStats} />)
    expect(screen.getByText('Browse Projects')).toBeInTheDocument()
    expect(screen.getByTestId('link-/projects')).toBeInTheDocument()
  })

  it('renders How It Works link', () => {
    render(<HeroSection totalStats={defaultStats} />)
    expect(screen.getByText('How It Works')).toBeInTheDocument()
    expect(screen.getByTestId('link-#how-it-works')).toBeInTheDocument()
  })

  it('renders scroll hint button', () => {
    render(<HeroSection totalStats={defaultStats} />)
    const scrollButton = screen.getByLabelText('Scroll to featured projects')
    expect(scrollButton).toBeInTheDocument()
  })

  it('scroll hint button calls scrollIntoView', () => {
    const mockScrollIntoView = jest.fn()
    const mockElement = { scrollIntoView: mockScrollIntoView }
    jest.spyOn(document, 'getElementById').mockReturnValue(mockElement as unknown as HTMLElement)

    render(<HeroSection totalStats={defaultStats} />)
    fireEvent.click(screen.getByLabelText('Scroll to featured projects'))

    expect(document.getElementById).toHaveBeenCalledWith('featured-projects')
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })
  })

  it('sets up scroll listener on mount', () => {
    const addEventSpy = jest.spyOn(window, 'addEventListener')
    render(<HeroSection totalStats={defaultStats} />)

    expect(addEventSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true })
    addEventSpy.mockRestore()
  })

  it('cleans up scroll listener on unmount', () => {
    const removeEventSpy = jest.spyOn(window, 'removeEventListener')
    const { unmount } = render(<HeroSection totalStats={defaultStats} />)
    unmount()

    expect(removeEventSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
    removeEventSpy.mockRestore()
  })

  it('handles scroll event for parallax', () => {
    render(<HeroSection totalStats={defaultStats} />)

    // Simulate scroll
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true })
    fireEvent.scroll(window)
  })
})
