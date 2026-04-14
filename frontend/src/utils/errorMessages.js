/**
 * Переводит ошибки Supabase на русский язык
 */
export function translateSupabaseError(error) {
  if (!error) return 'Произошла неизвестная ошибка'

  const message = error?.message || error?.error_description || ''
  const code = error?.code || ''

  // Auth errors - регистрация
  if (message.includes('email rate limit exceeded') || code === '429') {
    return '⏱️ Слишком много попыток регистрации. Подожди 5-10 минут и попробуй снова.'
  }

  if (message.includes('Password should be at least')) {
    return '🔒 Пароль должен быть минимум 6 символов'
  }

  if (message.includes('Signup requires a valid password')) {
    return '🔒 Введи корректный пароль (минимум 6 символов)'
  }

  if (message.includes('User already registered') || message.includes('already been registered')) {
    return '📧 Этот email уже зарегистрирован. Попробуй войти или используй другой email.'
  }

  if (message.includes('Unable to validate email address') || message.includes('Invalid email')) {
    return '📧 Проверь правильность email адреса'
  }

  // Auth errors - вход
  if (message.includes('Invalid login credentials')) {
    return '❌ Неверный email или пароль. Проверь данные и попробуй снова.'
  }

  if (message.includes('Email not confirmed')) {
    return '📬 Подтверди email (проверь свою почту)'
  }

  if (message.includes('Invalid email or password')) {
    return '❌ Неверный email или пароль'
  }

  // Network errors
  if (message.includes('Failed to fetch') || message.includes('Network request failed')) {
    return '🌐 Нет подключения к интернету. Проверь соединение.'
  }

  if (message.includes('fetch')) {
    return '🌐 Проблема с подключением к серверу. Проверь интернет.'
  }

  // Database errors
  if (code === 'PGRST116') {
    return '👤 Профиль не найден. Попробуй выйти и войти заново, или обратись к администратору.'
  }

  if (code === '23505' || message.includes('duplicate key') || message.includes('already exists')) {
    return '⚠️ Этот email или код уже используется'
  }

  if (code === '23503' || message.includes('violates foreign key')) {
    return '⚠️ Ошибка связи данных. Обратись к администратору.'
  }

  // RLS Policy errors
  if (message.includes('row-level security') || message.includes('policy') || message.includes('permission denied')) {
    return '🔐 Недостаточно прав для выполнения действия. Попробуй выйти и войти снова.'
  }

  // Timeout
  if (message.includes('timeout')) {
    return '⏱️ Превышено время ожидания. Попробуй ещё раз.'
  }

  // Session errors
  if (message.includes('session') || message.includes('token')) {
    return '🔑 Сессия устарела. Попробуй выйти и войти снова.'
  }

  // Generic fallback
  if (message) {
    return `Ошибка: ${message}`
  }

  return 'Произошла ошибка. Попробуй ещё раз или обратись к администратору.'
}
