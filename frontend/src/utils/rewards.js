import { supabase } from './supabase'
import { getBalance, addPoints } from './points'
import { logAction } from './log'

// Получить доступные награды
export async function getRewards(familyId) {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('family_id', familyId)
    .eq('is_available', true)
    .order('cost', { ascending: true })
  if (error) throw error
  return data
}

// Все награды (включая скрытые) для управления
export async function getAllRewards(familyId) {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('family_id', familyId)
    .order('cost', { ascending: true })
  if (error) throw error
  return data
}

// Создать награду
export async function createReward(rewardData) {
  const { data, error } = await supabase
    .from('rewards')
    .insert(rewardData)
    .select()
    .single()
  if (error) throw error
  return data
}

// Редактировать награду
export async function updateReward(rewardId, updates) {
  const { data, error } = await supabase
    .from('rewards')
    .update(updates)
    .eq('id', rewardId)
    .select()
    .single()
  if (error) throw error
  return data
}

// Удалить награду (скрыть)
export async function deleteReward(rewardId) {
  const { error } = await supabase
    .from('rewards')
    .update({ is_available: false })
    .eq('id', rewardId)
  if (error) throw error
}

// Купить награду
export async function buyReward(rewardId, childId, familyId) {
  const { data: reward, error: rewardError } = await supabase
    .from('rewards')
    .select('*')
    .eq('id', rewardId)
    .single()
  if (rewardError || !reward) throw new Error('Награда не найдена')
  if (!reward.is_available) throw new Error('Награда недоступна')

  const balance = await getBalance(childId)
  if (balance < reward.cost) throw new Error(`Недостаточно баллов. Нужно ${reward.cost}, есть ${balance}`)

  if (reward.stock !== null && reward.stock !== undefined && reward.stock <= 0) {
    throw new Error('Награда закончилась')
  }

  // Списать баллы
  await addPoints({
    familyId,
    userId: childId,
    amount: -reward.cost,
    source: 'purchase',
    description: `Покупка: ${reward.title}`,
    createdBy: childId
  })

  // Уменьшить stock если ограничен
  if (reward.stock !== null && reward.stock !== undefined) {
    await supabase
      .from('rewards')
      .update({ stock: reward.stock - 1 })
      .eq('id', rewardId)
  }

  // Создать покупку
  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .insert({
      reward_id: rewardId,
      reward_title: reward.title,
      child_id: childId,
      family_id: familyId,
      cost_paid: reward.cost,
      status: 'pending'
    })
    .select()
    .single()
  if (purchaseError) throw purchaseError

  await logAction({
    familyId,
    userId: childId,
    action: 'purchase',
    details: { reward_id: rewardId, reward_title: reward.title, cost: reward.cost }
  })

  return purchase
}

// Список ожидающих покупок для взрослых
export async function getPendingPurchases(familyId) {
  const { data, error } = await supabase
    .from('purchases')
    .select('*, profiles!purchases_child_id_fkey(name, avatar)')
    .eq('family_id', familyId)
    .eq('status', 'pending')
    .order('purchased_at', { ascending: false })
  if (error) throw error
  return data
}

// Взрослый подтвержд��ет выдачу награды
export async function approvePurchase(purchaseId, approvedBy) {
  const { data, error } = await supabase
    .from('purchases')
    .update({
      status: 'delivered',
      approved_by: approvedBy,
      approved_at: new Date().toISOString()
    })
    .eq('id', purchaseId)
    .select()
    .single()
  if (error) throw error
  return data
}