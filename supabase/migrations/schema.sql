-- DDL Schema for Smart Bharat - AI-Powered Civic Companion
-- Suitable for Supabase / PostgreSQL

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create complaints table
CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_id TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    urgency TEXT NOT NULL,
    latitude FLOAT8,
    longitude FLOAT8,
    photo_url TEXT,
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'in_review', 'in_progress', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- Optional foreign key if auth is configured
    messages JSONB DEFAULT '[]'::jsonb,
    language TEXT DEFAULT 'en' CHECK (language IN ('en', 'hi')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create schemes table
CREATE TABLE IF NOT EXISTS schemes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    eligibility TEXT,
    eligibility_hi TEXT,
    description TEXT,
    description_hi TEXT,
    documents_required JSONB DEFAULT '[]'::jsonb,
    official_url TEXT,
    processing_time TEXT
);

-- Create profiles table (extends auth.users if Supabase auth is used)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY, -- maps to auth.users.id
    age INT,
    occupation TEXT,
    income_bracket TEXT,
    state TEXT,
    preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to complaints
DROP TRIGGER IF EXISTS set_timestamp_complaints ON complaints;
CREATE TRIGGER set_timestamp_complaints
BEFORE UPDATE ON complaints
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();
