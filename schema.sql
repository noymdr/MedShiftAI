-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE (System Access)
-- This extends the default NextAuth/Supabase auth users if we were using Supabase Auth,
-- but since we are using NextAuth with a custom adapter or just custom tables, 
-- we will define our domain tables clearly.

CREATE TYPE system_role_enum AS ENUM ('user', 'admin');

CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  system_role system_role_enum DEFAULT 'user',
  doctor_id UUID, -- Will block reference until doctors table exists, added as ALTER later or defined carefully
  image TEXT, -- For NextAuth compatibility
  email_verified TIMESTAMPTZ, -- For NextAuth
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DOCTORS TABLE (Medical Profile)
CREATE TYPE medical_role_enum AS ENUM ('resident', 'attending');
CREATE TYPE qualification_enum AS ENUM ('Junior', 'Intermediate', 'Senior');

CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL UNIQUE,
  full_name TEXT NOT NULL,
  medical_role medical_role_enum NOT NULL,
  qualification qualification_enum NOT NULL,
  specialty TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add the Foreign Key from users to doctors now that doctors exists
-- Note: Circular references can be tricky, but here it's just a loose link for 0 checks.
-- Ideally we just strictly use user_id in the doctors table to link them. 
-- But per requirements: "users table should also have a doctor id".
ALTER TABLE public.users 
ADD CONSTRAINT fk_users_doctor 
FOREIGN KEY (doctor_id) REFERENCES public.doctors(id);

-- 3. DOCTORS CONSTRAINTS (Availability)
CREATE TYPE constraint_status_enum AS ENUM ('vacation', 'blocked');

CREATE TABLE public.doctors_constraints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  status constraint_status_enum NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, date) -- One constraint status per day per doctor
);

-- 4. SHIFTS (Schedule)
CREATE TYPE shift_role_enum AS ENUM ('Junior Resident', 'Intermediate Resident', 'Senior Resident', 'Attending');

CREATE TABLE public.shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  shift_role shift_role_enum NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL, -- Nullable if slot is empty/unassigned
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, shift_role) -- Ensure only 1 of each role per day as per coverage rules
);

-- 5. SCHEDULE LOCKS (Admin Control)
CREATE TABLE public.schedule_locks (
  month_start DATE PRIMARY KEY, -- e.g. '2026-02-01'
  is_locked BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id)
);

-- Row Level Security (RLS) policies would go here, 
-- but for the MVP NextAuth adapter often bypasses RLS if using the service role key,
-- or we handle it in application logic.

-- Seed Data (Optional - for testing)
-- INSERT INTO public.users (email, full_name, system_role) VALUES ('sarah@hospital.com', 'Dr. Sarah Chen', 'user');
