import { supabase } from './supabase'
import { translateSupabaseError } from './errorMessages'

/**
 * Регистрация пользователя.
 */
export async function register({ name, email, password, role }) {
  try {
    // 1. Регистрируем пользователя
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
      },
    })

    if (signUpError) {
      throw new Error(translateSupabaseError(signUpError))
    }

    // 2. Проверяем, что пользователь создан
    const user = data?.user
    if (!user?.id) {
      throw new Error('Не удалось создать пользователя. Попробуй другой email.')
    }

    // 3. Небольшая пауза даёт Supabase время завершить создание пользователя
    // и установить сессию перед тем как мы попытаемся создать профиль.
    await new Promise(resolve => setTimeout(resolve, 500))

    // 4. Проверяем сессию
    const { data: sessionData } = await supabase.auth.getSession()
    const sessionUser = sessionData?.session?.user
    const userId = sessionUser?.id || user.id

    // 5. Создаём профиль (триггер должен создать автоматически, но на всякий случай проверяем)
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (!existingProfile) {
      // Пытаемся создать профиль вручную
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          name,
          role,
          family_id: null,
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        throw new Error(translateSupabaseError(profileError))
      }
    }

    return { userId }
  } catch (err) {
    // Если это уже переведённая ошибка, пробрасываем как есть
    if (err.message && (err.message.includes('🔒') || err.message.includes('⏱️') || err.message.includes('📧'))) {
      throw err
    }
    // Иначе переводим
    throw new Error(translateSupabaseError(err))
  }
}

/**
 * Вход по email и паролю.
 */
export async function login({ email, password }) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new Error(translateSupabaseError(error))
    }

    return data.user
  } catch (err) {
    if (err.message && err.message.includes('❌')) {
      throw err
    }
    throw new Error(translateSupabaseError(err))
  }
}

/**
 * Выход.
 */
export async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw new Error(translateSupabaseError(error))
  }
}

/**
 * Текущий профиль пользователя.
 */
export async function getCurrentProfile() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) throw new Error(translateSupabaseError(userError))
    if (!user) return null

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError && profileError.code !== 'PGRST116') {
      throw new Error(translateSupabaseError(profileError))
    }

    return profile
  } catch (err) {
    throw new Error(translateSupabaseError(err))
  }
}

/**
 * Создать семью (создатель становится admin).
 */
export async function createFamily(name, userId) {
  const inviteCode =
    'KPD-' + Math.random().toString(36).substring(2, 6).toUpperCase()

  const { data: family, error } = await supabase
    .from('families')
    .insert({ name, invite_code: inviteCode, created_by: userId })
    .select()
    .single()

  if (error) throw new Error(translateSupabaseError(error))

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ family_id: family.id, role: 'admin' })
    .eq('id', userId)

  if (updateError) throw new Error(translateSupabaseError(updateError))

  return family
}

/**
 * Вступить в семью по коду.
 */
export async function joinFamily(inviteCode, userId) {
  const { data: family, error } = await supabase
    .from('families')
    .select('*')
    .eq('invite_code', inviteCode.toUpperCase())
    .single()

  if (error || !family) {
    throw new Error('🔍 Семья не найдена. Проверь правильность кода.')
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ family_id: family.id })
    .eq('id', userId)

  if (updateError) throw new Error(translateSupabaseError(updateError))

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

  if (error) throw new Error(translateSupabaseError(error))
  return data
}