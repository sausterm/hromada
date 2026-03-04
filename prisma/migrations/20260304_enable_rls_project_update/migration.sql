-- Enable RLS on ProjectUpdate table (missed in 20260225_enable_rls).
ALTER TABLE IF EXISTS "public"."ProjectUpdate" ENABLE ROW LEVEL SECURITY;
