import { supabase } from './supabase'
import { addPoints } from './points'
import { isX2Active } from './x2'

// Получить все активные задания семьи
export async function getTasks(familyId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, profiles!tasks_assigned_to_fkey(name, avatar)')
    .eq('family_id', familyId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// Получить задания с сегодняшним статусом для ребёнка
export async function getTasksWithStatus(familyId, childId) {
  const today = new Date().toISOString().split('T')[0]
  const [tasksResult, completionsResult] = await Promise.all([
    supabase
      .from('tasks')
      .select('*')
      .eq('family_id', familyId)
      .eq('is_active', true)
      .or(`assigned_to.eq.${childId},assigned_to.is.null`)
      .order('created_at', { ascending: false }),
    supabase
      .from('task_completions')
      .select('*')
      .eq('family_id', familyId)
      .eq('child_id', childId)
      .gte('completed_at', today + 'T00:00:00')
  ])
  if (tasksResult.error) throw tasksResult.error

  const completions = completionsResult.data || []
  return (tasksResult.data || []).map(task => {
    const completion = completions.find(c => c.task_id === task.id)
    return {
      ...task,
      status: completion?.status || 'pending',
      completion_id: completion?.id || null
    }
  })
}

// Создать задание
export async function createTask(taskData) {
  const { data, error } = await supabase
    .from('tasks')
    .insert(taskData)
    .select()
    .single()
  if (error) throw error
  return data
}

// Редактировать задание
export async function updateTask(taskId, updates) {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single()
  if (error) throw error
  return data
}

// Мягкое удаление задания
export async function deleteTask(taskId) {
  const { error } = await supabase
    .from('tasks')
    .update({ is_active: false })
    .eq('id', taskId)
  if (error) throw error
}

// Ребёнок отметил задание выполненным → создаёт task_completion со status='pending'
export async function completeTask(taskId, childId, familyId) {
  const { data, error } = await supabase
    .from('task_completions')
    .insert({
      task_id: taskId,
      child_id: childId,
      family_id: familyId,
      status: 'pending'
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// Взрослый подтверждает задание → начисляет баллы с учётом X2
export async function confirmCompletion(completionId, reviewedBy, familyId) {
  const { data: completion, error: fetchError } = await supabase
    .from('task_completions')
    .select('*, tasks(points, title, category)')
    .eq('id', completionId)
    .single()
  if (fetchError) throw fetchError

  const { error: updateError } = await supabase
    .from('task_completions')
    .update({
      status: 'confirmed',
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewedBy
    })
    .eq('id', completionId)
  if (updateError) throw updateError

  const task = completion.tasks
  let points = task.points
  let isX2 = false

  const x2Active = await isX2Active(familyId, completion.child_id)
  if (x2Active) {
    points = points * 2
    isX2 = true
  }

  await addPoints({
    familyId,
    userId: completion.child_id,
    amount: points,
    source: 'task',
    description: `Задание: ${task.title}`,
    createdBy: reviewedBy,
    isX2,
    relatedId: completionId
  })

  return completion
}

// Взрослый отклоняет задание
export async function rejectCompletion(completionId, reviewedBy, reason) {
  const { error } = await supabase
    .from('task_completions')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewedBy,
      rejection_reason: reason
    })
    .eq('id', completionId)
  if (error) throw error
}

// Список ожидающих подтверждения
export async function getPendingCompletions(familyId) {
  const { data, error } = await supabase
    .from('task_completions')
    .select('*, tasks(title, points, category), profiles!task_completions_child_id_fkey(name, avatar)')
    .eq('family_id', familyId)
    .eq('status', 'pending')
    .order('completed_at', { ascending: true })
  if (error) throw error
  return data
}
