import { render, screen } from '@testing-library/react'
import UnsubscribePage from '@/app/[locale]/(public)/unsubscribe/page'

// Mock next/navigation
const mockSearchParams = new URLSearchParams()
jest.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}))

// Mock Header
jest.mock('@/components/layout/Header', () => ({
  Header: () => <header data-testid="header">Header</header>,
}))

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

// Mock i18n navigation
jest.mock('@/i18n/navigation', () => ({
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/unsubscribe',
}))

describe('UnsubscribePage', () => {
  beforeEach(() => {
    // Reset search params
    mockSearchParams.delete('success')
  })

  it('renders default state without success param', () => {
    render(<UnsubscribePage />)
    expect(screen.getByText('Unsubscribe')).toBeInTheDocument()
    expect(screen.getByText(/without clicking an unsubscribe link/)).toBeInTheDocument()
  })

  it('renders success state when success=true', () => {
    mockSearchParams.set('success', 'true')
    render(<UnsubscribePage />)
    expect(screen.getByText("You've been unsubscribed")).toBeInTheDocument()
    expect(screen.getByText(/no longer receive newsletter emails/)).toBeInTheDocument()
  })

  it('renders header', () => {
    render(<UnsubscribePage />)
    expect(screen.getByTestId('header')).toBeInTheDocument()
  })
})
