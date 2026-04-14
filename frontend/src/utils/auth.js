import { supabase } from './supabase'

/**
 * Регистрация пользователя.
 * 1) Создаём пользователя в Supabase Auth
 * 2) Создаём профиль в таблице profiles
 */
export async function register({ name, email, password, role }) {
  // 1. Регистрация в Auth
  const {
    data: { user },
    error: signUpError,
  } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Эти данные попадут в auth.users -> raw_user_meta_data
      data: { name, role },
    },
  })

  if (signUpError) {
    throw signUpError
  }

  if (!user?.id) {
    throw new Error('Не удалось создать пользователя. Попробуй ещё раз.')
  }

  // 2. Создание профиля.
  // Важно: id профиля должен совпадать с auth.uid(), иначе RLS не пропустит.
  const { error: profileError } = await supabase.from('profiles').insert({
    id: user.id,
    name,
    role,
    family_id: null,
  })

  if (profileError) {
    // Здесь как раз может быть "new row violates row-level security policy..."
    throw profileError
  }

  return user
}

/**
 * Вход пользователя по email / password.
 */
export async function login({ email, password }) {
  const {
    data,
    error,
  } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  // В v2 supabase-js user лежит в data.user
  return data.user
}

/**
 * Выход пользователя.
 */
export async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Получить профиль текущего пользователя (по auth.getUser()).
 */
export async function getCurrentProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    return null
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) {
    throw profileError
  }

  return profile
}

/**
 * Создать семью (создатель становится admin).
 */
export async function createFamily(name, userId) {
  const inviteCode =
    'KPD-' + Math.random().toString(36).substring(2, 6).toUpperCase()

  const {
    data: family,
    error,
  } = await supabase
    .from('families')
    .insert({ name, invite_code: inviteCode, created_by: userId })
    .select()
    .single()

  if (error) {
    throw error
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ family_id: family.id, role: 'admin' })
    .eq('id', userId)

  if (updateError) {
    throw updateError
  }

  return family
}

/**
 * Вступить в семью по коду.
 */
export async function joinFamily(inviteCode, userId) {
  const {
    data: family,
    error,
  } = await supabase
    .from('families')
    .select('*')
    .eq('invite_code', inviteCode.toUpperCase())
    .single()

  if (error || !family) {
    throw new Error('Семья не найдена. Проверь код.')
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ family_id: family.id })
    .eq('id', userId)

  if (updateError) {
    throw updateError
  }

  return family
}

/**
 * Получить всех членов семьи.
 */
export async function getFamilyMembers(familyId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return data
}