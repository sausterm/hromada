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
      'projectDetail.cofinancingAvailable': 'Co-financing Available',
    }
    return translations[key] || key
  },
  useLocale: () => 'en',
}))

// Mock next/link — component uses next/link (not i18n/navigation)
jest.mock('next/link', () => {
  return function MockLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
    return <a href={href} className={className} data-testid="project-link">{children}</a>
  }
})

// Mock @/types — provide CATEGORY_CONFIG, PROJECT_TYPE_CONFIG, formatCurrency, getLocalizedProject
jest.mock('@/types', () => ({
  CATEGORY_CONFIG: {
    HOSPITAL: { color: '#C75B39', icon: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3"/>' },
    SCHOOL: { color: '#7B9E6B', icon: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838"/>' },
    WATER: { color: '#5B8FA8', icon: '<path d="M12 22a7 7 0 0 0 7-7"/>' },
    ENERGY: { color: '#D4954A', icon: '<path d="M13 2 3 14h9l-1 8"/>' },
    OTHER: { color: '#8B7355', icon: '<path d="M2 20a2 2 0 0 0 2 2h16"/>' },
  },
  PROJECT_TYPE_CONFIG: {
    SOLAR_PV: { color: '#D4954A', icon: '<circle cx="12" cy="12" r="5"/>' },
    HEAT_PUMP: { color: '#5B8FA8', icon: '<path d="M12 22a7 7 0 0 0 7-7"/>' },
    BATTERY_STORAGE: { color: '#7B9E6B', icon: '<rect x="4" y="8" width="16" height="12"/>' },
    THERMO_MODERNIZATION: { color: '#C75B39', icon: '<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26"/>' },
  },
  formatCurrency: (value: number, options?: { compact?: boolean }) =>
    options?.compact ? `$${Math.round(value/1000)}K` : `$${value.toLocaleString()}`,
  getLocalizedProject: (project: any, _locale: string) => project,
}))

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
      // Component uses t(`categories.${category}`).split(' ')[0] — "Hospital".split(' ')[0] = "Hospital"
      expect(screen.getByText('Hospital')).toBeInTheDocument()
    })

    it('renders view details link', () => {
      render(<ProjectPopup project={baseProject} />)
      const links = screen.getAllByTestId('project-link')
      expect(links.length).toBe(2) // Title link and View Details button
      links.forEach(link => {
        expect(link).toHaveAttribute('href', '/en/projects/proj-123')
      })
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
      expect(screen.getByText('Co-financing Available')).toBeInTheDocument()
    })

    it('does not render cofinancing badge when not available', () => {
      const projectWithoutCofinancing = {
        ...baseProject,
        cofinancingAvailable: 'NO' as const,
      }
      render(<ProjectPopup project={projectWithoutCofinancing} />)
      expect(screen.queryByText('Co-financing Available')).not.toBeInTheDocument()
    })
  })
})
