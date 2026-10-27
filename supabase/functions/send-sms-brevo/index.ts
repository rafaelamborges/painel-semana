// deno-lint-ignore-file no-explicit-any
// Envia o SMS correspondente a uma notification usando a API free do Brevo
// (brevo.com, antes Sendinblue). Fica atrás da service role: só quem já tem
// a notification ID (via o cliente autenticado) consegue disparar.
//
// Config:
//   BREVO_API_KEY       — chave da conta Brevo
//   BREVO_SMS_SENDER    — remetente visível no SMS (até 11 chars). Default "Compasso"
//   APP_URL             — URL base pro link curto no SMS
//
// Se BREVO_API_KEY não estiver configurado o endpoint responde ok+skipped
// pra o cliente não precisar tratar erro de infra.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')
const BREVO_SMS_SENDER = (Deno.env.get('BREVO_SMS_SENDER') || 'Compasso').slice(0, 11)
const APP_URL = Deno.env.get('APP_URL') || 'https://familiaemcompasso.com.br'

const KIND_PATH: Record<string, string> = {
  guard_switch_eve: '/bolsa',
  bag_reminder:     '/bolsa',
  consultation_upcoming: '/agenda',
}

const ENTITY_PATH: Record<string, string> = {
  guard_swap:    '/agenda',
  guard_pattern: '/agenda',
  decision:      '/decisoes',
  consultation:  '/saude',
  expense:       '/despesas',
  document:      '/documentos',
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json', ...(init.headers || {}) },
  })
}

// Normaliza telefone pra E.164 do jeito que o Brevo aceita (sem "+"):
// aceita "+5581999998888", "81999998888", "(81) 99999-8888" etc.
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D+/g, '')
  if (digits.length < 10) return null
  // Se já veio com DDI (12-13 dígitos pra BR), devolve como está
  if (digits.length >= 12) return digits
  // Caso contrário, assume BR (DDI 55)
  return `55${digits}`
}

// SMS tem 160 chars por segmento. Mantemos tudo em um só pra não cobrar múltiplo.
function buildSmsBody(title: string, link: string): string {
  const prefix = 'Compasso: '
  const maxBody = 160 - prefix.length - 1 - link.length
  const body = title.length > maxBody ? title.slice(0, maxBody - 1) + '…' : title
  return `${prefix}${body} ${link}`
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() })
  if (req.method !== 'POST') return json({ ok: false, error: 'method not allowed' }, { status: 405 })

  try {
    const { notification_id } = await req.json()
    if (!notification_id) return json({ ok: false, error: 'notification_id required' }, { status: 400 })

    const admin = createClient(SUPABASE_URL, SERVICE_KEY)

    const { data: n, error: nErr } = await admin
      .from('notifications')
      .select('*')
      .eq('id', notification_id)
      .maybeSingle()
    if (nErr || !n) return json({ ok: false, error: nErr?.message || 'not found' }, { status: 404 })
    if (n.sms_sent_at) return json({ ok: true, skipped: 'already sent' })

    const { data: member } = await admin
      .from('family_members')
      .select('id, name, phone')
      .eq('id', n.recipient_member_id)
      .maybeSingle()

    if (!member?.phone) return json({ ok: true, skipped: 'no phone' })

    const phone = normalizePhone(member.phone)
    if (!phone) return json({ ok: true, skipped: 'invalid phone' })

    if (!BREVO_API_KEY) {
      console.warn('BREVO_API_KEY not configured — SMS not sent')
      return json({ ok: true, skipped: 'no BREVO_API_KEY' })
    }

    const path = KIND_PATH[n.kind as string] || ENTITY_PATH[n.entity_type as string] || '/'
    const link = `${APP_URL}${path}`
    const content = buildSmsBody(n.title, link)

    const res = await fetch('https://api.brevo.com/v3/transactionalSMS/sms', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify({
        sender: BREVO_SMS_SENDER,
        recipient: phone,
        content,
        type: 'transactional',
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Brevo SMS error:', res.status, errText)
      return json({ ok: false, error: errText, status: res.status }, { status: 500 })
    }

    await admin
      .from('notifications')
      .update({ sms_sent_at: new Date().toISOString() })
      .eq('id', notification_id)

    return json({ ok: true })
  } catch (e: any) {
    console.error('send-sms-brevo error:', e)
    return json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
})
