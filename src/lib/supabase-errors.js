/**
 * Enriquece errores de Supabase con contexto útil para debug.
 *
 * Los errores de PostgREST llegan como { message, details, hint, code } pero
 * el código del cliente sólo mira `message`. Esta función los expone
 * completos vía console.error + añade la query y el payload para que
 * futuros 400s sean diagnosticables sin abrir Supabase Dashboard.
 *
 * Uso:
 *   const { data, error } = await supabase.from(...).insert(...);
 *   throwIfError(error, 'clientes.create', { payload });
 */
export function throwIfError(error, context, extra = {}) {
  if (!error) return;
  if (typeof console !== 'undefined') {
    console.error(`[supabase:${context}]`, {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      ...extra,
    });
  }
  const err = new Error(error.message || 'Supabase error');
  err.name = 'SupabaseError';
  err.code = error.code;
  err.details = error.details;
  err.hint = error.hint;
  err.context = context;
  throw err;
}
