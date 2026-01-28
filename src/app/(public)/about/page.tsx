'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--cream-50)]">
      {/* Header */}
      <header className="bg-[var(--cream-100)] border-b border-[var(--cream-300)] shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-[var(--navy-700)]">
            hromada <span className="opacity-60">|</span> громада
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              &larr; Back to Projects
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-[var(--navy-700)] mb-6">
          About Hromada
        </h1>

        <div className="prose prose-lg text-[var(--navy-600)] space-y-6">
          <p className="text-xl text-[var(--navy-500)]">
            Hromada connects American donors with Ukrainian communities in need of infrastructure support.
          </p>

          <section className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)]">
            <h2 className="text-2xl font-semibold text-[var(--navy-700)] mb-4">
              Our Mission
            </h2>
            <p>
              The word "hromada" (громада) means "community" in Ukrainian. Our platform serves as a bridge
              between Ukrainian municipalities seeking support for critical infrastructure projects and
              donors who want to make a direct, meaningful impact.
            </p>
          </section>

          <section className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)]">
            <h2 className="text-2xl font-semibold text-[var(--navy-700)] mb-4">
              How It Works
            </h2>
            <ul className="space-y-3">
              <li>
                <strong>For Municipalities:</strong> Ukrainian community leaders submit their infrastructure
                projects through our platform. Each project is reviewed before being published.
              </li>
              <li>
                <strong>For Donors:</strong> Browse verified projects, filter by category, urgency, or
                location, and connect directly with communities to provide support.
              </li>
              <li>
                <strong>Direct Connection:</strong> We facilitate introductions but do not process payments.
                Donors work directly with municipalities to ensure transparency and accountability.
              </li>
            </ul>
          </section>

          <section className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)]">
            <h2 className="text-2xl font-semibold text-[var(--navy-700)] mb-4">
              Project Categories
            </h2>
            <ul className="space-y-2">
              <li><strong>Hospitals & Medical Facilities</strong> - Healthcare infrastructure and equipment</li>
              <li><strong>Schools & Education</strong> - Educational facilities and resources</li>
              <li><strong>Water Utilities</strong> - Clean water and sanitation systems</li>
              <li><strong>Energy Infrastructure</strong> - Solar panels, heat pumps, and power systems</li>
              <li><strong>Other Infrastructure</strong> - Community buildings and essential services</li>
            </ul>
          </section>

          <section className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)]">
            <h2 className="text-2xl font-semibold text-[var(--navy-700)] mb-4">
              Contact Us
            </h2>
            <p>
              Questions or feedback? Reach out to us at{' '}
              <a href="mailto:support@hromada.org" className="text-[var(--navy-700)] underline">
                support@hromada.org
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 flex gap-4">
          <Link href="/">
            <Button variant="primary" className="bg-[var(--navy-700)] hover:bg-[var(--navy-800)]">
              Browse Projects
            </Button>
          </Link>
          <Link href="/submit-project">
            <Button variant="outline">
              Submit a Project
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-[var(--cream-300)] bg-[var(--cream-100)]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs text-[var(--navy-600)]">
            <span className="font-medium">hromada</span> connects American donors with Ukrainian communities.
          </p>
        </div>
      </footer>
    </div>
  )
}
