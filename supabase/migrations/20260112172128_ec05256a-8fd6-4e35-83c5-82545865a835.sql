-- Fix SECURITY DEFINER functions by revoking public access and adding auth checks

-- 1. Revoke execute permissions from anon and authenticated roles
REVOKE EXECUTE ON FUNCTION public.generate_widget_api_key() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_widget_api_key(TEXT) FROM anon, authenticated;

-- 2. Update generate_widget_api_key to require authentication
CREATE OR REPLACE FUNCTION public.generate_widget_api_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Require authentication to generate API keys
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to generate API keys';
  END IF;
  RETURN 'a11y_' || replace(gen_random_uuid()::text, '-', '');
END;
$$;

-- 3. Update validate_widget_api_key to be callable only by service role
-- Keep SECURITY DEFINER as it needs to update records, but restrict access
CREATE OR REPLACE FUNCTION public.validate_widget_api_key(key_to_validate TEXT)
RETURNS TABLE(is_valid BOOLEAN, key_name TEXT, key_domain TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function should only be called from edge functions using service role
  -- The REVOKE above ensures anon/authenticated users cannot call it directly
  
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
$$;