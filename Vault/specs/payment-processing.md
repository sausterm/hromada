---
title: "Payment Processing v2"
created: "2026-02-10"
status: In Progress
owner: "@sloan"
---

# Payment Processing v2

## Summary

Enable donors to contribute directly to Ukrainian infrastructure projects through the Hromada platform. Phase 1 (manual confirmation) is built. Phase 2 adds automated payment detection and outbound transfer tracking.

## Motivation

Hromada currently shows projects but has no integrated giving flow. Donors must navigate externally to make payments. A built-in donation flow increases conversion, enables tracking, and builds donor trust through transparency.

## Current State (Phase 1 — Built)

### Donation Flow
```
Donor views project → Support This Project card →
Choose method: Wire ($10k+) | DAF Grant | Check →
Sees payment instructions (routing, EIN, address) →
Makes payment externally →
Returns to site → "I've Sent My Contribution" →
Auto-creates donor account → Welcome email →
Tracks status in /donor dashboard
```

### Payment Methods
| Method | Target Donor | Details |
|--------|-------------|---------|
| Wire Transfer | $10k+ donors | Routing/account/SWIFT numbers displayed |
| DAF Grant | Wealthy individuals | Funder name, EIN, grant instructions |
| Check | Foundations | Mail to POCACITO Network address |

### Database Models
- **Donation** — status lifecycle: `PENDING_CONFIRMATION → RECEIVED → ALLOCATED → FORWARDED → COMPLETED`
- **DonationUpdate** — public timeline entries visible to donor
- **WireTransfer** — outbound transfers to Ukraine with fee tracking

### Built Components
- `SupportProjectCard` — payment method tabs with instructions + confirmation form
- Donor dashboard (`/donor`) — stats, donation list, status timeline
- Nonprofit Manager dashboard (`/nonprofit`) — mark received, manage wire transfers, fee comparison
- Auto donor account creation on confirmation
- Welcome email via AWS SES

### Known Gaps
- Bank details are **placeholder values** — need real POCACITO account info
- Nonprofit dashboard uses **mock data** — APIs not connected
- No automated payment detection
- No outbound transfer tracking

---

## Phase 2 — Planned

### Plaid Integration
- Detect incoming wire transfers automatically
- Remove manual "I've Sent My Contribution" step for wire donors
- Webhook-based: Plaid notifies when payment lands

### Wise API Integration
- Track outbound transfers to Ukraine in real-time
- Auto-update donation status when wire is sent/received
- Display Wise fees vs traditional bank wire fees

### Email Notifications
- Donation status change emails (received, allocated, forwarded, completed)
- Weekly digest for nonprofit managers
- Monthly impact summary for donors

### Receipt Generation
- PDF receipt for tax purposes
- Include POCACITO Network EIN, donation amount, project details
- Auto-send on donation completion

### ACH Support
- Lower-cost payment option for smaller donations
- Plaid-powered bank account linking

---

## Technical Architecture

### API Routes
| Route | Method | Status |
|-------|--------|--------|
| `/api/donations/confirm` | POST | Built |
| `/api/donations` | GET | Needs implementation |
| `/api/donations/[id]` | GET, PATCH | Needs implementation |
| `/api/wire-transfers` | GET, POST | Needs implementation |
| `/api/wire-transfers/[id]` | PATCH | Needs implementation |
| `/api/plaid/webhook` | POST | Phase 2 |
| `/api/wise/webhook` | POST | Phase 2 |

### Key Files
- `src/components/projects/SupportProjectCard.tsx` — payment UI
- `src/app/[locale]/(public)/donor/page.tsx` — donor dashboard
- `src/app/[locale]/(public)/nonprofit/page.tsx` — nonprofit dashboard
- `src/app/api/donations/confirm/route.ts` — confirmation endpoint
- `prisma/schema.prisma` — Donation, DonationUpdate, WireTransfer models

---

## Tasks

### Phase 1 Completion
- [ ] Replace placeholder bank details with real POCACITO account info #p0 @sloan
- [ ] Connect nonprofit dashboard to real donation/wire-transfer APIs #p1 @sloan
- [ ] Donor password reset flow #p2

### Phase 2
- [ ] Plaid integration for automatic payment detection #p1
- [ ] Wise API integration for outbound transfer tracking #p1
- [ ] Email notifications on donation status changes #p2
- [ ] Receipt/tax documentation generation (PDF) #p2
- [ ] ACH payment method support #p3

## Open Questions

- What are the real POCACITO Network bank details? (Blocking launch)
- Plaid pricing tier — which plan do we need for incoming transfer detection?
- Wise API — business account or personal? Multi-currency support needed?
- Do we need to handle partial allocations (one donation split across multiple projects)?

## Related

- Decision: [[decisions/002-payment-architecture]]
- Sprint: [[current-sprint]]
