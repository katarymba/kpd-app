import { supabase } from './supabase'
import { addPoints } from './points'

// Отправить лайк
export async function sendLike({ fromUserId, toUserId, familyId, isSuper = false, familySettings = {} }) {
  if (fromUserId === toUserId) throw new Error('Нельзя лайкать самого себя')

  const likePoints = isSuper
    ? (familySettings.super_like_points ?? 10)
    : (familySettings.like_points ?? 2)

  const dailyLimit = familySettings.like_daily_limit ?? 5
  const sameDailyLimit = familySettings.like_same_person_daily_limit ?? 3
  const superDailyLimit = familySettings.super_like_daily_limit ?? 2

  const today = new Date().toISOString().split('T')[0]

  // Проверка общего дневного лимита
  const { count: totalCount } = await supabase
    .from('likes')
    .select('id', { count: 'exact', head: true })
    .eq('from_user_id', fromUserId)
    .gte('created_at', today + 'T00:00:00')

  if ((totalCount || 0) >= dailyLimit) {
    throw new Error(`Дневной лимит лайков исчерпан (${dailyLimit} в день)`)
  }

  // Проверка лимита одному человеку
  const { count: sameCount } = await supabase
    .from('likes')
    .select('id', { count: 'exact', head: true })
    .eq('from_user_id', fromUserId)
    .eq('to_user_id', toUserId)
    .gte('created_at', today + 'T00:00:00')

  if ((sameCount || 0) >= sameDailyLimit) {
    throw new Error(`Лимит лайков одному человеку исчерпан (${sameDailyLimit} в день)`)
  }

  // Проверка лимита супер-лайков
  if (isSuper) {
    const { count: superCount } = await supabase
      .from('likes')
      .select('id', { count: 'exact', head: true })
      .eq('from_user_id', fromUserId)
      .eq('is_super', true)
      .gte('created_at', today + 'T00:00:00')

    if ((superCount || 0) >= superDailyLimit) {
      throw new Error(`Лимит супер-лайков исчерпан (${superDailyLimit} в день)`)
    }
  }

  // Записать лайк
  const { data: like, error } = await supabase
    .from('likes')
    .insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      family_id: familyId,
      is_super: isSuper,
      points: likePoints
    })
    .select()
    .single()
  if (error) throw error

  // Начислить баллы получателю (только если ребёнок)
  const { data: recipient } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', toUserId)
    .single()

  if (recipient?.role === 'child') {
    await addPoints({
      familyId,
      userId: toUserId,
      amount: likePoints,
      source: 'like',
      description: isSuper ? '💫 Супер-лайк' : '👍 Лайк',
      createdBy: fromUserId,
      relatedId: like.id
    })
  }

  return like
}

// Сколько лайков поставил сегодня
export async function getTodayLikesCount(fromUserId) {
  const today = new Date().toISOString().split('T')[0]
  const { count } = await supabase
    .from('likes')
    .select('id', { count: 'exact', head: true })
    .eq('from_user_id', fromUserId)
    .gte('created_at', today + 'T00:00:00')
  return count || 0
}

// Полученные лайки пользователя
export async function getLikesReceived(userId, familyId) {
  const { data, error } = await supabase
    .from('likes')
    .select('*, profiles!likes_from_user_id_fkey(name, avatar)')
    .eq('to_user_id', userId)
    .eq('family_id', familyId)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return data
}
