GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.can_moderate_content(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_moderate_content(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_moderate_content(uuid, text) TO service_role;