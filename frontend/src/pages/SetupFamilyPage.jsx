import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getCurrentUser,
  setCurrentUser,
  addFamily,
  updateUser,
  updateFamily,
  findFamilyByCode,
  generateId,
  generateInviteCode,
} from '../utils/storage'

export default function SetupFamilyPage() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const isAdult = user?.role === 'adult'

  const [familyName, setFamilyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')

  const handleCreateFamily = (e) => {
    e.preventDefault()
    setError('')

    if (!familyName.trim()) {
      setError('Введите название семьи')
      return
    }

    const code = generateInviteCode()
    const family = {
      id: generateId('fam'),
      name: familyName.trim(),
      inviteCode: code,
      createdBy: user.id,
      members: [user.id],
      createdAt: new Date().toISOString().slice(0, 10),
    }

    addFamily(family)
    updateUser(user.id, { familyId: family.id })
    setCurrentUser({ ...user, familyId: family.id })
    navigate('/app/home')
  }

  const handleJoinFamily = (e) => {
    e.preventDefault()
    setError('')

    const code = inviteCode.trim().toUpperCase()
    if (!code) {
      setError('Введите код приглашения')
      return
    }

    const family = findFamilyByCode(code)
    if (!family) {
      setError('Семья с таким кодом не найдена')
      return
    }

    const updatedMembers = family.members.includes(user.id)
      ? family.members
      : [...family.members, user.id]

    updateFamily(family.id, { members: updatedMembers })
    updateUser(user.id, { familyId: family.id })
    setCurrentUser({ ...user, familyId: family.id })
    navigate('/app/home')
  }

  return (
    <div className="auth-page" style={{ paddingTop: 48 }}>
      {isAdult ? (
        <>
          <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>🏠</div>
          <h1 className="auth-title" style={{ textAlign: 'center' }}>Создай свою семью</h1>

          <form onSubmit={handleCreateFamily}>
            <div className="form-group">
              <label className="form-label" htmlFor="familyName">Название семьи</label>
              <input
                id="familyName"
                className="form-input"
                type="text"
                value={familyName}
                onChange={e => setFamilyName(e.target.value)}
                placeholder="Семья Ивановых..."
              />
            </div>

            {error && <div className="form-error">{error}</div>}

            <div style={{ marginTop: 24 }}>
              <button type="submit" className="btn-primary">Создать семью</button>
            </div>
          </form>
        </>
      ) : (
        <>
          <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>🔑</div>
          <h1 className="auth-title" style={{ textAlign: 'center' }}>Введи код семьи</h1>

          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
            Попроси взрослого показать код приглашения
          </p>

          <form onSubmit={handleJoinFamily}>
            <div className="form-group">
              <label className="form-label" htmlFor="inviteCode">Код приглашения</label>
              <input
                id="inviteCode"
                className="form-input"
                type="text"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
                placeholder="KPD-XXXX"
                style={{ textAlign: 'center', letterSpacing: 4, fontSize: 20, fontWeight: 900 }}
              />
            </div>

            {error && <div className="form-error">{error}</div>}

            <div style={{ marginTop: 24 }}>
              <button type="submit" className="btn-primary">Вступить в семью</button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}
