/**
 * Переводит ошибки Supabase на русский язык
 */
export function translateSupabaseError(error) {
  if (!error) return 'Произошла неизвестная ошибка'

  const message = error?.message || error?.error_description || ''
  const code = error?.code || ''
  const status = error?.status || error?.statusCode || 0

  // Auth errors - регистрация
  if (
    message.includes('email rate limit exceeded') ||
    message.includes('over_request_rate_limit') ||
    message.includes('over_email_send_rate_limit') ||
    code === '429' ||
    status === 429
  ) {
    return '⏱️ Слишком много попыток. Подожди 5-10 минут и попробуй снова.'
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

  if (message.includes('Unable to validate email address') || message.includes('invalid email')) {
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

  // Session errors
  if (
    message.includes('JWT expired') ||
    message.includes('token is expired') ||
    code === 'session_expired'
  ) {
    return '⏰ Сессия истекла. Пожалуйста, войди снова.'
  }

  if (
    message.includes('session_not_found') ||
    message.includes('Session not found') ||
    code === 'session_not_found'
  ) {
    return '⏰ Сессия не найдена. Пожалуйста, войди снова.'
  }

  if (message.includes('refresh_token_not_found') || message.includes('Invalid Refresh Token')) {
    return '⏰ Токен обновления недействителен. Войди снова.'
  }

  // Network errors
  if (message.includes('Failed to fetch') || message.includes('Network request failed')) {
    return '🌐 Нет подключения к интернету. Проверь соединение.'
  }

  if (message.includes('fetch')) {
    return '🌐 Проблема с подключением к серверу. Проверь интернет.'
  }

  // Permission errors
  if (
    message.includes('permission denied') ||
    message.includes('insufficient_privilege') ||
    code === '42501' ||
    status === 403
  ) {
    return '🔐 Нет прав для выполнения этого действия. Попробуй выйти и войти заново.'
  }

  // Database errors
  if (code === 'PGRST116') {
    return '👤 Профиль не найден. Попробуй выйти и войти заново, или обратись к администратору.'
  }

  if (code === '23505' || message.includes('duplicate key') || message.includes('unique_violation')) {
    return '⚠️ Такое значение уже существует. Используй другие данные.'
  }

  if (code === '23503' || message.includes('violates foreign key')) {
    return '⚠️ Ошибка связи данных. Обратись к администратору.'
  }

  // RLS Policy errors
  if (message.includes('row-level security') || message.includes('violates row-level security policy')) {
    return '🔐 Недостаточно прав для выполнения действия. Войди заново.'
  }

  if (message.includes('policy')) {
    return '🔐 Доступ запрещён. Войди заново и попробуй снова.'
  }

  // Timeout
  if (message.includes('timeout')) {
    return '⏱️ Превышено время ожидания. Попробуй ещё раз.'
  }

  // Generic fallback
  if (message) {
    return `Ошибка: ${message}`
  }

  return 'Произошла ошибка. Попробуй ещё раз или обратись к администратору.'
}
