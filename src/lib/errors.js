// Mapeia códigos/mensagens de erro Supabase para copy no tom Compasso.
// Centraliza para que forms, uploads e handlers de rede falem a mesma língua.

const AUTH_MESSAGES = {
  invalid_credentials:        'Email ou senha não conferem.',
  invalid_grant:              'Email ou senha não conferem.',
  user_not_found:             'Não achamos uma conta com esse email.',
  email_not_confirmed:        'Falta confirmar seu email. Verifique sua caixa de entrada.',
  user_already_exists:        'Já existe conta com esse email. Entrar em vez de criar?',
  signup_disabled:            'Cadastro temporariamente indisponível.',
  weak_password:              'Senha fraca. Use pelo menos 8 caracteres, com letras e números.',
  over_email_send_rate_limit: 'Muitas mensagens enviadas. Aguarde alguns minutos.',
  over_request_rate_limit:    'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
  provider_email_needs_verification: 'Confirme seu email no provedor antes de continuar.',
}

const NETWORK_HINTS = [
  'Failed to fetch',
  'NetworkError',
  'network request failed',
  'ERR_INTERNET_DISCONNECTED',
]

const PERMISSION_HINTS = [
  'permission denied',
  'row-level security',
  'new row violates',
]

const NOT_FOUND_HINTS = [
  'not found',
  'PGRST116', // No rows found with maybeSingle expecting single
]

const CONFLICT_HINTS = [
  'duplicate key value',
  '23505', // unique_violation
  'conflict',
]

export function humanizeError(err) {
  if (!err) return 'Algo não deu certo. Tente de novo.'

  // Supabase Auth errors têm um `code` em alguns casos, ou `message`
  const code = err.code || err?.error?.code
  const msg = err.message || err?.error?.message || String(err)

  if (code && AUTH_MESSAGES[code]) return AUTH_MESSAGES[code]

  const lower = msg.toLowerCase()

  // Procura padrões textuais nas mensagens
  for (const [k, v] of Object.entries(AUTH_MESSAGES)) {
    if (lower.includes(k.replace(/_/g, ' '))) return v
  }

  if (NETWORK_HINTS.some(h => msg.includes(h))) {
    return 'Sem conexão agora. Verifique sua internet e tente de novo.'
  }
  if (PERMISSION_HINTS.some(h => lower.includes(h))) {
    return 'Você não tem permissão para essa ação. Fale com quem administra a família.'
  }
  if (NOT_FOUND_HINTS.some(h => lower.includes(h))) {
    return 'Esse item não existe mais ou foi removido.'
  }
  if (CONFLICT_HINTS.some(h => lower.includes(h))) {
    return 'Outra pessoa alterou esse item. Recarregue antes de continuar.'
  }

  // Fallback: devolve a mensagem original, mais limpa
  return msg.replace(/^Error:\s*/, '')
}

export function isNetworkError(err) {
  if (!err) return false
  const msg = err.message || err?.error?.message || String(err)
  return NETWORK_HINTS.some(h => msg.includes(h))
}
