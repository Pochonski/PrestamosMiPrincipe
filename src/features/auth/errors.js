export function describeAuthError(err) {
  const status = err?.status ?? err?.response?.status;
  const code = err?.code || err?.error_code;
  const raw = String(err?.message || err?.error_description || '').toLowerCase();

  if (status === 429 || raw.includes('rate limit')) {
    return {
      title: 'Demasiados intentos',
      message: 'Supabase está limitando las peticiones. Esperá 1-2 minutos e intentá de nuevo.',
      variant: 'warning',
    };
  }
  if (status === 422 && code === 'user_already_exists') {
    return {
      title: 'Este email ya está registrado',
      message: 'Iniciá sesión con tu contraseña o usá "¿Olvidaste tu contraseña?"',
      variant: 'info',
    };
  }
  if (raw.includes('already registered')) {
    return {
      title: 'Email ya registrado',
      message: 'Este email ya tiene cuenta. Iniciá sesión con tu contraseña, o usá "¿Olvidaste tu contraseña?"',
      variant: 'info',
    };
  }
  if (status === 400 && raw.includes('email not confirmed')) {
    return {
      title: 'Email sin confirmar',
      message: 'Revisá tu casilla (incluido spam) y hacé click en el link de confirmación.',
      variant: 'info',
    };
  }
  if (status === 400 && raw.includes('email_provider_disabled')) {
    return {
      title: 'Registro deshabilitado',
      message: 'El registro con email/contraseña está deshabilitado en Supabase. Pedile al admin que lo habilite.',
      variant: 'error',
    };
  }
  if (status === 400 && (raw.includes('password') || raw.includes('credential'))) {
    return {
      title: 'Contraseña incorrecta',
      message: 'La contraseña ingresada no es válida. Si no la recordás, usá "¿Olvidaste tu contraseña?"',
      variant: 'error',
    };
  }
  if (status === 401 || status === 403 || raw.includes('invalid login')) {
    return {
      title: 'Credenciales inválidas',
      message: 'No encontramos una cuenta con ese email y contraseña. Verificá los datos o creá una cuenta nueva.',
      variant: 'error',
    };
  }
  if (status === 422 && raw.includes('email')) {
    return {
      title: 'Email inválido',
      message: 'El formato del email no es correcto. Usá un email válido (ej: juan@gmail.com).',
      variant: 'error',
    };
  }
  if (status === 422 && (raw.includes('weak') || raw.includes('6 characters'))) {
    return {
      title: 'Contraseña muy corta',
      message: 'La contraseña debe tener al menos 6 caracteres.',
      variant: 'error',
    };
  }
  if (raw.includes('rate limit') && raw.includes('email')) {
    return {
      title: 'Demasiados emails enviados',
      message: 'Supabase está limitando los emails. Esperá unos minutos antes de reenviar.',
      variant: 'warning',
    };
  }
  if (raw.includes('user not found')) {
    return {
      title: 'Usuario no encontrado',
      message: 'No existe una cuenta con ese email. Verificá el email o creá una cuenta nueva.',
      variant: 'error',
    };
  }
  if (raw.includes('network') || raw.includes('fetch')) {
    return {
      title: 'Error de conexión',
      message: 'No se pudo conectar con Supabase. Verificá tu conexión a internet.',
      variant: 'error',
    };
  }
  if (status >= 500) {
    return {
      title: 'Error del servidor',
      message: 'Supabase tuvo un problema. Esperá unos segundos e intentá de nuevo.',
      variant: 'error',
    };
  }
  return {
    title: 'Error',
    message: err?.message || 'Error inesperado. Intentá de nuevo.',
    variant: 'error',
  };
}