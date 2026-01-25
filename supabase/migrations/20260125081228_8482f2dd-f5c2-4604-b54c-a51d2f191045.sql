-- Allow admins to create API keys
CREATE POLICY "Admins can create API keys"
ON public.widget_api_keys
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Allow admins to view all API keys
CREATE POLICY "Admins can view all API keys"
ON public.widget_api_keys
FOR SELECT
USING (is_admin(auth.uid()));

-- Allow admins to update all API keys
CREATE POLICY "Admins can update all API keys"
ON public.widget_api_keys
FOR UPDATE
USING (is_admin(auth.uid()));

-- Allow admins to delete all API keys
CREATE POLICY "Admins can delete all API keys"
ON public.widget_api_keys
FOR DELETE
USING (is_admin(auth.uid()));