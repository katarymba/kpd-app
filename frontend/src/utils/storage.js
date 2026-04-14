// Получить текущего пользователя
export const getCurrentUser = () => {
  const u = localStorage.getItem('kpd_current_user')
  return u ? JSON.parse(u) : null
}

// Сохранить сессию
export const setCurrentUser = (user) => {
  localStorage.setItem('kpd_current_user', JSON.stringify(user))
}

// Выйти
export const logout = () => {
  localStorage.removeItem('kpd_current_user')
}

// Получить всех пользователей
export const getUsers = () => {
  const u = localStorage.getItem('kpd_users')
  return u ? JSON.parse(u) : []
}

// Добавить пользователя
export const addUser = (user) => {
  const users = getUsers()
  users.push(user)
  localStorage.setItem('kpd_users', JSON.stringify(users))
}

// Получить все семьи
export const getFamilies = () => {
  const f = localStorage.getItem('kpd_families')
  return f ? JSON.parse(f) : []
}

// Добавить семью
export const addFamily = (family) => {
  const families = getFamilies()
  families.push(family)
  localStorage.setItem('kpd_families', JSON.stringify(families))
}

// Найти семью по коду
export const findFamilyByCode = (code) => {
  return getFamilies().find(f => f.inviteCode === code)
}

// Найти семью по id
export const findFamilyById = (id) => {
  return getFamilies().find(f => f.id === id)
}

// Обновить пользователя
export const updateUser = (userId, updates) => {
  const users = getUsers()
  const idx = users.findIndex(u => u.id === userId)
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...updates }
    localStorage.setItem('kpd_users', JSON.stringify(users))
    // Если обновляем текущего пользователя — обновить сессию тоже
    const current = getCurrentUser()
    if (current && current.id === userId) {
      setCurrentUser({ ...current, ...updates })
    }
  }
}

// Обновить семью
export const updateFamily = (familyId, updates) => {
  const families = getFamilies()
  const idx = families.findIndex(f => f.id === familyId)
  if (idx !== -1) {
    families[idx] = { ...families[idx], ...updates }
    localStorage.setItem('kpd_families', JSON.stringify(families))
  }
}

// Генерировать уникальный ID
export const generateId = (prefix = 'id') => {
  return `${prefix}_${Math.random().toString(36).slice(2, 11)}`
}

// Генерировать код приглашения
export const generateInviteCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'KPD-'
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// Инициализировать демо-данные при первом запуске
export const seedDemoData = () => {
  if (localStorage.getItem('kpd_seeded')) return

  const mama = {
    id: 'user_demo_mama',
    name: 'Мама',
    email: 'demo@kpd.fun',
    password: '123456',
    role: 'adult',
    familyId: 'fam_demo',
    createdAt: '2026-04-14',
  }
  const sasha = {
    id: 'user_demo_sasha',
    name: 'Саша',
    email: 'sasha@kpd.fun',
    password: '123456',
    role: 'child',
    familyId: 'fam_demo',
    createdAt: '2026-04-14',
  }
  const demoFamily = {
    id: 'fam_demo',
    name: 'Семья Demo',
    inviteCode: 'KPD-DEMO',
    createdBy: 'user_demo_mama',
    members: ['user_demo_mama', 'user_demo_sasha'],
    createdAt: '2026-04-14',
  }

  localStorage.setItem('kpd_users', JSON.stringify([mama, sasha]))
  localStorage.setItem('kpd_families', JSON.stringify([demoFamily]))
  localStorage.setItem('kpd_seeded', '1')
}
