-- Enable Row Level Security on all public tables.
-- All backend access uses service_role (bypasses RLS).
-- No permissive policies needed — anon/authenticated should not
-- access these tables directly via the Supabase API.
--
-- Using IF EXISTS so this is idempotent for tables that
-- may already have RLS enabled.

ALTER TABLE IF EXISTS "public"."Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."ProjectImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."ProjectDocument" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."ProjectSubmission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."FeaturedProject" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."ContactSubmission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."PasswordResetToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."Donation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."DonationUpdate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."WireTransfer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."PartnershipInquiry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."NewsletterSubscriber" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."EmailCampaign" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."EmailSend" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."DripSequence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."DripStep" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."DripEnrollment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."TransactionEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."CronState" ENABLE ROW LEVEL SECURITY;
