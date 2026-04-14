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

// Получить текущего пользователя с профилем
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

// Создать семью
export async function createFamily(name, userId) {
  const inviteCode = 'KPD-' + Math.random().toString(36).substr(2, 4).toUpperCase()

  const { data: family, error } = await supabase
    .from('families')
    .insert({ name, invite_code: inviteCode, created_by: userId })
    .select()
    .single()
  if (error) throw error

  await supabase
    .from('profiles')
    .update({ family_id: family.id })
    .eq('id', userId)

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

  await supabase
    .from('profiles')
    .update({ family_id: family.id })
    .eq('id', userId)

  return family
}

// Получить членов семьи
export async function getFamilyMembers(familyId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('family_id', familyId)
  if (error) throw error
  return data
}
