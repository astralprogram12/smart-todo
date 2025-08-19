-- Migration: setup_whatsapp_auth_database_fixed
-- Created at: 1755586564

-- Migration: setup_whatsapp_auth_database_fixed
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create or update trigger functions
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql AS
$$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql AS
$$
BEGIN
  NEW.updated_at := NOW();
  BEGIN
    NEW.version := COALESCE(OLD.version, 0) + 1;
  EXCEPTION
    WHEN undefined_column THEN
      -- Do nothing if version column doesn't exist
  END;
  RETURN NEW;
END;
$$;

-- Create wa_auth_codes table
CREATE TABLE IF NOT EXISTS public.wa_auth_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  attempts INTEGER NOT NULL DEFAULT 0
);

-- Create indexes for wa_auth_codes
CREATE INDEX IF NOT EXISTS idx_wa_auth_codes_phone ON public.wa_auth_codes(phone);
CREATE INDEX IF NOT EXISTS idx_wa_auth_codes_expires_at ON public.wa_auth_codes(expires_at);

-- Create wa_otp_rate_limits table
CREATE TABLE IF NOT EXISTS public.wa_otp_rate_limits (
  id uuid not null default uuid_generate_v4() primary key,
  phone text not null,
  last_request_at timestamp with time zone not null default now(),
  request_count integer not null default 1,
  cooldown_ends_at timestamp with time zone not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

CREATE INDEX IF NOT EXISTS idx_wa_otp_rate_limits_phone ON public.wa_otp_rate_limits USING btree (phone);

-- Create user_whatsapp table
CREATE TABLE IF NOT EXISTS public.user_whatsapp (
  user_id uuid not null,
  phone text null,
  status text not null default 'disconnected'::text,
  wa_connected boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  daily_message_count integer not null default 0,
  last_message_date date not null default CURRENT_DATE,
  timezone text not null default 'Asia/Jakarta'::text,
  schedule_limit integer not null default 5,
  auth_id uuid null,
  plan text null,
  plan_start date null,
  plan_end date null,
  constraint user_whatsapp_pkey primary key (user_id),
  constraint user_whatsapp_phone_key unique (phone)
);

-- Create indexes for user_whatsapp
CREATE INDEX IF NOT EXISTS idx_user_whatsapp_phone ON public.user_whatsapp USING btree (phone);

-- Create triggers
DROP TRIGGER IF EXISTS trg_user_whatsapp_set_updated_at ON public.user_whatsapp;
CREATE TRIGGER trg_user_whatsapp_set_updated_at BEFORE UPDATE ON public.user_whatsapp FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();

DROP TRIGGER IF EXISTS trg_wa_otp_rate_limits_set_updated_at ON public.wa_otp_rate_limits;
CREATE TRIGGER trg_wa_otp_rate_limits_set_updated_at BEFORE UPDATE ON public.wa_otp_rate_limits FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();;