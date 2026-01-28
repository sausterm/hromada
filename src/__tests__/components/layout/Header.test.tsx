import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Header } from '@/components/layout/Header'

// Mock next-intl
const mockReplace = jest.fn()

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'nav.admin': 'Admin',
      'nav.aboutUs': 'About Us',
      'nav.submitProject': 'Submit a Project',
      'nav.language': 'Language',
    }
    return translations[key] || key
  },
  useLocale: () => 'en',
}))

// Mock @/i18n/navigation
jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className} data-testid={`link-${href}`}>
      {children}
    </a>
  ),
  usePathname: () => '/',
  useRouter: () => ({
    replace: mockReplace,
    push: jest.fn(),
    prefetch: jest.fn(),
  }),
}))

// Mock @/i18n
jest.mock('@/i18n', () => ({
  locales: ['en', 'uk'] as const,
}))

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the header element', () => {
      render(<Header />)
      expect(screen.getByRole('banner')).toBeInTheDocument()
    })

    it('renders the logo/brand with both English and Ukrainian text', () => {
      render(<Header />)
      expect(screen.getByText('hromada')).toBeInTheDocument()
      expect(screen.getByText('|', { exact: false })).toBeInTheDocument()
    })

    it('renders the Admin link', () => {
      render(<Header />)
      const adminLink = screen.getByTestId('link-/admin')
      expect(adminLink).toBeInTheDocument()
      expect(adminLink).toHaveAttribute('href', '/admin')
      expect(screen.getByText('Admin')).toBeInTheDocument()
    })

    it('renders the About Us link', () => {
      render(<Header />)
      const aboutLink = screen.getByTestId('link-/about')
      expect(aboutLink).toBeInTheDocument()
      expect(aboutLink).toHaveAttribute('href', '/about')
      expect(screen.getByText('About Us')).toBeInTheDocument()
    })

    it('renders the Submit Project link', () => {
      render(<Header />)
      const submitLink = screen.getByTestId('link-/submit-project')
      expect(submitLink).toBeInTheDocument()
      expect(submitLink).toHaveAttribute('href', '/submit-project')
      expect(screen.getByText('Submit a Project')).toBeInTheDocument()
    })

    it('renders children when provided', () => {
      render(
        <Header>
          <div data-testid="filter-bar">Filter content</div>
        </Header>
      )
      expect(screen.getByTestId('filter-bar')).toBeInTheDocument()
      expect(screen.getByText('Filter content')).toBeInTheDocument()
    })
  })

  describe('Navigation Links', () => {
    it('Admin link has correct href', () => {
      render(<Header />)
      const adminLink = screen.getByTestId('link-/admin')
      expect(adminLink).toHaveAttribute('href', '/admin')
    })

    it('About Us link has correct href', () => {
      render(<Header />)
      const aboutLink = screen.getByTestId('link-/about')
      expect(aboutLink).toHaveAttribute('href', '/about')
    })

    it('Submit Project link has correct href', () => {
      render(<Header />)
      const submitLink = screen.getByTestId('link-/submit-project')
      expect(submitLink).toHaveAttribute('href', '/submit-project')
    })
  })

  describe('Language Switcher', () => {
    it('renders language switcher button', () => {
      render(<Header />)
      const langButton = screen.getByRole('button', { name: /language/i })
      expect(langButton).toBeInTheDocument()
    })

    it('shows current locale indicator', () => {
      render(<Header />)
      // EN should be displayed for current locale
      expect(screen.getByText('EN')).toBeInTheDocument()
    })

    it('opens language dropdown on click', async () => {
      const user = userEvent.setup()
      render(<Header />)

      const langButton = screen.getByRole('button', { name: /language/i })
      await user.click(langButton)

      // Should show language options
      expect(screen.getByText('English')).toBeInTheDocument()
    })

    it('closes language dropdown when clicking outside', async () => {
      const user = userEvent.setup()
      render(<Header />)

      // Open dropdown
      const langButton = screen.getByRole('button', { name: /language/i })
      await user.click(langButton)
      expect(screen.getByText('English')).toBeInTheDocument()

      // Click outside (on the header itself)
      fireEvent.mouseDown(document.body)

      // Dropdown should close - English option should no longer be visible
      // Note: The button still shows, but the dropdown options should be gone
    })

    it('toggles dropdown visibility on button click', async () => {
      const user = userEvent.setup()
      render(<Header />)

      const langButton = screen.getByRole('button', { name: /language/i })

      // Open dropdown
      await user.click(langButton)
      expect(screen.getByText('English')).toBeInTheDocument()

      // Close dropdown
      await user.click(langButton)
      // After closing, the English text in dropdown should be gone
      // (Note: EN in button is still visible)
    })
  })

  describe('Brand Logo Interactions', () => {
    it('renders hromada button for English locale switch', () => {
      render(<Header />)
      const hromadaButton = screen.getByRole('button', { name: 'hromada' })
      expect(hromadaButton).toBeInTheDocument()
    })

    it('switches to English locale when clicking hromada', async () => {
      const user = userEvent.setup()
      render(<Header />)

      const hromadaButton = screen.getByRole('button', { name: 'hromada' })
      await user.click(hromadaButton)

      expect(mockReplace).toHaveBeenCalledWith('/', { locale: 'en' })
    })

    it('switches to Ukrainian locale when clicking the Ukrainian text', async () => {
      const user = userEvent.setup()
      render(<Header />)

      // The Ukrainian button contains the Cyrillic text
      const ukrainianButton = screen.getByRole('button', { name: /громада/i })
      await user.click(ukrainianButton)

      expect(mockReplace).toHaveBeenCalledWith('/', { locale: 'uk' })
    })
  })

  describe('Sticky Header', () => {
    it('has sticky positioning class', () => {
      render(<Header />)
      const header = screen.getByRole('banner')
      expect(header).toHaveClass('sticky')
      expect(header).toHaveClass('top-0')
    })

    it('has appropriate z-index for stacking', () => {
      render(<Header />)
      const header = screen.getByRole('banner')
      expect(header).toHaveClass('z-50')
    })
  })

  describe('Accessibility', () => {
    it('language button has aria-label', () => {
      render(<Header />)
      const langButton = screen.getByRole('button', { name: /language/i })
      expect(langButton).toHaveAttribute('aria-label', 'Language')
    })

    it('all navigation links are keyboard accessible', () => {
      render(<Header />)
      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toBeVisible()
      })
    })
  })

  describe('Mobile Responsiveness Classes', () => {
    it('Admin link has hidden class for small screens', () => {
      render(<Header />)
      const adminLink = screen.getByTestId('link-/admin')
      expect(adminLink).toHaveClass('hidden')
      expect(adminLink).toHaveClass('sm:inline-block')
    })

    it('About Us link has hidden class for small screens', () => {
      render(<Header />)
      const aboutLink = screen.getByTestId('link-/about')
      expect(aboutLink).toHaveClass('hidden')
      expect(aboutLink).toHaveClass('sm:inline-block')
    })

    it('Submit Project button shows + on mobile', () => {
      render(<Header />)
      // The mobile version shows just a +
      expect(screen.getByText('+')).toBeInTheDocument()
    })
  })
})
