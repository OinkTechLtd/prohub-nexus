GRANT SELECT ON public.warning_types TO anon, authenticated;
GRANT ALL ON public.warning_types TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.user_warnings TO authenticated;
GRANT ALL ON public.user_warnings TO service_role;

GRANT SELECT ON public.user_bans TO anon;
GRANT SELECT, INSERT, UPDATE ON public.user_bans TO authenticated;
GRANT ALL ON public.user_bans TO service_role;

REVOKE EXECUTE ON FUNCTION public.check_and_apply_sanctions(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_and_apply_sanctions(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_apply_sanctions(uuid, uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_user_warning_points(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_warning_points(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_warning_points(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.is_user_banned(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_user_banned(uuid) TO anon, authenticated, service_role;