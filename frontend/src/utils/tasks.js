import { supabase } from './supabase'

export async function getTasks(familyId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createTask(task) {
  const { data, error } = await supabase
    .from('tasks')
    .insert(task)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function completeTask(taskId) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ status: 'done' })
    .eq('id', taskId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function confirmTask(taskId, childId, familyId, points, createdBy) {
  await supabase.from('tasks').update({ status: 'confirmed' }).eq('id', taskId)

  await supabase.from('points').insert({
    family_id: familyId,
    child_id: childId,
    amount: points,
    source: 'task',
    description: 'Задание выполнено',
    created_by: createdBy
  })
}
