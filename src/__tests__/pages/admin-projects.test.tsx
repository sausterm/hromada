import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewProjectPage from '@/app/[locale]/admin/projects/new/page'
import EditProjectPage from '@/app/[locale]/admin/projects/[id]/page'

// Mock next/navigation
const mockPush = jest.fn()
const mockParams = { id: 'test-project-123' }

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    prefetch: jest.fn(),
  }),
  useParams: () => mockParams,
}))

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'admin.projects.backToDashboard': '← Back to Dashboard',
      'admin.projects.notFound': 'Project Not Found',
      'admin.projects.confirmDelete': 'Are you sure you want to delete this project?',
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

// Mock useAdminAuth hook
const mockLogin = jest.fn()
const mockLogout = jest.fn()
let mockIsAuthenticated = true
let mockAuthLoading = false

jest.mock('@/hooks/useAdminAuth', () => ({
  useAdminAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    isLoading: mockAuthLoading,
    login: mockLogin,
    logout: mockLogout,
  }),
}))

// Mock ProjectForm component
const mockFormSubmit = jest.fn()
const mockFormCancel = jest.fn()
const mockFormDelete = jest.fn()

jest.mock('@/components/admin/ProjectForm', () => ({
  ProjectForm: ({ onSubmit, onCancel, onDelete, project, isLoading }: any) => {
    mockFormSubmit.mockImplementation(onSubmit)
    mockFormCancel.mockImplementation(onCancel)
    if (onDelete) mockFormDelete.mockImplementation(onDelete)

    return (
      <div data-testid="project-form">
        <span>{project ? `Editing: ${project.facilityName}` : 'New Project Form'}</span>
        <span>{isLoading ? 'Loading...' : ''}</span>
        <button onClick={() => onSubmit({ facilityName: 'Test Project' })} data-testid="submit-btn">
          Submit
        </button>
        <button onClick={onCancel} data-testid="cancel-btn">Cancel</button>
        {onDelete && (
          <button onClick={onDelete} data-testid="delete-btn">Delete</button>
        )}
      </div>
    )
  },
}))

// Mock fetch
global.fetch = jest.fn()

// Sample project data
const mockProject = {
  id: 'test-project-123',
  facilityName: 'Test Hospital',
  municipalityName: 'Test Municipality',
  category: 'HOSPITAL',
  urgency: 'HIGH',
  status: 'OPEN',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-20T10:00:00Z',
}

describe('NewProjectPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsAuthenticated = true
    mockAuthLoading = false
    ;(global.fetch as jest.Mock).mockReset()
  })

  describe('Authentication', () => {
    it('shows loading spinner while checking auth', () => {
      mockAuthLoading = true
      render(<NewProjectPage />)
      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('redirects to admin when not authenticated', () => {
      mockIsAuthenticated = false
      render(<NewProjectPage />)
      expect(mockPush).toHaveBeenCalledWith('/admin')
    })
  })

  describe('Rendering', () => {
    it('renders back to dashboard link', () => {
      render(<NewProjectPage />)
      expect(screen.getByTestId('link-/admin')).toBeInTheDocument()
      expect(screen.getByText('← Back to Dashboard')).toBeInTheDocument()
    })

    it('renders ProjectForm component', () => {
      render(<NewProjectPage />)
      expect(screen.getByTestId('project-form')).toBeInTheDocument()
      expect(screen.getByText('New Project Form')).toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('submits form successfully and redirects', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project: { id: 'new-id' } }),
      })

      render(<NewProjectPage />)

      const submitBtn = screen.getByTestId('submit-btn')
      await user.click(submitBtn)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/projects', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }))
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin')
      })
    })

    it('shows error message on API failure', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to create project' }),
      })

      render(<NewProjectPage />)

      const submitBtn = screen.getByTestId('submit-btn')
      await user.click(submitBtn)

      await waitFor(() => {
        expect(screen.getByText('Failed to create project')).toBeInTheDocument()
      })
    })

    it('shows error message on network failure', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(<NewProjectPage />)

      const submitBtn = screen.getByTestId('submit-btn')
      await user.click(submitBtn)

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })
  })

  describe('Cancel', () => {
    it('navigates back to admin on cancel', async () => {
      const user = userEvent.setup()
      render(<NewProjectPage />)

      const cancelBtn = screen.getByTestId('cancel-btn')
      await user.click(cancelBtn)

      expect(mockPush).toHaveBeenCalledWith('/admin')
    })
  })
})

