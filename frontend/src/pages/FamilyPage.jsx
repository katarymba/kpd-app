import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getFamilyMembers } from '../utils/auth'
import { supabase } from '../utils/supabase'

export default function FamilyPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [family, setFamily] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isAdult = profile?.role === 'adult'

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
      setMembers(membersData)
      setFamily(familyData)
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
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{family.name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: isAdult ? 16 : 0 }}>
                {members.length} участников
              </div>

              {isAdult && (
                <div>
                  <div className="label" style={{ marginBottom: 8 }}>Код для приглашения</div>
                  <div className="invite-code-box">
                    <div className="invite-code">{family.invite_code}</div>
                    <p className="invite-code-hint">Поделись этим кодом с другими членами семьи</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="section-title">Участники</div>
          {members.map(member => (
            <div key={member.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 32 }}>{member.avatar || '👤'}</div>
              <div>
                <div style={{ fontWeight: 700 }}>{member.name}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  {member.role === 'adult' ? '👩 Взрослый' : '👦 Ребёнок'}
                  {member.id === profile.id ? ' · Это ты' : ''}
                </div>
              </div>
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

