import { render, screen } from '@testing-library/react'
import OFACPolicyPage from '@/app/[locale]/(public)/ofac-policy/page'

// Mock Header
jest.mock('@/components/layout/Header', () => ({
  Header: () => <header data-testid="mock-header">Header</header>,
}))

describe('OFACPolicyPage', () => {
  it('renders the page title', () => {
    render(<OFACPolicyPage />)
    expect(screen.getByText('OFAC Sanctions Compliance Policy')).toBeInTheDocument()
  })

  it('renders the version info', () => {
    render(<OFACPolicyPage />)
    expect(screen.getAllByText(/POCACITO Network/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Version 1.0/)).toBeInTheDocument()
  })

  it('renders section headings', () => {
    render(<OFACPolicyPage />)
    expect(screen.getByText('1. Purpose')).toBeInTheDocument()
    expect(screen.getByText('2. Responsible Parties')).toBeInTheDocument()
    expect(screen.getByText('3. Pre-Disbursement Screening')).toBeInTheDocument()
  })

  it('renders main content element', () => {
    render(<OFACPolicyPage />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('renders the header', () => {
    render(<OFACPolicyPage />)
    expect(screen.getByTestId('mock-header')).toBeInTheDocument()
  })
})
