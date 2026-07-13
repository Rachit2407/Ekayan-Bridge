-- Ekayan Bridge — Supabase Schema Migration Script
-- Run this in your Supabase Project SQL Editor (https://supabase.com)

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS gender text DEFAULT 'prefer_not_to_say',
ADD COLUMN IF NOT EXISTS marital_status text DEFAULT 'prefer_not_to_say',
ADD COLUMN IF NOT EXISTS dropout_date date,
ADD COLUMN IF NOT EXISTS dropout_reason text,
ADD COLUMN IF NOT EXISTS consent_given boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS consent_date date,
ADD COLUMN IF NOT EXISTS parent_guardian_name text,
ADD COLUMN IF NOT EXISTS parent_guardian_contact text,
ADD COLUMN IF NOT EXISTS parent_guardian_relation text DEFAULT 'parent',
ADD COLUMN IF NOT EXISTS alumni_outcome text,
ADD COLUMN IF NOT EXISTS alumni_details text;
