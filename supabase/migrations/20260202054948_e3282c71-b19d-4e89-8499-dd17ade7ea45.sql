-- Allow admins to insert new admin users
CREATE POLICY "Admins can add admin users" 
ON public.admin_users 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

-- Allow admins to delete admin users (but not themselves)
CREATE POLICY "Admins can remove admin users" 
ON public.admin_users 
FOR DELETE 
USING (is_admin(auth.uid()) AND user_id != auth.uid());