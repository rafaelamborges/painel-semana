// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() })
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 })

  try {
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    if (!token) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })

    // Cliente anon pra validar o JWT do usuário chamador
    const anon = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user }, error: authErr } = await anon.auth.getUser(token)
    if (authErr || !user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })

    const admin = createClient(SUPABASE_URL, SERVICE_KEY)

    // Descobre a família do usuário
    const { data: membership } = await admin
      .from('family_members')
      .select('family_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) return new Response(JSON.stringify({ error: 'no family' }), { status: 404 })

    const familyId = membership.family_id

    // Fetch tudo relacionado à família
    const [
      family, members, children, guardPatterns, guardSwaps,
      healthConsultations, healthVaccinations, healthNotes,
      childDocuments, calendarEvents, sharedDecisions, decisionAgreements,
      bagItems, bagShipments,
      expenseSettings, expenses, expenseSettlements,
      notificationPrefs,
      childrenProfile,
    ] = await Promise.all([
      admin.from('families').select('*').eq('id', familyId).maybeSingle(),
      admin.from('family_members').select('*').eq('family_id', familyId),
      admin.from('children').select('*').eq('family_id', familyId),
      admin.from('guard_patterns').select('*').eq('family_id', familyId),
      admin.from('guard_swaps').select('*').eq('family_id', familyId),
      admin.from('health_consultations').select('*, children!inner(family_id)').eq('children.family_id', familyId),
      admin.from('health_vaccinations').select('*, children!inner(family_id)').eq('children.family_id', familyId),
      admin.from('health_notes').select('*').eq('family_id', familyId),
      admin.from('child_documents').select('*').eq('family_id', familyId),
      admin.from('calendar_events').select('*').eq('family_id', familyId),
      admin.from('shared_decisions').select('*').eq('family_id', familyId),
      admin.from('decision_agreements').select('*, shared_decisions!inner(family_id)').eq('shared_decisions.family_id', familyId),
      admin.from('bag_items').select('*').eq('family_id', familyId),
      admin.from('bag_shipments').select('*').eq('family_id', familyId),
      admin.from('expense_settings').select('*').eq('family_id', familyId),
      admin.from('expenses').select('*').eq('family_id', familyId),
      admin.from('expense_settlements').select('*, expenses!inner(family_id)').eq('expenses.family_id', familyId),
      admin.from('notification_preferences').select('*, family_members!inner(family_id)').eq('family_members.family_id', familyId),
      admin.from('children_profile').select('*, children!inner(family_id)').eq('children.family_id', familyId),
    ])

    const payload = {
      exported_at: new Date().toISOString(),
      exported_by: { user_id: user.id, email: user.email },
      family: family.data,
      family_members: members.data || [],
      children: children.data || [],
      children_profile: childrenProfile.data || [],
      guard_patterns: guardPatterns.data || [],
      guard_swaps: guardSwaps.data || [],
      health_consultations: healthConsultations.data || [],
      health_vaccinations: healthVaccinations.data || [],
      health_notes: healthNotes.data || [],
      child_documents: childDocuments.data || [],
      calendar_events: calendarEvents.data || [],
      shared_decisions: sharedDecisions.data || [],
      decision_agreements: decisionAgreements.data || [],
      bag_items: bagItems.data || [],
      bag_shipments: bagShipments.data || [],
      expenses: expenses.data || [],
      expense_settings: expenseSettings.data || [],
      expense_settlements: expenseSettlements.data || [],
      notification_preferences: notificationPrefs.data || [],
    }

    // Audit: registra a exportação
    await admin.from('audit_log').insert({
      user_id: user.id,
      family_id: familyId,
      action: 'export',
      entity_type: 'family',
      entity_id: familyId,
      metadata: { rows: Object.keys(payload).length },
    })

    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="compasso-familia-${familyId}-${new Date().toISOString().slice(0,10)}.json"`,
      },
    })
  } catch (e: any) {
    console.error('export-family-data error:', e)
    return new Response(JSON.stringify({ error: e?.message || String(e) }), { status: 500, headers: corsHeaders() })
  }
})
