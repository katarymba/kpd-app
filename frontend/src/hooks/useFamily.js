import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { getFamilyMembers } from '../utils/auth'

export function useFamily(profile) {
  const [family, setFamily] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.family_id) {
      setLoading(false)
      return
    }

    loadFamily()

    // Realtime подписка на изменения профилей семьи
    const channel = supabase
      .channel(`family:${profile.family_id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `family_id=eq.${profile.family_id}`
      }, () => {
        loadFamily()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.family_id])

  async function loadFamily() {
    if (!profile?.family_id) return
    setLoading(true)
    try {
      const [membersData, { data: familyData }] = await Promise.all([
        getFamilyMembers(profile.family_id),
        supabase.from('families').select('*').eq('id', profile.family_id).single()
      ])
      setMembers(membersData || [])
      setFamily(familyData)
    } catch (err) {
      console.error('useFamily error:', err)
    } finally {
      setLoading(false)
    }
  }

  return { family, members, loading, refresh: loadFamily }
}
