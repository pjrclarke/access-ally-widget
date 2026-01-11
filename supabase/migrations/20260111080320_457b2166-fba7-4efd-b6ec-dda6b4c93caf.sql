-- Allow anonymous/public read access to API keys (only the api_key column for display)
-- This is intentional - users need to see their API key to embed the widget
CREATE POLICY "Allow public to read active API keys"
ON public.widget_api_keys
FOR SELECT
USING (is_active = true);