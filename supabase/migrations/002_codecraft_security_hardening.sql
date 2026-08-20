-- The trigger needs SECURITY DEFINER privileges, but it must never be callable
-- through the public REST/RPC surface.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Pin the trigger helper's lookup path to prevent search_path manipulation.
alter function public.set_updated_at() set search_path = public;
