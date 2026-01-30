import { render, screen } from '@testing-library/react'
import { ProjectPopup } from '@/components/map/ProjectPopup'
import { Project } from '@/types'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, string>) => {
    const translations: Record<string, string> = {
      'categories.HOSPITAL': 'Hospital',
      'categories.SCHOOL': 'School',
      'categories.WATER': 'Water',
      'categories.ENERGY': 'Energy',
      'categories.OTHER': 'Other',
      'status.OPEN': 'Seeking Donors',
      'status.IN_DISCUSSION': 'In Discussion',
      'status.MATCHED': 'Matched',
      'status.FULFILLED': 'Fulfilled',
      'urgency.LOW': 'Low',
      'urgency.MEDIUM': 'Medium',
      'urgency.HIGH': 'High',
      'urgency.CRITICAL': 'Critical',
      'projectTypes.SOLAR_PV': 'Solar PV',
      'projectTypes.HEAT_PUMP': 'Heat Pump',
      'projectTypes.WATER_TREATMENT': 'Water Treatment',
      'projectTypes.GENERAL': 'General',
      'projectDetail.viewDetails': 'View Details',
      'projectDetail.urgencyLabel': `${params?.level || ''} Urgency`,
    }
    return translations[key] || key
  },
  useLocale: () => 'en',
}))

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
    return <a href={href} className={className} data-testid="project-link">{children}</a>
  }
})

