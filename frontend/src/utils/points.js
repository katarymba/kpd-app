import { supabase } from './supabase'

// Получить баланс пользователя
export async function getBalance(userId) {
  const { data, error } = await supabase
    .from('points')
    .select('amount')
    .eq('user_id', userId)
  if (error) throw error
  return (data || []).reduce((sum, p) => sum + p.amount, 0)
}

// История транзакций семьи
export async function getHistory(familyId, limit = 50) {
  const { data, error } = await supabase
    .from('points')
    .select('*, profiles!points_user_id_fkey(name)')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

// Начислить баллы
export async function addPoints({ familyId, userId, amount, description, source = 'manual', createdBy, isX2 = false, relatedId }) {
  const payload = {
    family_id: familyId,
    user_id: userId,
    amount,
    source,
    description,
    created_by: createdBy,
    is_x2: isX2
  }
  if (relatedId) payload.related_id = relatedId

  const { data, error } = await supabase
    .from('points')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

// Штраф (amount отрицательный), проверить лимит -50
export async function addPenalty({ familyId, userId, amount, description, createdBy }) {
  if (!description || description.trim() === '') {
    throw new Error('Комментарий обязателен при штрафе')
  }

  const currentBalance = await getBalance(userId)
  const penaltyAmount = amount > 0 ? -amount : amount
  if (currentBalance + penaltyAmount < -50) {
    throw new Error(`Нельзя начислить штраф: баланс не может быть ниже -50 (сейчас ${currentBalance})`)
  }

  const { data, error } = await supabase
    .from('points')
    .insert({
      family_id: familyId,
      user_id: userId,
      amount: penaltyAmount,
      source: 'penalty',
      description,
      created_by: createdBy
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// Статистика за неделю
export async function getWeeklyStats(childId) {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { data, error } = await supabase
    .from('points')
    .select('amount, source, created_at')
    .eq('user_id', childId)
    .gte('created_at', weekAgo.toISOString())
  if (error) throw error
  return data
}
