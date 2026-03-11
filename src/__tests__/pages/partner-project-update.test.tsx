import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import PartnerPostUpdatePage from '@/app/[locale]/(public)/partner/projects/[id]/update/page'

// Mock useAuth
const mockUseAuth = jest.fn()
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

// Mock i18n navigation
const mockRouterPush = jest.fn()
jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
  useRouter: () => ({ push: mockRouterPush }),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'project-123' }),
  useRouter: () => ({ push: mockRouterPush }),
  usePathname: () => '/partner/projects/project-123/update',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock UI components
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, isLoading, loadingText, ...props }: any) => (
    <button onClick={onClick} {...props}>{isLoading ? loadingText : children}</button>
  ),
}))

jest.mock('@/components/ui/Input', () => ({
  Input: (props: any) => <input {...props} />,
}))

jest.mock('@/components/ui/Textarea', () => ({
  Textarea: (props: any) => <textarea {...props} />,
}))

jest.mock('@/components/ui/Card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

jest.mock('@/components/ui/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}))

jest.mock('@/components/forms/PublicImageUpload', () => ({
  PublicImageUpload: (props: any) => <div data-testid="public-image-upload">ImageUpload</div>,
}))

function setupAuthenticatedPartner() {
  mockUseAuth.mockReturnValue({
    isAuthenticated: true,
    isLoading: false,
    hasRole: jest.fn(() => true),
    isPartner: jest.fn(() => true),
    logout: jest.fn(),
    user: { name: 'Partner User', role: 'PARTNER' },
  })
}

describe('PartnerPostUpdatePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  it('shows loading spinner when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      hasRole: jest.fn(() => false),
      isPartner: jest.fn(() => false),
      user: null,
    })

    render(<PartnerPostUpdatePage />)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('redirects to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      hasRole: jest.fn(() => false),
      isPartner: jest.fn(() => false),
      user: null,
    })

    render(<PartnerPostUpdatePage />)
    expect(mockRouterPush).toHaveBeenCalledWith('/login')
  })

  it('redirects to home when user is not a partner', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: jest.fn(() => false),
      isPartner: jest.fn(() => false),
      user: { name: 'Donor', role: 'DONOR' },
    })

    render(<PartnerPostUpdatePage />)
    expect(mockRouterPush).toHaveBeenCalledWith('/')
  })

  it('shows no access message when partner does not own project', async () => {
    setupAuthenticatedPartner()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ submissions: [] }),
    })

    render(<PartnerPostUpdatePage />)

    await waitFor(() => {
      expect(screen.getByText(/do not have access/)).toBeInTheDocument()
    })
  })

  it('renders the form when partner has access', async () => {
    setupAuthenticatedPartner()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ submissions: [{ approvedProjectId: 'project-123' }] }),
    })

    render(<PartnerPostUpdatePage />)

    await waitFor(() => {
      expect(screen.getByText('Post Project Update')).toBeInTheDocument()
    })
    expect(screen.getByText('Update Type')).toBeInTheDocument()
    expect(screen.getByText(/Title/)).toBeInTheDocument()
    expect(screen.getByText(/Message/)).toBeInTheDocument()
    expect(screen.getByText('Post Update')).toBeInTheDocument()
  })

  it('shows validation error when submitting empty form', async () => {
    setupAuthenticatedPartner()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ submissions: [{ approvedProjectId: 'project-123' }] }),
    })

    render(<PartnerPostUpdatePage />)

    await waitFor(() => {
      expect(screen.getByText('Post Update')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Post Update'))

    await waitFor(() => {
      expect(screen.getByText('Title and message are required.')).toBeInTheDocument()
    })
  })

  it('submits the form successfully and redirects', async () => {
    setupAuthenticatedPartner()
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/partner/projects')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ submissions: [{ approvedProjectId: 'project-123' }] }),
        })
      }
      if (url.includes('/api/projects/project-123/updates')) {
        return Promise.resolve({ ok: true, json: async () => ({ id: 'update-1' }) })
      }
      return Promise.resolve({ ok: false })
    })

    render(<PartnerPostUpdatePage />)

    await waitFor(() => {
      expect(screen.getByText('Post Update')).toBeInTheDocument()
    })

    // Fill in form
    const titleInput = screen.getByPlaceholderText(/Equipment delivered/)
    const messageInput = screen.getByPlaceholderText(/Describe the update/)

    fireEvent.change(titleInput, { target: { value: 'Equipment delivered' } })
    fireEvent.change(messageInput, { target: { value: 'Equipment was delivered to the site today.' } })

    await act(async () => {
      fireEvent.click(screen.getByText('Post Update'))
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/projects/project-123/updates',
        expect.objectContaining({ method: 'POST' })
      )
    })

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/partner')
    })
  })

  it('shows error when API submission fails', async () => {
    setupAuthenticatedPartner()
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/partner/projects')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ submissions: [{ approvedProjectId: 'project-123' }] }),
        })
      }
      if (url.includes('/api/projects/project-123/updates')) {
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: 'Unauthorized' }),
        })
      }
      return Promise.resolve({ ok: false })
    })

    render(<PartnerPostUpdatePage />)

    await waitFor(() => {
      expect(screen.getByText('Post Update')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByPlaceholderText(/Equipment delivered/), {
      target: { value: 'Title' },
    })
    fireEvent.change(screen.getByPlaceholderText(/Describe the update/), {
      target: { value: 'Message content' },
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Post Update'))
    })

    await waitFor(() => {
      expect(screen.getByText('Unauthorized')).toBeInTheDocument()
    })
  })

  it('shows photo upload when type is PHOTO_ADDED', async () => {
    setupAuthenticatedPartner()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ submissions: [{ approvedProjectId: 'project-123' }] }),
    })

    render(<PartnerPostUpdatePage />)

    await waitFor(() => {
      expect(screen.getByText('Post Project Update')).toBeInTheDocument()
    })

    // Change type to PHOTO_ADDED
    const select = screen.getByDisplayValue('Status Update')
    fireEvent.change(select, { target: { value: 'PHOTO_ADDED' } })

    expect(screen.getByTestId('public-image-upload')).toBeInTheDocument()
  })

  it('has cancel link back to partner dashboard', async () => {
    setupAuthenticatedPartner()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ submissions: [{ approvedProjectId: 'project-123' }] }),
    })

    render(<PartnerPostUpdatePage />)

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })
    expect(screen.getByText('Cancel').closest('a')).toHaveAttribute('href', '/partner')
  })
})
