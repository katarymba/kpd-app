import { supabase } from './supabase'

// Записать действие в системный лог
export async function logAction({ familyId, userId, action, details }) {
  const { error } = await supabase
    .from('system_log')
    .insert({
      family_id: familyId,
      user_id: userId,
      action,
      details
    })
  if (error) console.error('Log error:', error)
}
