import { render, screen } from '@testing-library/react'
import BlockedPage from '@/app/[locale]/blocked/page'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      title: 'Access Denied',
      message: 'This service is not available in your region.',
      reasonTitle: 'Why am I seeing this?',
      reason: 'For security reasons, access from certain regions is restricted.',
      vpnTitle: 'Using a VPN?',
      vpnMessage: 'If you believe this is an error, please contact support.',
    }
    return translations[key] || key
  },
}))

describe('BlockedPage', () => {
  describe('Rendering', () => {
    it('renders the page', () => {
      render(<BlockedPage />)
      expect(screen.getByText('Access Denied')).toBeInTheDocument()
    })

    it('displays the main message', () => {
      render(<BlockedPage />)
      expect(screen.getByText('This service is not available in your region.')).toBeInTheDocument()
    })

    it('displays reason section', () => {
      render(<BlockedPage />)
      expect(screen.getByText('Why am I seeing this?')).toBeInTheDocument()
      expect(screen.getByText(/For security reasons/)).toBeInTheDocument()
    })

    it('displays VPN section', () => {
      render(<BlockedPage />)
      expect(screen.getByText('Using a VPN?')).toBeInTheDocument()
      expect(screen.getByText(/If you believe this is an error/)).toBeInTheDocument()
    })

    it('renders blocked icon', () => {
      const { container } = render(<BlockedPage />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass('text-red-600')
    })
  })

  describe('Styling', () => {
    it('has centered layout', () => {
      const { container } = render(<BlockedPage />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center')
    })

    it('has proper background color', () => {
      const { container } = render(<BlockedPage />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('bg-[var(--cream-50)]')
    })

    it('content card has shadow', () => {
      const { container } = render(<BlockedPage />)
      const card = container.querySelector('.shadow-lg')
      expect(card).toBeInTheDocument()
    })
  })
})
