-- ========================================
-- МИГРАЦИЯ 004: Исправление RLS для families и других таблиц
-- ========================================

-- 1. FAMILIES — разрешить создание семьи любому авторизованному
DROP POLICY IF EXISTS "families_select" ON families;
DROP POLICY IF EXISTS "families_insert" ON families;
DROP POLICY IF EXISTS "families_update" ON families;

-- SELECT: видят все члены семьи
CREATE POLICY "families_select" ON families
  FOR SELECT
  USING (
    id IN (SELECT family_id FROM profiles WHERE id = auth.uid())
    OR created_by = auth.uid()
  );

-- INSERT: любой авторизованный может создать семью
CREATE POLICY "families_insert" ON families
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- UPDATE: только создатель семьи или админ
CREATE POLICY "families_update" ON families
  FOR UPDATE
  USING (
    created_by = auth.uid() 
    OR id IN (
      SELECT family_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 2. TASKS — исправить политики
DROP POLICY IF EXISTS "tasks_select" ON tasks;
DROP POLICY IF EXISTS "tasks_insert" ON tasks;
DROP POLICY IF EXISTS "tasks_update" ON tasks;
DROP POLICY IF EXISTS "tasks_delete" ON tasks;

CREATE POLICY "tasks_select" ON tasks
  FOR SELECT
  USING (family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT
  WITH CHECK (
    family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE
  USING (family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE
  USING (
    family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid())
    AND created_by = auth.uid()
  );

-- 3. TASK_COMPLETIONS — исправить политики
DROP POLICY IF EXISTS "task_completions_select" ON task_completions;
DROP POLICY IF EXISTS "task_completions_insert" ON task_completions;
DROP POLICY IF EXISTS "task_completions_update" ON task_completions;

CREATE POLICY "task_completions_select" ON task_completions
  FOR SELECT
  USING (family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "task_completions_insert" ON task_completions
  FOR INSERT
  WITH CHECK (
    family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid())
    AND child_id = auth.uid()
  );

CREATE POLICY "task_completions_update" ON task_completions
  FOR UPDATE
  USING (family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid()));

-- 4. POINTS — исправить политики
DROP POLICY IF EXISTS "points_select" ON points;
DROP POLICY IF EXISTS "points_insert" ON points;

CREATE POLICY "points_select" ON points
  FOR SELECT
  USING (family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "points_insert" ON points
  FOR INSERT
  WITH CHECK (family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid()));

-- 5. REWARDS — исправить политики
DROP POLICY IF EXISTS "rewards_select" ON rewards;
DROP POLICY IF EXISTS "rewards_insert" ON rewards;
DROP POLICY IF EXISTS "rewards_update" ON rewards;
DROP POLICY IF EXISTS "rewards_delete" ON rewards;

CREATE POLICY "rewards_select" ON rewards
  FOR SELECT
  USING (family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "rewards_insert" ON rewards
  FOR INSERT
  WITH CHECK (family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "rewards_update" ON rewards
  FOR UPDATE
  USING (family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "rewards_delete" ON rewards
  FOR DELETE
  USING (family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid()));

-- 6. PURCHASES — исправить политики
DROP POLICY IF EXISTS "purchases_select" ON purchases;
DROP POLICY IF EXISTS "purchases_insert" ON purchases;
DROP POLICY IF EXISTS "purchases_update" ON purchases;

CREATE POLICY "purchases_select" ON purchases
  FOR SELECT
  USING (family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "purchases_insert" ON purchases
  FOR INSERT
  WITH CHECK (
    family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid())
    AND child_id = auth.uid()
  );

CREATE POLICY "purchases_update" ON purchases
  FOR UPDATE
  USING (family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid()));

-- 7. GRADES — исправить политики
DROP POLICY IF EXISTS "grades_select" ON grades;
DROP POLICY IF EXISTS "grades_insert" ON grades;

CREATE POLICY "grades_select" ON grades
  FOR SELECT
  USING (family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "grades_insert" ON grades
  FOR INSERT
  WITH CHECK (family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid()));

-- 8. LIKES — исправить политики
DROP POLICY IF EXISTS "likes_select" ON likes;
DROP POLICY IF EXISTS "likes_insert" ON likes;

CREATE POLICY "likes_select" ON likes
  FOR SELECT
  USING (family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "likes_insert" ON likes
  FOR INSERT
  WITH CHECK (
    family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid())
    AND from_user_id = auth.uid()
  );

-- 9. X2_ACTIVATIONS — исправить политики
DROP POLICY IF EXISTS "x2_all" ON x2_activations;
DROP POLICY IF EXISTS "x2_select" ON x2_activations;
DROP POLICY IF EXISTS "x2_insert" ON x2_activations;

CREATE POLICY "x2_select" ON x2_activations
  FOR SELECT
  USING (family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "x2_insert" ON x2_activations
  FOR INSERT
  WITH CHECK (
    family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid())
    AND child_id = auth.uid()
  );

-- 10. SYSTEM_LOG — исправить политики
DROP POLICY IF EXISTS "log_select" ON system_log;
DROP POLICY IF EXISTS "log_insert" ON system_log;

CREATE POLICY "log_select" ON system_log
  FOR SELECT
  USING (family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "log_insert" ON system_log
  FOR INSERT
  WITH CHECK (family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid()));

-- Отчёт
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Миграция 004 завершена!';
  RAISE NOTICE 'RLS политики обновлены для всех таблиц';
  RAISE NOTICE '========================================';
END $$;
