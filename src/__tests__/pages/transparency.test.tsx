import { render, screen } from '@testing-library/react'
import TransparencyPage from '@/app/[locale]/(public)/transparency/page'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'prescreening.title': 'Transparency Pre-Screening',
      'prescreening.subtitle': 'How we verify municipal partners',
      'prescreening.tiPartnership': 'Transparency International Ukraine',
      'prescreening.tiPartnershipDesc': 'We use TI Ukraine rankings.',
      'prescreening.visitTransparentCities': 'Visit Transparent Cities',
      'prescreening.criteriaTitle': 'Pre-Screening Criteria',
      'prescreening.thresholds.transparent': 'Transparent',
      'prescreening.thresholds.transparentDesc': 'Eligible',
      'prescreening.thresholds.partial': 'Partially Transparent',
      'prescreening.thresholds.partialDesc': 'Case by case',
      'prescreening.thresholds.nonTransparent': 'Non-Transparent',
      'prescreening.thresholds.nonTransparentDesc': 'Not eligible',
      'prescreening.ourPolicyTitle': 'Our Policy',
      'prescreening.policy1': 'Score 75+ accepted',
      'prescreening.policy2': 'Score 50-74 case by case',
      'prescreening.policy3': 'NGO partner required',
      'prescreening.policy4': 'Additional review for war zones',
      'prescreening.areasTitle': 'Assessment Areas',
      'prescreening.areasSubtitle': 'Seven areas of evaluation',
      'prescreening.areas.openness.title': 'Openness',
      'prescreening.areas.openness.desc': 'Public access to information',
      'prescreening.areas.budget.title': 'Budget',
      'prescreening.areas.budget.desc': 'Budget transparency',
      'prescreening.areas.property.title': 'Property',
      'prescreening.areas.property.desc': 'Property management',
      'prescreening.areas.publicRelations.title': 'Public Relations',
      'prescreening.areas.publicRelations.desc': 'Community engagement',
      'prescreening.areas.personnel.title': 'Personnel',
      'prescreening.areas.personnel.desc': 'HR practices',
      'prescreening.areas.services.title': 'Services',
      'prescreening.areas.services.desc': 'Service delivery',
      'prescreening.areas.warResponse.title': 'War Response',
      'prescreening.areas.warResponse.desc': 'Crisis management',
      'prescreening.topCitiesTitle': 'Top Transparent Cities',
      'prescreening.topCitiesSubtitle': '2024 ranking data',
      'prescreening.tableRank': 'Rank',
      'prescreening.tableCity': 'City',
      'prescreening.tableScore': 'Score',
      'prescreening.tableStatus': 'Status',
      'prescreening.statusTransparent': 'Transparent',
      'prescreening.statusPartial': 'Partial',
      'prescreening.dataSource': 'Source: Transparency International Ukraine',
      'prescreening.additionalDDTitle': 'Additional Due Diligence',
      'prescreening.ngoPartnerTitle': 'NGO Partner Verification',
      'prescreening.ngoPartnerDesc': 'We verify through NGO partners.',
      'prescreening.documentationTitle': 'Documentation',
      'prescreening.documentationDesc': 'Engineering assessments required.',
      'prescreening.bankingTitle': 'Banking Verification',
      'prescreening.bankingDesc': 'Direct municipal accounts.',
      'prescreening.ofacTitle': 'OFAC Screening',
      'prescreening.ofacDesc': 'All recipients screened.',
      'prescreening.policiesTitle': 'Policies',
      'prescreening.sanctionsPolicy': 'Sanctions Policy',
      'prescreening.ctaText': 'Browse verified projects',
      'prescreening.learnAboutUs': 'Learn About Us',
      'footer.terms': 'Terms',
      'footer.privacy': 'Privacy',
      'about.browseProjects': 'Browse Projects',
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

// Mock Button
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

describe('TransparencyPage', () => {
  it('renders the page title', () => {
    render(<TransparencyPage />)
    expect(screen.getByText('Transparency Pre-Screening')).toBeInTheDocument()
  })

  it('renders header', () => {
    render(<TransparencyPage />)
    expect(screen.getByTestId('mock-header')).toBeInTheDocument()
  })

  it('renders TI Ukraine partnership section', () => {
    render(<TransparencyPage />)
    expect(screen.getByText('Transparency International Ukraine')).toBeInTheDocument()
  })

  it('renders pre-screening thresholds', () => {
    render(<TransparencyPage />)
    expect(screen.getByText('75+')).toBeInTheDocument()
    expect(screen.getByText('50-74')).toBeInTheDocument()
  })

  it('renders assessment areas', () => {
    render(<TransparencyPage />)
    expect(screen.getByText('Assessment Areas')).toBeInTheDocument()
    expect(screen.getByText('Openness')).toBeInTheDocument()
    expect(screen.getByText('Budget')).toBeInTheDocument()
  })

  it('renders top transparent cities', () => {
    render(<TransparencyPage />)
    expect(screen.getByText('Top Transparent Cities')).toBeInTheDocument()
  })

  it('renders additional due diligence section', () => {
    render(<TransparencyPage />)
    expect(screen.getByText('Additional Due Diligence')).toBeInTheDocument()
    expect(screen.getByText('NGO Partner Verification')).toBeInTheDocument()
    expect(screen.getByText('OFAC Screening')).toBeInTheDocument()
  })

  it('renders policy links', () => {
    render(<TransparencyPage />)
    expect(screen.getByText('Terms')).toBeInTheDocument()
    expect(screen.getByText('Privacy')).toBeInTheDocument()
    expect(screen.getByText('Sanctions Policy')).toBeInTheDocument()
  })

  it('renders CTA section', () => {
    render(<TransparencyPage />)
    expect(screen.getByText('Browse Projects')).toBeInTheDocument()
    expect(screen.getByText('Learn About Us')).toBeInTheDocument()
  })
})
