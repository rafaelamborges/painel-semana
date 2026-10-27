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
export async function sendBagReminder({ family, child, guardPattern, members, currentUserMember, swaps = [] }) {
  const empty = {
    recipient: null, notification: null, whatsappText: '', whatsappUrl: null,
    emailResult: { ok: true, skipped: 'not-sent' },
    smsResult:   { ok: true, skipped: 'not-sent' },
    recipientIsMe: false,
  }

  if (!family?.id || !child?.id || !guardPattern) {
    return { ...empty, error: 'Família, criança ou padrão de guarda ausente.' }
  }

  const currentGuardian = getEffectiveGuardian(new Date(), guardPattern, swaps)
  if (!currentGuardian) return { ...empty, error: 'Não foi possível identificar quem está com a guarda.' }

  const recipient = members.find(m => m.role === currentGuardian) || null
  if (!recipient) return { ...empty, error: `Nenhum responsável cadastrado como ${currentGuardian === 'mother' ? 'mãe' : 'pai'}.` }

  const recipientIsMe = recipient.id === currentUserMember?.id
  const senderName = currentUserMember?.name?.split(' ')[0] || 'alguém da família'
  const recipientFirstName = recipient.name?.split(' ')[0] || ''
  const childName = child.name

  const title = `Lembrete da bolsa de ${childName}`
  const body = `${senderName} pediu pra lembrar da bolsa de ${childName} antes da próxima troca.`

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
    return { ...empty, recipient, recipientIsMe, error: insertErr?.message || 'Falha ao criar a notificação.' }
  }

  // Dispara email e SMS em paralelo. Erros voltam no resultado mas não bloqueiam
  // o fluxo — a notificação in-app já foi criada e o WhatsApp copiável sempre funciona.
  const [emailResult, smsResult] = await Promise.all([
    invokeEdge('send-notification', { notification_id: notification.id }),
    invokeEdge('send-sms-brevo',   { notification_id: notification.id }),
  ])

  const greeting = recipientFirstName ? `Oi, ${recipientFirstName}! ` : 'Oi! '
  const whatsappText = `${greeting}Só pra lembrar da bolsa de ${childName} antes da próxima troca — faixa do jiu-jítsu, livros da escola, essas coisas. 💜 (via Compasso · https://familiaemcompasso.com.br/bolsa)`

  const whatsappUrl = recipient.phone
    ? `https://wa.me/${phoneToWaMe(recipient.phone)}?text=${encodeURIComponent(whatsappText)}`
    : null

  return {
    recipient,
    recipientIsMe,
    notification,
    whatsappText,
    whatsappUrl,
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
