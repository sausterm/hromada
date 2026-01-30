import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectForm } from '@/components/admin/ProjectForm'
import { Project } from '@/types'

// Mock ImageUpload
jest.mock('@/components/admin/ImageUpload', () => ({
  ImageUpload: ({ images, onChange }: { images: string[]; onChange: (imgs: string[]) => void }) => (
    <div data-testid="image-upload">
      <span>Images: {images.length}</span>
      <button type="button" onClick={() => onChange([...images, 'new-image.jpg'])}>Add Image</button>
    </div>
  ),
}))

// Mock fetch for geocoding
global.fetch = jest.fn()

describe('ProjectForm', () => {
  const mockOnSubmit = jest.fn()
  const mockOnCancel = jest.fn()
  const mockOnDelete = jest.fn()

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockReset()
  })

  describe('Create Mode', () => {
    it('renders form for new project', () => {
      render(<ProjectForm {...defaultProps} />)
      expect(screen.getByText('Add New Project')).toBeInTheDocument()
    })

    it('renders all form sections', () => {
      render(<ProjectForm {...defaultProps} />)

      expect(screen.getByText('Basic Information')).toBeInTheDocument()
      expect(screen.getByText('Contact Information')).toBeInTheDocument()
      expect(screen.getByText('Technical & Financial Details')).toBeInTheDocument()
    })

    it('renders category dropdown with options', () => {
      render(<ProjectForm {...defaultProps} />)

      // Categories include icons: "🏥 Hospital / Medical", "🏫 School / Education", etc.
      expect(screen.getByRole('option', { name: /Hospital \/ Medical/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /School \/ Education/i })).toBeInTheDocument()
    })

    it('renders urgency dropdown with all options', () => {
      render(<ProjectForm {...defaultProps} />)

      expect(screen.getByRole('option', { name: 'Low' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Medium' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'High' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Critical' })).toBeInTheDocument()
    })

    it('renders status dropdown with all options', () => {
      render(<ProjectForm {...defaultProps} />)

      expect(screen.getByRole('option', { name: 'Seeking Donors' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'In Discussion' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Matched' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Fulfilled' })).toBeInTheDocument()
    })

    it('renders project type dropdown', () => {
      render(<ProjectForm {...defaultProps} />)

      // Project types include icons: "☀️ Solar PV", "🔥 Heat Pump", etc.
      expect(screen.getByRole('option', { name: /Solar PV/ })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /Heat Pump/ })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /General/ })).toBeInTheDocument()
    })

    it('renders ImageUpload component', () => {
      render(<ProjectForm {...defaultProps} />)

      expect(screen.getByTestId('image-upload')).toBeInTheDocument()
    })

    it('shows Create Project button in create mode', () => {
      render(<ProjectForm {...defaultProps} />)

      expect(screen.getByRole('button', { name: /Create Project/i })).toBeInTheDocument()
    })

    it('does not show delete button in create mode', () => {
      render(<ProjectForm {...defaultProps} />)

      expect(screen.queryByRole('button', { name: /Delete Project/i })).not.toBeInTheDocument()
    })
  })

  describe('Edit Mode', () => {
    const existingProject: Project = {
      id: 'proj-123',
      municipalityName: 'Kyiv',
      municipalityEmail: 'kyiv@example.com',
      facilityName: 'Central Hospital',
      category: 'HOSPITAL',
      briefDescription: 'Solar panels for hospital',
      description: 'Full description',
      fullDescription: 'Full description of the project',
      address: '123 Main St, Kyiv',
      cityLatitude: 50.4501,
      cityLongitude: 30.5234,
      contactName: 'John Doe',
      contactEmail: 'john@example.com',
      contactPhone: '+380123456789',
      urgency: 'HIGH',
      status: 'OPEN',
      photos: ['photo1.jpg', 'photo2.jpg'],
      projectType: 'SOLAR_PV',
      technicalPowerKw: 50,
      estimatedCostUsd: 75000,
      cofinancingAvailable: 'YES',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('shows Edit Project title in edit mode', () => {
      render(<ProjectForm {...defaultProps} project={existingProject} />)

      expect(screen.getByText('Edit Project')).toBeInTheDocument()
    })

    it('shows Update Project button in edit mode', () => {
      render(<ProjectForm {...defaultProps} project={existingProject} />)

      expect(screen.getByRole('button', { name: /Update Project/i })).toBeInTheDocument()
    })

    it('shows delete button when onDelete provided', () => {
      render(<ProjectForm {...defaultProps} project={existingProject} onDelete={mockOnDelete} />)

      expect(screen.getByRole('button', { name: /Delete Project/i })).toBeInTheDocument()
    })

    it('calls onDelete when delete button clicked', async () => {
      const user = userEvent.setup()
      render(<ProjectForm {...defaultProps} project={existingProject} onDelete={mockOnDelete} />)

      await user.click(screen.getByRole('button', { name: /Delete Project/i }))

      expect(mockOnDelete).toHaveBeenCalled()
    })
  })

  describe('Form Interactions', () => {
    it('calls onCancel when cancel button clicked', async () => {
      const user = userEvent.setup()
      render(<ProjectForm {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /Cancel/i }))

      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('updates images through ImageUpload', async () => {
      const user = userEvent.setup()
      render(<ProjectForm {...defaultProps} />)

      await user.click(screen.getByText('Add Image'))

      expect(screen.getByText('Images: 1')).toBeInTheDocument()
    })
  })

  describe('Geocoding', () => {
    it('shows Get Coordinates button', () => {
      render(<ProjectForm {...defaultProps} />)

      expect(screen.getByRole('button', { name: /Get Coordinates/i })).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('shows loading indicator when isLoading is true', () => {
      render(<ProjectForm {...defaultProps} isLoading={true} />)

      // The button should contain loading text "Saving..."
      expect(screen.getByText(/Saving/i)).toBeInTheDocument()
    })
  })
})
