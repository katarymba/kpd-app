import { supabase } from './supabase'

// Активировать X2 для ребёнка
export async function activateX2({ familyId, childId, activatedBy, category = null, familySettings = {} }) {
  const weeklyLimit = familySettings.x2_weekly_limit ?? 2

  const weekCount = await getWeeklyX2Count(familyId, childId)
  if (weekCount >= weeklyLimit) {
    throw new Error(`Лимит X2 исчерпан на этой неделе (${weeklyLimit} раза)`)
  }

  const { data, error } = await supabase
    .from('x2_activations')
    .insert({
      family_id: familyId,
      child_id: childId,
      activated_by: activatedBy,
      category,
      active_date: new Date().toISOString().split('T')[0]
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// Проверить активен ли X2 сегодня
export async function isX2Active(familyId, childId) {
  const today = new Date().toISOString().split('T')[0]
  const { count } = await supabase
    .from('x2_activations')
    .select('id', { count: 'exact', head: true })
    .eq('family_id', familyId)
    .eq('child_id', childId)
    .eq('active_date', today)
  return (count || 0) > 0
}

// Сколько раз X2 активирован на этой неделе
export async function getWeeklyX2Count(familyId, childId) {
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const weekStartStr = weekStart.toISOString().split('T')[0]

  let query = supabase
    .from('x2_activations')
    .select('id', { count: 'exact', head: true })
    .eq('family_id', familyId)
    .gte('active_date', weekStartStr)

  if (childId) {
    query = query.eq('child_id', childId)
  }

  const { count } = await query
  return count || 0
}