describe('ProjectPopup', () => {
  const baseProject: Project = {
    id: 'proj-123',
    municipalityName: 'Kyiv',
    municipalityEmail: 'kyiv@example.com',
    facilityName: 'Central Hospital',
    category: 'HOSPITAL',
    briefDescription: 'A brief description of the hospital project',
    description: 'Full description of the project',
    fullDescription: 'Extended full description of the hospital solar project',
    address: '123 Main St',
    cityLatitude: 50.4501,
    cityLongitude: 30.5234,
    contactName: 'John Doe',
    contactEmail: 'john@example.com',
    urgency: 'HIGH',
    status: 'OPEN',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  describe('Basic rendering', () => {
    it('renders facility name', () => {
      render(<ProjectPopup project={baseProject} />)
      expect(screen.getByText('Central Hospital')).toBeInTheDocument()
    })

    it('renders municipality name', () => {
      render(<ProjectPopup project={baseProject} />)
      expect(screen.getByText('Kyiv')).toBeInTheDocument()
    })

    it('renders category badge', () => {
      render(<ProjectPopup project={baseProject} />)
      expect(screen.getByText('Hospital')).toBeInTheDocument()
    })

    it('renders status badge', () => {
      render(<ProjectPopup project={baseProject} />)
      expect(screen.getByText('Seeking Donors')).toBeInTheDocument()
    })

    it('renders brief description', () => {
      render(<ProjectPopup project={baseProject} />)
      expect(screen.getByText(/A brief description/)).toBeInTheDocument()
    })

    it('renders view details link', () => {
      render(<ProjectPopup project={baseProject} />)
      const link = screen.getByTestId('project-link')
      expect(link).toHaveAttribute('href', '/projects/proj-123')
      expect(screen.getByText('View Details')).toBeInTheDocument()
    })
  })

  describe('Photo display', () => {
    it('renders photo when available', () => {
      const projectWithPhoto = {
        ...baseProject,
        photos: ['https://example.com/photo1.jpg'],
      }
      render(<ProjectPopup project={projectWithPhoto} />)
      const img = screen.getByAltText('Central Hospital')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'https://example.com/photo1.jpg')
    })

    it('does not render photo section when no photos', () => {
      render(<ProjectPopup project={baseProject} />)
      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })

    it('renders first photo when multiple photos exist', () => {
      const projectWithPhotos = {
        ...baseProject,
        photos: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
      }
      render(<ProjectPopup project={projectWithPhotos} />)
      const img = screen.getByAltText('Central Hospital')
      expect(img).toHaveAttribute('src', 'https://example.com/photo1.jpg')
    })
  })

  describe('Urgency display', () => {
    it('shows urgency indicator for HIGH urgency', () => {
      render(<ProjectPopup project={baseProject} />)
      expect(screen.getByText(/High Urgency/)).toBeInTheDocument()
    })

    it('shows urgency indicator for CRITICAL urgency', () => {
      const criticalProject = { ...baseProject, urgency: 'CRITICAL' as const }
      render(<ProjectPopup project={criticalProject} />)
      expect(screen.getByText(/Critical Urgency/)).toBeInTheDocument()
    })

    it('shows urgency indicator for MEDIUM urgency', () => {
      const mediumProject = { ...baseProject, urgency: 'MEDIUM' as const }
      render(<ProjectPopup project={mediumProject} />)
      expect(screen.getByText(/Medium Urgency/)).toBeInTheDocument()
    })

    it('does not show urgency indicator for LOW urgency', () => {
      const lowProject = { ...baseProject, urgency: 'LOW' as const }
      render(<ProjectPopup project={lowProject} />)
      expect(screen.queryByText(/Urgency/)).not.toBeInTheDocument()
    })
  })

  describe('Project type and cost', () => {
    it('renders project type when available', () => {
      const projectWithType = {
        ...baseProject,
        projectType: 'SOLAR_PV' as const,
      }
      render(<ProjectPopup project={projectWithType} />)
      expect(screen.getByText('Solar PV')).toBeInTheDocument()
    })

    it('renders estimated cost when available', () => {
      const projectWithCost = {
        ...baseProject,
        estimatedCostUsd: 50000,
      }
      render(<ProjectPopup project={projectWithCost} />)
      expect(screen.getByText('$50,000')).toBeInTheDocument()
    })

    it('renders both project type and cost', () => {
      const projectWithBoth = {
        ...baseProject,
        projectType: 'HEAT_PUMP' as const,
        estimatedCostUsd: 75000,
      }
      render(<ProjectPopup project={projectWithBoth} />)
      expect(screen.getByText('Heat Pump')).toBeInTheDocument()
      expect(screen.getByText('$75,000')).toBeInTheDocument()
    })

    it('does not render cost section when neither type nor cost available', () => {
      render(<ProjectPopup project={baseProject} />)
      expect(screen.queryByText(/\$/)).not.toBeInTheDocument()
    })
  })

  describe('Different categories', () => {
    it('renders SCHOOL category correctly', () => {
      const schoolProject = { ...baseProject, category: 'SCHOOL' as const }
      render(<ProjectPopup project={schoolProject} />)
      expect(screen.getByText('School')).toBeInTheDocument()
    })

    it('renders WATER category correctly', () => {
      const waterProject = { ...baseProject, category: 'WATER' as const }
      render(<ProjectPopup project={waterProject} />)
      expect(screen.getByText('Water')).toBeInTheDocument()
    })

    it('renders ENERGY category correctly', () => {
      const energyProject = { ...baseProject, category: 'ENERGY' as const }
      render(<ProjectPopup project={energyProject} />)
      expect(screen.getByText('Energy')).toBeInTheDocument()
    })

    it('renders OTHER category correctly', () => {
      const otherProject = { ...baseProject, category: 'OTHER' as const }
      render(<ProjectPopup project={otherProject} />)
      expect(screen.getByText('Other')).toBeInTheDocument()
    })
  })

  describe('Different statuses', () => {
    it('renders IN_DISCUSSION status', () => {
      const discussionProject = { ...baseProject, status: 'IN_DISCUSSION' as const }
      render(<ProjectPopup project={discussionProject} />)
      expect(screen.getByText('In Discussion')).toBeInTheDocument()
    })

    it('renders MATCHED status', () => {
      const matchedProject = { ...baseProject, status: 'MATCHED' as const }
      render(<ProjectPopup project={matchedProject} />)
      expect(screen.getByText('Matched')).toBeInTheDocument()
    })

    it('renders FULFILLED status', () => {
      const fulfilledProject = { ...baseProject, status: 'FULFILLED' as const }
      render(<ProjectPopup project={fulfilledProject} />)
      expect(screen.getByText('Fulfilled')).toBeInTheDocument()
    })
  })

  describe('Description fallback', () => {
    it('uses fullDescription when briefDescription is empty', () => {
      const projectNoBreif = {
        ...baseProject,
        briefDescription: '',
      }
      render(<ProjectPopup project={projectNoBreif} />)
      expect(screen.getByText(/Extended full description/)).toBeInTheDocument()
    })
  })
})
