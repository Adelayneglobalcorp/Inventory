-- Global 360 financing form expansion. Additive, compatible with existing applications.
-- requested_amount and estimated_property_value are preserved for historical requests
-- but no longer requested in the new form. No rows or existing CRM hooks are removed.
ALTER TABLE public.financing_requests
  ALTER COLUMN requested_amount DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS residential_address text,
  ADD COLUMN IF NOT EXISTS residential_city text,
  ADD COLUMN IF NOT EXISTS residential_state text,
  ADD COLUMN IF NOT EXISTS residential_postal_code text,
  ADD COLUMN IF NOT EXISTS housing_status text,
  ADD COLUMN IF NOT EXISTS credit_score integer,
  ADD COLUMN IF NOT EXISTS down_payment_available numeric(15,2),
  ADD COLUMN IF NOT EXISTS investment_properties_count text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'financing_requests_housing_status_check') THEN
    ALTER TABLE public.financing_requests ADD CONSTRAINT financing_requests_housing_status_check
      CHECK (housing_status IS NULL OR housing_status IN ('own','rent'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'financing_requests_credit_score_check') THEN
    ALTER TABLE public.financing_requests ADD CONSTRAINT financing_requests_credit_score_check
      CHECK (credit_score IS NULL OR credit_score BETWEEN 300 AND 850);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'financing_requests_down_payment_check') THEN
    ALTER TABLE public.financing_requests ADD CONSTRAINT financing_requests_down_payment_check
      CHECK (down_payment_available IS NULL OR down_payment_available >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'financing_requests_investment_properties_check') THEN
    ALTER TABLE public.financing_requests ADD CONSTRAINT financing_requests_investment_properties_check
      CHECK (investment_properties_count IS NULL OR investment_properties_count IN ('0','1-5','5+'));
  END IF;
END $$;
-- Existing row-level policies, ownership checks and GHL insert trigger remain unchanged.
