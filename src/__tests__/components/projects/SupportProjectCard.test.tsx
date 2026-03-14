import { render, screen } from '@testing-library/react'
import { SupportProjectCard } from '@/components/projects/SupportProjectCard'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

// Mock @/types
jest.mock('@/types', () => ({
  formatCurrency: (value: number, options?: { compact?: boolean }) =>
    options?.compact ? `$${Math.round(value/1000)}K` : `$${value.toLocaleString()}`,
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, ...props }: any) => <img alt={alt} {...props} />,
}))

describe('SupportProjectCard - Directory Mode', () => {
  const defaultProps = {
    projectId: 'proj-123',
    projectName: 'Test Hospital Solar Project',
    estimatedCostUsd: 50000,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Options view (directory mode — Calendly CTA only)', () => {
    it('renders the support card with title', () => {
      render(<SupportProjectCard {...defaultProps} />)
      expect(screen.getByText('title')).toBeInTheDocument()
    })

    it('displays estimated cost when provided', () => {
      render(<SupportProjectCard {...defaultProps} />)
      expect(screen.getByText('estimatedCostLabel')).toBeInTheDocument()
    })

    it('hides estimated cost section when not provided', () => {
      render(<SupportProjectCard {...defaultProps} estimatedCostUsd={undefined} />)
      expect(screen.queryByText('estimatedCostLabel')).not.toBeInTheDocument()
    })

    it('displays co-financing information when available', () => {
      render(
        <SupportProjectCard
          {...defaultProps}
          cofinancingAvailable="YES"
          cofinancingDetails="50% from local government"
        />
      )
      expect(screen.getByText('cofinancingBadge')).toBeInTheDocument()
    })

    it('hides co-financing when not available', () => {
      render(
        <SupportProjectCard
          {...defaultProps}
          cofinancingAvailable="NO"
          cofinancingDetails="Some details"
        />
      )
      expect(screen.queryByText('cofinancingBadge')).not.toBeInTheDocument()
    })

    it('renders Calendly CTA link', () => {
      render(<SupportProjectCard {...defaultProps} />)
      expect(screen.getByText('scheduleCallWith')).toBeInTheDocument()
    })

    it('does not render payment method buttons (directory mode)', () => {
      render(<SupportProjectCard {...defaultProps} />)
      expect(screen.queryByText('methods.wire.title')).not.toBeInTheDocument()
      expect(screen.queryByText('methods.daf.title')).not.toBeInTheDocument()
      expect(screen.queryByText('methods.check.title')).not.toBeInTheDocument()
    })

    it('does not render tax-deductible notice (directory mode)', () => {
      render(<SupportProjectCard {...defaultProps} />)
      expect(screen.queryByText('taxNote')).not.toBeInTheDocument()
    })

    it('Calendly link includes project name', () => {
      render(<SupportProjectCard {...defaultProps} />)
      const calendlyLink = screen.getByText('scheduleCallWith').closest('a')
      expect(calendlyLink).toHaveAttribute('href', expect.stringContaining('Test%20Hospital%20Solar%20Project'))
    })
  })
})
