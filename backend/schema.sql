-- ============================================================
-- Agradut Foundation — PostgreSQL Schema
-- Run this in Neon (or any Postgres) to create all tables
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Members
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  member_id TEXT UNIQUE NOT NULL,
  email TEXT,
  phone TEXT,
  designation TEXT DEFAULT 'Member',
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Past Programs
CREATE TABLE IF NOT EXISTS past_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  place TEXT NOT NULL,
  details TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Future Programs
CREATE TABLE IF NOT EXISTS future_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  place TEXT NOT NULL,
  details TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments (monthly membership)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id TEXT UNIQUE NOT NULL,
  member_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'razorpay',
  transaction_ref TEXT,
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  month INTEGER,
  year INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Donations
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  amount NUMERIC NOT NULL,
  transaction_id TEXT,
  message TEXT,
  donation_date TIMESTAMPTZ DEFAULT NOW(),
  month INTEGER,
  year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certificate Requests
CREATE TABLE IF NOT EXISTS certificate_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  year TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Requests (Blood / Organ)
CREATE TABLE IF NOT EXISTS service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  blood_group TEXT,
  details TEXT,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Users
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  member_id TEXT,
  admin_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- OTP Store (temporary, in-memory in code, but table for persistence)
CREATE TABLE IF NOT EXISTS otp_store (
  email TEXT PRIMARY KEY,
  otp TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);
