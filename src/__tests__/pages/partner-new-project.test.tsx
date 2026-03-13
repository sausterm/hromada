import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PartnerNewProjectPage from '@/app/[locale]/(public)/partner/projects/new/page'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, any>) => {
    const translations: Record<string, string> = {
      'partner.title': 'Partner',
      'partner.submission.title': 'Submit New Project',
      'partner.submission.description': 'Fill out the form below to submit a new project.',
      'partner.submission.success': 'Project Submitted Successfully!',
      'partner.submission.error': 'Failed to submit project',
      'admin.projects.backToDashboard': 'Back to Dashboard',
      'submitProject.sections.municipalityInfo': 'Municipality Information',
      'submitProject.sections.projectDetails': 'Project Details',
      'submitProject.sections.technicalFinancial': 'Technical & Financial Information',
      'submitProject.sections.location': 'Location',
      'submitProject.sections.contactInfo': 'Contact Information',
      'submitProject.sections.supportingInfo': 'Supporting Information',
      'submitProject.sections.optional': 'Optional',
      'submitProject.fields.municipalityName': 'Municipality Name',
      'submitProject.fields.municipalityNamePlaceholder': 'e.g., Kharkiv City Council',
      'submitProject.fields.municipalityEmail': 'Municipality Email',
      'submitProject.fields.municipalityEmailPlaceholder': 'official@municipality.gov.ua',
      'submitProject.fields.region': 'Region (Oblast)',
      'submitProject.fields.regionPlaceholder': 'e.g., Kharkiv Oblast',
      'submitProject.fields.facilityName': 'Facility Name',
      'submitProject.fields.facilityPlaceholder': 'e.g., Regional Hospital #5',
      'submitProject.fields.category': 'Category',
      'submitProject.fields.selectCategory': 'Select Category',
      'submitProject.fields.projectType': 'Project Type',
      'submitProject.fields.selectType': '-- Select Type --',
      'submitProject.fields.briefDescription': 'Brief Description',
      'submitProject.fields.briefDescriptionHelper': 'Short summary (max 150 characters)',
      'submitProject.fields.fullDescription': 'Full Description',
      'submitProject.fields.fullDescriptionHelper': 'Detailed project description',
      'submitProject.fields.estimatedCost': 'Estimated Cost (USD)',
      'submitProject.fields.costPlaceholder': 'e.g., 50000',
      'submitProject.fields.technicalPower': 'Technical Power (kW)',
      'submitProject.fields.technicalPowerPlaceholder': 'e.g., 100',
      'submitProject.fields.numberOfPanels': 'Number of Panels',
      'submitProject.fields.numberOfPanelsPlaceholder': 'e.g., 200',
      'submitProject.fields.cofinancingAvailable': 'Co-financing Available',
      'submitProject.fields.cofinancingDetails': 'Co-financing Details',
      'submitProject.fields.select': '-- Select --',
      'submitProject.fields.cityName': 'City Name',
      'submitProject.fields.cityNamePlaceholder': 'e.g., Kharkiv',
      'submitProject.fields.getCoordinates': 'Get Coordinates',
      'submitProject.fields.findingCoordinates': 'Finding...',
      'submitProject.fields.address': 'Address (Optional)',
      'submitProject.fields.addressPlaceholder': 'Street address',
      'submitProject.fields.cityLatitude': 'City Latitude',
      'submitProject.fields.cityLatitudePlaceholder': 'e.g., 49.9935',
      'submitProject.fields.cityLongitude': 'City Longitude',
      'submitProject.fields.cityLongitudePlaceholder': 'e.g., 36.2304',
      'submitProject.fields.coordinatesHelper': 'Will be auto-filled from city name',
      'submitProject.fields.contactName': 'Contact Person',
      'submitProject.fields.contactNamePlaceholder': 'e.g., Dr. Olena Kovalenko',
      'submitProject.fields.contactEmail': 'Contact Email',
      'submitProject.fields.contactEmailPlaceholder': 'contact@example.ua',
      'submitProject.fields.contactPhone': 'Phone Number',
      'submitProject.fields.phonePlaceholder': '+380...',
      'submitProject.fields.partnerOrganization': 'Partner Organization',
      'submitProject.fields.partnerPlaceholder': 'e.g., NGO name',
      'submitProject.fields.projectSubtype': 'Project Subtype',
      'submitProject.fields.subtypePlaceholder': 'e.g., Building hybrid PV',
      'submitProject.fields.additionalNotes': 'Additional Notes',
      'submitProject.fields.notesPlaceholder': 'Any additional information',
      'submitProject.photos.title': 'Project Photos',
      'submitProject.photos.description': 'Upload photos of the facility',
      'submitProject.buttons.submit': 'Submit Project',
      'submitProject.buttons.submitAnother': 'Submit Another',
      'submitProject.validation.required': 'Required',
      'submitProject.validation.invalidEmail': 'Invalid email address',
      'submitProject.validation.invalidLatitude': 'Invalid latitude (-90 to 90)',
      'submitProject.validation.invalidLongitude': 'Invalid longitude (-180 to 180)',
      'submitProject.validation.enterCityFirst': 'Enter a city name first',
      'submitProject.validation.coordinatesNotFound': 'Could not find coordinates',
      'submitProject.validation.geocodingFailed': 'Geocoding failed',
      'submitProject.error.network': 'Network error',
      'categories.HOSPITAL': 'Hospital / Medical',
      'categories.SCHOOL': 'School / Education',
      'categories.WATER': 'Water Utility',
      'categories.ENERGY': 'Energy Infrastructure',
      'categories.OTHER': 'Other Infrastructure',
      'projectTypes.SOLAR_PV': 'Solar PV',
      'projectTypes.HEAT_PUMP': 'Heat Pump',
      'projectTypes.BATTERY_STORAGE': 'Battery Storage',
      'projectTypes.THERMO_MODERNIZATION': 'Thermo-modernization',
      'cofinancing.YES': 'Yes',
      'cofinancing.NO': 'No',
      'cofinancing.NEEDS_CLARIFICATION': 'Needs Clarification',
    }
    if (key === 'submitProject.validation.tooLong' && params?.max) {
      return `Maximum ${params.max} characters`
    }
    return translations[key] || key
  },
}))

