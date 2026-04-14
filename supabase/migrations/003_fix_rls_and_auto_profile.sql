-- ========================================
-- МИГРАЦИЯ 003: Исправление RLS и автосоздание профилей
-- ========================================

-- 1. Добавить политику для вставки собственного профиля
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 2. Убедиться что у нас есть политика для SELECT своего профиля
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles 
  FOR SELECT 
  USING (auth.uid() = id OR family_id IN (
    SELECT family_id FROM profiles WHERE id = auth.uid()
  ));

-- 3. Политика для UPDATE своего профиля
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- 4. Создать функцию автоматического создания профиля
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, family_id, avatar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Пользователь'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'child'),
    NULL,
    '👤'
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Профиль уже существует, игнорируем
    RETURN NEW;
  WHEN OTHERS THEN
    -- Логируем ошибку но не прерываем создание пользователя
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 5. Создать триггер для автоматического создания профиля при регистрации
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. Исправить существующих пользователей без профилей
INSERT INTO public.profiles (id, name, role, family_id, avatar)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', 'Пользователь'),
  COALESCE(au.raw_user_meta_data->>'role', 'child'),
  NULL,
  '👤'
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 7. Вывести отчёт
DO $$
DECLARE
  users_count INT;
  profiles_count INT;
  missing_count INT;
BEGIN
  SELECT COUNT(*) INTO users_count FROM auth.users;
  SELECT COUNT(*) INTO profiles_count FROM public.profiles;
  missing_count := users_count - profiles_count;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Миграция 003 завершена!';
  RAISE NOTICE 'Всего пользователей: %', users_count;
  RAISE NOTICE 'Всего профилей: %', profiles_count;
  RAISE NOTICE 'Исправлено профилей: %', missing_count;
  RAISE NOTICE '========================================';
END $$;
