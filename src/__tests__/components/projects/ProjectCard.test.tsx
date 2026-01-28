import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { type Project } from '@/types'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, string>) => {
    const translations: Record<string, string> = {
      'categories.HOSPITAL': 'Hospital / Medical',
      'categories.SCHOOL': 'School / Education',
      'categories.WATER': 'Water Utility',
      'categories.ENERGY': 'Energy Infrastructure',
      'categories.OTHER': 'Other Infrastructure',
      'urgency.LOW': 'Low',
      'urgency.MEDIUM': 'Medium',
      'urgency.HIGH': 'High',
      'urgency.CRITICAL': 'Critical',
      'status.OPEN': 'Seeking Donors',
      'status.IN_DISCUSSION': 'In Discussion',
      'status.MATCHED': 'Matched',
      'status.FULFILLED': 'Fulfilled',
      'projectTypes.SOLAR_PV': 'Solar PV',
      'projectTypes.HEAT_PUMP': 'Heat Pump',
      'projectTypes.WATER_TREATMENT': 'Water Treatment',
      'projectTypes.GENERAL': 'General',
      'projectDetail.viewDetails': 'View Details',
    }
    if (key === 'projectCard.postedAgo' && params?.time) {
      return `Posted ${params.time}`
    }
    return translations[key] || key
  },
  useLocale: () => 'en',
}))

// Mock @/i18n/navigation
jest.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, onClick, className, onMouseEnter, onMouseLeave }: {
    children: React.ReactNode
    href: string
    onClick?: (e: React.MouseEvent) => void
    className?: string
    onMouseEnter?: () => void
    onMouseLeave?: () => void
  }) => (
    <a
      href={href}
      onClick={onClick}
      className={className}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-testid="link"
    >
      {children}
    </a>
  ),
}))

// Mock ShareButton component
jest.mock('@/components/ui/ShareButton', () => ({
  ShareButton: ({ projectId, projectTitle }: { projectId: string; projectTitle: string }) => (
    <button data-testid="share-button" aria-label="Share project">
      Share {projectTitle}
    </button>
  ),
}))

// Sample project data for tests
const createMockProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'test-project-123',
  municipalityName: 'Test Municipality',
  region: 'Kyiv Oblast',
  municipalityEmail: 'test@municipality.gov.ua',
  facilityName: 'Test Hospital Building',
  category: 'HOSPITAL',
  briefDescription: 'A brief description of the test hospital project that needs funding.',
  description: 'Full description of the project',
  address: '123 Test Street, Test City',
  cityLatitude: 50.4501,
  cityLongitude: 30.5234,
  contactName: 'John Doe',
  contactEmail: 'john@example.com',
  urgency: 'MEDIUM',
  status: 'OPEN',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-20'),
  ...overrides,
})

