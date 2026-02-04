-- Fix Security Issue 1: Remove public read policy that exposes all API keys
-- The policy "Allow public to read active API keys" allows unauthenticated access
DROP POLICY IF EXISTS "Allow public to read active API keys" ON public.widget_api_keys;

-- Fix Security Issue 2: The "Service role can read all keys for validation" policy
-- This policy uses USING (true) which is overly permissive
-- However, we need service role access for edge functions to validate keys
-- The key insight is: service role bypasses RLS by default in Supabase
-- So this policy is actually redundant and can be safely removed
-- Edge functions using service role will still work without this policy
DROP POLICY IF EXISTS "Service role can read all keys for validation" ON public.widget_api_keys;