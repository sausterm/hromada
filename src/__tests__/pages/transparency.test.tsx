import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TransparencyPage from '@/app/[locale]/(public)/transparency/page'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'transparency.title': 'Transparency & Verification',
      'transparency.intro': 'How Hromada ensures every dollar reaches its destination.',
      'transparency.civilianOnlyTitle': 'Civilian Infrastructure Only',
      'transparency.civilianOnlyText': 'Hromada funds only civilian infrastructure.',
      'transparency.processTitle': 'How Projects Reach the Platform',
      'transparency.processStep1Title': 'Identification',
      'transparency.processStep1Text': 'NGO partners identify needs.',
      'transparency.processStep2Title': 'Documentation',
      'transparency.processStep2Text': 'Cost estimates are gathered.',
      'transparency.processStep3Title': 'Review',
      'transparency.processStep3Text': 'Hromada reviews submissions.',
      'transparency.processStep4Title': 'Publishing',
      'transparency.processStep4Text': 'Approved projects go live.',
      'transparency.processStep5Title': 'Funding',
      'transparency.processStep5Text': 'Donors fund projects directly.',
      'transparency.verificationTitle': 'Project Verification',
      'transparency.verificationText': 'Every project undergoes verification.',
      'prescreening.ngoPartnerTitle': 'NGO Partner Verification',
      'prescreening.ngoPartnerDesc': 'We verify through NGO partners.',
      'prescreening.documentationTitle': 'Documentation',
      'prescreening.documentationDesc': 'Engineering assessments required.',
      'prescreening.bankingTitle': 'Banking Verification',
      'prescreening.bankingDesc': 'Direct municipal accounts.',
      'prescreening.ofacTitle': 'OFAC Screening',
      'prescreening.ofacDesc': 'All recipients screened.',
      'transparency.directConnectionTitle': 'Direct Connection',
      'transparency.directConnectionText': 'Funds go directly to municipalities.',
      'transparency.governanceDataTitle': 'Municipal Governance Data',
      'transparency.governanceDataText': 'We reference TI Ukraine rankings.',
      'prescreening.visitTransparentCities': 'Visit Transparent Cities',
      'transparency.faqTitle': 'Frequently Asked Questions',
      'transparency.faq1Question': 'How are projects selected?',
      'transparency.faq1Answer': 'Projects are submitted by municipalities.',
      'transparency.faq2Question': 'Where does my money go?',
      'transparency.faq2Answer': 'Directly to the municipality.',
      'transparency.faq3Question': 'Is my donation tax-deductible?',
      'transparency.faq3Answer': 'Yes, through POCACITO Network.',
      'transparency.faq4Question': 'How do you prevent fraud?',
      'transparency.faq4Answer': 'Multiple verification layers.',
      'transparency.faq5Question': 'Can I visit the project?',
      'transparency.faq5Answer': 'We can facilitate visits.',
      'prescreening.policiesTitle': 'Policies',
      'prescreening.sanctionsPolicy': 'Sanctions Policy',
      'footer.terms': 'Terms',
      'footer.privacy': 'Privacy',
    }
    return translations[key] || key
  },
}))

// Mock Header
jest.mock('@/components/layout/Header', () => ({
  Header: () => <header data-testid="mock-header">Header</header>,
}))

// Mock i18n navigation
jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('TransparencyPage', () => {
  it('renders the page title', () => {
    render(<TransparencyPage />)
    expect(screen.getByText('Transparency & Verification')).toBeInTheDocument()
  })

  it('renders header', () => {
    render(<TransparencyPage />)
    expect(screen.getByTestId('mock-header')).toBeInTheDocument()
  })

  it('renders civilian infrastructure section', () => {
    render(<TransparencyPage />)
    expect(screen.getByText('Civilian Infrastructure Only')).toBeInTheDocument()
    expect(screen.getByText('Hromada funds only civilian infrastructure.')).toBeInTheDocument()
  })

  it('renders how projects reach the platform section', () => {
    render(<TransparencyPage />)
    expect(screen.getByText('How Projects Reach the Platform')).toBeInTheDocument()
    expect(screen.getByText(/Identification/)).toBeInTheDocument()
    expect(screen.getByText(/Cost estimates are gathered/)).toBeInTheDocument()
  })

  it('renders project verification section', () => {
    render(<TransparencyPage />)
    expect(screen.getByText('Project Verification')).toBeInTheDocument()
    expect(screen.getByText(/NGO Partner Verification/)).toBeInTheDocument()
    expect(screen.getByText(/OFAC Screening/)).toBeInTheDocument()
    expect(screen.getByText(/Banking Verification/)).toBeInTheDocument()
  })

  it('renders municipal governance data section', () => {
    render(<TransparencyPage />)
    expect(screen.getByText('Municipal Governance Data')).toBeInTheDocument()
    expect(screen.getByText('Visit Transparent Cities')).toBeInTheDocument()
  })

  it('renders FAQ section with expandable items', async () => {
    const user = userEvent.setup()
    render(<TransparencyPage />)
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument()
    expect(screen.getByText('How are projects selected?')).toBeInTheDocument()

    // Click to expand a FAQ
    await user.click(screen.getByText('How are projects selected?'))
    expect(screen.getByText('Projects are submitted by municipalities.')).toBeInTheDocument()
  })

  it('renders policy links', () => {
    render(<TransparencyPage />)
    expect(screen.getByText('Terms')).toBeInTheDocument()
    expect(screen.getByText('Privacy')).toBeInTheDocument()
    expect(screen.getByText('Sanctions Policy')).toBeInTheDocument()
  })
})
