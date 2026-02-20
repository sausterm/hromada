import { render, screen } from '@testing-library/react'
import PartnerWithUsPage from '@/app/[locale]/(public)/partner-with-us/page'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'hero.title': 'Municipal Partnership Program',
      'hero.subtitle': 'Partner with a Ukrainian community.',
      'hero.pitch': 'Your community raises funds.',
      'hero.cta': 'Start a Partnership',
      'howItWorks.title': 'How It Works',
      'howItWorks.step1Title': 'Express Interest',
      'howItWorks.step1Desc': 'Fill out the form.',
      'howItWorks.step2Title': 'Get Matched',
      'howItWorks.step2Desc': 'We match you.',
      'howItWorks.step3Title': 'Fundraise',
      'howItWorks.step3Desc': 'Raise funds.',
      'howItWorks.step4Title': 'Transfer',
      'howItWorks.step4Desc': 'We transfer.',
      'howItWorks.step5Title': 'Impact',
      'howItWorks.step5Desc': 'See results.',
      'whyItWorks.title': 'Why It Works',
      'whyItWorks.achievableTitle': 'Achievable',
      'whyItWorks.achievableDesc': 'Funded as whole projects.',
      'whyItWorks.collectiveTitle': 'Collective',
      'whyItWorks.collectiveDesc': 'Community-driven.',
      'whyItWorks.concreteTitle': 'Concrete',
      'whyItWorks.concreteDesc': 'Real infrastructure.',
      'whyItWorks.bridgesTitle': 'Bridges',
      'whyItWorks.bridgesDesc': 'Transatlantic bonds.',
      'whoParticipates.title': 'Who Participates',
      'whoParticipates.subtitle': 'Any community group can partner.',
      'whoParticipates.rotary': 'Rotary Clubs',
      'whoParticipates.cityCouncil': 'City Councils',
      'whoParticipates.faith': 'Faith Groups',
      'whoParticipates.school': 'Schools',
      'whoParticipates.diaspora': 'Diaspora Orgs',
      'whoParticipates.corporate': 'Corporate',
      'whoParticipates.other': 'Other',
      'whatGetsFunded.title': 'What Gets Funded',
      'whatGetsFunded.subtitle': 'Civilian infrastructure.',
      'form.title': 'Express Interest',
      'form.subtitle': 'Tell us about your community.',
    }
    return translations[key] || key
  },
}))

// Mock Header
jest.mock('@/components/layout/Header', () => ({
  Header: () => <header data-testid="mock-header">Header</header>,
}))

// Mock Button
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}))

// Mock PartnershipInterestForm
jest.mock('@/components/forms/PartnershipInterestForm', () => ({
  PartnershipInterestForm: () => <div data-testid="partnership-form">Partnership Form</div>,
}))

// Mock types
jest.mock('@/types', () => ({
  CATEGORY_CONFIG: {
    HOSPITAL: { label: 'Hospital', color: '#C75B39', icon: '<path d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>' },
    SCHOOL: { label: 'School', color: '#7B9E6B', icon: '<path d="M12 6v6"/>' },
    WATER: { label: 'Water', color: '#5B8FA8', icon: '<path d="M12 6v6"/>' },
    ENERGY: { label: 'Energy', color: '#D4954A', icon: '<path d="M12 6v6"/>' },
    OTHER: { label: 'Other', color: '#8B7355', icon: '<path d="M12 6v6"/>' },
  },
}))

describe('PartnerWithUsPage', () => {
  it('renders the page title', () => {
    render(<PartnerWithUsPage />)
    expect(screen.getByText('Municipal Partnership Program')).toBeInTheDocument()
  })

  it('renders header', () => {
    render(<PartnerWithUsPage />)
    expect(screen.getByTestId('mock-header')).toBeInTheDocument()
  })

  it('renders how it works section', () => {
    render(<PartnerWithUsPage />)
    expect(screen.getByText('How It Works')).toBeInTheDocument()
    expect(screen.getAllByText('Express Interest').length).toBeGreaterThan(0)
    expect(screen.getByText('Get Matched')).toBeInTheDocument()
  })

  it('renders why it works section', () => {
    render(<PartnerWithUsPage />)
    expect(screen.getByText('Why It Works')).toBeInTheDocument()
    expect(screen.getByText('Achievable')).toBeInTheDocument()
    expect(screen.getByText('Collective')).toBeInTheDocument()
  })

  it('renders who participates section', () => {
    render(<PartnerWithUsPage />)
    expect(screen.getByText('Who Participates')).toBeInTheDocument()
    expect(screen.getByText('Rotary Clubs')).toBeInTheDocument()
    expect(screen.getByText('City Councils')).toBeInTheDocument()
  })

  it('renders what gets funded section', () => {
    render(<PartnerWithUsPage />)
    expect(screen.getByText('What Gets Funded')).toBeInTheDocument()
  })

  it('renders the partnership interest form', () => {
    render(<PartnerWithUsPage />)
    expect(screen.getByTestId('partnership-form')).toBeInTheDocument()
  })

  it('renders CTA button', () => {
    render(<PartnerWithUsPage />)
    expect(screen.getByText('Start a Partnership')).toBeInTheDocument()
  })
})
