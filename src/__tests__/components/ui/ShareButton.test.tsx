import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ShareButton } from '@/components/ui/ShareButton'

// Mock the toast module
jest.mock('@/components/ui/Toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}))

import { toast } from '@/components/ui/Toast'

// Mock implementations
const mockWindowOpen = jest.fn()

describe('ShareButton', () => {
  beforeAll(() => {
    // Mock clipboard API with a default implementation
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    })

    // Mock window.open
    Object.defineProperty(window, 'open', {
      value: mockWindowOpen,
      writable: true,
      configurable: true,
    })

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'https://hromada.org',
        href: 'https://hromada.org',
      },
      writable: true,
      configurable: true,
    })
  })

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset window.location.href before each test
    window.location.href = 'https://hromada.org'
  })

  const defaultProps = {
    projectId: 'test-project-123',
    projectTitle: 'Test Project Title',
    projectDescription: 'A test project description for sharing.',
  }

  // Helper to open dropdown menu
  const openMenu = () => {
    const button = screen.getByRole('button', { name: /share project/i })
    fireEvent.mouseEnter(button.parentElement!)
  }

  // Helper to close dropdown menu
  const closeMenu = () => {
    const button = screen.getByRole('button', { name: /share project/i })
    fireEvent.mouseLeave(button.parentElement!)
  }

  describe('Rendering', () => {
    it('renders the share button with icon variant by default', () => {
      render(<ShareButton {...defaultProps} />)

      const button = screen.getByRole('button', { name: /share project/i })
      expect(button).toBeInTheDocument()
      expect(button).not.toHaveTextContent('Share')
    })

    it('renders the share button with button variant', () => {
      render(<ShareButton {...defaultProps} variant="button" />)

      const button = screen.getByRole('button', { name: /share project/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveTextContent('Share')
    })

    it('applies custom className', () => {
      render(<ShareButton {...defaultProps} className="custom-class" />)

      const container = screen.getByRole('button', { name: /share project/i }).parentElement
      expect(container).toHaveClass('custom-class')
    })

    it('does not show dropdown menu initially', () => {
      render(<ShareButton {...defaultProps} />)

      expect(screen.queryByText('Copy link')).not.toBeInTheDocument()
      expect(screen.queryByText('Share on X')).not.toBeInTheDocument()
    })
  })

  describe('Share Menu', () => {
    it('opens share menu on hover', () => {
      render(<ShareButton {...defaultProps} />)

      openMenu()

      expect(screen.getByText('Copy link')).toBeInTheDocument()
      expect(screen.getByText('Share on X')).toBeInTheDocument()
      expect(screen.getByText('Share on LinkedIn')).toBeInTheDocument()
      expect(screen.getByText('Share on Facebook')).toBeInTheDocument()
      expect(screen.getByText('Share via Email')).toBeInTheDocument()
    })

    it('closes share menu on mouse leave', async () => {
      render(<ShareButton {...defaultProps} />)

      // Open menu
      openMenu()
      expect(screen.getByText('Copy link')).toBeInTheDocument()

      // Close menu
      closeMenu()
      await waitFor(() => {
        expect(screen.queryByText('Copy link')).not.toBeInTheDocument()
      })
    })

    it('closes menu when clicking outside', async () => {
      render(
        <div>
          <div data-testid="outside">Outside element</div>
          <ShareButton {...defaultProps} />
        </div>
      )

      // Open menu
      openMenu()
      expect(screen.getByText('Copy link')).toBeInTheDocument()

      // Click outside - use mousedown as the component listens for mousedown
      fireEvent.mouseDown(screen.getByTestId('outside'))

      await waitFor(() => {
        expect(screen.queryByText('Copy link')).not.toBeInTheDocument()
      })
    })

    it('keeps menu open when hovering over dropdown', async () => {
      render(<ShareButton {...defaultProps} />)

      openMenu()

      // Hover over dropdown content - this should keep it open
      const copyLinkButton = screen.getByText('Copy link')
      fireEvent.mouseEnter(copyLinkButton.closest('div[class*="absolute"]')!)

      // Menu should still be visible
      expect(screen.getByText('Copy link')).toBeInTheDocument()
    })
  })

  describe('Copy Link Functionality', () => {
    it('copies link to clipboard and shows success toast', async () => {
      const clipboardWriteText = jest.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: clipboardWriteText },
        writable: true,
        configurable: true,
      })

      render(<ShareButton {...defaultProps} />)

      openMenu()

      const copyButton = screen.getByText('Copy link')
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(clipboardWriteText).toHaveBeenCalledWith(
          'https://hromada.org/projects/test-project-123'
        )
      })

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Link copied to clipboard!')
      })
    })

    it('shows error toast when clipboard copy fails', async () => {
      const clipboardWriteText = jest.fn().mockRejectedValue(new Error('Copy failed'))
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: clipboardWriteText },
        writable: true,
        configurable: true,
      })

      render(<ShareButton {...defaultProps} />)

      openMenu()

      const copyButton = screen.getByText('Copy link')
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to copy link')
      })
    })
  })

  describe('Social Media Sharing', () => {
    it('opens Twitter share dialog', async () => {
      render(<ShareButton {...defaultProps} />)

      openMenu()
      fireEvent.click(screen.getByText('Share on X'))

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com/intent/tweet'),
        '_blank',
        'width=600,height=400'
      )
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('Test%20Project%20Title'),
        '_blank',
        'width=600,height=400'
      )
    })

    it('opens LinkedIn share dialog', async () => {
      render(<ShareButton {...defaultProps} />)

      openMenu()
      fireEvent.click(screen.getByText('Share on LinkedIn'))

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('linkedin.com/sharing/share-offsite'),
        '_blank',
        'width=600,height=400'
      )
    })

    it('opens Facebook share dialog', async () => {
      render(<ShareButton {...defaultProps} />)

      openMenu()
      fireEvent.click(screen.getByText('Share on Facebook'))

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('facebook.com/sharer/sharer'),
        '_blank',
        'width=600,height=400'
      )
    })

    it('opens email share with correct subject and body', async () => {
      render(<ShareButton {...defaultProps} />)

      openMenu()
      fireEvent.click(screen.getByText('Share via Email'))

      expect(window.location.href).toContain('mailto:')
      expect(window.location.href).toContain('subject=')
      expect(window.location.href).toContain('Test%20Project%20Title')
    })
  })

  describe('Event Propagation', () => {
    it('prevents event propagation when clicking the share button', () => {
      const parentClickHandler = jest.fn()

      render(
        <div onClick={parentClickHandler}>
          <ShareButton {...defaultProps} />
        </div>
      )

      const button = screen.getByRole('button', { name: /share project/i })
      fireEvent.click(button)

      expect(parentClickHandler).not.toHaveBeenCalled()
    })

    it('prevents event propagation when clicking menu items', async () => {
      const parentClickHandler = jest.fn()

      render(
        <div onClick={parentClickHandler}>
          <ShareButton {...defaultProps} />
        </div>
      )

      openMenu()
      fireEvent.click(screen.getByText('Copy link'))

      // Parent should not have received the click
      expect(parentClickHandler).not.toHaveBeenCalled()
    })
  })

  describe('Description Handling', () => {
    it('uses default description when projectDescription is not provided', async () => {
      render(
        <ShareButton
          projectId="test-project-123"
          projectTitle="Test Project Title"
        />
      )

      openMenu()
      fireEvent.click(screen.getByText('Share via Email'))

      expect(window.location.href).toContain('Help%20Ukrainian%20communities')
    })

    it('truncates long descriptions to 200 characters with ellipsis', async () => {
      const longDescription = 'A'.repeat(250)

      render(
        <ShareButton
          projectId="test-project-123"
          projectTitle="Test Project Title"
          projectDescription={longDescription}
        />
      )

      openMenu()
      fireEvent.click(screen.getByText('Share via Email'))

      // The description should be truncated with ellipsis
      expect(window.location.href).toContain(encodeURIComponent('A'.repeat(200) + '...'))
    })

    it('does not add ellipsis for descriptions under 200 characters', async () => {
      const shortDescription = 'Short description'

      render(
        <ShareButton
          projectId="test-project-123"
          projectTitle="Test Project Title"
          projectDescription={shortDescription}
        />
      )

      openMenu()
      fireEvent.click(screen.getByText('Share via Email'))

      expect(window.location.href).toContain(encodeURIComponent(shortDescription))
      expect(window.location.href).not.toContain(encodeURIComponent(shortDescription + '...'))
    })
  })

  describe('URL Generation', () => {
    it('generates correct share URL based on projectId', async () => {
      const clipboardWriteText = jest.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: clipboardWriteText },
        writable: true,
        configurable: true,
      })

      render(<ShareButton {...defaultProps} projectId="my-unique-project" />)

      openMenu()
      fireEvent.click(screen.getByText('Copy link'))

      await waitFor(() => {
        expect(clipboardWriteText).toHaveBeenCalledWith(
          'https://hromada.org/projects/my-unique-project'
        )
      })
    })
  })

  describe('Accessibility', () => {
    it('has accessible name for the share button', () => {
      render(<ShareButton {...defaultProps} />)

      const button = screen.getByRole('button', { name: /share project/i })
      expect(button).toHaveAttribute('aria-label', 'Share project')
    })

    it('has title attribute for tooltip', () => {
      render(<ShareButton {...defaultProps} />)

      const button = screen.getByRole('button', { name: /share project/i })
      expect(button).toHaveAttribute('title', 'Share')
    })
  })
})