// Mock i18n navigation
const mockPush = jest.fn()
jest.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className} data-testid={`link-${href}`}>
      {children}
    </a>
  ),
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock useAuth hook
const mockIsPartner = jest.fn()
const mockAuthState: {
  isAuthenticated: boolean
  isLoading: boolean
  user: { name: string; email: string; organization: string | null } | null
} = {
  isAuthenticated: true,
  isLoading: false,
  user: { name: 'Test Partner', email: 'partner@example.com', organization: 'Ecoaction' },
}

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: mockAuthState.isAuthenticated,
    isLoading: mockAuthState.isLoading,
    isPartner: mockIsPartner,
    user: mockAuthState.user,
  }),
}))

// Mock UI components
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, type, variant, isLoading, disabled, className }: any) => (
    <button onClick={onClick} type={type || 'button'} data-variant={variant} disabled={disabled || isLoading} className={className}>
      {isLoading ? 'Submitting...' : children}
    </button>
  ),
}))

jest.mock('@/components/ui/Input', () => ({
  Input: ({ value, onChange, placeholder, error, type, maxLength }: any) => (
    <div>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={type || 'text'}
        maxLength={maxLength}
        data-testid={`input-${placeholder}`}
      />
      {error && <span className="error-text">{error}</span>}
    </div>
  ),
}))

jest.mock('@/components/ui/Textarea', () => ({
  Textarea: ({ value, onChange, placeholder, error, rows, maxLength }: any) => (
    <div>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        data-testid={`textarea-${placeholder}`}
      />
      {error && <span className="error-text">{error}</span>}
    </div>
  ),
}))

jest.mock('@/components/ui/Card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card">{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <h3 data-testid="card-title">{children}</h3>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
}))

jest.mock('@/components/ui/Badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  ),
}))

jest.mock('@/components/ui/LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: { size?: string }) => (
    <div data-testid="loading-spinner" data-size={size}>Loading...</div>
  ),
}))

jest.mock('@/components/forms/PublicImageUpload', () => ({
  PublicImageUpload: ({ images, onChange, maxImages }: { images: string[]; onChange: (imgs: string[]) => void; maxImages: number }) => (
    <div data-testid="image-upload">
      <span>Images: {images.length}/{maxImages}</span>
      <button type="button" onClick={() => onChange([...images, 'new-image.jpg'])}>Add Image</button>
    </div>
  ),
}))

jest.mock('@/components/forms/DocumentUpload', () => ({
  DocumentUpload: ({ documents, onChange, maxDocuments }: any) => (
    <div data-testid="document-upload">
      <span>Documents: {documents.length}/{maxDocuments}</span>
      <button type="button" onClick={() => onChange([...documents, { key: 'doc-1', filename: 'test.pdf', size: 1024 }])}>Add Document</button>
    </div>
  ),
}))

// Mock types
jest.mock('@/types', () => ({
  CATEGORY_CONFIG: {
    HOSPITAL: { label: 'Hospital / Medical', color: '#ff0000', icon: '🏥' },
    SCHOOL: { label: 'School / Education', color: '#00ff00', icon: '🏫' },
    WATER: { label: 'Water Utility', color: '#0000ff', icon: '💧' },
    ENERGY: { label: 'Energy Infrastructure', color: '#ffff00', icon: '⚡' },
    OTHER: { label: 'Other Infrastructure', color: '#808080', icon: '🏢' },
  },
  PROJECT_TYPE_CONFIG: {
    SOLAR_PV: { label: 'Solar PV', color: '#B07830', icon: '☀️' },
    HEAT_PUMP: { label: 'Heat Pump', color: '#C05050', icon: '🔥' },
    BATTERY_STORAGE: { label: 'Battery Storage', color: '#4070B0', icon: '🔋' },
    THERMO_MODERNIZATION: { label: 'Thermo-modernization', color: '#308050', icon: '🏗️' },
  },
}))

// Mock fetch
global.fetch = jest.fn()

