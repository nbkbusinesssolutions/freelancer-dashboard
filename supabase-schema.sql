-- NBK Control Center Supabase Schema
-- Run this SQL in your Supabase SQL Editor to create all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email accounts table
CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_name TEXT NOT NULL,
  domain_name TEXT,
  domain_provider TEXT,
  domain_email_id UUID REFERENCES email_accounts(id) ON DELETE SET NULL,
  domain_username TEXT,
  deployment_email_id UUID REFERENCES email_accounts(id) ON DELETE SET NULL,
  deployment_username TEXT,
  hosting_platform TEXT DEFAULT 'Netlify',
  domain_purchase_date DATE,
  domain_renewal_date DATE,
  hosting_start_date DATE,
  hosting_renewal_date DATE,
  status TEXT NOT NULL DEFAULT 'Ongoing',
  project_amount NUMERIC,
  payment_status TEXT,
  pending_amount NUMERIC,
  completed_date DATE,
  attention_state TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC,
  tax_amount NUMERIC,
  discount_amount NUMERIC,
  grand_total NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  balance_due NUMERIC DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'Unpaid',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  rate NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0
);

-- AI subscriptions table
CREATE TABLE IF NOT EXISTS ai_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  tool_name TEXT NOT NULL,
  platform TEXT,
  platform_other TEXT,
  subscription_type TEXT NOT NULL DEFAULT 'Paid',
  email_id UUID REFERENCES email_accounts(id) ON DELETE SET NULL,
  password TEXT,
  start_date DATE,
  end_date DATE,
  cancel_by_date DATE,
  cost NUMERIC,
  manual_status TEXT,
  attention_state TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Action items table
CREATE TABLE IF NOT EXISTS action_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  context_type TEXT NOT NULL,
  context_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project logs table
CREATE TABLE IF NOT EXISTS project_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business branding table (single row)
CREATE TABLE IF NOT EXISTS business_branding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name TEXT NOT NULL DEFAULT 'NBK Business Solutions',
  tagline TEXT,
  logo_url TEXT,
  upi_qr_url TEXT,
  upi_id TEXT,
  mobile TEXT,
  address TEXT,
  email TEXT,
  default_hourly_rate NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Effort logs table
CREATE TABLE IF NOT EXISTS effort_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_ai_subscriptions_email_id ON ai_subscriptions(email_id);
CREATE INDEX IF NOT EXISTS idx_action_items_context ON action_items(context_type, context_id);
CREATE INDEX IF NOT EXISTS idx_project_logs_project_id ON project_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_effort_logs_project_id ON effort_logs(project_id);

-- Insert default business branding if none exists
INSERT INTO business_branding (business_name, tagline)
SELECT 'NBK Business Solutions', 'Professional Web Development & Design'
WHERE NOT EXISTS (SELECT 1 FROM business_branding);

-- Enable Row Level Security (optional - for multi-user scenarios)
-- ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ai_subscriptions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE project_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE business_branding ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE effort_logs ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (anonymous access for internal tool)
-- You can add RLS policies later if you need authentication
