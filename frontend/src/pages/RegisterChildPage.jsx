import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { translateSupabaseError } from '../utils/errorMessages'

function buildTechLogin(name) {
  const baseSlug = name
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    // Убираем combining diacritical marks (Unicode U+0300–U+036F), чтобы получить безопасный ASCII-slug для технического email.
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'child'

  const timestamp = Date.now()
  const techEmail = `${baseSlug}-${timestamp}@kpd.internal`
  const randomBytes = new Uint8Array(32)
  crypto.getRandomValues(randomBytes)
  // 32 случайных байта превращаются в 64-символьный hex-пароль для технического входа ребёнка.
  const techPassword = Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, '0')).join('')

  return { techEmail, techPassword }
}

export default function RegisterChildPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function validateForm() {
    if (!name.trim()) {
      setError('👤 Введи своё имя')
      return false
    }
    if (name.trim().length < 2) {
      setError('👤 Имя должно быть не менее 2 символов')
      return false
    }
    if (!inviteCode.trim()) {
      setError('🔑 Введи код семьи')
      return false
    }
    if (inviteCode.trim().length < 5) {
      setError('🔑 Код семьи неправильный (должен быть вида KPD-XXXX)')
      return false
    }
    return true
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const normalizedInviteCode = inviteCode.trim().toUpperCase()

      const { data: familyRows, error: familyError } = await supabase.rpc('get_family_by_invite_code', {
        p_invite_code: normalizedInviteCode,
      })

      if (familyError) {
        throw new Error(translateSupabaseError(familyError))
      }

      const family = familyRows?.[0]
      if (!family?.id) {
        throw new Error('🔍 Семья с таким кодом не найдена. Проверь код.')
      }

      const { techEmail, techPassword } = buildTechLogin(name)

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: techEmail,
        password: techPassword,
        options: {
          data: { name: name.trim(), role: 'child' },
        },
      })

      if (signUpError) {
        throw new Error(translateSupabaseError(signUpError))
      }

      const user = authData?.user
      if (!user?.id) {
        throw new Error('Не удалось создать аккаунт. Попробуй снова.')
      }

      // Небольшая пауза нужна, чтобы auth.users и триггеры успели завершить регистрацию до RPC.
      await new Promise(resolve => setTimeout(resolve, 1000))

      let completeRegistrationError = null
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const { error } = await supabase.rpc('complete_child_registration', {
          p_user_id: user.id,
          p_family_id: family.id,
          p_tech_email: techEmail,
          p_tech_password: techPassword,
        })
        completeRegistrationError = error

        if (!completeRegistrationError) break
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 400))
        }
      }

      if (completeRegistrationError) {
        const { data: existingProfile, error: profileLookupError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()

        if (profileLookupError) {
          throw new Error(translateSupabaseError(profileLookupError))
        }

        if (!existingProfile) {
          const { error: profileInsertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              name: name.trim(),
              role: 'child',
              family_id: family.id,
              avatar: '👤',
              tech_email: techEmail,
              tech_password: techPassword,
            })

          if (profileInsertError) {
            throw new Error(translateSupabaseError(profileInsertError))
          }
        }
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: techEmail,
        password: techPassword,
      })

      if (signInError) {
        throw new Error(translateSupabaseError(signInError))
      }

      navigate('/app/home')
    } catch (err) {
      console.error('Register child error', err)
      setError(err.message || 'Ошибка регистрации. Попробуй снова.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container auth-page">
      <div className="auth-surface">
        <button type="button" className="auth-back" onClick={() => navigate('/register')}>
          ←
        </button>

        <div className="auth-header auth-header-left">
          <div className="auth-hero">👦</div>
          <h1>Регистрация ребёнка</h1>
          <p className="auth-subtitle">Введи своё имя и семейный код от взрослого.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Как тебя зовут?</label>
            <input
              type="text"
              className="form-input"
              placeholder="Например: Саша"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Код семьи</label>
            <input
              type="text"
              className="form-input form-input-uppercase"
              placeholder="KPD-XXXX"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              required
            />
            <p className="auth-helper">Попроси код у мамы или папы.</p>
          </div>

          {error && <div className="auth-status auth-status-error">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '⏳ Присоединяюсь...' : 'Присоединиться к семье'}
          </button>
        </form>

        <p className="auth-switch-link">
          Уже зарегистрирован?{' '}
          <Link to="/login">
            Войти
          </Link>
        </p>
      </div>
    </div>
  )
}