describe('PartnerNewProjectPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPush.mockClear()
    mockIsPartner.mockReturnValue(true)
    mockAuthState.isAuthenticated = true
    mockAuthState.isLoading = false
    mockAuthState.user = { name: 'Test Partner', email: 'partner@example.com', organization: 'Ecoaction' }
    ;(global.fetch as jest.Mock).mockReset()
  })

  // ---------- AUTH GUARD ----------
  describe('Auth Guard', () => {
    it('shows loading spinner while authentication is loading', () => {
      mockAuthState.isLoading = true
      render(<PartnerNewProjectPage />)
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('redirects to /login when not authenticated', () => {
      mockAuthState.isAuthenticated = false
      mockAuthState.isLoading = false
      render(<PartnerNewProjectPage />)
      expect(mockPush).toHaveBeenCalledWith('/login')
    })

    it('redirects to / when authenticated but not a partner', () => {
      mockAuthState.isAuthenticated = true
      mockAuthState.isLoading = false
      mockIsPartner.mockReturnValue(false)
      render(<PartnerNewProjectPage />)
      expect(mockPush).toHaveBeenCalledWith('/')
    })

    it('shows loading spinner when not authenticated (while redirect happens)', () => {
      mockAuthState.isAuthenticated = false
      mockAuthState.isLoading = false
      render(<PartnerNewProjectPage />)
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('shows loading spinner when authenticated but not partner (while redirect happens)', () => {
      mockAuthState.isAuthenticated = true
      mockAuthState.isLoading = false
      mockIsPartner.mockReturnValue(false)
      render(<PartnerNewProjectPage />)
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })

  // ---------- RENDERING ----------
  describe('Rendering', () => {
    it('renders the page title', () => {
      render(<PartnerNewProjectPage />)
      expect(screen.getByText('Submit New Project')).toBeInTheDocument()
    })

    it('renders the page description', () => {
      render(<PartnerNewProjectPage />)
      expect(screen.getByText('Fill out the form below to submit a new project.')).toBeInTheDocument()
    })

    it('renders partner badge in header', () => {
      render(<PartnerNewProjectPage />)
      expect(screen.getByText('Partner')).toBeInTheDocument()
    })

    it('renders Hromada header link', () => {
      render(<PartnerNewProjectPage />)
      expect(screen.getByText('Hromada')).toBeInTheDocument()
    })

    it('renders all form sections', () => {
      render(<PartnerNewProjectPage />)
      expect(screen.getByText('Municipality Information')).toBeInTheDocument()
      expect(screen.getByText('Project Details')).toBeInTheDocument()
      expect(screen.getByText('Technical & Financial Information')).toBeInTheDocument()
      expect(screen.getByText('Location')).toBeInTheDocument()
      expect(screen.getByText('Contact Information')).toBeInTheDocument()
      expect(screen.getByText('Supporting Information')).toBeInTheDocument()
    })

    it('renders submit button', () => {
      render(<PartnerNewProjectPage />)
      expect(screen.getByRole('button', { name: 'Submit Project' })).toBeInTheDocument()
    })

    it('renders back to dashboard button', () => {
      render(<PartnerNewProjectPage />)
      const backButtons = screen.getAllByText('Back to Dashboard')
      expect(backButtons.length).toBeGreaterThan(0)
    })

    it('renders main content element', () => {
      render(<PartnerNewProjectPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders image upload component', () => {
      render(<PartnerNewProjectPage />)
      expect(screen.getByTestId('image-upload')).toBeInTheDocument()
    })

    it('renders document upload component', () => {
      render(<PartnerNewProjectPage />)
      expect(screen.getByTestId('document-upload')).toBeInTheDocument()
    })
  })

  // ---------- FORM FIELDS ----------
  describe('Form Fields', () => {
    it('renders municipality name input', () => {
      render(<PartnerNewProjectPage />)
      expect(screen.getByPlaceholderText('e.g., Kharkiv City Council')).toBeInTheDocument()
    })

    it('renders municipality email input', () => {
      render(<PartnerNewProjectPage />)
      expect(screen.getByPlaceholderText('official@municipality.gov.ua')).toBeInTheDocument()
    })

    it('renders facility name input', () => {
      render(<PartnerNewProjectPage />)
      expect(screen.getByPlaceholderText('e.g., Regional Hospital #5')).toBeInTheDocument()
    })

    it('renders category dropdown with all options', () => {
      render(<PartnerNewProjectPage />)
      expect(screen.getByText(/Select Category/)).toBeInTheDocument()
      // The select should have category options
      expect(screen.getByRole('option', { name: /Hospital \/ Medical/ })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /School \/ Education/ })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /Water Utility/ })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /Energy Infrastructure/ })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /Other Infrastructure/ })).toBeInTheDocument()
    })

    it('renders project type dropdown with all options', () => {
      render(<PartnerNewProjectPage />)
      expect(screen.getByText('-- Select Type --')).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /Solar PV/ })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /Heat Pump/ })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /Battery Storage/ })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /Thermo-modernization/ })).toBeInTheDocument()
    })

    it('renders brief description input', () => {
      render(<PartnerNewProjectPage />)
      expect(screen.getByPlaceholderText('Short summary (max 150 characters)')).toBeInTheDocument()
    })

    it('renders full description textarea', () => {
      render(<PartnerNewProjectPage />)
      expect(screen.getByPlaceholderText('Detailed project description')).toBeInTheDocument()
    })

    it('renders city name input', () => {
      render(<PartnerNewProjectPage />)
      expect(screen.getByPlaceholderText('e.g., Kharkiv')).toBeInTheDocument()
    })

    it('renders latitude and longitude inputs', () => {
      render(<PartnerNewProjectPage />)
      expect(screen.getByPlaceholderText('e.g., 49.9935')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('e.g., 36.2304')).toBeInTheDocument()
    })

    it('renders contact name input', () => {
      render(<PartnerNewProjectPage />)
      expect(screen.getByPlaceholderText('e.g., Dr. Olena Kovalenko')).toBeInTheDocument()
    })

    it('renders contact email input', () => {
      render(<PartnerNewProjectPage />)
      expect(screen.getByPlaceholderText('contact@example.ua')).toBeInTheDocument()
    })

    it('renders contact phone input', () => {
      render(<PartnerNewProjectPage />)
      expect(screen.getByPlaceholderText('+380...')).toBeInTheDocument()
    })

    it('renders EDRPOU field', () => {
      render(<PartnerNewProjectPage />)
      expect(screen.getByPlaceholderText('e.g. 04054866')).toBeInTheDocument()
    })

    it('renders cofinancing dropdown', () => {
      render(<PartnerNewProjectPage />)
      expect(screen.getByRole('option', { name: 'Yes' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'No' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Needs Clarification' })).toBeInTheDocument()
    })

    it('renders partner organization checkboxes', () => {
      render(<PartnerNewProjectPage />)
      expect(screen.getByText('Ecoaction')).toBeInTheDocument()
      expect(screen.getByText('Ecoclub Rivne')).toBeInTheDocument()
      expect(screen.getByText('Greenpeace Ukraine')).toBeInTheDocument()
      expect(screen.getByText('Other')).toBeInTheDocument()
    })

    it('renders character count for brief description', () => {
      render(<PartnerNewProjectPage />)
      expect(screen.getByText('0/150')).toBeInTheDocument()
    })

    it('renders character count for full description', () => {
      render(<PartnerNewProjectPage />)
      expect(screen.getByText('0/2000')).toBeInTheDocument()
    })
  })

  // ---------- PRE-FILL PARTNER ORGANIZATION ----------
  describe('Partner Organization Pre-fill', () => {
    it('pre-fills known partner organization from user', () => {
      mockAuthState.user = { name: 'Test', email: 'test@ecoaction.org', organization: 'Ecoaction' }
      render(<PartnerNewProjectPage />)
      // Ecoaction checkbox should be checked
      const ecoactionCheckbox = screen.getByText('Ecoaction').closest('label')?.querySelector('input[type="checkbox"]')
      expect(ecoactionCheckbox).toBeChecked()
    })

    it('pre-fills "other" field for unknown organization', () => {
      mockAuthState.user = { name: 'Test', email: 'test@other.org', organization: 'Custom NGO' }
      render(<PartnerNewProjectPage />)
      // The "Other" checkbox should be checked and the input should show
      const otherCheckbox = screen.getByText('Other').closest('label')?.querySelector('input[type="checkbox"]')
      expect(otherCheckbox).toBeChecked()
      // Other partner input should be visible with pre-filled value
      const otherInput = screen.getByPlaceholderText('e.g., NGO name')
      expect(otherInput).toHaveValue('Custom NGO')
    })

    it('does not pre-fill when user has no organization', () => {
      mockAuthState.user = { name: 'Test', email: 'test@test.com', organization: null }
      render(<PartnerNewProjectPage />)
      const ecoactionCheckbox = screen.getByText('Ecoaction').closest('label')?.querySelector('input[type="checkbox"]')
      expect(ecoactionCheckbox).not.toBeChecked()
    })
  })

  // ---------- FORM VALIDATION ----------
  describe('Form Validation', () => {
    it('shows validation errors for empty required fields on submit', async () => {
      // Clear organization to avoid pre-fill
      mockAuthState.user = { name: 'Test', email: 'test@test.com', organization: null }
      const user = userEvent.setup()
      render(<PartnerNewProjectPage />)

      const submitButton = screen.getByRole('button', { name: 'Submit Project' })
      await user.click(submitButton)

      await waitFor(() => {
        const requiredErrors = screen.getAllByText('Required')
        expect(requiredErrors.length).toBeGreaterThan(0)
      })
    })

    it('validates municipality email format', async () => {
      mockAuthState.user = { name: 'Test', email: 'test@test.com', organization: null }
      render(<PartnerNewProjectPage />)

      // Fill all required fields, with an invalid municipality email
      // Use fireEvent.change for speed and reliability — set invalid email LAST
      fireEvent.change(screen.getByPlaceholderText('e.g., Kharkiv City Council'), { target: { value: 'Test' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., Regional Hospital #5'), { target: { value: 'Test' } })
      fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'HOSPITAL' } })
      fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'SOLAR_PV' } })
      fireEvent.change(screen.getByPlaceholderText('Short summary (max 150 characters)'), { target: { value: 'Brief' } })
      fireEvent.change(screen.getByPlaceholderText('Detailed project description'), { target: { value: 'Full' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., Kharkiv'), { target: { value: 'Kyiv' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., 49.9935'), { target: { value: '50' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., 36.2304'), { target: { value: '30' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., Dr. Olena Kovalenko'), { target: { value: 'Test' } })
      fireEvent.change(screen.getByPlaceholderText('contact@example.ua'), { target: { value: 'test@test.ua' } })
      // Set invalid email last to ensure it sticks
      fireEvent.change(screen.getByPlaceholderText('official@municipality.gov.ua'), { target: { value: 'invalid-email' } })

      fireEvent.submit(screen.getByRole('button', { name: 'Submit Project' }).closest('form')!)

      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument()
      })
    })

    it('validates contact email format', async () => {
      mockAuthState.user = { name: 'Test', email: 'test@test.com', organization: null }
      render(<PartnerNewProjectPage />)

      fireEvent.change(screen.getByPlaceholderText('e.g., Kharkiv City Council'), { target: { value: 'Test' } })
      fireEvent.change(screen.getByPlaceholderText('official@municipality.gov.ua'), { target: { value: 'test@test.ua' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., Regional Hospital #5'), { target: { value: 'Test' } })
      fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'HOSPITAL' } })
      fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'SOLAR_PV' } })
      fireEvent.change(screen.getByPlaceholderText('Short summary (max 150 characters)'), { target: { value: 'Brief' } })
      fireEvent.change(screen.getByPlaceholderText('Detailed project description'), { target: { value: 'Full' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., Kharkiv'), { target: { value: 'Kyiv' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., 49.9935'), { target: { value: '50' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., 36.2304'), { target: { value: '30' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., Dr. Olena Kovalenko'), { target: { value: 'Test' } })
      // Set invalid contact email last
      fireEvent.change(screen.getByPlaceholderText('contact@example.ua'), { target: { value: 'bad-email' } })

      fireEvent.submit(screen.getByRole('button', { name: 'Submit Project' }).closest('form')!)

      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument()
      })
    })

    it('validates brief description max length', async () => {
      const user = userEvent.setup()
      render(<PartnerNewProjectPage />)

      fireEvent.change(screen.getByPlaceholderText('Short summary (max 150 characters)'), {
        target: { value: 'A'.repeat(151) },
      })

      // Fill other required fields
      fireEvent.change(screen.getByPlaceholderText('e.g., Kharkiv City Council'), { target: { value: 'Test' } })
      fireEvent.change(screen.getByPlaceholderText('official@municipality.gov.ua'), { target: { value: 'test@test.ua' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., Regional Hospital #5'), { target: { value: 'Test' } })
      fireEvent.change(screen.getByPlaceholderText('Detailed project description'), { target: { value: 'Full' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., Kharkiv'), { target: { value: 'Kyiv' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., 49.9935'), { target: { value: '50' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., 36.2304'), { target: { value: '30' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., Dr. Olena Kovalenko'), { target: { value: 'Test' } })
      fireEvent.change(screen.getByPlaceholderText('contact@example.ua'), { target: { value: 'test@test.ua' } })

      await user.click(screen.getByRole('button', { name: 'Submit Project' }))

      await waitFor(() => {
        expect(screen.getByText('Maximum 150 characters')).toBeInTheDocument()
      })
    })

    it('validates full description max length', async () => {
      const user = userEvent.setup()
      render(<PartnerNewProjectPage />)

      fireEvent.change(screen.getByPlaceholderText('Detailed project description'), {
        target: { value: 'A'.repeat(2001) },
      })

      // Fill other required fields
      fireEvent.change(screen.getByPlaceholderText('e.g., Kharkiv City Council'), { target: { value: 'Test' } })
      fireEvent.change(screen.getByPlaceholderText('official@municipality.gov.ua'), { target: { value: 'test@test.ua' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., Regional Hospital #5'), { target: { value: 'Test' } })
      fireEvent.change(screen.getByPlaceholderText('Short summary (max 150 characters)'), { target: { value: 'Brief' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., Kharkiv'), { target: { value: 'Kyiv' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., 49.9935'), { target: { value: '50' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., 36.2304'), { target: { value: '30' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., Dr. Olena Kovalenko'), { target: { value: 'Test' } })
      fireEvent.change(screen.getByPlaceholderText('contact@example.ua'), { target: { value: 'test@test.ua' } })

      await user.click(screen.getByRole('button', { name: 'Submit Project' }))

      await waitFor(() => {
        expect(screen.getByText('Maximum 2000 characters')).toBeInTheDocument()
      })
    })

    it('validates invalid latitude', async () => {
      const user = userEvent.setup()
      render(<PartnerNewProjectPage />)

      fireEvent.change(screen.getByPlaceholderText('e.g., 49.9935'), { target: { value: '999' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., 36.2304'), { target: { value: '30' } })
      // Fill other required fields
      fireEvent.change(screen.getByPlaceholderText('e.g., Kharkiv City Council'), { target: { value: 'Test' } })
      fireEvent.change(screen.getByPlaceholderText('official@municipality.gov.ua'), { target: { value: 'test@test.ua' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., Regional Hospital #5'), { target: { value: 'Test' } })
      fireEvent.change(screen.getByPlaceholderText('Short summary (max 150 characters)'), { target: { value: 'Brief' } })
      fireEvent.change(screen.getByPlaceholderText('Detailed project description'), { target: { value: 'Full' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., Kharkiv'), { target: { value: 'Kyiv' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., Dr. Olena Kovalenko'), { target: { value: 'Test' } })
      fireEvent.change(screen.getByPlaceholderText('contact@example.ua'), { target: { value: 'test@test.ua' } })

      await user.click(screen.getByRole('button', { name: 'Submit Project' }))

      await waitFor(() => {
        expect(screen.getByText('Invalid latitude (-90 to 90)')).toBeInTheDocument()
      })
    })

    it('validates invalid longitude', async () => {
      const user = userEvent.setup()
      render(<PartnerNewProjectPage />)

      fireEvent.change(screen.getByPlaceholderText('e.g., 49.9935'), { target: { value: '50' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., 36.2304'), { target: { value: '999' } })
      // Fill other required fields
      fireEvent.change(screen.getByPlaceholderText('e.g., Kharkiv City Council'), { target: { value: 'Test' } })
      fireEvent.change(screen.getByPlaceholderText('official@municipality.gov.ua'), { target: { value: 'test@test.ua' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., Regional Hospital #5'), { target: { value: 'Test' } })
      fireEvent.change(screen.getByPlaceholderText('Short summary (max 150 characters)'), { target: { value: 'Brief' } })
      fireEvent.change(screen.getByPlaceholderText('Detailed project description'), { target: { value: 'Full' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., Kharkiv'), { target: { value: 'Kyiv' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., Dr. Olena Kovalenko'), { target: { value: 'Test' } })
      fireEvent.change(screen.getByPlaceholderText('contact@example.ua'), { target: { value: 'test@test.ua' } })

      await user.click(screen.getByRole('button', { name: 'Submit Project' }))

      await waitFor(() => {
        expect(screen.getByText('Invalid longitude (-180 to 180)')).toBeInTheDocument()
      })
    })

    it('clears validation error when field is filled', async () => {
      const user = userEvent.setup()
      render(<PartnerNewProjectPage />)

      // Submit to trigger errors
      await user.click(screen.getByRole('button', { name: 'Submit Project' }))

      await waitFor(() => {
        expect(screen.getAllByText('Required').length).toBeGreaterThan(0)
      })

      const initialErrorCount = screen.getAllByText('Required').length

      // Type into municipality name to clear its error
      fireEvent.change(screen.getByPlaceholderText('e.g., Kharkiv City Council'), { target: { value: 'Test' } })

      await waitFor(() => {
        const currentErrors = screen.getAllByText('Required')
        expect(currentErrors.length).toBeLessThan(initialErrorCount)
      })
    })

    it('does not submit when validation fails', async () => {
      const user = userEvent.setup()
      render(<PartnerNewProjectPage />)

      await user.click(screen.getByRole('button', { name: 'Submit Project' }))

      await waitFor(() => {
        expect(screen.getAllByText('Required').length).toBeGreaterThan(0)
      })
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  // ---------- GEOCODING ----------
  describe('Geocoding', () => {
    it('shows get coordinates button', () => {
      render(<PartnerNewProjectPage />)
      expect(screen.getByRole('button', { name: 'Get Coordinates' })).toBeInTheDocument()
    })

    it('shows error when clicking get coordinates with empty city', async () => {
      const user = userEvent.setup()
      render(<PartnerNewProjectPage />)

      await user.click(screen.getByRole('button', { name: 'Get Coordinates' }))

      await waitFor(() => {
        expect(screen.getByText('Enter a city name first')).toBeInTheDocument()
      })
    })

    it('fills coordinates when geocoding succeeds', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [{ lat: '50.4501', lon: '30.5234' }],
      })

      render(<PartnerNewProjectPage />)

      fireEvent.change(screen.getByPlaceholderText('e.g., Kharkiv'), { target: { value: 'Kyiv' } })
      await user.click(screen.getByRole('button', { name: 'Get Coordinates' }))

      await waitFor(() => {
        const latInput = screen.getByPlaceholderText('e.g., 49.9935') as HTMLInputElement
        expect(latInput.value).toBe('50.4501')
        const lngInput = screen.getByPlaceholderText('e.g., 36.2304') as HTMLInputElement
        expect(lngInput.value).toBe('30.5234')
      })
    })

    it('shows error when geocoding returns no results', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      render(<PartnerNewProjectPage />)

      fireEvent.change(screen.getByPlaceholderText('e.g., Kharkiv'), { target: { value: 'Unknown' } })
      await user.click(screen.getByRole('button', { name: 'Get Coordinates' }))

      await waitFor(() => {
        expect(screen.getByText('Could not find coordinates')).toBeInTheDocument()
      })
    })

    it('shows error when geocoding API fails', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(<PartnerNewProjectPage />)

      fireEvent.change(screen.getByPlaceholderText('e.g., Kharkiv'), { target: { value: 'Kyiv' } })
      await user.click(screen.getByRole('button', { name: 'Get Coordinates' }))

      await waitFor(() => {
        expect(screen.getByText('Geocoding failed')).toBeInTheDocument()
      })
    })

    it('calls geocoding API with correct URL format', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [{ lat: '50.4501', lon: '30.5234' }],
      })

      render(<PartnerNewProjectPage />)

      fireEvent.change(screen.getByPlaceholderText('e.g., Kharkiv'), { target: { value: 'Kyiv' } })
      await user.click(screen.getByRole('button', { name: 'Get Coordinates' }))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('nominatim.openstreetmap.org/search'),
          expect.objectContaining({
            headers: { 'User-Agent': 'Hromada/1.0' },
          })
        )
      })
    })
  })

  // ---------- FORM SUBMISSION ----------
  describe('Form Submission', () => {
    const fillRequiredFields = () => {
      fireEvent.change(screen.getByPlaceholderText('e.g., Kharkiv City Council'), { target: { value: 'Test Municipality' } })
      fireEvent.change(screen.getByPlaceholderText('official@municipality.gov.ua'), { target: { value: 'muni@test.ua' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., Regional Hospital #5'), { target: { value: 'Test Facility' } })

      // Select category
      const categorySelect = screen.getAllByRole('combobox')[0]
      fireEvent.change(categorySelect, { target: { value: 'HOSPITAL' } })

      // Select project type
      const typeSelect = screen.getAllByRole('combobox')[1]
      fireEvent.change(typeSelect, { target: { value: 'SOLAR_PV' } })

      fireEvent.change(screen.getByPlaceholderText('Short summary (max 150 characters)'), { target: { value: 'Brief description' } })
      fireEvent.change(screen.getByPlaceholderText('Detailed project description'), { target: { value: 'Full description text' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., Kharkiv'), { target: { value: 'Kyiv' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., 49.9935'), { target: { value: '50.4501' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., 36.2304'), { target: { value: '30.5234' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., Dr. Olena Kovalenko'), { target: { value: 'Contact Person' } })
      fireEvent.change(screen.getByPlaceholderText('contact@example.ua'), { target: { value: 'contact@test.ua' } })
    }

    it('submits form successfully and shows success message', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new-project' }),
      })

      render(<PartnerNewProjectPage />)
      fillRequiredFields()

      await user.click(screen.getByRole('button', { name: 'Submit Project' }))

      await waitFor(() => {
        expect(screen.getByText('Project Submitted Successfully!')).toBeInTheDocument()
      })
    })

    it('calls API with correct endpoint and method', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new-project' }),
      })

      render(<PartnerNewProjectPage />)
      fillRequiredFields()

      await user.click(screen.getByRole('button', { name: 'Submit Project' }))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/partner/projects',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        )
      })
    })

    it('sends form data in request body', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new-project' }),
      })

      render(<PartnerNewProjectPage />)
      fillRequiredFields()

      await user.click(screen.getByRole('button', { name: 'Submit Project' }))

      await waitFor(() => {
        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
        expect(callBody.municipalityName).toBe('Test Municipality')
        expect(callBody.facilityName).toBe('Test Facility')
        expect(callBody.contactEmail).toBe('contact@test.ua')
        expect(callBody.cityLatitude).toBe('50.4501')
        expect(callBody.cityLongitude).toBe('30.5234')
      })
    })

    it('shows error message on API failure', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Server error occurred' }),
      })

      render(<PartnerNewProjectPage />)
      fillRequiredFields()

      await user.click(screen.getByRole('button', { name: 'Submit Project' }))

      await waitFor(() => {
        expect(screen.getByText('Server error occurred')).toBeInTheDocument()
      })
    })

    it('shows default error message when API returns no error message', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      })

      render(<PartnerNewProjectPage />)
      fillRequiredFields()

      await user.click(screen.getByRole('button', { name: 'Submit Project' }))

      await waitFor(() => {
        expect(screen.getByText('Failed to submit project')).toBeInTheDocument()
      })
    })

    it('shows network error on fetch failure', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(<PartnerNewProjectPage />)
      fillRequiredFields()

      await user.click(screen.getByRole('button', { name: 'Submit Project' }))

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })

    it('shows loading state during submission', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: () => ({}) }), 100))
      )

      render(<PartnerNewProjectPage />)
      fillRequiredFields()

      await user.click(screen.getByRole('button', { name: 'Submit Project' }))

      // Button should show loading state
      expect(screen.getByText('Submitting...')).toBeInTheDocument()
    })

    it('serializes cofinancing details when YES with percent', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new-project' }),
      })

      render(<PartnerNewProjectPage />)
      fillRequiredFields()

      // Set estimated cost
      fireEvent.change(screen.getByPlaceholderText('e.g., 50000'), { target: { value: '100000' } })

      // Select YES for cofinancing
      const cofinancingSelect = screen.getAllByRole('combobox')[2]
      fireEvent.change(cofinancingSelect, { target: { value: 'YES' } })

      // Change cofinancing percent (range slider)
      const rangeInput = screen.getByRole('slider')
      fireEvent.change(rangeInput, { target: { value: '20' } })

      await user.click(screen.getByRole('button', { name: 'Submit Project' }))

      await waitFor(() => {
        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
        expect(callBody.cofinancingDetails).toBe('20% ($20,000)')
      })
    })

    it('combines partner organizations into comma-separated string', async () => {
      mockAuthState.user = { name: 'Test', email: 'test@test.com', organization: null }
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new-project' }),
      })

      render(<PartnerNewProjectPage />)
      fillRequiredFields()

      // Check Ecoaction
      const ecoactionCheckbox = screen.getByText('Ecoaction').closest('label')?.querySelector('input[type="checkbox"]') as HTMLInputElement
      fireEvent.click(ecoactionCheckbox)

      // Check Ecoclub Rivne
      const ecoclubCheckbox = screen.getByText('Ecoclub Rivne').closest('label')?.querySelector('input[type="checkbox"]') as HTMLInputElement
      fireEvent.click(ecoclubCheckbox)

      await user.click(screen.getByRole('button', { name: 'Submit Project' }))

      await waitFor(() => {
        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
        expect(callBody.partnerOrganization).toBe('Ecoaction, Ecoclub Rivne')
      })
    })

    it('sends document keys in request', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new-project' }),
      })

      render(<PartnerNewProjectPage />)
      fillRequiredFields()

      // Add a document
      await user.click(screen.getByText('Add Document'))

      await user.click(screen.getByRole('button', { name: 'Submit Project' }))

      await waitFor(() => {
        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
        expect(callBody.documents).toEqual(['doc-1'])
      })
    })
  })

  // ---------- SUCCESS STATE ----------
  describe('Success State', () => {
    const fillAndSubmit = async (user: ReturnType<typeof userEvent.setup>) => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new-project' }),
      })

      fillRequiredFieldsHelper()
      await user.click(screen.getByRole('button', { name: 'Submit Project' }))
      await waitFor(() => {
        expect(screen.getByText('Project Submitted Successfully!')).toBeInTheDocument()
      })
    }

    const fillRequiredFieldsHelper = () => {
      fireEvent.change(screen.getByPlaceholderText('e.g., Kharkiv City Council'), { target: { value: 'Test' } })
      fireEvent.change(screen.getByPlaceholderText('official@municipality.gov.ua'), { target: { value: 'test@test.ua' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., Regional Hospital #5'), { target: { value: 'Test' } })
      const categorySelect = screen.getAllByRole('combobox')[0]
      fireEvent.change(categorySelect, { target: { value: 'HOSPITAL' } })
      const typeSelect = screen.getAllByRole('combobox')[1]
      fireEvent.change(typeSelect, { target: { value: 'SOLAR_PV' } })
      fireEvent.change(screen.getByPlaceholderText('Short summary (max 150 characters)'), { target: { value: 'Brief' } })
      fireEvent.change(screen.getByPlaceholderText('Detailed project description'), { target: { value: 'Full' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., Kharkiv'), { target: { value: 'Kyiv' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., 49.9935'), { target: { value: '50' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., 36.2304'), { target: { value: '30' } })
      fireEvent.change(screen.getByPlaceholderText('e.g., Dr. Olena Kovalenko'), { target: { value: 'Test' } })
      fireEvent.change(screen.getByPlaceholderText('contact@example.ua'), { target: { value: 'test@test.ua' } })
    }

    it('shows back to dashboard link on success', async () => {
      const user = userEvent.setup()
      render(<PartnerNewProjectPage />)
      await fillAndSubmit(user)

      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument()
      expect(screen.getAllByTestId('link-/partner').length).toBeGreaterThan(0)
    })

    it('shows submit another button on success', async () => {
      const user = userEvent.setup()
      render(<PartnerNewProjectPage />)
      await fillAndSubmit(user)

      expect(screen.getByText('Submit Another')).toBeInTheDocument()
    })

    it('resets form when clicking submit another', async () => {
      const user = userEvent.setup()
      render(<PartnerNewProjectPage />)
      await fillAndSubmit(user)

      await user.click(screen.getByRole('button', { name: 'Submit Another' }))

      // Should be back to the form
      await waitFor(() => {
        expect(screen.getByText('Submit New Project')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('e.g., Kharkiv City Council')).toBeInTheDocument()
      })
    })
  })

  // ---------- PARTNER ORGANIZATION CHECKBOXES ----------
  describe('Partner Organization Checkboxes', () => {
    it('toggles partner organization checkboxes', async () => {
      mockAuthState.user = { name: 'Test', email: 'test@test.com', organization: null }
      render(<PartnerNewProjectPage />)

      const ecoactionCheckbox = screen.getByText('Ecoaction').closest('label')?.querySelector('input[type="checkbox"]') as HTMLInputElement
      expect(ecoactionCheckbox).not.toBeChecked()

      fireEvent.click(ecoactionCheckbox)
      expect(ecoactionCheckbox).toBeChecked()

      fireEvent.click(ecoactionCheckbox)
      expect(ecoactionCheckbox).not.toBeChecked()
    })

    it('shows other partner input when Other is checked', async () => {
      mockAuthState.user = { name: 'Test', email: 'test@test.com', organization: null }
      render(<PartnerNewProjectPage />)

      // Initially no other input
      expect(screen.queryByPlaceholderText('e.g., NGO name')).not.toBeInTheDocument()

      // Check "Other"
      const otherCheckbox = screen.getByText('Other').closest('label')?.querySelector('input[type="checkbox"]') as HTMLInputElement
      fireEvent.click(otherCheckbox)

      expect(screen.getByPlaceholderText('e.g., NGO name')).toBeInTheDocument()
    })

    it('hides other partner input and clears value when Other is unchecked', async () => {
      mockAuthState.user = { name: 'Test', email: 'test@test.com', organization: null }
      render(<PartnerNewProjectPage />)

      // Check "Other" and type a value
      const otherCheckbox = screen.getByText('Other').closest('label')?.querySelector('input[type="checkbox"]') as HTMLInputElement
      fireEvent.click(otherCheckbox)
      fireEvent.change(screen.getByPlaceholderText('e.g., NGO name'), { target: { value: 'Custom NGO' } })

      // Uncheck "Other"
      fireEvent.click(otherCheckbox)
      expect(screen.queryByPlaceholderText('e.g., NGO name')).not.toBeInTheDocument()
    })
  })

  // ---------- COFINANCING CONDITIONAL ----------
  describe('Cofinancing Conditional Fields', () => {
    it('shows cofinancing slider when YES is selected', () => {
      render(<PartnerNewProjectPage />)

      // Select YES for cofinancing
      const cofinancingSelect = screen.getAllByRole('combobox')[2]
      fireEvent.change(cofinancingSelect, { target: { value: 'YES' } })

      expect(screen.getByRole('slider')).toBeInTheDocument()
      expect(screen.getByText(/Co-financing: 0%/)).toBeInTheDocument()
    })

    it('hides cofinancing slider when NO is selected', () => {
      render(<PartnerNewProjectPage />)

      // Select NO
      const cofinancingSelect = screen.getAllByRole('combobox')[2]
      fireEvent.change(cofinancingSelect, { target: { value: 'NO' } })

      expect(screen.queryByRole('slider')).not.toBeInTheDocument()
    })

    it('shows cofinancing amount when cost and percent are set', () => {
      render(<PartnerNewProjectPage />)

      // Set estimated cost
      fireEvent.change(screen.getByPlaceholderText('e.g., 50000'), { target: { value: '100000' } })

      // Select YES
      const cofinancingSelect = screen.getAllByRole('combobox')[2]
      fireEvent.change(cofinancingSelect, { target: { value: 'YES' } })

      // Change cofinancing percent
      const rangeInput = screen.getByRole('slider')
      fireEvent.change(rangeInput, { target: { value: '25' } })

      expect(screen.getByText(/Co-financing: 25%/)).toBeInTheDocument()
      expect(screen.getByText(/\$25,000/)).toBeInTheDocument()
    })
  })

  // ---------- IMAGE UPLOAD ----------
  describe('Image Upload', () => {
    it('allows adding images', async () => {
      const user = userEvent.setup()
      render(<PartnerNewProjectPage />)

      expect(screen.getByText('Images: 0/5')).toBeInTheDocument()

      await user.click(screen.getByText('Add Image'))

      expect(screen.getByText('Images: 1/5')).toBeInTheDocument()
    })
  })

  // ---------- DOCUMENT UPLOAD ----------
  describe('Document Upload', () => {
    it('allows adding documents', async () => {
      const user = userEvent.setup()
      render(<PartnerNewProjectPage />)

      expect(screen.getByText('Documents: 0/10')).toBeInTheDocument()

      await user.click(screen.getByText('Add Document'))

      expect(screen.getByText('Documents: 1/10')).toBeInTheDocument()
    })
  })
})
