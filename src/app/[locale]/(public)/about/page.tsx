'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'


const team = [
  { nameKey: 'about.teamTomName', roleKey: 'about.teamTomRole', bioKey: 'about.teamTomBio', initials: 'TP', photo: '/team/tom-navy.jpeg' },
  { nameKey: 'about.teamKostiaName', roleKey: 'about.teamKostiaRole', bioKey: 'about.teamKostiaBio', initials: 'KK', photo: '/team/kostia-navy.jpeg' },
  { nameKey: 'about.teamSloanName', roleKey: 'about.teamSloanRole', bioKey: 'about.teamSloanBio', initials: 'SA', photo: '/team/sloan-navy.jpeg' },
]

const partners = [
  { name: 'Ecoaction', logo: '/partners/EcoactionLogo.png', url: 'https://en.ecoaction.org.ua/', descKey: 'about.partnerEcoactionDesc' },
  { name: 'Ecoclub', logo: '/partners/EcoclubLogo.png', url: 'https://ecoclubrivne.org/en/', descKey: 'about.partnerEcoclubDesc' },
  { name: 'RePower Ukraine', logo: '/partners/RePowerUkraineLogo.png', url: 'https://repowerua.org/', descKey: 'about.partnerRePowerDesc' },
  { name: 'Greenpeace', logo: '/partners/greenpeacelogo.png', url: 'https://www.greenpeace.org/ukraine/en/', descKey: 'about.partnerGreenpeaceDesc' },
  { name: 'Energy Act For Ukraine', logo: '/partners/energyactukrainelogo.png', url: 'https://www.energyactua.com/', descKey: 'about.partnerEnergyActDesc' },
]

export default function AboutPage() {
  const t = useTranslations()

  return (
    <div className="min-h-screen bg-[var(--cream-100)] flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-12">
        {/* Mission */}
        <h1 className="font-logo text-4xl font-semibold tracking-tight text-[var(--navy-700)] mb-4 text-center">
          {t('about.title')}
        </h1>
        <p className="text-xl leading-relaxed text-[var(--navy-500)] mb-8 text-center max-w-2xl mx-auto">
          {t('about.mission')}
        </p>

        {/* Statement of Purpose */}
        <section className="mb-16">
          <h2 className="font-logo text-2xl font-semibold tracking-tight text-[var(--navy-700)] mb-4 text-center">
            {t('about.statementOfPurpose')}
          </h2>
          <blockquote className="text-lg leading-relaxed text-[var(--navy-600)] italic text-center border-l-4 border-r-4 border-[var(--ukraine-500)] px-6 py-2 mx-auto max-w-2xl">
            {t('about.statementOfPurposeText')}
          </blockquote>
        </section>

        <hr className="border-[var(--cream-300)] mb-16 w-24 mx-auto" />

        {/* Team */}
        <section className="mb-16">
          <h2 className="font-logo text-2xl font-semibold tracking-tight text-[var(--navy-700)] mb-8 text-center">
            {t('about.teamTitle')}
          </h2>
          <div className="space-y-10 max-w-2xl mx-auto">
            {team.map((member) => (
              <div key={member.initials} className="flex items-start gap-5">
                {member.photo ? (
                  <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0">
                    <img
                      src={member.photo}
                      alt={member.initials}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[var(--navy-100)] flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-semibold text-[var(--navy-600)]">{member.initials}</span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-[var(--navy-700)] text-lg leading-tight">{t(member.nameKey)}</h3>
                  <p className="text-sm text-[var(--ukraine-blue)] font-medium mb-1.5">{t(member.roleKey)}</p>
                  <p className="text-sm text-[var(--navy-500)] leading-relaxed">{t(member.bioKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <hr className="border-[var(--cream-300)] mb-16 w-24 mx-auto" />

        {/* Fiscal Sponsor */}
        <section className="mb-16">
          <h2 className="font-logo text-2xl font-semibold tracking-tight text-[var(--navy-700)] mb-4 text-center">
            {t('about.fiscalSponsorTitle')}
          </h2>
          <p className="text-base leading-relaxed text-[var(--navy-600)] mb-6 text-center max-w-2xl mx-auto">
            {t('about.fiscalSponsorIntro')}
          </p>

          <div className="flex justify-center mb-6">
            <a href="https://www.pocacito.org/" target="_blank" rel="noopener noreferrer">
              <img
                src="/partners/pocacitologo.png"
                alt="POCACITO Network"
                className="h-12 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
              />
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {[
              { key: 'about.fiscalSponsorEin' },
              { key: 'about.fiscalSponsorZeroFee' },
              { key: 'about.fiscalSponsorTaxDeductible' },
            ].map((item) => (
              <span
                key={item.key}
                className="inline-flex items-center px-4 py-2 bg-white rounded-full border border-[var(--cream-200)] text-sm text-[var(--navy-600)] font-medium"
              >
                {t(item.key)}
              </span>
            ))}
            <a
              href="https://app.candid.org/profile/16026326/pocacito-network/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white rounded-full border border-[var(--cream-200)] text-sm text-[var(--navy-600)] font-medium hover:border-[var(--ukraine-blue)] transition-colors"
            >
              <img src="/partners/candidseal.png" alt="Candid Platinum Seal" className="w-5 h-5 object-contain" />
              {t('about.fiscalSponsorCandid')}
            </a>
          </div>
        </section>

        <hr className="border-[var(--cream-300)] mb-16 w-24 mx-auto" />

        {/* Partners */}
        <section className="mb-16">
          <h2 className="font-logo text-2xl font-semibold tracking-tight text-[var(--navy-700)] mb-3 text-center">
            {t('about.ourPartners')}
          </h2>
          <p className="text-base leading-relaxed text-[var(--navy-600)] mb-6 text-center max-w-2xl mx-auto">
            {t('about.ourPartnersText')}
          </p>
          <div className="space-y-6 max-w-2xl mx-auto">
            {partners.map((partner) => (
              <a
                key={partner.name}
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 group"
              >
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="h-10 w-20 object-contain flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
                />
                <div>
                  <h4 className="font-semibold text-[var(--navy-700)] text-sm group-hover:text-[var(--ukraine-blue)] transition-colors">{partner.name}</h4>
                  <p className="text-sm text-[var(--navy-500)] leading-relaxed">{t(partner.descKey)}</p>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* CTA Buttons */}
        <div className="mt-12 flex justify-center gap-4">
          <Link href="/projects">
            <Button variant="primary">
              {t('about.browseProjects')}
            </Button>
          </Link>
          <Link href="/submit-project">
            <Button variant="primary">
              {t('nav.submitProject')}
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
