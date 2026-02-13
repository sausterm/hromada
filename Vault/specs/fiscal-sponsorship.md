---
title: "Fiscal Sponsorship Agreement"
created: "2026-02-12"
status: In Progress
owner: "@sloan @tom"
---

# Fiscal Sponsorship Agreement (FSA)

## Summary

Formalize the legal relationship between Hromada and POCACITO Network so that donor funds can be received, managed, and disbursed to Ukrainian municipalities. This is the **single biggest blocker** to launching the platform.

## Motivation

Without a signed FSA:
- We cannot publish real bank details on the site
- Donors cannot make tax-deductible contributions
- We have no legal authority to accept or disburse funds
- The platform is effectively a demo

## Current State

- **POCACITO Network** has verbally agreed to serve as fiscal sponsor at **0% fee**
- Tom has relationships with half the POCACITO board — they are actively helping
- POCACITO is a 501(c)(3) with EIN 99-0392258 and Candid Platinum Seal
- No written agreement exists yet

## What is a Fiscal Sponsorship Agreement?

An FSA is a legal contract between a fiscal sponsor (POCACITO Network) and a sponsored project (Hromada) that defines:

1. **Who holds the money** — POCACITO receives and holds all donations
2. **Who controls the project** — Hromada team directs project activities
3. **How funds are disbursed** — Process for releasing funds to Ukrainian municipalities
4. **What fees are charged** — 0% in our case (unusual and generous)
5. **Tax-deductibility** — Donations are tax-deductible because POCACITO is the 501(c)(3)
6. **Liability and insurance** — Who is liable for what
7. **Termination** — How either party can end the relationship

### Model A vs Model C

| | Model A (Comprehensive) | Model C (Pre-Approved Grant) |
|---|---|---|
| **Control** | Sponsor has legal control of project | Project has more independence |
| **Employment** | Sponsor may employ project staff | Project handles own staffing |
| **Liability** | Sponsor assumes more liability | Project assumes more liability |
| **Overhead** | Higher sponsor involvement | Lower sponsor involvement |
| **Common for** | New projects, high-risk work | Established projects, lower risk |
| **Our fit** | Less likely — POCACITO wants light touch | **More likely** — POCACITO at 0% fee suggests minimal involvement |

**Recommendation:** Model C (Pre-Approved Grant) is likely the right fit. POCACITO receives donations on Hromada's behalf, then grants the funds to Hromada for disbursement. POCACITO's role is primarily as the tax-deductible entity, not as an operational overseer.

---

## Process

### Phase 1: Research (In Progress)

- [ ] Research FSA templates and standard language #p0 @sloan
  - National Council of Nonprofits templates
  - Fiscal Sponsor Directory examples
  - Model C templates from established sponsors
- [ ] Determine Model A vs Model C (likely Model C) #p0 @sloan @tom
- [ ] Identify key terms specific to international disbursement (Ukraine) #p0 @sloan
- [ ] Research compliance requirements for sending funds to Ukraine (OFAC, sanctions) #p0 @sloan

### Phase 2: Drafting

- [ ] Draft FSA using template + Hromada-specific terms #p0 @sloan @tom
  - Fee structure: 0%
  - Fund disbursement process
  - Reporting requirements
  - Intellectual property ownership
  - Termination clause
  - International wire transfer provisions
- [ ] Internal review — Sloan and Tom align on all terms #p0 @sloan @tom

### Phase 3: POCACITO Review

- [ ] Present draft to POCACITO board #p0 @tom
- [ ] Incorporate POCACITO feedback #p0 @sloan @tom
- [ ] Align on any contested terms #p0 @tom

### Phase 4: Legal Review

- [ ] Attorney review of final draft #p0 @tom
- [ ] Address attorney feedback #p0 @sloan @tom
- [ ] Final version prepared for signatures #p0 @sloan

### Phase 5: Execution

- [ ] Both parties sign FSA #p0 @tom
- [ ] Obtain bank details from POCACITO (routing, account, SWIFT) #p0 @sloan
- [ ] Update platform with real bank details #p0 @sloan
- [ ] Update legal pages (Terms, Privacy) to reflect FSA terms #p1 @sloan
- [ ] File FSA for records #p1 @tom

---

## Key Terms to Define

### Fund Flow
```
Donor → POCACITO bank account (Bank of America)
    → POCACITO holds funds
    → Hromada requests disbursement for specific project
    → POCACITO approves and releases funds
    → Wire transfer to Ukrainian municipal bank account (via Wise or bank wire)
    → Hromada reports back to POCACITO on fund usage
```

### Reporting Requirements
- How often does Hromada report to POCACITO? (Quarterly? Per-disbursement?)
- What documentation is required for each disbursement request?
- Does POCACITO need to approve each individual transfer?
- What happens if a Ukrainian municipality doesn't use funds as intended?

### International Transfer Provisions
- OFAC compliance — Ukraine is not sanctioned, but due diligence is required
- Anti-money-laundering (AML) considerations
- Documentation trail for each international transfer
- Currency conversion handling (USD → UAH)
- Who bears transfer fees? (Currently shown to donors as Wise vs bank wire comparison)

### Intellectual Property
- Hromada retains all IP (code, design, brand)
- POCACITO has no claim to platform IP
- Hromada uses POCACITO name/EIN with permission for fundraising purposes

### Termination
- Either party can terminate with X days notice
- Upon termination, remaining funds are handled how?
- Hromada would need to find a new fiscal sponsor or become its own 501(c)(3)

---

## Compliance Considerations

### Tax-Deductibility Language
- Donations are tax-deductible "to the fullest extent allowed by law"
- POCACITO EIN (99-0392258) must appear on all receipts
- Donor receipts must state: "No goods or services were provided in exchange for this contribution"
- Need to verify exact language with attorney

### OFAC / Sanctions
- Ukraine is NOT on the OFAC sanctions list
- However, certain regions (Crimea, Donetsk, Luhansk) may have restrictions
- We should have a policy for which municipalities we can work with
- Consider adding OFAC screening to disbursement process

### State Registration
- Some states require registration for charitable solicitation
- POCACITO may already have registrations — need to confirm
- Key states: NY, CA, FL, IL (highest donor populations)

---

## Timeline Estimate

| Phase | Duration | Target |
|-------|----------|--------|
| Research | 1 week | Feb 17 |
| Drafting | 1 week | Feb 24 |
| POCACITO Review | 1–2 weeks | Mar 10 |
| Legal Review | 1–2 weeks | Mar 24 |
| Execution | 1 week | Mar 31 |

**Best case:** FSA signed by end of March 2026
**Realistic case:** FSA signed by mid-April 2026
**Worst case:** If significant legal issues arise, May 2026

> The platform can be fully code-complete before the FSA is signed. The only thing blocked is publishing real bank details and going live.

---

## Open Questions

- Has POCACITO done a fiscal sponsorship before? (If so, they may have a template)
- Does POCACITO have an attorney they work with, or do we need to find one?
- What is POCACITO's process for approving disbursements?
- Does POCACITO have existing state charitable solicitation registrations?
- Are there any POCACITO board members who might have concerns about the arrangement?
- What insurance does POCACITO carry, and does it cover Hromada's activities?
- Who at POCACITO is the operational contact for day-to-day fund management?

## Related

- Decision: [[decisions/002-payment-architecture]]
- Spec: [[specs/payment-processing]]
- Spec: [[specs/launch-readiness]]
- Sprint: [[current-sprint]]
