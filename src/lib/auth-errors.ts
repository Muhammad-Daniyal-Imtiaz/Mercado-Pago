// Mapeo de errores comunes de Supabase Auth a mensajes en español
const errorMessages: Record<string, string> = {
  // Credenciales
  'Invalid login credentials': 'Credenciales de inicio de sesión inválidas',
  'Invalid email or password': 'Correo electrónico o contraseña inválidos',
  'Email not confirmed': 'El correo electrónico no ha sido verificado. Revisa tu bandeja de entrada.',
  
  // Email
  'Email already registered': 'Este correo electrónico ya está registrado',
  'User already registered': 'El usuario ya está registrado',
  'Invalid email': 'El correo electrónico no es válido',
  'Email address not authorized': 'Esta dirección de correo no está autorizada',
  
  // Contraseña
  'Password is too weak': 'La contraseña es muy débil. Usa al menos 8 caracteres con mayúsculas, minúsculas y números.',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
  'Password must be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
  'Invalid password': 'Contraseña inválida',
  'Password recovery expired': 'El enlace de recuperación de contraseña expiró',
  
  // Token/Sesión
  'Token has expired': 'El enlace ha expirado. Solicita uno nuevo.',
  'Invalid token': 'El enlace no es válido',
  'Session expired': 'La sesión ha expirado. Inicia sesión nuevamente.',
  'User not found': 'Usuario no encontrado',
  'Session not found': 'Sesión no encontrada',
  
  // Rate limiting
  'Email rate limit exceeded': 'Demasiados intentos. Espera unos minutos antes de intentar de nuevo.',
  'Too many requests': 'Demasiadas solicitudes. Intenta más tarde.',
  'For security purposes, you can only request this once every 60 seconds': 'Por seguridad, solo puedes solicitar esto una vez cada 60 segundos',
  
  // Proveedores OAuth
  'Provider not enabled': 'Este método de inicio de sesión no está habilitado',
  'User already linked to this provider': 'La cuenta ya está vinculada a este proveedor',
  
  // Generales
  'Network error': 'Error de conexión. Verifica tu internet e intenta de nuevo.',
  'Request failed': 'La solicitud falló. Intenta de nuevo.',
  'Database error': 'Error en la base de datos. Intenta de nuevo más tarde.',
  'An error occurred': 'Ocurrió un error. Intenta de nuevo.',
}

export function translateAuthError(errorMessage: string): string {
  // Busca coincidencia exacta primero
  if (errorMessages[errorMessage]) {
    return errorMessages[errorMessage]
  }
  
  // Busca coincidencias parciales
  for (const [key, value] of Object.entries(errorMessages)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return value
    }
  }
  
  // Si no hay coincidencia, devuelve un mensaje genérico en español
  return 'Ocurrió un error. Intenta de nuevo.'
}
