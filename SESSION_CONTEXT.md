# Session Context - Payment Processing Implementation

**Date**: 2026-02-06
**Branch**: `v2-payment-processing`
**Status**: Core UI and database complete, ready for Plaid integration

---

## Summary

Built the complete payment processing infrastructure for Hromada. Donors can support projects via Wire Transfer, DAF Grant, or Check. When they confirm a contribution, a donor account is auto-created and they can track their donation through a dashboard. Nonprofit managers have a separate dashboard to track incoming donations and outbound wire transfers to Ukraine.

---

## Payment Flow Architecture

### Current Flow (Manual Confirmation)
```
Donor → Views project → Clicks "Support This Project" →
Chooses payment method (Wire/DAF/Check) → Sees instructions →
Sends payment externally → Returns to site →
Clicks "I've Sent My Contribution" → Fills form →
Account auto-created → Welcome email sent →
Tracks donation in /donor dashboard
```

### Future Flow (With Plaid)
```
Donor → Enters email → Sends payment →
Plaid detects payment in BoA → Auto-matches to project →
Account auto-created → Receipt email with login →
Tracks donation in /donor dashboard
```

The manual "I've Sent My Contribution" step will be removed once Plaid is integrated.

---

## Money Flow

```
Donor sends funds
       ↓
Bank of America (CSBE 501(c)(3) account)
       ↓
Plaid detects payment (future)
       ↓
Nonprofit Manager reviews in dashboard
       ↓
Initiates transfer via Wise or Bank Wire
(whichever has lower fees for the amount)
       ↓
Ukrainian municipal bank account
       ↓
Donor receives "Funds Delivered" update
```

---

## What Was Built

### 1. Support This Project Card
**File**: `src/components/projects/SupportProjectCard.tsx`
- Replaces "Express Interest" on project detail pages
- Shows estimated cost and co-financing info
- Three payment methods: Wire Transfer, DAF Grant, Check
- Each shows payment instructions with copy buttons
- "I've Sent My Contribution" confirmation form
- Success state with account creation messaging

### 2. Donation Confirmation API
**File**: `src/app/api/donations/confirm/route.ts`
- Validates donor input
- Checks if donor has existing account
- If new donor: creates DONOR account with temp password
- Creates Donation record in database
- Sends welcome email to new donors
- Sends notification to admin/nonprofit manager

### 3. Donor Dashboard
**File**: `src/app/[locale]/(public)/donor/page.tsx`
- Stats: total contributed, projects supported, pending, delivered
- List of donations with status badges
- Click donation to see update timeline
- Status progression: PENDING → RECEIVED → FORWARDED → COMPLETED
- Tax deduction information

### 4. Nonprofit Manager Dashboard
**File**: `src/app/[locale]/(public)/nonprofit/page.tsx`
- Overview tab with pending actions
- Donations tab with "Mark Received" functionality
- Wire Transfers tab with status tracking
- Fee comparison: Wise vs Bank Wire

### 5. Database Schema
**File**: `prisma/schema.prisma`

```prisma
enum UserRole {
  ADMIN
  PARTNER
  NONPROFIT_MANAGER
  DONOR  // NEW
}

model Donation {
  id, projectId, projectName
  donorUserId, donorName, donorEmail, donorOrganization
  amount, paymentMethod, referenceNumber
  status (PENDING_CONFIRMATION → RECEIVED → ALLOCATED → FORWARDED → COMPLETED)
  wireTransferId
  timestamps
}

model DonationUpdate {
  id, donationId, title, message, isPublic, createdAt
}

model WireTransfer {
  id, referenceNumber
  recipientName, recipientBankName, recipientBankSwift, recipientAccountIban
  amountUsd, status, projectId
  donations[] (linked)
  timestamps
}
```

### 6. Email Templates
**File**: `src/lib/email.ts`
- `sendDonorWelcomeEmail()` - Welcome with temp password, tracking info, next steps
- `sendDonationNotificationToAdmin()` - Alert with donation details, "NEW DONOR" badge

### 7. Auth Updates
**File**: `src/hooks/useAuth.ts`
- Added `isDonor()`, `isNonprofitManager()`, `getDashboardPath()`
- Login redirects to role-appropriate dashboard

---

## Role-Based Dashboards

| Role | Dashboard | Purpose |
|------|-----------|---------|
| ADMIN | `/admin` | Full system access, user management |
| PARTNER | `/partner` | Submit projects for approval |
| NONPROFIT_MANAGER | `/nonprofit` | Track donations, manage wire transfers |
| DONOR | `/donor` | Track personal donations and updates |

---

## Payment Methods Supported

| Method | Best For | How It Works |
|--------|----------|--------------|
| Wire Transfer | $10k+ | Donor wires to BoA, we provide routing/account |
| DAF Grant | Wealthy individuals | Donor recommends grant from their DAF to CSBE |
| Check | Foundations | Donor mails check to CSBE address |

Credit cards/Stripe intentionally not included - 3% fee is too high for large donations.

---

## Files Created/Modified

### New Files
- `src/components/projects/SupportProjectCard.tsx`
- `src/app/api/donations/confirm/route.ts`
- `src/app/[locale]/(public)/nonprofit/page.tsx`
- `src/app/[locale]/(public)/donor/page.tsx`

### Modified Files
- `prisma/schema.prisma` - Added Donation, DonationUpdate, WireTransfer, DONOR role
- `src/lib/email.ts` - Added donor welcome and admin notification emails
- `src/lib/security.ts` - Added donation/wire audit actions
- `src/hooks/useAuth.ts` - Added isDonor, isNonprofitManager, getDashboardPath
- `src/app/[locale]/(public)/login/page.tsx` - Updated redirect logic
- `src/app/[locale]/(public)/projects/[id]/page.tsx` - Replaced ContactForm with SupportProjectCard
- `locales/en.json` - Added donor and support translations

---

## Environment Variables Needed

```bash
# Already configured
RESEND_API_KEY=re_...        # For sending emails
ADMIN_EMAIL=admin@...        # Receives donation notifications

# Needed for production
# Real CSBE bank details (currently placeholders in SupportProjectCard.tsx):
# - Bank of America routing number
# - Account number
# - SWIFT code
# - CSBE EIN
# - Mailing address

# Future
PLAID_CLIENT_ID=...          # For bank transaction monitoring
PLAID_SECRET=...
WISE_API_KEY=...             # For outbound transfer tracking
```

---

## Next Steps

### Immediate
1. Replace placeholder bank details in `SupportProjectCard.tsx` with real CSBE info
2. Test full flow: project page → support → confirm → check email → login to donor dashboard

### Short Term
3. Add Plaid integration for automatic payment detection
4. Remove manual "I've Sent My Contribution" step
5. Connect nonprofit dashboard to real API (currently using mock data)

### Medium Term
6. Add Wise API for outbound transfer tracking
7. Auto-update donation status when Wise confirms delivery
8. Add password reset flow for donors

---

## Business Context

- **Fiscal Sponsor**: CSBE is a 501(c)(3), donations are tax-deductible
- **Receiving Bank**: Bank of America
- **Outbound Transfers**: Wise (cheaper for most amounts) or Bank Wire (better for very large)
- **Target Donors**: Wealthy individuals, corporations, foundations
- **Destination**: Ukrainian municipal bank accounts for infrastructure projects

---

## Team

- Thomas Protzmann
- Kostia (Ukraine contact for municipal bank details)
- Sloan (potential team member)
- Scott Sklar (potential partner)
