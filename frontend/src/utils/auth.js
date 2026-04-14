import { supabase } from './supabase'

/**
 * Регистрация пользователя.
 * 1) Создаём пользователя в Supabase Auth (signUp)
 * 2) Получаем актуальную сессию и user.id
 * 3) Создаём профиль в таблице profiles с id === auth.uid()
 */
export async function register({ name, email, password, role }) {
  // 1. Регистрируем пользователя
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role },
    },
  })

  if (signUpError) {
    throw signUpError
  }

  // user может быть в data.user или data.session.user
  const signupUser = data?.user ?? data?.session?.user
  if (!signupUser?.id) {
    throw new Error('Не удалось получить пользователя после регистрации.')
  }

  // 2. Гарантируем, что сессия подхвачена и auth.uid() установлен
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession()

  if (sessionError) {
    throw sessionError
  }

  const sessionUser = sessionData?.session?.user
  const effectiveUserId = sessionUser?.id ?? signupUser.id

  if (!effectiveUserId) {
    throw new Error('Не удалось получить ID текущего пользователя.')
  }

  // 3. Создаём профиль. ВАЖНО: id === auth.uid(), иначе RLS не пустит.
  const { error: profileError } = await supabase.from('profiles').insert({
    id: effectiveUserId,
    name,
    role,
    family_id: null,
  })

  if (profileError) {
    // Чтобы было проще дебажить, логируем в консоль
    console.error('Profile insert error', profileError)
    throw profileError
  }

  return { userId: effectiveUserId }
}

/**
 * Вход по email и паролю.
 */
export async function login({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data.user
}

/**
 * Выход.
 */
export async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Текущий профиль пользователя.
 */
export async function getCurrentProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) return null

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) throw profileError

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
  if (error) throw error

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ family_id: family.id, role: 'admin' })
    .eq('id', userId)
  if (updateError) throw updateError

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

  if (error || !family) throw new Error('Семья не найдена. Проверь код.')

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ family_id: family.id })
    .eq('id', userId)
  if (updateError) throw updateError

  return family
}

/**
 * Все члены семьи.
 */
export async function getFamilyMembers(familyId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}