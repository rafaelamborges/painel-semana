// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const MAIL_FROM = Deno.env.get('MAIL_FROM') || 'Compasso <ola@familiaemcompasso.com.br>'
const APP_URL = Deno.env.get('APP_URL') || 'https://www.familiaemcompasso.com.br'

const ENTITY_PATH: Record<string, string> = {
  guard_swap:   '/guarda',
  decision:     '/decisoes',
  consultation: '/saude',
  expense:      '/despesas',
  document:     '/documentos',
}

const KIND_LABEL: Record<string, string> = {
  guard_swap_requested: 'Pedido de troca de guarda',
  guard_swap_approved:  'Troca de guarda aprovada',
  guard_swap_denied:    'Troca de guarda negada',
  decision_created:     'Novo combinado',
  consultation_created: 'Nova consulta',
  expense_created:      'Nova despesa',
  expense_settled:      'Acerto registrado',
  document_created:     'Novo documento',
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

function escapeHtml(s: string) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

function buildEmailHtml(opts: {
  title: string
  body: string
  ctaUrl: string
  ctaLabel: string
  kindLabel: string
  recipientName: string
}) {
  const { title, body, ctaUrl, ctaLabel, kindLabel, recipientName } = opts
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#F5F6FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1E1B4B;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F6FA;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:20px;border:1px solid #EEEEF3;overflow:hidden;">
        <tr><td style="padding:28px 32px 4px;">
          <p style="margin:0 0 6px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:#9896B0;">Compasso · ${escapeHtml(kindLabel)}</p>
          <h1 style="margin:0;font-family:'Newsreader',Georgia,serif;font-weight:300;font-size:26px;line-height:1.15;color:#1E1B4B;letter-spacing:-.01em;">${escapeHtml(title)}</h1>
        </td></tr>
        <tr><td style="padding:14px 32px 0;">
          <p style="margin:0;font-size:15px;line-height:1.55;color:#5F5D7A;">Olá, ${escapeHtml(recipientName)}.</p>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.55;color:#1E1B4B;">${escapeHtml(body)}</p>
        </td></tr>
        <tr><td style="padding:22px 32px 30px;">
          <a href="${ctaUrl}" style="display:inline-block;background:#6B5CE7;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:14px;font-size:14px;font-weight:500;">${escapeHtml(ctaLabel)}</a>
        </td></tr>
        <tr><td style="padding:16px 32px 24px;border-top:1px solid #EEEEF3;">
          <p style="margin:0;font-size:11px;color:#9896B0;line-height:1.6;">
            Você recebeu este email porque faz parte de uma família no Compasso. Para ajustar quais eventos te avisam, acesse
            <a href="${APP_URL}/preferencias" style="color:#6B5CE7;text-decoration:none;">Preferências de notificação</a>.
          </p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:11px;color:#9896B0;">© Compasso · familiaemcompasso.com.br</p>
    </td></tr>
  </table>
</body></html>`
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() })
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405, headers: corsHeaders() })

  try {
    const { notification_id } = await req.json()
    if (!notification_id) return new Response(JSON.stringify({ ok: false, error: 'notification_id required' }), { status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })

    const admin = createClient(SUPABASE_URL, SERVICE_KEY)

    const { data: n, error: nErr } = await admin
      .from('notifications')
      .select('*')
      .eq('id', notification_id)
      .maybeSingle()

    if (nErr || !n) return new Response(JSON.stringify({ ok: false, error: nErr?.message || 'not found' }), { status: 404, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })

    if (n.email_sent_at) return new Response(JSON.stringify({ ok: true, skipped: 'already sent' }), { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })

    // Destinatário e preferências
    const { data: member } = await admin
      .from('family_members')
      .select('id, name, email, user_id')
      .eq('id', n.recipient_member_id)
      .maybeSingle()

    if (!member?.email) {
      return new Response(JSON.stringify({ ok: true, skipped: 'no email' }), { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })
    }

    const { data: prefs } = await admin
      .from('notification_preferences')
      .select('*')
      .eq('member_id', n.recipient_member_id)
      .maybeSingle()

    // Default: envia por email a menos que tenha desligado explicitamente
    const emailEnabled = (prefs?.email_by_kind?.[n.kind]) !== false
    if (!emailEnabled) {
      return new Response(JSON.stringify({ ok: true, skipped: 'email disabled by user' }), { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })
    }

    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured — notification stays in inbox, email not sent')
      return new Response(JSON.stringify({ ok: true, skipped: 'no RESEND_API_KEY' }), { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })
    }

    const path = ENTITY_PATH[n.entity_type as string] || '/'
    const ctaUrl = `${APP_URL}${path}${n.entity_id ? `?highlight=${n.entity_id}` : ''}`
    const kindLabel = KIND_LABEL[n.kind] || 'Compasso'
    const html = buildEmailHtml({
      title: n.title,
      body: n.body || '',
      ctaUrl,
      ctaLabel: 'Abrir no Compasso',
      kindLabel,
      recipientName: (member.name?.split(' ')[0]) || 'olá',
    })

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: member.email,
        subject: `[Compasso] ${n.title}`,
        html,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Resend error:', res.status, errText)
      return new Response(JSON.stringify({ ok: false, error: errText, status: res.status }), { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })
    }

    await admin
      .from('notifications')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('id', notification_id)

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })
  } catch (e: any) {
    console.error('send-notification error:', e)
    return new Response(JSON.stringify({ ok: false, error: e?.message || String(e) }), { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })
  }
})
