import { supabase } from './supabase'
import { addPoints, addPenalty } from './points'

// Добавить оценку и начислить/снять баллы
export async function addGrade({ childId, familyId, subject, grade, enteredBy, familySettings = {} }) {
  const gradePoints = {
    5: familySettings.grade_5_points ?? 8,
    4: familySettings.grade_4_points ?? 5,
    3: familySettings.grade_3_points ?? 0,
    2: familySettings.grade_2_penalty ?? -5
  }

  const pointsChange = gradePoints[grade] ?? 0

  const { data, error } = await supabase
    .from('grades')
    .insert({
      child_id: childId,
      family_id: familyId,
      subject,
      grade,
      points_change: pointsChange,
      entered_by: enteredBy
    })
    .select()
    .single()
  if (error) throw error

  if (pointsChange > 0) {
    await addPoints({
      familyId,
      userId: childId,
      amount: pointsChange,
      source: 'grade',
      description: `Оценка ${grade} по предмету ${subject}`,
      createdBy: enteredBy,
      relatedId: data.id
    })
  } else if (pointsChange < 0) {
    await addPenalty({
      familyId,
      userId: childId,
      amount: Math.abs(pointsChange),
      description: `Оценка ${grade} по предмету ${subject}`,
      createdBy: enteredBy
    })
  }

  return data
}

// История оценок ребёнка
export async function getGrades(childId) {
  const { data, error } = await supabase
    .from('grades')
    .select('*')
    .eq('child_id', childId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}
