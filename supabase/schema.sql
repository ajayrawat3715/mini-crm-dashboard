-- ========================================================
-- Mini CRM Dashboard - Supabase SQL Schema
-- Run this in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Click Run
-- ========================================================

-- Create the leads table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    business_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Converted')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indices for rapid search and status filtering
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow public read, insert, update, and delete for this CRM demo
DROP POLICY IF EXISTS "Allow public select on leads" ON public.leads;
CREATE POLICY "Allow public select on leads" ON public.leads
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on leads" ON public.leads;
CREATE POLICY "Allow public insert on leads" ON public.leads
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on leads" ON public.leads;
CREATE POLICY "Allow public update on leads" ON public.leads
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete on leads" ON public.leads;
CREATE POLICY "Allow public delete on leads" ON public.leads
    FOR DELETE USING (true);

-- Trigger for auto-updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_leads_updated_at ON public.leads;
CREATE TRIGGER trigger_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Seed with initial demo data
INSERT INTO public.leads (name, email, phone, business_name, status, notes)
VALUES
    ('Sarah Jenkins', 'sarah.jenkins@acmeinnovations.com', '+1 (555) 234-5678', 'Acme Innovations', 'Converted', 'Signed enterprise annual contract. Onboarding kickoff scheduled.'),
    ('Michael Chang', 'mchang@nexuslogistics.io', '+1 (555) 876-5432', 'Nexus Logistics', 'Contacted', 'Demo delivered on Tuesday. Following up on fleet tracking integration.'),
    ('Elena Rostova', 'elena.r@solardynamics.com', '+1 (555) 345-6789', 'Solar Dynamics Inc.', 'New', 'Inquired via contact form regarding commercial solar installations.'),
    ('David Miller', 'david.m@apexretail.co', '+1 (555) 987-6543', 'Apex Retail Solutions', 'New', 'Interested in POS system migration for 12 storefront locations.'),
    ('Priya Sharma', 'priya@healthbridge.org', '+1 (555) 456-7890', 'HealthBridge Clinics', 'Converted', 'Closed multi-clinic patient portal rollout. Implementation started.'),
    ('James Wilson', 'jwilson@fintechflow.com', '+1 (555) 678-1234', 'FinTech Flow Corp', 'Contacted', 'Reviewing security compliance and SOC2 reports before finalizing.'),
    ('Aisha Khan', 'aisha@greengrowth.eco', '+1 (555) 789-0123', 'GreenGrowth Organics', 'New', 'Requested a quote for inventory management and carbon accounting.'),
    ('Carlos Mendez', 'carlos@buildcraft.net', '+1 (555) 890-1234', 'BuildCraft Contractors', 'Converted', 'Converted from webinar. Subscribed to pro construction tier.')
ON CONFLICT DO NOTHING;
