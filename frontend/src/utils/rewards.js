import { supabase } from './supabase'

export async function getRewards(familyId) {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('family_id', familyId)
    .eq('is_available', true)
  if (error) throw error
  return data
}

export async function createReward(reward) {
  const { data, error } = await supabase
    .from('rewards')
    .insert(reward)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function buyReward(rewardId, childId, familyId, cost) {
  const { error: pointsError } = await supabase.from('points').insert({
    family_id: familyId,
    child_id: childId,
    amount: -cost,
    source: 'manual',
    description: 'Покупка в магазине'
  })
  if (pointsError) throw pointsError

  const { data, error } = await supabase
    .from('purchases')
    .insert({ reward_id: rewardId, child_id: childId, family_id: familyId, cost_paid: cost })
    .select()
    .single()
  if (error) throw error
  return data
}
