-- Add new financial fields to properties table
-- IMPORTANT: Run this in the Supabase SQL Editor
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS rehab_cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_rent NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS other_costs NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS operating_expenses NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_investment NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_profit NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS annual_income NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS annual_noi NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cap_rate NUMERIC DEFAULT 0;

-- Update existing records with basic calculations
UPDATE public.properties 
SET 
  total_investment = COALESCE(price, 0) + COALESCE(rehab_cost, 0) + COALESCE(other_costs, 0),
  annual_income = COALESCE(monthly_rent, 0) * 12
WHERE total_investment = 0 OR annual_income = 0;

-- NOTE: If the error persists after running this, go to Supabase -> Settings -> API -> "Reload Schema Cache"
