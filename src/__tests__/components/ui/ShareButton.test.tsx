import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    it('opens share menu when clicked', async () => {
      const user = userEvent.setup()
      render(<ShareButton {...defaultProps} />)

      const button = screen.getByRole('button', { name: /share project/i })
      await user.click(button)

      expect(screen.getByText('Copy link')).toBeInTheDocument()
      expect(screen.getByText('Share on X')).toBeInTheDocument()
      expect(screen.getByText('Share on LinkedIn')).toBeInTheDocument()
      expect(screen.getByText('Share on Facebook')).toBeInTheDocument()
      expect(screen.getByText('Share via Email')).toBeInTheDocument()
    })

    it('closes share menu when clicking the button again', async () => {
      const user = userEvent.setup()
      render(<ShareButton {...defaultProps} />)

      const button = screen.getByRole('button', { name: /share project/i })

      // Open menu
      await user.click(button)
      expect(screen.getByText('Copy link')).toBeInTheDocument()

      // Close menu
      await user.click(button)
      expect(screen.queryByText('Copy link')).not.toBeInTheDocument()
    })

    it('closes menu when clicking outside', async () => {
      render(
        <div>
          <div data-testid="outside">Outside element</div>
          <ShareButton {...defaultProps} />
        </div>
      )

      const button = screen.getByRole('button', { name: /share project/i })

      // Open menu
      fireEvent.click(button)
      expect(screen.getByText('Copy link')).toBeInTheDocument()

      // Click outside - use mousedown as the component listens for mousedown
      fireEvent.mouseDown(screen.getByTestId('outside'))

      await waitFor(() => {
        expect(screen.queryByText('Copy link')).not.toBeInTheDocument()
      })
    })

    it('does not close menu when clicking inside the dropdown', async () => {
      const user = userEvent.setup()
      render(<ShareButton {...defaultProps} />)

      const button = screen.getByRole('button', { name: /share project/i })
      await user.click(button)

      // Click on the dropdown container (divider area)
      const copyLinkButton = screen.getByText('Copy link')
      const dropdown = copyLinkButton.closest('div[class*="absolute"]')
      if (dropdown) {
        fireEvent.click(dropdown)
      }

      // Menu should still be visible
      expect(screen.getByText('Copy link')).toBeInTheDocument()
    })
  })

  describe('Copy Link Functionality', () => {
    it('copies link to clipboard and shows success toast', async () => {
      // Create a fresh mock for this test
      const clipboardWriteText = jest.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: clipboardWriteText },
        writable: true,
        configurable: true,
      })

      render(<ShareButton {...defaultProps} />)

      // Open menu using fireEvent (more predictable for this component)
      const button = screen.getByRole('button', { name: /share project/i })
      fireEvent.click(button)

      // Verify menu is open
      expect(screen.getByText('Copy link')).toBeInTheDocument()

      // Click copy link using fireEvent
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
      // Create a fresh mock for this test that rejects
      const clipboardWriteText = jest.fn().mockRejectedValue(new Error('Copy failed'))
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: clipboardWriteText },
        writable: true,
        configurable: true,
      })

      render(<ShareButton {...defaultProps} />)

      // Open menu using fireEvent
      const button = screen.getByRole('button', { name: /share project/i })
      fireEvent.click(button)

      // Verify menu is open
      expect(screen.getByText('Copy link')).toBeInTheDocument()

      // Click copy link using fireEvent
      const copyButton = screen.getByText('Copy link')
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to copy link')
      })
    })
  })

  describe('Social Media Sharing', () => {
    it('opens Twitter share dialog', async () => {
      const user = userEvent.setup()
      render(<ShareButton {...defaultProps} />)

      // Open menu
      const button = screen.getByRole('button', { name: /share project/i })
      await user.click(button)

      // Click share on X
      await user.click(screen.getByText('Share on X'))

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

      // Menu should close
      await waitFor(() => {
        expect(screen.queryByText('Copy link')).not.toBeInTheDocument()
      })
    })

    it('opens LinkedIn share dialog', async () => {
      const user = userEvent.setup()
      render(<ShareButton {...defaultProps} />)

      // Open menu
      const button = screen.getByRole('button', { name: /share project/i })
      await user.click(button)

      // Click share on LinkedIn
      await user.click(screen.getByText('Share on LinkedIn'))

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('linkedin.com/sharing/share-offsite'),
        '_blank',
        'width=600,height=400'
      )

      // Menu should close
      await waitFor(() => {
        expect(screen.queryByText('Copy link')).not.toBeInTheDocument()
      })
    })

    it('opens Facebook share dialog', async () => {
      const user = userEvent.setup()
      render(<ShareButton {...defaultProps} />)

      // Open menu
      const button = screen.getByRole('button', { name: /share project/i })
      await user.click(button)

      // Click share on Facebook
      await user.click(screen.getByText('Share on Facebook'))

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('facebook.com/sharer/sharer.php'),
        '_blank',
        'width=600,height=400'
      )

      // Menu should close
      await waitFor(() => {
        expect(screen.queryByText('Copy link')).not.toBeInTheDocument()
      })
    })

    it('opens email share with correct subject and body', async () => {
      const user = userEvent.setup()

      render(<ShareButton {...defaultProps} />)

      // Open menu
      const button = screen.getByRole('button', { name: /share project/i })
      await user.click(button)

      // Click share via email
      await user.click(screen.getByText('Share via Email'))

      // Check that location.href was set to a mailto link
      await waitFor(() => {
        expect(window.location.href).toContain('mailto:?subject=')
      })
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

    it('prevents event propagation when clicking menu items', () => {
      const parentClickHandler = jest.fn()

      render(
        <div onClick={parentClickHandler}>
          <ShareButton {...defaultProps} />
        </div>
      )

      // Open menu
      const button = screen.getByRole('button', { name: /share project/i })
      fireEvent.click(button)

      // Click copy link
      fireEvent.click(screen.getByText('Copy link'))

      expect(parentClickHandler).not.toHaveBeenCalled()
    })
  })

  describe('Project Description Handling', () => {
    it('uses default description when projectDescription is not provided', async () => {
      const user = userEvent.setup()

      render(
        <ShareButton
          projectId="test-project-123"
          projectTitle="Test Project Title"
        />
      )

      // Open menu
      const button = screen.getByRole('button', { name: /share project/i })
      await user.click(button)

      // Click share via email to test the description
      await user.click(screen.getByText('Share via Email'))

      await waitFor(() => {
        expect(window.location.href).toContain(
          encodeURIComponent('Help Ukrainian communities rebuild with direct infrastructure support.')
        )
      })
    })

    it('truncates long descriptions to 200 characters with ellipsis', async () => {
      const user = userEvent.setup()
      const longDescription = 'A'.repeat(250)

      render(
        <ShareButton
          projectId="test-project-123"
          projectTitle="Test Project Title"
          projectDescription={longDescription}
        />
      )

      // Open menu
      const button = screen.getByRole('button', { name: /share project/i })
      await user.click(button)

      // Click share via email to test the description
      await user.click(screen.getByText('Share via Email'))

      // The description should be truncated with ellipsis
      await waitFor(() => {
        expect(window.location.href).toContain(encodeURIComponent('A'.repeat(200) + '...'))
      })
    })

    it('does not add ellipsis for descriptions under 200 characters', async () => {
      const user = userEvent.setup()
      const shortDescription = 'Short description'

      render(
        <ShareButton
          projectId="test-project-123"
          projectTitle="Test Project Title"
          projectDescription={shortDescription}
        />
      )

      // Open menu
      const button = screen.getByRole('button', { name: /share project/i })
      await user.click(button)

      // Click share via email to test the description
      await user.click(screen.getByText('Share via Email'))

      await waitFor(() => {
        expect(window.location.href).toContain(encodeURIComponent(shortDescription))
      })
      expect(window.location.href).not.toContain(encodeURIComponent(shortDescription + '...'))
    })
  })

  describe('URL Generation', () => {
    it('generates correct share URL based on projectId', async () => {
      // Create a fresh mock for this test
      const clipboardWriteText = jest.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: clipboardWriteText },
        writable: true,
        configurable: true,
      })

      render(<ShareButton {...defaultProps} projectId="my-unique-project" />)

      // Open menu using fireEvent
      const button = screen.getByRole('button', { name: /share project/i })
      fireEvent.click(button)

      // Click copy link using fireEvent
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