describe('ProjectCard', () => {
  describe('Basic Rendering', () => {
    it('renders project name/facility name correctly', () => {
      const project = createMockProject({ facilityName: 'Kyiv City Hospital #5' })
      render(<ProjectCard project={project} />)

      expect(screen.getByText('Kyiv City Hospital #5')).toBeInTheDocument()
    })

    it('renders municipality name', () => {
      const project = createMockProject({ municipalityName: 'Lviv Municipality' })
      render(<ProjectCard project={project} />)

      expect(screen.getByText(/Lviv Municipality/)).toBeInTheDocument()
    })

    it('renders municipality with region', () => {
      const project = createMockProject({
        municipalityName: 'Kharkiv City',
        region: 'Kharkiv Oblast',
      })
      render(<ProjectCard project={project} />)

      expect(screen.getByText(/Kharkiv City.*Kharkiv/)).toBeInTheDocument()
    })

    it('renders brief description', () => {
      const project = createMockProject({
        briefDescription: 'Urgent need for medical equipment replacement',
      })
      render(<ProjectCard project={project} />)

      expect(screen.getByText('Urgent need for medical equipment replacement')).toBeInTheDocument()
    })
  })

  describe('Category Badge', () => {
    it('renders category badge for HOSPITAL', () => {
      const project = createMockProject({ category: 'HOSPITAL' })
      render(<ProjectCard project={project} />)

      expect(screen.getByText('Hospital / Medical')).toBeInTheDocument()
    })

    it('renders category badge for SCHOOL', () => {
      const project = createMockProject({ category: 'SCHOOL' })
      render(<ProjectCard project={project} />)

      expect(screen.getByText('School / Education')).toBeInTheDocument()
    })

    it('renders category badge for WATER', () => {
      const project = createMockProject({ category: 'WATER' })
      render(<ProjectCard project={project} />)

      expect(screen.getByText('Water Utility')).toBeInTheDocument()
    })

    it('renders category badge for ENERGY', () => {
      const project = createMockProject({ category: 'ENERGY' })
      render(<ProjectCard project={project} />)

      expect(screen.getByText('Energy Infrastructure')).toBeInTheDocument()
    })

    it('renders category badge for OTHER', () => {
      const project = createMockProject({ category: 'OTHER' })
      render(<ProjectCard project={project} />)

      expect(screen.getByText('Other Infrastructure')).toBeInTheDocument()
    })

    it('renders category icon', () => {
      const project = createMockProject({ category: 'HOSPITAL' })
      render(<ProjectCard project={project} />)

      // Hospital icon emoji
      expect(screen.getByText('🏥')).toBeInTheDocument()
    })
  })

  describe('Urgency Badge', () => {
    it('renders urgency badge for HIGH urgency', () => {
      const project = createMockProject({ urgency: 'HIGH' })
      render(<ProjectCard project={project} />)

      expect(screen.getByText('High')).toBeInTheDocument()
    })

    it('renders urgency badge for CRITICAL urgency', () => {
      const project = createMockProject({ urgency: 'CRITICAL' })
      render(<ProjectCard project={project} />)

      expect(screen.getByText('Critical')).toBeInTheDocument()
    })

    it('does not render urgency badge for LOW urgency', () => {
      const project = createMockProject({ urgency: 'LOW' })
      render(<ProjectCard project={project} />)

      expect(screen.queryByText('Low')).not.toBeInTheDocument()
    })

    it('does not render urgency badge for MEDIUM urgency', () => {
      const project = createMockProject({ urgency: 'MEDIUM' })
      render(<ProjectCard project={project} />)

      expect(screen.queryByText('Medium')).not.toBeInTheDocument()
    })
  })

  describe('Estimated Cost', () => {
    it('renders estimated cost when present', () => {
      const project = createMockProject({ estimatedCostUsd: 50000 })
      render(<ProjectCard project={project} />)

      expect(screen.getByText('USD $50K')).toBeInTheDocument()
    })

    it('renders estimated cost in millions format', () => {
      const project = createMockProject({ estimatedCostUsd: 1500000 })
      render(<ProjectCard project={project} />)

      expect(screen.getByText('USD $1.5M')).toBeInTheDocument()
    })

    it('does not render cost section when estimatedCostUsd is not provided', () => {
      const project = createMockProject({ estimatedCostUsd: undefined })
      render(<ProjectCard project={project} />)

      expect(screen.queryByText(/\$\d/)).not.toBeInTheDocument()
    })
  })

  describe('Project Type', () => {
    it('renders project type badge for SOLAR_PV', () => {
      const project = createMockProject({ projectType: 'SOLAR_PV' })
      render(<ProjectCard project={project} />)

      expect(screen.getByText('Solar PV')).toBeInTheDocument()
      expect(screen.getByText('☀️')).toBeInTheDocument()
    })

    it('renders project type badge for HEAT_PUMP', () => {
      const project = createMockProject({ projectType: 'HEAT_PUMP' })
      render(<ProjectCard project={project} />)

      expect(screen.getByText('Heat Pump')).toBeInTheDocument()
    })

    it('does not render project type when not provided', () => {
      const project = createMockProject({ projectType: undefined })
      render(<ProjectCard project={project} />)

      expect(screen.queryByText('Solar PV')).not.toBeInTheDocument()
      expect(screen.queryByText('Heat Pump')).not.toBeInTheDocument()
    })
  })

  describe('Status Badge', () => {
    it('renders status badge for OPEN status', () => {
      const project = createMockProject({ status: 'OPEN' })
      render(<ProjectCard project={project} />)

      expect(screen.getByText('Seeking Donors')).toBeInTheDocument()
    })

    it('renders status badge for IN_DISCUSSION status', () => {
      const project = createMockProject({ status: 'IN_DISCUSSION' })
      render(<ProjectCard project={project} />)

      expect(screen.getByText('In Discussion')).toBeInTheDocument()
    })

    it('renders status badge for MATCHED status', () => {
      const project = createMockProject({ status: 'MATCHED' })
      render(<ProjectCard project={project} />)

      expect(screen.getByText('Matched')).toBeInTheDocument()
    })

    it('renders status badge for FULFILLED status', () => {
      const project = createMockProject({ status: 'FULFILLED' })
      render(<ProjectCard project={project} />)

      expect(screen.getByText('Fulfilled')).toBeInTheDocument()
    })
  })

  describe('Photo Rendering', () => {
    it('renders project photo when available', () => {
      const project = createMockProject({
        photos: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
      })
      render(<ProjectCard project={project} />)

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('src', 'https://example.com/photo1.jpg')
    })

    it('renders placeholder icon when no photos', () => {
      const project = createMockProject({ photos: undefined, category: 'HOSPITAL' })
      render(<ProjectCard project={project} />)

      // Should not have an img element, but should have the placeholder
      expect(screen.queryByRole('img')).not.toBeInTheDocument()
      // The placeholder SVG is rendered for the category
      const placeholder = document.querySelector('svg')
      expect(placeholder).toBeInTheDocument()
    })
  })

  describe('Click Behavior', () => {
    it('calls onClick handler when provided and card is clicked', async () => {
      const user = userEvent.setup()
      const handleClick = jest.fn()
      const project = createMockProject()

      render(<ProjectCard project={project} onClick={handleClick} />)

      // With onClick, the card is a div with role="button"
      const card = screen.getByRole('button')
      await user.click(card)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('handles keyboard navigation when onClick is provided', () => {
      const handleClick = jest.fn()
      const project = createMockProject()

      render(<ProjectCard project={project} onClick={handleClick} />)

      const card = screen.getByRole('button')
      fireEvent.keyDown(card, { key: 'Enter' })
      expect(handleClick).toHaveBeenCalledTimes(1)

      fireEvent.keyDown(card, { key: ' ' })
      expect(handleClick).toHaveBeenCalledTimes(2)
    })

    it('renders as a link when onClick is not provided', () => {
      const project = createMockProject()
      render(<ProjectCard project={project} />)

      const link = screen.getByTestId('link')
      expect(link).toHaveAttribute('href', '/projects/test-project-123')
    })

    it('shows View Details link when onClick is provided', () => {
      const handleClick = jest.fn()
      const project = createMockProject()

      render(<ProjectCard project={project} onClick={handleClick} />)

      expect(screen.getByText('View Details →')).toBeInTheDocument()
    })
  })

  describe('ShareButton', () => {
    it('renders share button when onClick is not provided', () => {
      const project = createMockProject()
      render(<ProjectCard project={project} />)

      expect(screen.getByTestId('share-button')).toBeInTheDocument()
    })

    it('does not render share button when onClick is provided', () => {
      const handleClick = jest.fn()
      const project = createMockProject()

      render(<ProjectCard project={project} onClick={handleClick} />)

      expect(screen.queryByTestId('share-button')).not.toBeInTheDocument()
    })
  })

  describe('Mouse Events', () => {
    it('calls onMouseEnter when hovering over card', async () => {
      const user = userEvent.setup()
      const handleMouseEnter = jest.fn()
      const project = createMockProject()

      render(<ProjectCard project={project} onMouseEnter={handleMouseEnter} />)

      const link = screen.getByTestId('link')
      await user.hover(link)

      expect(handleMouseEnter).toHaveBeenCalledTimes(1)
    })

    it('calls onMouseLeave when mouse leaves card', async () => {
      const user = userEvent.setup()
      const handleMouseLeave = jest.fn()
      const project = createMockProject()

      render(<ProjectCard project={project} onMouseLeave={handleMouseLeave} />)

      const link = screen.getByTestId('link')
      await user.hover(link)
      await user.unhover(link)

      expect(handleMouseLeave).toHaveBeenCalledTimes(1)
    })
  })

  describe('Highlighted State', () => {
    it('applies highlighted styles when isHighlighted is true', () => {
      const project = createMockProject()
      render(<ProjectCard project={project} isHighlighted={true} />)

      const link = screen.getByTestId('link')
      expect(link.className).toContain('border-[var(--navy-600)]')
      expect(link.className).toContain('ring-2')
    })

    it('does not apply highlighted styles when isHighlighted is false', () => {
      const project = createMockProject()
      render(<ProjectCard project={project} isHighlighted={false} />)

      const link = screen.getByTestId('link')
      expect(link.className).toContain('border-[var(--cream-300)]')
      expect(link.className).not.toContain('ring-2')
    })
  })

  describe('Posted Time', () => {
    it('renders posted time with relative format', () => {
      const project = createMockProject({
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      })
      render(<ProjectCard project={project} />)

      expect(screen.getByText(/Posted/)).toBeInTheDocument()
    })
  })

  describe('Localization', () => {
    it('renders localized facility name based on locale', () => {
      const project = createMockProject({
        facilityName: 'Test Hospital',
        facilityNameUk: 'Тестова лікарня',
      })
      render(<ProjectCard project={project} />)

      // In English locale (default mock), should show English name
      expect(screen.getByText('Test Hospital')).toBeInTheDocument()
    })
  })

  describe('Region Formatting', () => {
    it('removes Oblast suffix from region display', () => {
      const project = createMockProject({
        municipalityName: 'Test City',
        region: 'Kyiv Oblast',
      })
      render(<ProjectCard project={project} />)

      // Should show "Test City, Kyiv" not "Test City, Kyiv Oblast"
      expect(screen.getByText('Test City, Kyiv')).toBeInTheDocument()
    })

    it('handles projects without region', () => {
      const project = createMockProject({
        municipalityName: 'Test City',
        region: undefined,
      })
      render(<ProjectCard project={project} />)

      expect(screen.getByText('Test City')).toBeInTheDocument()
    })
  })
})
