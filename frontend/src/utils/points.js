import { supabase } from './supabase'

// Получить баланс ребёнка
export async function getBalance(childId) {
  const { data, error } = await supabase
    .from('points')
    .select('amount')
    .eq('child_id', childId)
  if (error) throw error
  return data.reduce((sum, p) => sum + p.amount, 0)
}

// История баллов
export async function getHistory(familyId, limit = 50) {
  const { data, error } = await supabase
    .from('points')
    .select('*, profiles!points_child_id_fkey(name), profiles!points_created_by_fkey(name)')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

// Начислить баллы вручную
export async function addPoints({ familyId, childId, amount, description, createdBy, category = 'manual' }) {
  const { data, error } = await supabase
    .from('points')
    .insert({
      family_id: familyId,
      child_id: childId,
      amount,
      source: 'manual',
      category,
      description,
      created_by: createdBy
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// Баллы за неделю по дням и категориям
export async function getWeeklyPoints(childId) {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { data, error } = await supabase
    .from('points')
    .select('amount, category, created_at')
    .eq('child_id', childId)
    .gte('created_at', weekAgo.toISOString())
  if (error) throw error
  return data
}
