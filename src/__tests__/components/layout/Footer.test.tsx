import { render, screen } from '@testing-library/react'
import { Footer } from '@/components/layout/Footer'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      aboutUs: 'About Us',
      terms: 'Terms of Service',
      privacy: 'Privacy Policy',
      contact: 'Contact',
      builtFor: 'Built to support renewable infrastructure',
      geoRestrictions: 'Service restricted in certain regions for security',
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
  })

  describe('Navigation Links', () => {
    it('renders About Us link', () => {
      render(<Footer />)
      const aboutLink = screen.getByTestId('link-/about')
      expect(aboutLink).toBeInTheDocument()
      expect(aboutLink).toHaveAttribute('href', '/about')
      expect(screen.getByText('About Us')).toBeInTheDocument()
    })

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

    it('renders Contact link', () => {
      render(<Footer />)
      const contactLink = screen.getByTestId('link-/contact')
      expect(contactLink).toBeInTheDocument()
      expect(contactLink).toHaveAttribute('href', '/contact')
      expect(screen.getByText('Contact')).toBeInTheDocument()
    })

    it('renders all four navigation links', () => {
      render(<Footer />)
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(4)
    })
  })

  describe('Footer Messages', () => {
    it('renders builtFor message', () => {
      render(<Footer />)
      expect(screen.getByText(/Built to support renewable infrastructure/)).toBeInTheDocument()
    })

    it('renders geo restrictions notice', () => {
      render(<Footer />)
      expect(screen.getByText(/Service restricted in certain regions for security/)).toBeInTheDocument()
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
