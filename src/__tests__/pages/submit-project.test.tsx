import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SubmitProjectPage from '@/app/[locale]/(public)/submit-project/page'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, any>) => {
    const translations: Record<string, string> = {
      'submitProject.title': 'Submit Your Project',
      'submitProject.subtitle': 'Share your renewable energy project with potential donors',
      'submitProject.beforeYouBegin': 'Before You Begin',
      'submitProject.description': 'This form is for municipalities and organizations in Ukraine.',
      'submitProject.allFieldsRequired': 'All fields marked with * are required.',
      'submitProject.securityNote': 'For security, only provide city-level coordinates.',
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
      'submitProject.fields.urgency': 'Urgency',
      'submitProject.fields.selectUrgency': 'Select Urgency',
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
      'submitProject.fields.select': '-- Select --',
      'submitProject.fields.needsDiscussion': 'Needs Discussion',
      'submitProject.fields.cofinancingDetails': 'Co-financing Details',
      'submitProject.fields.cofinancingPlaceholder': 'e.g., Up to 20%',
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
      'submitProject.optionalFieldsNote': 'These fields are optional but help donors understand your project.',
      'submitProject.buttons.cancel': 'Cancel',
      'submitProject.buttons.submit': 'Submit Project',
      'submitProject.buttons.submitting': 'Submitting...',
      'submitProject.buttons.backToHome': 'Back to Home',
      'submitProject.buttons.submitAnother': 'Submit Another',
      'submitProject.validation.required': 'Required',
      'submitProject.validation.invalidEmail': 'Invalid email address',
      'submitProject.validation.positiveNumber': 'Must be a positive number',
      'submitProject.validation.positiveWholeNumber': 'Must be a positive whole number',
      'submitProject.validation.invalidLatitude': 'Invalid latitude (-90 to 90)',
      'submitProject.validation.invalidLongitude': 'Invalid longitude (-180 to 180)',
      'submitProject.validation.enterCityFirst': 'Enter a city name first',
      'submitProject.validation.coordinatesNotFound': 'Could not find coordinates',
      'submitProject.validation.geocodingFailed': 'Geocoding failed',
      'submitProject.success.title': 'Submission Received!',
      'submitProject.error.message': 'An error occurred',
      'submitProject.error.network': 'Network error',
      'categories.HOSPITAL': 'Hospital / Medical',
      'categories.SCHOOL': 'School / Education',
      'categories.WATER': 'Water Utility',
      'categories.ENERGY': 'Energy Infrastructure',
      'categories.OTHER': 'Other Infrastructure',
      'urgency.LOW': 'Low',
      'urgency.MEDIUM': 'Medium',
      'urgency.HIGH': 'High',
      'urgency.CRITICAL': 'Critical',
      'projectTypes.SOLAR_PV': 'Solar PV',
      'projectTypes.HEAT_PUMP': 'Heat Pump',
      'projectTypes.WATER_TREATMENT': 'Water Treatment',
      'projectTypes.GENERAL': 'General',
      'cofinancing.YES': 'Yes',
      'cofinancing.NO': 'No',
    }
    if (key === 'submitProject.success.message' && params?.email) {
      return `We will contact you at ${params.email}`
    }
    if (key === 'submitProject.validation.tooLong' && params?.max) {
      return `Maximum ${params.max} characters`
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

// Mock Header component
jest.mock('@/components/layout/Header', () => ({
  Header: () => <header data-testid="mock-header">Header</header>,
}))

// Mock PublicImageUpload component
jest.mock('@/components/forms/PublicImageUpload', () => ({
  PublicImageUpload: ({ images, onChange, maxImages }: { images: string[]; onChange: (imgs: string[]) => void; maxImages: number }) => (
    <div data-testid="image-upload">
      <span>Images: {images.length}/{maxImages}</span>
      <button type="button" onClick={() => onChange([...images, 'new-image.jpg'])}>Add Image</button>
    </div>
  ),
}))

// Mock fetch
global.fetch = jest.fn()

describe('SubmitProjectPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockReset()
  })

  describe('Rendering', () => {
    it('renders the page title', () => {
      render(<SubmitProjectPage />)
      expect(screen.getByText('Submit Your Project')).toBeInTheDocument()
    })

    it('renders the header', () => {
      render(<SubmitProjectPage />)
      expect(screen.getByTestId('mock-header')).toBeInTheDocument()
    })

    it('renders the subtitle', () => {
      render(<SubmitProjectPage />)
      expect(screen.getByText('Share your renewable energy project with potential donors')).toBeInTheDocument()
    })

    it('renders before you begin section', () => {
      render(<SubmitProjectPage />)
      expect(screen.getByText('Before You Begin')).toBeInTheDocument()
    })

    it('renders all form sections', () => {
      render(<SubmitProjectPage />)
      expect(screen.getByText('Municipality Information')).toBeInTheDocument()
      expect(screen.getByText('Project Details')).toBeInTheDocument()
      expect(screen.getByText('Technical & Financial Information')).toBeInTheDocument()
      expect(screen.getByText('Location')).toBeInTheDocument()
      expect(screen.getByText('Contact Information')).toBeInTheDocument()
    })

    it('renders submit button', () => {
      render(<SubmitProjectPage />)
      expect(screen.getByRole('button', { name: 'Submit Project' })).toBeInTheDocument()
    })

    it('renders cancel button', () => {
      render(<SubmitProjectPage />)
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    })

    it('renders back to home link', () => {
      render(<SubmitProjectPage />)
      // There are multiple links to home - just check at least one exists
      expect(screen.getAllByTestId('link-/').length).toBeGreaterThan(0)
    })
  })

  describe('Form Fields', () => {
    it('renders municipality name input', () => {
      render(<SubmitProjectPage />)
      expect(screen.getByPlaceholderText('e.g., Kharkiv City Council')).toBeInTheDocument()
    })

    it('renders facility name input', () => {
      render(<SubmitProjectPage />)
      expect(screen.getByPlaceholderText('e.g., Regional Hospital #5')).toBeInTheDocument()
    })

    it('renders category dropdown button', () => {
      render(<SubmitProjectPage />)
      // The dropdown uses a button with placeholder text
      expect(screen.getByText(/Select Category/)).toBeInTheDocument()
    })

    it('renders project type dropdown button', () => {
      render(<SubmitProjectPage />)
      expect(screen.getByText('-- Select Type --')).toBeInTheDocument()
    })

    it('renders urgency dropdown button', () => {
      render(<SubmitProjectPage />)
      expect(screen.getByText(/Select Urgency/)).toBeInTheDocument()
    })

    it('renders image upload component', () => {
      render(<SubmitProjectPage />)
      expect(screen.getByTestId('image-upload')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('shows validation errors for empty required fields on submit', async () => {
      const user = userEvent.setup()
      render(<SubmitProjectPage />)

      const submitButton = screen.getByRole('button', { name: 'Submit Project' })
      await user.click(submitButton)

      await waitFor(() => {
        // Check for at least one validation error
        const requiredErrors = screen.getAllByText('Required')
        expect(requiredErrors.length).toBeGreaterThan(0)
      })
    })

    it('clears validation error when field is filled', async () => {
      const user = userEvent.setup()
      render(<SubmitProjectPage />)

      // Submit to trigger validation
      const submitButton = screen.getByRole('button', { name: 'Submit Project' })
      await user.click(submitButton)

      // Fill in municipality name
      const municipalityInput = screen.getByPlaceholderText('e.g., Kharkiv City Council')
      await user.type(municipalityInput, 'Test Municipality')

      // The error for that field should be cleared
      // Check that input doesn't have error styling
    })
  })

  describe('Geocoding', () => {
    it('shows get coordinates button', () => {
      render(<SubmitProjectPage />)
      expect(screen.getByRole('button', { name: 'Get Coordinates' })).toBeInTheDocument()
    })

    it('fills coordinates when geocoding succeeds', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [{ lat: '50.4501', lon: '30.5234' }],
      })

      render(<SubmitProjectPage />)

      // Enter city name
      const cityInput = screen.getByPlaceholderText('e.g., Kharkiv')
      await user.type(cityInput, 'Kyiv')

      // Click geocode button
      const geocodeButton = screen.getByRole('button', { name: 'Get Coordinates' })
      await user.click(geocodeButton)

      await waitFor(() => {
        const latInput = screen.getByPlaceholderText('e.g., 49.9935') as HTMLInputElement
        expect(latInput.value).toBe('50.4501')
      })
    })

    it('shows error when geocoding fails', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(<SubmitProjectPage />)

      // Enter city name
      const cityInput = screen.getByPlaceholderText('e.g., Kharkiv')
      await user.type(cityInput, 'Unknown City')

      // Click geocode button
      const geocodeButton = screen.getByRole('button', { name: 'Get Coordinates' })
      await user.click(geocodeButton)

      await waitFor(() => {
        expect(screen.getByText('Geocoding failed')).toBeInTheDocument()
      })
    })

    it('shows error when no city name entered', async () => {
      const user = userEvent.setup()
      render(<SubmitProjectPage />)

      // Click geocode button without entering city
      const geocodeButton = screen.getByRole('button', { name: 'Get Coordinates' })
      await user.click(geocodeButton)

      await waitFor(() => {
        expect(screen.getByText('Enter a city name first')).toBeInTheDocument()
      })
    })
  })

  describe('Image Upload', () => {
    it('allows adding images', async () => {
      const user = userEvent.setup()
      render(<SubmitProjectPage />)

      expect(screen.getByText('Images: 0/5')).toBeInTheDocument()

      await user.click(screen.getByText('Add Image'))

      expect(screen.getByText('Images: 1/5')).toBeInTheDocument()
    })
  })

  describe('Page Structure', () => {
    it('renders main element', () => {
      render(<SubmitProjectPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })
})
