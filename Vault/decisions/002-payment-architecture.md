# ADR-002: Payment Architecture — Manual Confirmation with Planned Automation

**Status:** Accepted
**Date:** 2026-02-10
**Authors:** Sloan

## Context

Hromada needs to accept donations from American donors and forward funds to Ukrainian municipalities. As a fiscally sponsored project under POCACITO Network (501c3), all funds flow through POCACITO's accounts. We needed to decide how to handle payment processing.

## Decision

**Phase 1 (current):** Manual payment confirmation. Donors see payment instructions on-site, make payments externally (wire/DAF/check), then return to confirm. A nonprofit manager manually verifies receipt.

**Phase 2 (planned):** Add Plaid for automatic incoming payment detection and Wise API for outbound transfer tracking.

### Why not Stripe/PayPal?

| Factor | Stripe/PayPal | Our approach |
|--------|--------------|--------------|
| Target donation size | Optimized for small ($5-500) | $10k+ wire transfers, DAF grants |
| Fees | 2.9% + $0.30 per transaction | Wire: flat fee (~$25); DAF: $0; Check: $0 |
| Fee on $50k donation | $1,450 | ~$25 (wire) or $0 (DAF/check) |
| Donor type | Consumer credit cards | HNW individuals, foundations, DAFs |
| Setup complexity | Simple API integration | More complex, but lower ongoing cost |

For our donor profile (high-net-worth individuals making large donations), traditional payment methods save thousands in fees per transaction.

### Why manual confirmation first?

- Gets the platform functional immediately without third-party API dependencies
- Validates the donation flow UX before investing in automation
- POCACITO can manually verify receipts while volume is low
- Plaid/Wise integration is additive, not a rewrite

## Consequences

- Phase 1 requires human verification of every donation (nonprofit manager role)
- Higher friction for donors (must make payment externally, then return to confirm)
- No real-time payment status — updates depend on manual action
- Phase 2 (Plaid + Wise) will automate most of this, reducing manual work
- Small donations (<$1k) are impractical with this approach — may need Stripe later for broader donor base
