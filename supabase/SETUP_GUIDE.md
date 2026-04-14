# 📘 Подробная инструкция по настройке Supabase для КПД

## Шаг 1: Создание проекта (если ещё не создан)

1. Зайди на https://supabase.com
2. Нажми "Start your project"
3. Войди через GitHub
4. Нажми "New project"
5. Выбери Organization (или создай новую)
6. Заполни данные проекта:
   - **Name**: kpd-app
   - **Database Password**: придумай надёжный пароль (сохрани его!)
   - **Region**: выбери ближайший регион (например, Frankfurt)
   - **Pricing Plan**: Free
7. Нажми "Create new project"
8. Жди 2-3 минуты пока проект создаётся

## Шаг 2: Получение ключей API

1. В левом меню нажми на иконку ⚙️ **Settings**
2. Выбери **API**
3. Найди секцию **Project API keys**
4. Скопируй:
   - **Project URL** (например: `https://xxxxxxxxxxx.supabase.co`)
   - **anon public** ключ (длинная строка начинается с `eyJ...`)

## Шаг 3: Настройка переменных окружения

### Локально:
Создай файл `.env` в папке `frontend/`:
```
VITE_SUPABASE_URL=твой_project_url
VITE_SUPABASE_ANON_KEY=твой_anon_key
```

### В Vercel:
1. Зайди на https://vercel.com
2. Выбери свой проект kpd-app
3. Settings → Environment Variables
4. Добавь переменные:
   - `VITE_SUPABASE_URL` = твой Project URL
   - `VITE_SUPABASE_ANON_KEY` = твой anon ключ
5. Сохрани и передеплой проект

## Шаг 4: Применение миграций базы данных

### 4.1 Открой SQL Editor
1. В левом меню нажми 🗄️ **SQL Editor**
2. Нажми "+ New query"

### 4.2 Применение миграции 001
1. Открой файл `supabase/migrations/001_initial_schema.sql` в GitHub
2. Скопируй ВСЁ содержимое (Ctrl+A, Ctrl+C)
3. Вставь в SQL Editor
4. Нажми **Run** (или F5)
5. Должно появиться: "Success. No rows returned"

### 4.3 Применение миграции 002
1. Открой файл `supabase/migrations/002_full_schema.sql`
2. Скопируй ВСЁ содержимое
3. Вставь в SQL Editor
4. Нажми **Run**
5. Проверь что нет ошибок

### 4.4 Применение миграции 003 (КРИТИЧНО!)
1. Открой файл `supabase/migrations/003_fix_rls_and_auto_profile.sql`
2. Скопируй ВСЁ содержимое
3. Вставь в SQL Editor
4. Нажми **Run**
5. Должно появиться сообщение:
   ```
   Миграция 003 завершена!
   Всего пользователей: X
   Всего профилей: X
   ```

### 4.5 Применение миграции 004 (КРИТИЧНО — исправляет 403 Forbidden!)
1. Открой файл `supabase/migrations/004_fix_families_rls.sql`
2. Скопируй ВСЁ содержимое
3. Вставь в SQL Editor
4. Нажми **Run**
5. Должно появиться сообщение:
   ```
   Миграция 004 завершена!
   RLS политики обновлены для всех таблиц
   ```

## Шаг 5: Настройка Authentication

### 5.1 Открой настройки Auth
1. В левом меню нажми 🔐 **Authentication**
2. Перейди на вкладку **Settings**

### 5.2 Email Settings
1. Найди секцию **Email Auth**
2. ✅ **Убери галочку** "Enable email confirmations"
   (Это нужно для удобства тестирования. В продакшене включи обратно!)

### 5.3 Rate Limits (чтобы не было ошибки 429)
1. Прокрути вниз до **Rate Limits**
2. Измени значения:
   - **Auth Emails per Hour**: `10` (вместо 4)
   - **Auth Signups per Hour**: `10` (вместо 4)
3. Нажми **Save**

### 5.4 URL Configuration
1. Найди секцию **URL Configuration**
2. **Site URL**: укажи `https://kpd-app.vercel.app`
3. **Redirect URLs**: добавь (нажми "+ Add URL"):
   - `https://kpd-app.vercel.app/**`
   - `http://localhost:5173/**` (для локальной разработки)
4. Нажми **Save**

## Шаг 6: Проверка настроек

### 6.1 Проверь таблицы
1. В левом меню нажми 📊 **Table Editor**
2. Убедись что есть таблицы:
   - ✅ profiles
   - ✅ families
   - ✅ tasks
   - ✅ points
   - ✅ rewards
   - ✅ purchases
   - ✅ likes
   - ✅ grades

### 6.2 Проверь политики RLS
1. В SQL Editor выполни:
```sql
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
```
2. Должны быть политики для каждой таблицы (особенно `profiles_insert_own`)

### 6.3 Проверь триггер
1. В SQL Editor выполни:
```sql
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' OR event_object_schema = 'auth';
```
2. Должен быть триггер `on_auth_user_created` на таблице `users`

## Шаг 7: Тестирование

### 7.1 Тест регистрации
1. Открой https://kpd-app.vercel.app
2. Нажми "Зарегистрироваться" → "Взрослый"
3. Введи данные:
   - Имя: Тест
   - Email: test@example.com
   - Пароль: 123456
4. Нажми "Зарегистрироваться"
5. ✅ Должно перенаправить на страницу создания семьи
6. ❌ Если ошибка - смотри "Решение проблем" ниже

### 7.2 Проверка создания профиля
1. В Supabase → Table Editor → profiles
2. Проверь что появилась новая запись с твоим email

### 7.3 Тест входа
1. Выйди из аккаунта
2. Нажми "Войти"
3. Введи те же данные
4. ✅ Должно войти без ошибок

## Решение проблем

### Проблема: "403 Forbidden при создании семьи"
**Решение**:
1. Примени миграцию 004 в Supabase SQL Editor
2. Проверь что политики добавлены:
```sql
SELECT tablename, policyname FROM pg_policies WHERE tablename = 'families';
```
3. Должна быть политика `families_insert`

### Проблема: "email rate limit exceeded"
**Решение**: 
1. Подожди 10 минут
2. Проверь что увеличил Rate Limits в шаге 5.3
3. Попробуй другой email

### Проблема: "PGRST116: Cannot coerce to single object"
**Решение**:
1. Проверь что применил миграцию 003
2. В SQL Editor выполни:
```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_insert_own';
```
3. Если пусто - заново примени миграцию 003

### Проблема: "Password should be at least 6 characters"
**Решение**: Используй пароль минимум 6 символов

### Проблема: Профиль не создаётся
**Решение**:
1. В SQL Editor выполни:
```sql
SELECT au.id, au.email, p.id as profile_id
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;
```
2. Если видишь пользователей без профиля, выполни:
```sql
INSERT INTO profiles (id, name, role, family_id)
SELECT au.id, 'Пользователь', 'child', NULL
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;
```

## Готово! 🎉

Теперь приложение должно работать полностью.

Если остались вопросы - пиши в Issues на GitHub!
