-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for API keys to authorize widget usage
CREATE TABLE public.widget_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  domain TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  request_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast API key lookups
CREATE INDEX idx_widget_api_keys_api_key ON public.widget_api_keys(api_key);

-- Enable RLS
ALTER TABLE public.widget_api_keys ENABLE ROW LEVEL SECURITY;

-- Create function to generate API keys using uuid for randomness
CREATE OR REPLACE FUNCTION public.generate_widget_api_key()
RETURNS TEXT AS $$
BEGIN
  RETURN 'a11y_' || replace(gen_random_uuid()::text, '-', '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to validate and track API key usage
CREATE OR REPLACE FUNCTION public.validate_widget_api_key(key_to_validate TEXT)
RETURNS TABLE(is_valid BOOLEAN, key_name TEXT, key_domain TEXT) AS $$
BEGIN
  UPDATE public.widget_api_keys
  SET request_count = request_count + 1,
      last_used_at = now(),
      updated_at = now()
  WHERE api_key = key_to_validate AND is_active = true;
  
  RETURN QUERY
  SELECT 
    CASE WHEN wk.id IS NOT NULL THEN true ELSE false END,
    wk.name,
    wk.domain
  FROM (SELECT 1) AS dummy
  LEFT JOIN public.widget_api_keys wk ON wk.api_key = key_to_validate AND wk.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for updated_at
CREATE TRIGGER update_widget_api_keys_updated_at
BEFORE UPDATE ON public.widget_api_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert a default API key for testing
INSERT INTO public.widget_api_keys (api_key, name, domain)
VALUES ('a11y_' || replace(gen_random_uuid()::text, '-', ''), 'Default Test Key', '*');