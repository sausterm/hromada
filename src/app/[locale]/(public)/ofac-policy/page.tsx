'use client'

import { Header } from '@/components/layout/Header'

export default function OFACPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--cream-100)] flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-16">
        <h1 className="font-logo text-3xl font-semibold tracking-tight text-[var(--navy-700)] mb-2">
          OFAC Sanctions Compliance Policy
        </h1>
        <p className="text-sm text-[var(--navy-400)] mb-10">
          Hromada — A Project of POCACITO Network · Version 1.0
        </p>

        <div className="space-y-10 text-[var(--navy-600)] text-[15px] leading-relaxed">

          <section className="fade-in-section">
            <h2 className="font-logo text-xl font-semibold tracking-tight text-[var(--navy-700)] mb-3">1. Purpose</h2>
            <p>
              Hromada (&ldquo;the Project&rdquo;) is committed to full compliance with all United States sanctions
              laws and regulations administered by the Office of Foreign Assets Control (&ldquo;OFAC&rdquo;) of the
              U.S. Department of the Treasury. All funds received by the Project originate from U.S. donors
              through POCACITO Network, a 501(c)(3) tax-exempt organization serving as the Project&rsquo;s fiscal
              sponsor. All international disbursements are subject to the screening and compliance procedures
              set forth in this policy.
            </p>
          </section>

          <section className="fade-in-section">
            <h2 className="font-logo text-xl font-semibold tracking-tight text-[var(--navy-700)] mb-3">2. Responsible Parties</h2>
            <ol className="list-[lower-alpha] pl-5 space-y-1.5 mt-2">
              <li>
                <strong>Project Director — Primary Compliance Officer.</strong> Responsible for conducting
                all pre-disbursement screening, maintaining compliance records, and reporting any concerns
                to the Fiscal Sponsor.
              </li>
              <li>
                <strong>Alternate Project Director — Backup Compliance Officer.</strong> Assumes all
                compliance responsibilities in the event the Project Director is unable to fulfill their duties.
              </li>
              <li>
                <strong>POCACITO Network, Fiscal Sponsor.</strong> Reviews and approves all disbursements
                pursuant to the Fiscal Sponsorship Agreement. Retains authority to suspend any disbursement
                pending resolution of compliance concerns.
              </li>
            </ol>
          </section>

          <section className="fade-in-section">
            <h2 className="font-logo text-xl font-semibold tracking-tight text-[var(--navy-700)] mb-3">3. Pre-Disbursement Screening</h2>
            <p>Prior to any international disbursement, the Compliance Officer shall:</p>
            <ol className="list-[lower-alpha] pl-5 space-y-1.5 mt-2">
              <li>
                Screen the recipient municipality name, in both English and Ukrainian transliteration,
                against the OFAC Consolidated Sanctions List;
              </li>
              <li>
                Screen the full legal name of the municipality&rsquo;s signing official (mayor, administrator,
                or authorized representative) against the OFAC Consolidated Sanctions List;
              </li>
              <li>
                Screen the name of any contractor, vendor, or third-party recipient receiving more than
                $2,500 in Project funds against the OFAC Consolidated Sanctions List;
              </li>
              <li>
                Conduct screening using OFAC&rsquo;s Sanctions List Search tool or an equivalent screening
                service approved by the Fiscal Sponsor;
              </li>
              <li>
                Document all screening results, including date of screening, names screened, and search
                results, and retain documentation in the Project&rsquo;s compliance file for a minimum of
                five (5) years from the date of the transaction.
              </li>
            </ol>
          </section>

          <section className="fade-in-section">
            <h2 className="font-logo text-xl font-semibold tracking-tight text-[var(--navy-700)] mb-3">4. Prohibited Transactions</h2>
            <p>No Project funds shall be disbursed, directly or indirectly, to:</p>
            <ol className="list-[lower-alpha] pl-5 space-y-1.5 mt-2">
              <li>
                Any individual or entity appearing on the Specially Designated Nationals and Blocked
                Persons List (SDN List) or any other OFAC sanctions list;
              </li>
              <li>
                Any individual or entity located in, organized under the laws of, or ordinarily resident
                in the Crimean Peninsula, the so-called Donetsk People&rsquo;s Republic, or the so-called
                Luhansk People&rsquo;s Republic;
              </li>
              <li>
                Any transaction routed through or involving a financial institution identified on the
                Sectoral Sanctions Identifications List (SSI List) or otherwise blocked under U.S. sanctions;
              </li>
              <li>
                Any transaction that would otherwise violate Executive Orders 13660, 13661, 13662, 13685,
                or any subsequent executive orders imposing sanctions related to the Russian Federation or Ukraine.
              </li>
            </ol>
          </section>

          <section className="fade-in-section">
            <h2 className="font-logo text-xl font-semibold tracking-tight text-[var(--navy-700)] mb-3">5. Name-Match Procedures</h2>
            <p>In the event that sanctions screening returns a potential match:</p>
            <ol className="list-[lower-alpha] pl-5 space-y-1.5 mt-2">
              <li>
                The Compliance Officer shall immediately halt the disbursement and shall not proceed
                with the transaction;
              </li>
              <li>
                The Compliance Officer shall investigate whether the match is a false positive by comparing
                available identifying information, including but not limited to dates of birth, addresses,
                identification numbers, and nationality;
              </li>
              <li>
                If the Compliance Officer determines, with supporting documentation, that the match is a
                false positive, the disbursement may proceed. The false-positive determination and supporting
                evidence shall be documented and retained for five (5) years;
              </li>
              <li>
                If the match cannot be conclusively resolved as a false positive, the Compliance Officer
                shall notify POCACITO Network&rsquo;s designated representative within twenty-four (24) hours;
              </li>
              <li>
                No disbursement shall proceed until the Fiscal Sponsor provides written clearance or the
                potential match is otherwise resolved.
              </li>
            </ol>
          </section>

          <section className="fade-in-section">
            <h2 className="font-logo text-xl font-semibold tracking-tight text-[var(--navy-700)] mb-3">6. Ongoing Monitoring</h2>
            <ol className="list-[lower-alpha] pl-5 space-y-1.5 mt-2">
              <li>
                The Compliance Officer shall re-screen all active recipient municipalities and their
                current signing officials on a quarterly basis, or more frequently if circumstances warrant;
              </li>
              <li>
                Re-screening shall be conducted promptly upon learning of any change in municipal leadership,
                project contractors, or other material changes to a recipient&rsquo;s personnel or organizational
                structure;
              </li>
              <li>
                The Compliance Officer shall monitor OFAC announcements and Federal Register notices for new
                or amended sanctions designations related to the Russian Federation, Ukraine, or any other
                jurisdiction relevant to the Project&rsquo;s operations.
              </li>
            </ol>
          </section>

          <section className="fade-in-section">
            <h2 className="font-logo text-xl font-semibold tracking-tight text-[var(--navy-700)] mb-3">7. Due Diligence on Municipalities</h2>
            <p>Prior to onboarding any new municipality to the Hromada platform, the Compliance Officer shall:</p>
            <ol className="list-[lower-alpha] pl-5 space-y-1.5 mt-2">
              <li>
                Verify that the municipality is located in territory under the effective control of the
                Government of Ukraine;
              </li>
              <li>
                Obtain and verify the full legal name and title of the municipality&rsquo;s signing official;
              </li>
              <li>
                Confirm that the municipality is a recognized local government entity and not a private
                organization, shell entity, or front;
              </li>
              <li>
                Obtain a brief written description of the intended use of funds, confirming the project
                involves civilian infrastructure;
              </li>
              <li>
                Document all verification steps and retain records for a minimum of five (5) years.
              </li>
            </ol>
          </section>

          <section className="fade-in-section">
            <h2 className="font-logo text-xl font-semibold tracking-tight text-[var(--navy-700)] mb-3">8. Record Retention</h2>
            <p>
              All compliance records, including but not limited to screening results, due diligence
              documentation, false-positive determinations, disbursement approvals, compliance correspondence,
              and incident reports, shall be retained for a minimum of five (5) years from the date of the
              relevant transaction or event. Records shall be organized by recipient municipality and made
              available to the Fiscal Sponsor upon request.
            </p>
          </section>

          <section className="fade-in-section">
            <h2 className="font-logo text-xl font-semibold tracking-tight text-[var(--navy-700)] mb-3">9. Training</h2>
            <ol className="list-[lower-alpha] pl-5 space-y-1.5 mt-2">
              <li>
                Any individual with authority to initiate, approve, or process disbursements on behalf of
                the Project shall review this policy in full prior to assuming such authority;
              </li>
              <li>
                All individuals subject to this policy shall acknowledge in writing, on an annual basis,
                that they have read, understand, and agree to comply with this policy;
              </li>
              <li>
                The Compliance Officer shall maintain records of all training acknowledgments.
              </li>
            </ol>
          </section>

          <section className="fade-in-section">
            <h2 className="font-logo text-xl font-semibold tracking-tight text-[var(--navy-700)] mb-3">10. Reporting and Voluntary Self-Disclosure</h2>
            <p>
              In the event that the Project becomes aware of any potential sanctions violation or compliance breach:
            </p>
            <ol className="list-[lower-alpha] pl-5 space-y-1.5 mt-2">
              <li>
                The Compliance Officer shall immediately halt the relevant transaction and take steps to
                prevent further exposure;
              </li>
              <li>
                The Compliance Officer shall notify POCACITO Network&rsquo;s designated representative
                within twenty-four (24) hours of becoming aware of the potential violation;
              </li>
              <li>
                The Project Director and Fiscal Sponsor shall jointly assess whether a voluntary
                self-disclosure to OFAC is warranted. Voluntary self-disclosure is strongly encouraged,
                as it is considered a significant mitigating factor in any OFAC enforcement action;
              </li>
              <li>
                The Project shall cooperate fully with any investigation by OFAC, the Fiscal Sponsor,
                or other relevant authorities;
              </li>
              <li>
                The Compliance Officer shall document all actions taken in response to the potential
                violation and retain such records indefinitely.
              </li>
            </ol>
          </section>

          <section className="fade-in-section">
            <h2 className="font-logo text-xl font-semibold tracking-tight text-[var(--navy-700)] mb-3">11. Policy Review and Amendments</h2>
            <p>
              This policy shall be reviewed at least annually by the Project Director and updated as necessary
              to reflect changes in applicable law, OFAC guidance, the Project&rsquo;s operations, or the
              Fiscal Sponsor&rsquo;s requirements. Any material amendments shall be provided to the Fiscal
              Sponsor in writing within thirty (30) days of adoption.
            </p>
          </section>

        </div>
      </main>
    </div>
  )
}
