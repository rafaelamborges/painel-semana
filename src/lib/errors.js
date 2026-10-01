// Mapeia códigos/mensagens de erro Supabase para copy no tom Compasso.
// Centraliza para que forms, uploads e handlers de rede falem a mesma língua.

const GENERIC_FALLBACK = 'Algo não deu certo. Tente de novo.'

// Match por code exato
const CODE_MESSAGES = {
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
  PGRST116:                   'Esse item não existe mais ou foi removido.',
  '23505':                    'Esse registro já existe.',
  '42501':                    'Você não tem permissão para essa ação.',
}

// Match por pattern na mensagem (versões antigas do Supabase, erros do PostgREST
// que vêm sem code estruturado, ou mensagens de rede do browser)
const MESSAGE_PATTERNS = [
  // Auth — mensagens textuais clássicas
  [/invalid (login )?credentials/i,              'Email ou senha não conferem.'],
  [/email not confirmed/i,                       'Falta confirmar seu email. Verifique sua caixa de entrada.'],
  [/user not found/i,                            'Não achamos uma conta com esse email.'],
  [/already registered/i,                        'Já existe conta com esse email. Entrar em vez de criar?'],
  [/password should be at least|weak.?password/i,'Senha fraca. Use pelo menos 8 caracteres, com letras e números.'],
  [/for security purposes|rate limit/i,          'Muitas tentativas. Aguarde alguns minutos.'],
  [/signup.? (is )?disabled/i,                   'Cadastro temporariamente indisponível.'],

  // Rede
  [/failed to fetch|networkerror|network request failed|err_internet_disconnected/i,
    'Sem conexão agora. Verifique sua internet e tente de novo.'],

  // Permissão (copy genérica — não assume contexto família)
  [/permission denied|row[- ]level security|new row violates|insufficient[_ ]privilege/i,
    'Você não tem permissão para essa ação.'],

  // Not found
  [/\bnot found\b|contains 0 rows/i,
    'Esse item não existe mais ou foi removido.'],

  // Conflito
  [/duplicate key value|unique constraint/i,
    'Esse registro já existe.'],
  [/conflict/i,
    'Outra pessoa alterou esse item. Recarregue antes de continuar.'],
]

function pickCode(err) {
  const code = err?.code ?? err?.error?.code
  if (typeof code === 'string' || typeof code === 'number') return String(code)
  return null
}

function pickMessage(err) {
  if (typeof err === 'string') return err
  const m = err?.message ?? err?.error?.message
  if (typeof m === 'string' && m) return m
  return null // sinaliza que não temos uma mensagem usável
}

export function humanizeError(err) {
  if (!err) return GENERIC_FALLBACK

  const code = pickCode(err)
  if (code && Object.prototype.hasOwnProperty.call(CODE_MESSAGES, code)) {
    return CODE_MESSAGES[code]
  }

  const msg = pickMessage(err)
  if (!msg) return GENERIC_FALLBACK

  for (const [pattern, friendly] of MESSAGE_PATTERNS) {
    if (pattern.test(msg)) return friendly
  }

  // Evita vazar '[object Object]' ou JSON cru pro usuário
  if (/^\[object /.test(msg) || /^{/.test(msg)) return GENERIC_FALLBACK

  return msg.replace(/^Error:\s*/, '')
}

export function isNetworkError(err) {
  if (!err) return false
  const msg = pickMessage(err)
  if (!msg) return false
  return /failed to fetch|networkerror|network request failed|err_internet_disconnected/i.test(msg)
}
