import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getFamilyMembers } from '../utils/auth'
import { getBalance } from '../utils/points'
import { supabase } from '../utils/supabase'

const isAdultRole = (role) => role === 'admin' || role === 'adult'

const ROLE_LABELS = {
  admin: '👑 Администратор',
  adult: '👩 Взрослый',
  child: '👦 Ребёнок'
}

export default function FamilyPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [family, setFamily] = useState(null)
  const [members, setMembers] = useState([])
  const [balances, setBalances] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const isAdult = profile && isAdultRole(profile.role)
  const isAdmin = profile?.role === 'admin'

  useEffect(() => {
    if (profile?.family_id) loadFamily()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  async function loadFamily() {
    setLoading(true)
    setError('')
    try {
      const [membersData, { data: familyData }] = await Promise.all([
        getFamilyMembers(profile.family_id),
        supabase.from('families').select('*').eq('id', profile.family_id).single()
      ])
      setMembers(membersData || [])
      setFamily(familyData)

      // Load balances for all members
      const balanceEntries = await Promise.all(
        (membersData || []).map(async m => {
          const bal = await getBalance(m.id)
          return [m.id, bal]
        })
      )
      setBalances(Object.fromEntries(balanceEntries))
    } catch {
      setError('Не удалось загрузить данные семьи.')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  async function handleCopyCode() {
    if (!family?.invite_code) return
    try {
      await navigator.clipboard.writeText(family.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for devices without clipboard API
      const el = document.createElement('textarea')
      el.value = family.invite_code
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleChangeRole(memberId, newRole) {
    if (!isAdmin) return
    try {
      await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', memberId)
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m))
    } catch (err) {
      setError('Ошибка изменения роли: ' + (err.message || ''))
    }
  }

  return (
    <>
      <h2 style={{ marginBottom: 16 }}>Семья</h2>

      {error && (
        <div style={{ color: 'var(--danger)', marginBottom: 12, fontSize: 14 }}>{error}</div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, fontSize: 32 }}>⭐</div>
      ) : (
        <>
          {family && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 4 }}>{family.name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
                {members.length} участников
              </div>

              {isAdult && (
                <div>
                  <div className="label" style={{ marginBottom: 8 }}>Код для приглашения</div>
                  <div style={{
                    background: 'var(--bg-secondary)', borderRadius: 12, padding: '16px 20px',
                    textAlign: 'center', marginBottom: 8
                  }}>
                    <div style={{
                      fontFamily: 'monospace', fontSize: 28, fontWeight: 900,
                      letterSpacing: 4, color: 'var(--primary)'
                    }}>
                      {family.invite_code}
                    </div>
                  </div>
                  <button
                    className={copied ? 'btn-secondary' : 'btn-primary'}
                    style={{ width: '100%' }}
                    onClick={handleCopyCode}
                  >
                    {copied ? '✅ Скопировано!' : '📋 Копировать код'}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="section-title">Участники</div>
          {members.map(member => (
            <div key={member.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 32 }}>{member.avatar || '👤'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {member.name}
                  {member.id === profile.id && (
                    <span style={{ fontSize: 11, background: 'var(--primary)', color: 'white', borderRadius: 8, padding: '1px 6px' }}>
                      Ты
                    </span>
                  )}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  {ROLE_LABELS[member.role] || member.role}
                </div>
                {balances[member.id] !== undefined && (
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>
                    ⭐ {balances[member.id]}
                  </div>
                )}
              </div>
              {isAdmin && member.id !== profile.id && (
                <select
                  value={member.role}
                  onChange={e => handleChangeRole(member.id, e.target.value)}
                  style={{
                    border: '1px solid var(--border)', borderRadius: 8, padding: '4px 8px',
                    fontSize: 12, background: 'white', cursor: 'pointer'
                  }}
                >
                  <option value="admin">👑 Админ</option>
                  <option value="adult">👩 Взрослый</option>
                  <option value="child">👦 Ребёнок</option>
                </select>
              )}
            </div>
          ))}

          <button
            className="btn-ghost"
            style={{ marginTop: 24 }}
            onClick={handleLogout}
          >
            Выйти из аккаунта
          </button>
        </>
      )}
    </>
  )
}
