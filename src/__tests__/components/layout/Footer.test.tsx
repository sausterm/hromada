import { render, screen } from '@testing-library/react'
import { Footer } from '@/components/layout/Footer'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    const translations: Record<string, string> = {
      terms: 'Terms of Service',
      privacy: 'Privacy Policy',
    }
    if (key === 'copyright') {
      return `© ${params?.year} Thomas D. Protzman. All rights reserved.`
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

describe('Footer', () => {
  describe('Rendering', () => {
    it('renders footer element', () => {
      render(<Footer />)
      expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    })

    it('renders copyright notice with current year', () => {
      render(<Footer />)
      const currentYear = new Date().getFullYear()
      expect(screen.getByText(new RegExp(`© ${currentYear}`))).toBeInTheDocument()
    })

    it('renders copyright with Thomas D. Protzman', () => {
      render(<Footer />)
      expect(screen.getByText(/Thomas D. Protzman/)).toBeInTheDocument()
    })

    it('renders all rights reserved text', () => {
      render(<Footer />)
      expect(screen.getByText(/All rights reserved/)).toBeInTheDocument()
    })

    it('does not render POCACITO or fiscal sponsor text (directory mode)', () => {
      render(<Footer />)
      expect(screen.queryByText(/POCACITO/)).not.toBeInTheDocument()
      expect(screen.queryByText(/hromada is a project of/)).not.toBeInTheDocument()
    })

    it('does not render Candid seal (directory mode)', () => {
      render(<Footer />)
      expect(screen.queryByText(/Candid/)).not.toBeInTheDocument()
    })
  })

  describe('Navigation Links', () => {
    it('renders Terms of Service link', () => {
      render(<Footer />)
      const termsLink = screen.getByTestId('link-/terms')
      expect(termsLink).toBeInTheDocument()
      expect(termsLink).toHaveAttribute('href', '/terms')
      expect(screen.getByText('Terms of Service')).toBeInTheDocument()
    })

    it('renders Privacy Policy link', () => {
      render(<Footer />)
      const privacyLink = screen.getByTestId('link-/privacy')
      expect(privacyLink).toBeInTheDocument()
      expect(privacyLink).toHaveAttribute('href', '/privacy')
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
    })

    it('renders Sanctions Policy link', () => {
      render(<Footer />)
      const sanctionsLink = screen.getByTestId('link-/ofac-policy')
      expect(sanctionsLink).toBeInTheDocument()
      expect(sanctionsLink).toHaveAttribute('href', '/ofac-policy')
      expect(screen.getByText('Sanctions Policy')).toBeInTheDocument()
    })

    it('renders exactly three links total', () => {
      render(<Footer />)
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(3)
    })
  })

  describe('Styling', () => {
    it('has correct background color class', () => {
      render(<Footer />)
      const footer = screen.getByRole('contentinfo')
      expect(footer).toHaveClass('bg-[var(--cream-100)]')
    })

    it('has border top styling', () => {
      render(<Footer />)
      const footer = screen.getByRole('contentinfo')
      expect(footer).toHaveClass('border-t')
    })

    it('has padding for vertical spacing', () => {
      render(<Footer />)
      const footer = screen.getByRole('contentinfo')
      expect(footer).toHaveClass('py-8')
    })
  })

  describe('Accessibility', () => {
    it('all links are accessible', () => {
      render(<Footer />)
      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toBeVisible()
      })
    })

    it('uses semantic footer element', () => {
      render(<Footer />)
      const footer = screen.getByRole('contentinfo')
      expect(footer.tagName).toBe('FOOTER')
    })
  })
})