describe('EditProjectPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsAuthenticated = true
    mockAuthLoading = false
    ;(global.fetch as jest.Mock).mockReset()
  })

  describe('Authentication', () => {
    it('shows loading spinner while checking auth', () => {
      mockAuthLoading = true
      ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))
      render(<EditProjectPage />)
      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('redirects to admin when not authenticated', async () => {
      mockIsAuthenticated = false
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project: mockProject }),
      })
      render(<EditProjectPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin')
      })
    })
  })

  describe('Loading Project', () => {
    it('shows loading spinner while fetching project', async () => {
      ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))
      render(<EditProjectPage />)
      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('fetches project with correct ID', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project: mockProject }),
      })

      render(<EditProjectPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/projects/test-project-123')
      })
    })

    it('shows not found when project does not exist', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      render(<EditProjectPage />)

      await waitFor(() => {
        expect(screen.getByText('Project Not Found')).toBeInTheDocument()
      })
    })

    it('shows back to dashboard button when project not found', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      render(<EditProjectPage />)

      await waitFor(() => {
        expect(screen.getByTestId('link-/admin')).toBeInTheDocument()
      })
    })
  })

  describe('Rendering', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ project: mockProject }),
      })
    })

    it('renders back to dashboard link', async () => {
      render(<EditProjectPage />)

      await waitFor(() => {
        expect(screen.getByText('← Back to Dashboard')).toBeInTheDocument()
      })
    })

    it('renders ProjectForm with project data', async () => {
      render(<EditProjectPage />)

      await waitFor(() => {
        expect(screen.getByTestId('project-form')).toBeInTheDocument()
        expect(screen.getByText('Editing: Test Hospital')).toBeInTheDocument()
      })
    })

    it('renders delete button', async () => {
      render(<EditProjectPage />)

      await waitFor(() => {
        expect(screen.getByTestId('delete-btn')).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project: mockProject }),
      })
    })

    it('submits form successfully and redirects', async () => {
      const user = userEvent.setup()

      render(<EditProjectPage />)

      await waitFor(() => {
        expect(screen.getByTestId('project-form')).toBeInTheDocument()
      })

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project: mockProject }),
      })

      const submitBtn = screen.getByTestId('submit-btn')
      await user.click(submitBtn)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/projects/test-project-123', expect.objectContaining({
          method: 'PUT',
        }))
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin')
      })
    })

    it('shows error message on API failure', async () => {
      const user = userEvent.setup()

      render(<EditProjectPage />)

      await waitFor(() => {
        expect(screen.getByTestId('project-form')).toBeInTheDocument()
      })

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to update project' }),
      })

      const submitBtn = screen.getByTestId('submit-btn')
      await user.click(submitBtn)

      await waitFor(() => {
        expect(screen.getByText('Failed to update project')).toBeInTheDocument()
      })
    })
  })

  describe('Delete Project', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project: mockProject }),
      })
      // Mock window.confirm
      global.confirm = jest.fn(() => true)
    })

    it('deletes project and redirects on confirm', async () => {
      const user = userEvent.setup()

      render(<EditProjectPage />)

      await waitFor(() => {
        expect(screen.getByTestId('delete-btn')).toBeInTheDocument()
      })

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      const deleteBtn = screen.getByTestId('delete-btn')
      await user.click(deleteBtn)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/projects/test-project-123', expect.objectContaining({
          method: 'DELETE',
        }))
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin')
      })
    })

    it('does not delete when confirm is cancelled', async () => {
      const user = userEvent.setup()
      global.confirm = jest.fn(() => false)

      render(<EditProjectPage />)

      await waitFor(() => {
        expect(screen.getByTestId('delete-btn')).toBeInTheDocument()
      })

      const deleteBtn = screen.getByTestId('delete-btn')
      await user.click(deleteBtn)

      // Should not have made a DELETE request
      expect(global.fetch).not.toHaveBeenCalledWith(
        '/api/projects/test-project-123',
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('shows error on delete failure', async () => {
      const user = userEvent.setup()

      render(<EditProjectPage />)

      await waitFor(() => {
        expect(screen.getByTestId('delete-btn')).toBeInTheDocument()
      })

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to delete project' }),
      })

      const deleteBtn = screen.getByTestId('delete-btn')
      await user.click(deleteBtn)

      await waitFor(() => {
        expect(screen.getByText('Failed to delete project')).toBeInTheDocument()
      })
    })
  })

  describe('Cancel', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project: mockProject }),
      })
    })

    it('navigates back to admin on cancel', async () => {
      const user = userEvent.setup()

      render(<EditProjectPage />)

      await waitFor(() => {
        expect(screen.getByTestId('cancel-btn')).toBeInTheDocument()
      })

      const cancelBtn = screen.getByTestId('cancel-btn')
      await user.click(cancelBtn)

      expect(mockPush).toHaveBeenCalledWith('/admin')
    })
  })
})
