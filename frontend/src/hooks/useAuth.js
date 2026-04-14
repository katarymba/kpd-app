import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId) {
    console.log('loadProfile for', userId)

    const MAX_ATTEMPTS = 3

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle()

        if (error && error.code !== 'PGRST116') {
          console.error(`loadProfile attempt ${attempt} error`, error)
          if (attempt < MAX_ATTEMPTS) {
            await new Promise(resolve => setTimeout(resolve, 500 * attempt))
            continue
          }
          setProfile(null)
          return
        }

        setProfile(data || null)
        return
      } catch (err) {
        console.error(`loadProfile attempt ${attempt} exception`, err)
        if (attempt < MAX_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, 500 * attempt))
          continue
        }
        setProfile(null)
      }
    }
  }

  useEffect(() => {
    let cancelled = false

    // Начальная загрузка сессии
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return
      console.log('Initial session', session)
      if (session?.user) {
        setUser(session.user)
        await loadProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
      }
      if (!cancelled) setLoading(false)
    }).catch((err) => {
      if (cancelled) return
      console.error('getSession error', err)
      setLoading(false)
    })

    // Подписка на изменения авторизации
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return
      console.log('Auth state changed', event, session)

      if (session?.user) {
        setUser(session.user)
        await loadProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
      }
      if (!cancelled) setLoading(false)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return { user, profile, loading }
}