import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function loadProfile(userId, retryCount = 0) {
    console.log(`loadProfile for ${userId} (attempt ${retryCount + 1})`)

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('loadProfile error:', error)
        setError(error)
      }

      if (data) {
        setProfile(data)
        setError(null)
        return true
      }

      // Если профиля нет и есть ещё попытки — подождать и повторить
      if (!data && retryCount < 3) {
        console.log('Profile not found, retrying...')
        await new Promise(resolve => setTimeout(resolve, 1000))
        return loadProfile(userId, retryCount + 1)
      }

      // Если после 3 попыток профиля нет — это ошибка
      if (!data && retryCount >= 3) {
        console.error('Profile not found after 3 attempts')
        setError(new Error('Профиль не найден'))
        setProfile(null)
      }

      return false
    } catch (err) {
      console.error('loadProfile exception:', err)
      setError(err)
      setProfile(null)
      return false
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true

    // Начальная загрузка сессии
    supabase.auth.getSession()
      .then(({ data: { session }, error: sessionError }) => {
        if (!mounted) return

        if (sessionError) {
          console.error('getSession error:', sessionError)
          setError(sessionError)
          setLoading(false)
          return
        }

        console.log('Initial session:', session?.user?.id)

        if (session?.user) {
          setUser(session.user)
          loadProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!mounted) return
        console.error('getSession exception:', err)
        setError(err)
        setLoading(false)
      })

    // Подписка на изменения авторизации
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      console.log('Auth state changed:', event, session?.user?.id)

      if (session?.user) {
        setUser(session.user)
        setLoading(true)
        await loadProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
        setError(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { user, profile, loading, error }
}