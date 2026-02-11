# Current Sprint

**Sprint:** 2026-02-10 → 2026-02-24
**Focus:** Payment processing v2 + security hardening

---

## In Progress

- [/] Payment provider integration (v2-payment-processing branch) #p0 @sloan
- [/] Migrate photos from local to Supabase Storage #p1 @sloan

## To Do

- [ ] Fix session token vulnerability — replace base64 encoding with crypto.randomBytes #p0 @sloan
- [ ] Remove default password fallback in `/api/admin/verify` #p0 @sloan
- [ ] Donation flow UI — design and implement donor-facing payment screens #p0
- [ ] Add rate limiting to public file upload endpoint #p1
- [ ] Receipt generation for completed donations #p1

## Done

- [x] Migrate photos from local to Supabase Storage #p1 @sloan
- [x] Correct Candid seal level to Platinum #p2 @sloan
- [x] Replace CSBE with POCACITO Network as fiscal sponsor #p1 @sloan
- [x] Consolidate how-it-works into homepage and unify cream theme #p2 @sloan
- [x] Restore improved project detail page and support card #p2 @sloan

---

## Sprint Notes

- Payment processing is the primary deliverable — all other work is secondary
- Security fixes should be addressed before any public launch
- Photo migration to Supabase Storage is complete as of 381b98c
