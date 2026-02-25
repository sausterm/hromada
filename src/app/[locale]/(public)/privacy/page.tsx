'use client'

import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/Header'

export default function PrivacyPage() {
  const t = useTranslations('legal')

  return (
    <div className="min-h-screen bg-[var(--cream-100)] flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-16">
        <h1 className="font-logo text-3xl font-semibold tracking-tight text-[var(--navy-700)] mb-2">
          {t('privacyTitle')}
        </h1>
        <p className="text-sm text-[var(--navy-400)] mb-10">Effective Date: February 23, 2026</p>

        <div className="space-y-10 text-[var(--navy-600)] text-[15px] leading-relaxed">
          <section>
            <h2 className="font-logo text-xl font-semibold tracking-tight text-[var(--navy-700)] mb-3">1. Who We Are</h2>
            <p>
              Hromada is a platform connecting American donors with Ukrainian municipalities for civilian infrastructure rebuilding, with a focus on renewable energy. Hromada operates as a project of POCACITO Network, a 501(c)(3) public charity (EIN 99-0392258) based in Charlottesville, Virginia.
            </p>
            <p className="mt-2">
              For privacy-related inquiries, contact us at{' '}
              <a href="mailto:thomas@hromadaproject.org" className="text-[var(--ukraine-blue)] hover:underline">thomas@hromadaproject.org</a>.
            </p>
          </section>

          <section>
            <h2 className="font-logo text-xl font-semibold tracking-tight text-[var(--navy-700)] mb-3">2. Information We Collect</h2>

            <h3 className="font-semibold text-[var(--navy-700)] mt-4 mb-2">Account Information</h3>
            <p>When you create an account or submit a donation confirmation, we collect your name, email address, and optionally your organization name. Donor accounts are created automatically when you confirm a contribution.</p>

            <h3 className="font-semibold text-[var(--navy-700)] mt-4 mb-2">Donation Information</h3>
            <p>When you confirm a contribution, we record the amount, payment method (wire transfer, DAF grant, check, or ACH), reference number, and the project you are supporting. This information is used to track your donation through our disbursement process and provide you with status updates.</p>

            <h3 className="font-semibold text-[var(--navy-700)] mt-4 mb-2">Contact and Inquiry Forms</h3>
            <p>If you submit a contact form, partnership inquiry, or newsletter signup, we collect the information you provide (name, email, message, and any additional fields on the form).</p>

            <h3 className="font-semibold text-[var(--navy-700)] mt-4 mb-2">Technical Data</h3>
            <p>We collect IP addresses and user agent strings in connection with login attempts, donation submissions, and security events. IP addresses are also checked (but not stored) for geographic access restrictions. We do not use tracking cookies or third-party analytics tools.</p>

            <h3 className="font-semibold text-[var(--navy-700)] mt-4 mb-2">Financial Account Data (Planned)</h3>
            <p>In a future version of the platform, we plan to integrate with Plaid and Wise to automate donation detection and international fund transfers. Plaid will connect to POCACITO Network&apos;s bank account — not to donor bank accounts — to detect incoming wire transfers. Wise will be used to process outbound transfers to Ukrainian municipalities. No donor banking credentials will be collected or stored through these integrations.</p>
          </section>

          <section>
            <h2 className="font-logo text-xl font-semibold tracking-tight text-[var(--navy-700)] mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>To process and track your donations from receipt through disbursement to Ukrainian municipalities</li>
              <li>To create and maintain your donor account and provide access to your donation dashboard</li>
              <li>To send transactional emails (donation confirmations, status updates, password resets)</li>
              <li>To issue tax receipts through our fiscal sponsor, POCACITO Network</li>
              <li>To respond to your inquiries and partnership requests</li>
              <li>To comply with U.S. sanctions laws (OFAC) and anti-money laundering regulations</li>
              <li>To detect and prevent fraud, unauthorized access, and other security threats</li>
              <li>To send newsletter updates if you have subscribed (you may unsubscribe at any time)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-logo text-xl font-semibold tracking-tight text-[var(--navy-700)] mb-3">4. Cookies</h2>
            <p>We use two cookies, both essential for the platform to function:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong>hromada_session</strong> — An encrypted session token that keeps you logged in. Expires after 7 days. HttpOnly, secure, not accessible to JavaScript.</li>
              <li><strong>hromada_site_access</strong> — Verifies that you have entered the site access password (used during beta). Expires after 7 days. HttpOnly, secure.</li>
            </ul>
            <p className="mt-2">We do not use advertising cookies, tracking cookies, or third-party analytics cookies.</p>
          </section>

          <section>
            <h2 className="font-logo text-xl font-semibold tracking-tight text-[var(--navy-700)] mb-3">5. Who We Share Your Information With</h2>

            <h3 className="font-semibold text-[var(--navy-700)] mt-4 mb-2">POCACITO Network (Fiscal Sponsor)</h3>
            <p>As our fiscal sponsor, POCACITO Network receives donor information necessary to issue tax receipts, maintain financial records, and fulfill IRS reporting obligations.</p>

            <h3 className="font-semibold text-[var(--navy-700)] mt-4 mb-2">Service Providers</h3>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong>Supabase</strong> (database and file storage) — Hosts our database and project photo storage on AWS infrastructure.</li>
              <li><strong>Amazon SES</strong> (email delivery) — Processes transactional emails on our behalf. Receives recipient email addresses and email content.</li>
              <li><strong>Sentry</strong> (error monitoring) — Receives technical error data to help us identify and fix bugs. May capture limited session replay data when errors occur.</li>
              <li><strong>AWS Amplify</strong> (hosting) — Hosts the platform. Processes web requests including IP addresses.</li>
            </ul>

            <h3 className="font-semibold text-[var(--navy-700)] mt-4 mb-2">Planned Integrations</h3>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong>Plaid</strong> — Will access POCACITO Network&apos;s bank account transaction data to detect incoming donations. Does not access donor bank accounts.</li>
              <li><strong>Wise</strong> — Will process international wire transfers to Ukrainian municipalities. Receives recipient bank details and transfer amounts.</li>
            </ul>

            <h3 className="font-semibold text-[var(--navy-700)] mt-4 mb-2">We Do Not</h3>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Sell or rent your personal information to anyone</li>
              <li>Share donor information with NGO verification partners (they verify projects, not donors)</li>
              <li>Use your data for advertising or marketing purposes beyond our own newsletter</li>
            </ul>
          </section>

          <section>
            <h2 className="font-logo text-xl font-semibold tracking-tight text-[var(--navy-700)] mb-3">6. Geographic Access Restrictions</h2>
            <p>
              To protect Ukrainian infrastructure data, access to the platform is restricted from certain regions (currently Russia and Belarus). This check uses your IP address as provided by our hosting infrastructure. Blocked access attempts are logged for security monitoring but your IP address is not stored in our database for this purpose.
            </p>
          </section>

          <section>
            <h2 className="font-logo text-xl font-semibold tracking-tight text-[var(--navy-700)] mb-3">7. Data Security</h2>
            <p>We implement the following security measures to protect your information:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Passwords are hashed using bcrypt and never stored in plain text</li>
              <li>Sessions use encrypted JWT tokens with HMAC-SHA256 signing</li>
              <li>All cookies are HttpOnly, secure, and SameSite protected</li>
              <li>Rate limiting on all public endpoints to prevent abuse</li>
              <li>Account lockout after repeated failed login attempts</li>
              <li>Input validation and sanitization to prevent injection attacks</li>
              <li>HTTPS enforced across the entire platform</li>
              <li>Audit logging of all authentication and financial events</li>
            </ul>
          </section>

          <section>
            <h2 className="font-logo text-xl font-semibold tracking-tight text-[var(--navy-700)] mb-3">8. Data Retention</h2>
            <p>
              We retain donation records and financial transaction data indefinitely, as required for tax reporting, audit compliance, and OFAC sanctions record-keeping obligations. Account information is retained for as long as your account is active. Contact form submissions and partnership inquiries are retained until they are resolved. You may request deletion of your account by contacting us, subject to our legal retention obligations.
            </p>
          </section>

          <section>
            <h2 className="font-logo text-xl font-semibold tracking-tight text-[var(--navy-700)] mb-3">9. Your Rights</h2>
            <p>You may:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Request access to the personal data we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your account, subject to legal retention requirements</li>
              <li>Unsubscribe from newsletter communications at any time</li>
              <li>Contact us with any questions or concerns about your data</li>
            </ul>
            <p className="mt-2">
              If you are located in the European Union or Ukraine, you may have additional rights under the General Data Protection Regulation (GDPR) or Ukrainian data protection law. Contact us to exercise these rights.
            </p>
          </section>

          <section>
            <h2 className="font-logo text-xl font-semibold tracking-tight text-[var(--navy-700)] mb-3">10. Children&apos;s Privacy</h2>
            <p>
              The platform is not directed at individuals under the age of 18. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us and we will delete it.
            </p>
          </section>

          <section>
            <h2 className="font-logo text-xl font-semibold tracking-tight text-[var(--navy-700)] mb-3">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Material changes will be posted on this page with an updated effective date. Your continued use of the platform after changes are posted constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="font-logo text-xl font-semibold tracking-tight text-[var(--navy-700)] mb-3">12. Contact</h2>
            <p>
              For questions about this Privacy Policy or your personal data, contact:<br />
              Thomas Protzman<br />
              <a href="mailto:thomas@hromadaproject.org" className="text-[var(--ukraine-blue)] hover:underline">thomas@hromadaproject.org</a>
            </p>
            <p className="mt-2 text-sm text-[var(--navy-400)]">
              Hromada is a project of POCACITO Network, 1004 Fern Ct, Charlottesville, VA 22901.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
