-- ========================================
-- МИГРАЦИЯ 005: технические credentials для детей
-- ========================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tech_email text,
  ADD COLUMN IF NOT EXISTS tech_password text;

COMMENT ON COLUMN public.profiles.tech_password IS
  'MVP: plaintext password for child technical login via invite code; replace with encrypted/token-based flow in production hardening.';

CREATE UNIQUE INDEX IF NOT EXISTS profiles_tech_email_unique_idx
  ON public.profiles (tech_email)
  WHERE tech_email IS NOT NULL;

CREATE OR REPLACE FUNCTION public.get_family_by_invite_code(p_invite_code text)
RETURNS TABLE (id uuid, name text)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT f.id, f.name
  FROM public.families f
  WHERE upper(f.invite_code) = upper(trim(p_invite_code))
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_children_by_invite_code(p_invite_code text)
RETURNS TABLE (id uuid, name text, avatar text)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT p.id, p.name, p.avatar
  FROM public.families f
  JOIN public.profiles p ON p.family_id = f.id
  WHERE upper(f.invite_code) = upper(trim(p_invite_code))
    AND p.role = 'child'
  ORDER BY p.name;
$$;

CREATE OR REPLACE FUNCTION public.get_child_login_credentials(
  p_invite_code text,
  p_child_id uuid
)
RETURNS TABLE (tech_email text, tech_password text)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT p.tech_email, p.tech_password
  FROM public.families f
  JOIN public.profiles p ON p.family_id = f.id
  WHERE upper(f.invite_code) = upper(trim(p_invite_code))
    AND p.id = p_child_id
    AND p.role = 'child'
    AND p.tech_email IS NOT NULL
    AND p.tech_password IS NOT NULL
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.complete_child_registration(
  p_user_id uuid,
  p_family_id uuid,
  p_tech_email text,
  p_tech_password text
)
RETURNS void
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  profile_name text;
BEGIN
  SELECT COALESCE(raw_user_meta_data->>'name', 'Пользователь')
  INTO profile_name
  FROM auth.users
  WHERE id = p_user_id
    AND email = p_tech_email;

  IF profile_name IS NULL THEN
    RAISE EXCEPTION 'Пользователь для завершения регистрации не найден';
  END IF;

  INSERT INTO public.profiles (id, name, role, family_id, avatar, tech_email, tech_password)
  VALUES (p_user_id, profile_name, 'child', p_family_id, '👤', p_tech_email, p_tech_password)
  ON CONFLICT (id) DO UPDATE
  SET family_id = EXCLUDED.family_id,
      tech_email = EXCLUDED.tech_email,
      tech_password = EXCLUDED.tech_password;

  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
      confirmed_at = COALESCE(confirmed_at, now())
  WHERE id = p_user_id
    AND email = p_tech_email
    AND COALESCE(raw_user_meta_data->>'role', 'child') = 'child';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Не удалось подтвердить технический детский аккаунт';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_family_by_invite_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_children_by_invite_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_child_login_credentials(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_child_registration(uuid, uuid, text, text) TO anon, authenticated;
