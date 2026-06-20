-- Отключаем необходимость подтверждения email для всех новых пользователей
-- Для этого создаём trigger, который автоматически подтверждает email при регистрации
CREATE OR REPLACE FUNCTION public.auto_confirm_email()
RETURNS trigger
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
      confirmed_at = COALESCE(confirmed_at, now())
  WHERE id = NEW.id
    AND email_confirmed_at IS NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_confirm_email ON auth.users;
CREATE TRIGGER on_auth_user_created_confirm_email
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_email();

-- Также подтверждаем всех уже существующих неподтверждённых пользователей
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, created_at),
    confirmed_at = COALESCE(confirmed_at, created_at)
WHERE email_confirmed_at IS NULL;
