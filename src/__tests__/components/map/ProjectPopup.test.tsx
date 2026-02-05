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
      'projectTypes.BATTERY_STORAGE': 'Battery Storage',
      'projectTypes.THERMO_MODERNIZATION': 'Thermo-modernization',
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

    it('renders view details link', () => {
      render(<ProjectPopup project={baseProject} />)
      const link = screen.getByTestId('project-link')
      expect(link).toHaveAttribute('href', '/projects/proj-123')
      expect(screen.getByText('View Details')).toBeInTheDocument()
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

    it('renders estimated cost in compact format when available', () => {
      const projectWithCost = {
        ...baseProject,
        estimatedCostUsd: 50000,
      }
      render(<ProjectPopup project={projectWithCost} />)
      expect(screen.getByText('$50K')).toBeInTheDocument()
    })

    it('renders both project type and cost', () => {
      const projectWithBoth = {
        ...baseProject,
        projectType: 'HEAT_PUMP' as const,
        estimatedCostUsd: 75000,
      }
      render(<ProjectPopup project={projectWithBoth} />)
      expect(screen.getByText('Heat Pump')).toBeInTheDocument()
      expect(screen.getByText('$75K')).toBeInTheDocument()
    })

    it('does not render cost when not available', () => {
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

  describe('Cofinancing badge', () => {
    it('renders cofinancing badge when available', () => {
      const projectWithCofinancing = {
        ...baseProject,
        cofinancingAvailable: 'YES' as const,
      }
      render(<ProjectPopup project={projectWithCofinancing} />)
      expect(screen.getByText('projectDetail.cofinancingAvailable')).toBeInTheDocument()
    })

    it('does not render cofinancing badge when not available', () => {
      const projectWithoutCofinancing = {
        ...baseProject,
        cofinancingAvailable: 'NO' as const,
      }
      render(<ProjectPopup project={projectWithoutCofinancing} />)
      expect(screen.queryByText('projectDetail.cofinancingAvailable')).not.toBeInTheDocument()
    })
  })
})
