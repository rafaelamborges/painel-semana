// Dispara um lembrete da bolsa pra quem está com a guarda agora.
// Encapsula: cálculo do guardião efetivo, insert em notifications,
// invocação das duas Edge Functions (e-mail Resend + SMS Brevo) e geração do
// texto copiável pro WhatsApp. As chamadas às EFs são paralelas e com erros
// silenciosos (voltam no retorno); a notificação na home sempre vai.
import { supabase } from './supabase'
import { getEffectiveGuardian } from './guard'

/**
 * @param {object} args
 * @param {object} args.family                 - família ativa
 * @param {object} args.child                  - criança ativa
 * @param {object} args.guardPattern           - pattern de guarda
 * @param {object[]} args.members              - membros da família
 * @param {object} args.currentUserMember      - membro que está disparando
 * @param {object[]} [args.swaps=[]]           - overrides manuais de guarda (opcional)
 * @returns {Promise<{
 *   recipient: object|null,
 *   notification: object|null,
 *   whatsappText: string,
 *   whatsappUrl: string|null,
 *   emailResult: {ok:boolean, skipped?:string, error?:string},
 *   smsResult:   {ok:boolean, skipped?:string, error?:string},
 *   recipientIsMe: boolean,
 *   error?: string,
 * }>}
 */
// Constrói o texto do WhatsApp sem depender do backend. É o mínimo útil pra
// a UX: mesmo que o insert ou as EFs falhem, a copy é entregue.
export function buildWhatsappText({ child, recipientFirstName }) {
  const greeting = recipientFirstName ? `Oi, ${recipientFirstName}! ` : 'Oi! '
  const childName = child?.name || 'das crianças'
  return `${greeting}Só pra lembrar da bolsa de ${childName} antes da próxima troca — faixa do jiu-jítsu, livros da escola, essas coisas. 💜 (via Compasso · https://familiaemcompasso.com.br/bolsa)`
}

export function buildWhatsappUrl(phone, text) {
  const digits = phoneToWaMe(phone)
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : null
}

const SKIPPED_IN_APP = { ok: true, skipped: 'not-sent' }

export async function sendBagReminder({ family, child, guardPattern, members, currentUserMember, swaps = [] }) {
  // Sempre resolve o guardião antes de tudo. Se der ruim depois, ainda temos
  // o destinatário e podemos oferecer o copy do WhatsApp.
  let recipient = null
  let recipientIsMe = false

  const currentGuardian = guardPattern
    ? getEffectiveGuardian(new Date(), guardPattern, swaps)
    : null

  if (currentGuardian) {
    recipient = members.find(m => m.role === currentGuardian) || null
    recipientIsMe = recipient?.id === currentUserMember?.id
  }

  const recipientFirstName = recipient?.name?.split(' ')[0] || ''
  const whatsappText = buildWhatsappText({ child, recipientFirstName })
  const whatsappUrl = recipient?.phone ? buildWhatsappUrl(recipient.phone, whatsappText) : null

  // Base de retorno — se falharmos daqui pra frente, o cliente ainda tem o
  // texto do WhatsApp pra copiar e manda do app dele mesmo.
  const base = {
    recipient, recipientIsMe,
    notification: null,
    whatsappText, whatsappUrl,
    emailResult: SKIPPED_IN_APP,
    smsResult: SKIPPED_IN_APP,
    inAppResult: SKIPPED_IN_APP,
  }

  if (!family?.id || !child?.id || !guardPattern) {
    return { ...base, error: 'Família, criança ou padrão de guarda ausente.' }
  }
  if (!currentGuardian) return { ...base, error: 'Não foi possível identificar quem está com a guarda.' }
  if (!recipient) return { ...base, error: `Nenhum responsável cadastrado como ${currentGuardian === 'mother' ? 'mãe' : 'pai'}.` }

  const senderName = currentUserMember?.name?.split(' ')[0] || 'alguém da família'
  const title = `Lembrete da bolsa de ${child.name}`
  const body = `${senderName} pediu pra lembrar da bolsa de ${child.name} antes da próxima troca.`

  const { data: notification, error: insertErr } = await supabase
    .from('notifications')
    .insert({
      family_id: family.id,
      recipient_member_id: recipient.id,
      recipient_user_id: recipient.user_id || null,
      actor_member_id: currentUserMember?.id || null,
      kind: 'bag_reminder',
      title,
      body,
      entity_type: null,
      entity_id: null,
      payload: { child_id: child.id, triggered_by: 'bag_page' },
    })
    .select()
    .single()

  if (insertErr || !notification) {
    // Insert falhou — devolve base com inAppResult=falha mas MANTÉM a copy do WhatsApp
    return {
      ...base,
      inAppResult: { ok: false, error: insertErr?.message || 'Falha ao criar a notificação.' },
      emailResult: { ok: false, skipped: 'insert-failed' },
      smsResult:   { ok: false, skipped: 'insert-failed' },
    }
  }

  // Dispara email e SMS em paralelo. Erros voltam no resultado mas não bloqueiam
  // o fluxo — a notificação in-app já foi criada e o WhatsApp copiável sempre funciona.
  const [emailResult, smsResult] = await Promise.all([
    invokeEdge('send-notification', { notification_id: notification.id }),
    invokeEdge('send-sms-brevo',   { notification_id: notification.id }),
  ])

  return {
    ...base,
    notification,
    inAppResult: { ok: true },
    emailResult,
    smsResult,
  }
}

async function invokeEdge(fnName, body) {
  try {
    const { data, error } = await supabase.functions.invoke(fnName, { body })
    if (error) return { ok: false, error: error.message || String(error) }
    return data || { ok: true }
  } catch (e) {
    return { ok: false, error: e?.message || String(e) }
  }
}

// wa.me espera só dígitos no formato E.164. Normaliza "+55 (81) 99999-8888" → "5581999998888".
function phoneToWaMe(raw) {
  const digits = String(raw).replace(/\D+/g, '')
  if (digits.length < 10) return ''
  if (digits.length >= 12) return digits
  return `55${digits}`
}
