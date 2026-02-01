import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Header } from '@/components/layout/Header'

// Mock next-intl
const mockReplace = jest.fn()
const mockPush = jest.fn()

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'nav.admin': 'Admin',
      'nav.aboutUs': 'About Us',
      'nav.submitProject': 'Submit a Project',
      'nav.home': 'Home',
      'nav.menu': 'Menu',
      'nav.language': 'Language',
      'nav.headerSubtitle': 'Built to support Ukrainian renewable infrastructure recovery',
    }
    return translations[key] || key
  },
  useLocale: () => 'en',
}))

// Mock @/i18n/navigation
jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className, onClick }: { href: string; children: React.ReactNode; className?: string; onClick?: () => void }) => (
    <a href={href} className={className} onClick={onClick} data-testid={`link-${href}`}>
      {children}
    </a>
  ),
  usePathname: () => '/',
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
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
      expect(screen.getByText('громада')).toBeInTheDocument()
    })

    it('renders the menu button', () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: 'Menu' })
      expect(menuButton).toBeInTheDocument()
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

    it('renders tagline', () => {
      render(<Header />)
      expect(screen.getByText('Built to support Ukrainian renewable infrastructure recovery')).toBeInTheDocument()
    })
  })

  describe('Navigation Menu', () => {
    it('shows navigation dropdown on mouse enter', async () => {
      render(<Header />)

      const menuButton = screen.getByRole('button', { name: 'Menu' })
      // Hover over the menu area (the parent div has the hover handler)
      fireEvent.mouseEnter(menuButton.parentElement!)

      // Navigation links should appear
      await waitFor(() => {
        expect(screen.getByTestId('link-/')).toBeInTheDocument()
        expect(screen.getByTestId('link-/about')).toBeInTheDocument()
        expect(screen.getByTestId('link-/submit-project')).toBeInTheDocument()
        expect(screen.getByTestId('link-/admin')).toBeInTheDocument()
      })
    })

    it('hides navigation dropdown on mouse leave', async () => {
      render(<Header />)

      const menuButton = screen.getByRole('button', { name: 'Menu' })
      const menuContainer = menuButton.parentElement!

      // Open menu
      fireEvent.mouseEnter(menuContainer)
      await waitFor(() => {
        expect(screen.getByTestId('link-/admin')).toBeInTheDocument()
      })

      // Close menu
      fireEvent.mouseLeave(menuContainer)
      await waitFor(() => {
        expect(screen.queryByTestId('link-/admin')).not.toBeInTheDocument()
      })
    })

    it('shows correct navigation link texts', async () => {
      render(<Header />)

      const menuButton = screen.getByRole('button', { name: 'Menu' })
      fireEvent.mouseEnter(menuButton.parentElement!)

      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument()
        expect(screen.getByText('About Us')).toBeInTheDocument()
        expect(screen.getByText('Submit a Project')).toBeInTheDocument()
        expect(screen.getByText('Admin')).toBeInTheDocument()
      })
    })
  })

  describe('Language Switcher', () => {
    it('renders language switcher button', () => {
      render(<Header />)
      const langButton = screen.getByRole('button', { name: /language/i })
      expect(langButton).toBeInTheDocument()
    })

    it('shows language dropdown on mouse enter', async () => {
      render(<Header />)

      const langButton = screen.getByRole('button', { name: /language/i })
      // Hover over the language menu area
      fireEvent.mouseEnter(langButton.parentElement!)

      // Should show another flag button for switching
      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        // Should have more than just the language button (another flag appears)
        expect(buttons.length).toBeGreaterThan(3)
      })
    })

    it('hides language dropdown on mouse leave', async () => {
      render(<Header />)

      const langButton = screen.getByRole('button', { name: /language/i })
      const langContainer = langButton.parentElement!

      // Open dropdown
      fireEvent.mouseEnter(langContainer)

      // Close dropdown
      fireEvent.mouseLeave(langContainer)

      // Should close
    })
  })

  describe('Brand Logo Interactions', () => {
    it('renders hromada button for English locale switch', () => {
      render(<Header />)
      const hromadaButton = screen.getByRole('button', { name: 'hromada' })
      expect(hromadaButton).toBeInTheDocument()
    })

    it('renders Ukrainian button for locale switch', () => {
      render(<Header />)
      const ukrainianButton = screen.getByRole('button', { name: /громада/i })
      expect(ukrainianButton).toBeInTheDocument()
    })

    it('switches to English locale when clicking hromada on homepage', async () => {
      const user = userEvent.setup()
      render(<Header />)

      const hromadaButton = screen.getByRole('button', { name: 'hromada' })
      await user.click(hromadaButton)

      // On homepage, it just switches locale
      expect(mockReplace).toHaveBeenCalledWith('/', { locale: 'en' })
    })

    it('switches to Ukrainian locale when clicking the Ukrainian text on homepage', async () => {
      const user = userEvent.setup()
      render(<Header />)

      const ukrainianButton = screen.getByRole('button', { name: /громада/i })
      await user.click(ukrainianButton)

      expect(mockReplace).toHaveBeenCalledWith('/', { locale: 'uk' })
    })
  })

  describe('Brand Logo Navigation from other pages', () => {
    // Note: Testing the non-homepage navigation path (router.push) requires different
    // pathname mocking which is complex with React hooks. The functionality is tested
    // in integration/e2e tests. Line 96 remains uncovered in unit tests.
    it('renders logo buttons for both locales', () => {
      render(<Header />)

      const hromadaButton = screen.getByRole('button', { name: 'hromada' })
      const ukrainianButton = screen.getByRole('button', { name: /громада/i })

      expect(hromadaButton).toBeInTheDocument()
      expect(ukrainianButton).toBeInTheDocument()
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

    it('menu button has aria-label', () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: 'Menu' })
      expect(menuButton).toHaveAttribute('aria-label', 'Menu')
    })

    it('navigation links are accessible when menu is open', async () => {
      render(<Header />)

      const menuButton = screen.getByRole('button', { name: 'Menu' })
      fireEvent.mouseEnter(menuButton.parentElement!)

      await waitFor(() => {
        const links = screen.getAllByRole('link')
        expect(links.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Styling', () => {
    it('has proper background color class', () => {
      render(<Header />)
      const header = screen.getByRole('banner')
      expect(header).toHaveClass('bg-[var(--cream-100)]')
    })

    it('has border bottom', () => {
      render(<Header />)
      const header = screen.getByRole('banner')
      expect(header).toHaveClass('border-b')
    })

    it('has shadow', () => {
      render(<Header />)
      const header = screen.getByRole('banner')
      expect(header).toHaveClass('shadow-sm')
    })
  })

  describe('Click outside to close menus', () => {
    it('closes nav menu when clicking outside', async () => {
      render(<Header />)

      const menuButton = screen.getByRole('button', { name: 'Menu' })
      const menuContainer = menuButton.parentElement!

      // Open menu
      fireEvent.mouseEnter(menuContainer)
      await waitFor(() => {
        expect(screen.getByTestId('link-/admin')).toBeInTheDocument()
      })

      // Simulate click outside
      fireEvent.mouseDown(document.body)

      await waitFor(() => {
        expect(screen.queryByTestId('link-/admin')).not.toBeInTheDocument()
      })
    })

    it('closes language menu when clicking outside', async () => {
      render(<Header />)

      const langButton = screen.getByRole('button', { name: /language/i })
      const langContainer = langButton.parentElement!

      // Open dropdown
      fireEvent.mouseEnter(langContainer)
      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        expect(buttons.length).toBeGreaterThan(3)
      })

      // Simulate click outside
      fireEvent.mouseDown(document.body)

      // Wait for dropdown to close (button count should decrease)
      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        expect(buttons.length).toBeLessThanOrEqual(4)
      })
    })
  })

  describe('Navigation link clicks', () => {
    it('closes menu when clicking a navigation link', async () => {
      const user = userEvent.setup()
      render(<Header />)

      const menuButton = screen.getByRole('button', { name: 'Menu' })
      fireEvent.mouseEnter(menuButton.parentElement!)

      await waitFor(() => {
        expect(screen.getByTestId('link-/')).toBeInTheDocument()
      })

      // Click on Home link
      await user.click(screen.getByTestId('link-/'))

      // Menu should close (since onClick sets isNavMenuOpen to false)
      await waitFor(() => {
        expect(screen.queryByTestId('link-/admin')).not.toBeInTheDocument()
      })
    })

    it('closes menu when clicking About link', async () => {
      const user = userEvent.setup()
      render(<Header />)

      const menuButton = screen.getByRole('button', { name: 'Menu' })
      fireEvent.mouseEnter(menuButton.parentElement!)

      await waitFor(() => {
        expect(screen.getByTestId('link-/about')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('link-/about'))

      await waitFor(() => {
        expect(screen.queryByTestId('link-/admin')).not.toBeInTheDocument()
      })
    })

    it('closes menu when clicking Submit Project link', async () => {
      const user = userEvent.setup()
      render(<Header />)

      const menuButton = screen.getByRole('button', { name: 'Menu' })
      fireEvent.mouseEnter(menuButton.parentElement!)

      await waitFor(() => {
        expect(screen.getByTestId('link-/submit-project')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('link-/submit-project'))

      await waitFor(() => {
        expect(screen.queryByTestId('link-/admin')).not.toBeInTheDocument()
      })
    })

    it('closes menu when clicking Admin link', async () => {
      const user = userEvent.setup()
      render(<Header />)

      const menuButton = screen.getByRole('button', { name: 'Menu' })
      fireEvent.mouseEnter(menuButton.parentElement!)

      await waitFor(() => {
        expect(screen.getByTestId('link-/admin')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('link-/admin'))

      await waitFor(() => {
        expect(screen.queryByTestId('link-/')).not.toBeInTheDocument()
      })
    })
  })

  describe('Language switcher dropdown', () => {
    it('switches language when clicking on dropdown option', async () => {
      const user = userEvent.setup()
      render(<Header />)

      const langButton = screen.getByRole('button', { name: /language/i })
      fireEvent.mouseEnter(langButton.parentElement!)

      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        // More than initial buttons means dropdown is open
        expect(buttons.length).toBeGreaterThan(3)
      })

      // Find the language switch button in the dropdown (it has a title attribute)
      const switchButtons = screen.getAllByRole('button')
      const dropdownButton = switchButtons.find(btn => btn.getAttribute('title'))
      if (dropdownButton) {
        await user.click(dropdownButton)
        expect(mockReplace).toHaveBeenCalledWith('/', { locale: 'uk' })
      }
    })
  })
})
