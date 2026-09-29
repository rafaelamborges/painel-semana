// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

const BUCKETS = ['expense-receipts', 'vaccination-cards', 'child-documents']

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

async function purgeBucketFolder(admin: any, bucket: string, folder: string) {
  // Lista tudo dentro do folder e apaga em lote
  const { data: files, error } = await admin.storage.from(bucket).list(folder, { limit: 1000 })
  if (error || !files?.length) return
  const paths = files.map((f: any) => `${folder}/${f.name}`)
  if (paths.length) await admin.storage.from(bucket).remove(paths)
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors() })
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 })

  try {
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    if (!token) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })

    const anon = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user }, error: authErr } = await anon.auth.getUser(token)
    if (authErr || !user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })

    const { confirm } = await req.json().catch(() => ({}))
    if (confirm !== 'EXCLUIR TUDO') {
      return new Response(JSON.stringify({ error: 'confirmation required: send { confirm: "EXCLUIR TUDO" }' }), { status: 400 })
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY)

    // Verifica que o usuário é sysadmin da família
    const { data: membership } = await admin
      .from('family_members')
      .select('family_id, access_role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) return new Response(JSON.stringify({ error: 'no family' }), { status: 404 })
    if (membership.access_role !== 'sysadmin') {
      return new Response(JSON.stringify({ error: 'only sysadmin can delete the family' }), { status: 403 })
    }

    const familyId = membership.family_id

    // Registra o evento no audit ANTES do delete (senão perde)
    await admin.from('audit_log').insert({
      user_id: user.id,
      family_id: familyId,
      action: 'delete_family',
      entity_type: 'family',
      entity_id: familyId,
      metadata: { requested_at: new Date().toISOString() },
    })

    // Apaga arquivos no storage — todos os buckets, pasta familyId
    for (const bucket of BUCKETS) {
      try { await purgeBucketFolder(admin, bucket, familyId) } catch (e) { console.error('purge failed', bucket, e) }
    }

    // Delete cascade da família (FKs on delete cascade cuidam do resto)
    const { error: delErr } = await admin.from('families').delete().eq('id', familyId)
    if (delErr) throw delErr

    return new Response(JSON.stringify({ ok: true, family_id: familyId }), {
      headers: { ...cors(), 'Content-Type': 'application/json' },
    })
  } catch (e: any) {
    console.error('delete-family error:', e)
    return new Response(JSON.stringify({ error: e?.message || String(e) }), { status: 500, headers: cors() })
  }
})
