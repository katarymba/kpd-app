import { supabase } from './supabase'

// Регистрация
export async function register({ name, email, password, role }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role }
    }
  })
  if (error) throw error

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: data.user.id,
      name,
      role,
      family_id: null
    })
  if (profileError) throw profileError

  return data.user
}

// Вход
export async function login({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) throw error
  return data.user
}

// Выход
export async function logout() {
  await supabase.auth.signOut()
}

// Получить профиль текущего пользователя
export async function getCurrentProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

// Создать семью (создатель становится admin)
export async function createFamily(name, userId) {
  const inviteCode = 'KPD-' + Math.random().toString(36).substring(2, 6).toUpperCase()

  const { data: family, error } = await supabase
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

// Вступить в семью по коду
export async function joinFamily(inviteCode, userId) {
  const { data: family, error } = await supabase
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

// Получить членов семьи
export async function getFamilyMembers(familyId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}
