-- Ekayan Bridge — Supabase Course Migration Script
-- Run this in your Supabase Project SQL Editor (https://supabase.com)

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS course_name text,
ADD COLUMN IF NOT EXISTS course_year text;
