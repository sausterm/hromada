'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'

// Top 10 Transparent Cities from 2024 ranking
const TRANSPARENT_CITIES = [
  { name: 'Chernivtsi', nameUk: 'Чернівці', score: 84.5, status: 'transparent' },
  { name: 'Vinnytsia', nameUk: 'Вінниця', score: 81.0, status: 'transparent' },
  { name: 'Lutsk', nameUk: 'Луцьк', score: 76.0, status: 'transparent' },
  { name: 'Lviv', nameUk: 'Львів', score: 75.0, status: 'transparent' },
  { name: 'Mukachevo', nameUk: 'Мукачево', score: 75.0, status: 'transparent' },
  { name: 'Bila Tserkva', nameUk: 'Біла Церква', score: 69.0, status: 'partial' },
  { name: 'Mykolaiv', nameUk: 'Миколаїв', score: 68.0, status: 'partial' },
  { name: 'Kropyvnytskyi', nameUk: 'Кропивницький', score: 67.5, status: 'partial' },
  { name: 'Drohobych', nameUk: 'Дрогобич', score: 66.0, status: 'partial' },
  { name: 'Khmelnytskyi', nameUk: 'Хмельницький', score: 64.5, status: 'partial' },
]

const ASSESSMENT_AREAS = [
  { key: 'openness', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
  { key: 'budget', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'property', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { key: 'publicRelations', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { key: 'personnel', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { key: 'services', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { key: 'warResponse', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
]

export default function TransparencyPage() {
  const t = useTranslations()

  return (
    <div className="min-h-screen bg-[var(--cream-100)] flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="font-logo text-2xl sm:text-4xl font-semibold tracking-tight text-[var(--navy-700)] mb-3 sm:mb-4">
            {t('prescreening.title')}
          </h1>
          <p className="text-base sm:text-xl text-[var(--navy-500)] max-w-2xl mx-auto">
            {t('prescreening.subtitle')}
          </p>
        </div>

        {/* TI Ukraine Partnership Banner */}
        <div className="bg-white rounded-xl border border-[var(--cream-300)] p-4 sm:p-6 mb-8 sm:mb-10 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-[var(--ukraine-100)] rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--ukraine-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-base sm:text-lg text-[var(--navy-700)] mb-1">
                {t('prescreening.tiPartnership')}
              </h2>
              <p className="text-[var(--navy-600)] text-sm leading-relaxed mb-3">
                {t('prescreening.tiPartnershipDesc')}
              </p>
              <a
                href="https://transparentcities.in.ua/en/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ukraine-600)] hover:text-[var(--ukraine-700)] transition-colors"
              >
                {t('prescreening.visitTransparentCities')}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Pre-screening Criteria Section */}
        <section className="mb-8 sm:mb-12">
          <h2 className="font-logo text-xl sm:text-2xl font-semibold text-[var(--navy-700)] mb-4 sm:mb-6 text-center">
            {t('prescreening.criteriaTitle')}
          </h2>

          {/* Thresholds */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-green-50 border border-green-200 rounded-lg sm:rounded-xl p-3 sm:p-5 text-center">
              <div className="text-xl sm:text-3xl font-bold text-green-700 mb-0.5 sm:mb-1">75+</div>
              <div className="text-xs sm:text-sm font-medium text-green-800">{t('prescreening.thresholds.transparent')}</div>
              <div className="hidden sm:block text-xs text-green-600 mt-1">{t('prescreening.thresholds.transparentDesc')}</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg sm:rounded-xl p-3 sm:p-5 text-center">
              <div className="text-xl sm:text-3xl font-bold text-yellow-700 mb-0.5 sm:mb-1">50-74</div>
              <div className="text-xs sm:text-sm font-medium text-yellow-800">{t('prescreening.thresholds.partial')}</div>
              <div className="hidden sm:block text-xs text-yellow-600 mt-1">{t('prescreening.thresholds.partialDesc')}</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg sm:rounded-xl p-3 sm:p-5 text-center">
              <div className="text-xl sm:text-3xl font-bold text-red-700 mb-0.5 sm:mb-1">&lt;50</div>
              <div className="text-xs sm:text-sm font-medium text-red-800">{t('prescreening.thresholds.nonTransparent')}</div>
              <div className="hidden sm:block text-xs text-red-600 mt-1">{t('prescreening.thresholds.nonTransparentDesc')}</div>
            </div>
          </div>

          {/* Our Policy */}
          <div className="bg-[var(--navy-50)] border border-[var(--navy-200)] rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
            <h3 className="font-semibold text-[var(--navy-700)] mb-3 flex items-center gap-2 text-sm sm:text-base">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--navy-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('prescreening.ourPolicyTitle')}
            </h3>
            <ul className="space-y-2 text-[var(--navy-600)] text-xs sm:text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5 flex-shrink-0">✓</span>
                <span>{t('prescreening.policy1')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5 flex-shrink-0">✓</span>
                <span>{t('prescreening.policy2')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5 flex-shrink-0">✓</span>
                <span>{t('prescreening.policy3')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-0.5 flex-shrink-0">◐</span>
                <span>{t('prescreening.policy4')}</span>
              </li>
            </ul>
          </div>
        </section>

        {/* 7 Assessment Areas */}
        <section className="mb-8 sm:mb-12">
          <h2 className="font-logo text-xl sm:text-2xl font-semibold text-[var(--navy-700)] mb-2 text-center">
            {t('prescreening.areasTitle')}
          </h2>
          <p className="text-[var(--navy-500)] text-center mb-4 sm:mb-6 text-xs sm:text-sm">
            {t('prescreening.areasSubtitle')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {ASSESSMENT_AREAS.map((area) => (
              <div
                key={area.key}
                className="bg-white border border-[var(--cream-300)] rounded-lg p-3 sm:p-4 hover:border-[var(--navy-300)] transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[var(--cream-200)] rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--navy-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={area.icon} />
                    </svg>
                  </div>
                  <h3 className="font-medium text-[var(--navy-700)] text-xs sm:text-sm">
                    {t(`prescreening.areas.${area.key}.title`)}
                  </h3>
                </div>
                <p className="text-xs text-[var(--navy-500)] leading-relaxed">
                  {t(`prescreening.areas.${area.key}.desc`)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Top Transparent Cities */}
        <section className="mb-8 sm:mb-12">
          <h2 className="font-logo text-xl sm:text-2xl font-semibold text-[var(--navy-700)] mb-2 text-center">
            {t('prescreening.topCitiesTitle')}
          </h2>
          <p className="text-[var(--navy-500)] text-center mb-4 sm:mb-6 text-xs sm:text-sm">
            {t('prescreening.topCitiesSubtitle')}
          </p>

          {/* Mobile: Card layout */}
          <div className="sm:hidden space-y-2">
            {TRANSPARENT_CITIES.map((city, index) => (
              <div key={city.name} className="bg-white border border-[var(--cream-300)] rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[var(--navy-400)] w-5">{index + 1}</span>
                  <div>
                    <div className="font-medium text-[var(--navy-700)] text-sm">{city.name}</div>
                    <div className="text-[var(--navy-400)] text-xs">{city.nameUk}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--navy-700)] text-sm">{city.score}</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      city.status === 'transparent'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {city.status === 'transparent' ? '✓' : '◐'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table layout */}
          <div className="hidden sm:block bg-white border border-[var(--cream-300)] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--cream-100)] border-b border-[var(--cream-300)]">
                    <th className="text-left py-3 px-4 font-medium text-[var(--navy-600)]">{t('prescreening.tableRank')}</th>
                    <th className="text-left py-3 px-4 font-medium text-[var(--navy-600)]">{t('prescreening.tableCity')}</th>
                    <th className="text-center py-3 px-4 font-medium text-[var(--navy-600)]">{t('prescreening.tableScore')}</th>
                    <th className="text-center py-3 px-4 font-medium text-[var(--navy-600)]">{t('prescreening.tableStatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {TRANSPARENT_CITIES.map((city, index) => (
                    <tr key={city.name} className="border-b border-[var(--cream-200)] last:border-0 hover:bg-[var(--cream-50)]">
                      <td className="py-3 px-4 text-[var(--navy-500)]">{index + 1}</td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-[var(--navy-700)]">{city.name}</span>
                        <span className="text-[var(--navy-400)] ml-1.5 text-xs">({city.nameUk})</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-semibold text-[var(--navy-700)]">{city.score}</span>
                        <span className="text-[var(--navy-400)]">/100</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            city.status === 'transparent'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {city.status === 'transparent' ? t('prescreening.statusTransparent') : t('prescreening.statusPartial')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-[var(--cream-50)] border-t border-[var(--cream-200)] text-xs text-[var(--navy-500)]">
              {t('prescreening.dataSource')}
            </div>
          </div>
          {/* Mobile data source */}
          <div className="sm:hidden mt-3 text-xs text-[var(--navy-500)] text-center">
            {t('prescreening.dataSource')}
          </div>
        </section>

        {/* Additional Due Diligence */}
        <section className="mb-8 sm:mb-12">
          <h2 className="font-logo text-xl sm:text-2xl font-semibold text-[var(--navy-700)] mb-4 sm:mb-6 text-center">
            {t('prescreening.additionalDDTitle')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white border border-[var(--cream-300)] rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[var(--ukraine-100)] rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--ukraine-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-[var(--navy-700)] text-sm sm:text-base">{t('prescreening.ngoPartnerTitle')}</h3>
              </div>
              <p className="text-xs sm:text-sm text-[var(--navy-600)]">{t('prescreening.ngoPartnerDesc')}</p>
            </div>

            <div className="bg-white border border-[var(--cream-300)] rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[var(--ukraine-100)] rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--ukraine-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-[var(--navy-700)] text-sm sm:text-base">{t('prescreening.documentationTitle')}</h3>
              </div>
              <p className="text-xs sm:text-sm text-[var(--navy-600)]">{t('prescreening.documentationDesc')}</p>
            </div>

            <div className="bg-white border border-[var(--cream-300)] rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[var(--ukraine-100)] rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--ukraine-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-[var(--navy-700)] text-sm sm:text-base">{t('prescreening.bankingTitle')}</h3>
              </div>
              <p className="text-xs sm:text-sm text-[var(--navy-600)]">{t('prescreening.bankingDesc')}</p>
            </div>

            <div className="bg-white border border-[var(--cream-300)] rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[var(--ukraine-100)] rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--ukraine-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-[var(--navy-700)] text-sm sm:text-base">{t('prescreening.ofacTitle')}</h3>
              </div>
              <p className="text-xs sm:text-sm text-[var(--navy-600)]">{t('prescreening.ofacDesc')}</p>
            </div>
          </div>
        </section>

        {/* Legal & Policies */}
        <section className="mb-8 sm:mb-12">
          <div className="bg-[var(--cream-200)] rounded-xl p-4 sm:p-6">
            <h2 className="font-logo text-lg sm:text-xl font-semibold text-[var(--navy-700)] mb-3 sm:mb-4 text-center">
              {t('prescreening.policiesTitle')}
            </h2>
            <div className="flex flex-col sm:flex-row sm:flex-wrap justify-center gap-2 sm:gap-4">
              <Link
                href="/terms"
                className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 bg-white rounded-lg border border-[var(--cream-300)] hover:border-[var(--navy-300)] hover:shadow-sm transition-all text-[var(--navy-700)] font-medium text-sm"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--navy-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t('footer.terms')}
              </Link>
              <Link
                href="/ofac-policy"
                className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 bg-white rounded-lg border border-[var(--cream-300)] hover:border-[var(--navy-300)] hover:shadow-sm transition-all text-[var(--navy-700)] font-medium text-sm"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--navy-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                {t('prescreening.sanctionsPolicy')}
              </Link>
              <Link
                href="/privacy"
                className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 bg-white rounded-lg border border-[var(--cream-300)] hover:border-[var(--navy-300)] hover:shadow-sm transition-all text-[var(--navy-700)] font-medium text-sm"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--navy-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {t('footer.privacy')}
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <p className="text-[var(--navy-600)] mb-4 text-sm sm:text-base">{t('prescreening.ctaText')}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Link href="/">
              <Button variant="primary" className="w-full sm:w-auto">{t('about.browseProjects')}</Button>
            </Link>
            <Link href="/about">
              <Button variant="secondary" className="w-full sm:w-auto">{t('prescreening.learnAboutUs')}</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
