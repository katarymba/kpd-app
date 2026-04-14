import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId) {
    console.log('loadProfile for', userId)
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('loadProfile error', error)
      }

      setProfile(data || null)
    } catch (err) {
      console.error('loadProfile exception', err)
      setProfile(null)
    } finally {
      // КРИТИЧНО: всегда ставим loading = false
      setLoading(false)
    }
  }

  useEffect(() => {
    // Начальная загрузка сессии
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session', session)
      if (session?.user) {
        setUser(session.user)
        loadProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
        setLoading(false) // КРИТИЧНО: если нет сессии — убираем loader
      }
    }).catch((err) => {
      console.error('getSession error', err)
      setLoading(false) // КРИТИЧНО: при ошибке тоже убираем loader
    })

    // Подписка на изменения авторизации
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed', event, session)

      if (session?.user) {
        setUser(session.user)
        await loadProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, profile, loading }
}