import { render, screen } from '@testing-library/react'
import { Footer } from '@/components/layout/Footer'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    const translations: Record<string, string> = {
      fiscalSponsor: 'hromada is a project of',
      candidSeal: 'Candid Platinum Seal of Transparency',
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

    it('renders fiscal sponsor text', () => {
      render(<Footer />)
      expect(screen.getByText(/hromada is a project of/)).toBeInTheDocument()
    })

    it('renders POCACITO Network link', () => {
      render(<Footer />)
      const pocacitoLink = screen.getByText('POCACITO Network')
      expect(pocacitoLink).toBeInTheDocument()
      expect(pocacitoLink).toHaveAttribute('href', 'https://pocacito.org')
      expect(pocacitoLink).toHaveAttribute('target', '_blank')
      expect(pocacitoLink).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('renders Candid Platinum Seal link', () => {
      render(<Footer />)
      const candidLink = screen.getByText('Candid Platinum Seal of Transparency')
      expect(candidLink).toBeInTheDocument()
      expect(candidLink).toHaveAttribute('href', 'https://app.candid.org/profile/16026326/pocacito-network/')
      expect(candidLink).toHaveAttribute('target', '_blank')
      expect(candidLink).toHaveAttribute('rel', 'noopener noreferrer')
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

    it('does not render About Us link', () => {
      render(<Footer />)
      expect(screen.queryByTestId('link-/about')).not.toBeInTheDocument()
    })

    it('does not render Contact link', () => {
      render(<Footer />)
      expect(screen.queryByTestId('link-/contact')).not.toBeInTheDocument()
    })

    it('renders exactly five links total', () => {
      render(<Footer />)
      // 3 internal navigation links (Terms, Privacy, Sanctions Policy)
      // + 2 external links (POCACITO Network, Candid Seal)
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(5)
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
