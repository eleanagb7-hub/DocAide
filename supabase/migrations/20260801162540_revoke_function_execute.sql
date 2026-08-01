-- Ensure EXECUTE is revoked from anon and authenticated on both SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.is_secretary() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
