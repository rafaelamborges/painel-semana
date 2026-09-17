import { useState, useEffect, useMemo, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useFamily } from '../context/FamilyContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { getNextSwapDate } from '../lib/guard'

export default function Bolsa() {
  const { family, child, guardPattern, permissions, getCurrentUserMember } = useFamily()
  const [items, setItems] = useState([])
  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showPrepare, setShowPrepare] = useState(false)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !family || !child) return
    setLoading(true)
    const [{ data: it }, { data: sh }] = await Promise.all([
      supabase.from('bag_items').select('*')
        .eq('family_id', family.id).eq('child_id', child.id).eq('active', true)
        .order('created_at'),
      supabase.from('bag_shipments').select('*')
        .eq('family_id', family.id).eq('child_id', child.id).eq('must_return', true).is('returned_at', null)
        .order('sent_at', { ascending: false }),
    ])
    setItems(it || [])
    setShipments(sh || [])
    setLoading(false)
  }, [family, child])

  useEffect(() => { load() }, [load])

  const nextSwap = useMemo(() => guardPattern ? getNextSwapDate(new Date(), guardPattern) : null, [guardPattern])
  const displayName = child?.name || 'a criança'

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-bussola border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!child) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="corpo">Cadastre a criança no onboarding antes de montar a Bolsa.</p>
      </div>
    )
  }

  // Onboarding — sem itens ainda
  if (items.length === 0 && !showOnboarding) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <p className="rotulo mb-2">Rotina das trocas</p>
          <h1 className="page-title">Bolsa de {displayName}</h1>
        </div>

        <div className="faixa mb-6">
          <p className="font-display leading-[1.06] tracking-[-0.035em] text-ink" style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 200, maxWidth: '16em' }}>
            Vamos deixar as trocas de casa <em className="italic font-semibold">mais simples</em>?
          </p>
          <p className="corpo mt-4">Cadastre o que costuma acompanhar {displayName} entre as casas. A cada troca, o Compasso lembra do que precisa ir e do que precisa voltar.</p>
          {permissions.canAdd && (
            <button onClick={() => setShowOnboarding(true)} className="btn-primario mt-6">
              Montar a Bolsa de {displayName}
            </button>
          )}
        </div>
      </div>
    )
  }

  if (showOnboarding) {
    return (
      <ItemsEditor
        familyId={family.id}
        childId={child.id}
        displayName={displayName}
        member={getCurrentUserMember()}
        initialItems={items}
        onDone={() => { setShowOnboarding(false); load() }}
        onCancel={() => setShowOnboarding(false)}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
        <div>
          <p className="rotulo mb-2">Rotina das trocas</p>
          <h1 className="page-title">Bolsa de {displayName}</h1>
        </div>
        {permissions.canAdd && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowOnboarding(true)} className="btn-secundario">Editar itens</button>
            <button onClick={() => setShowPrepare(true)} className="btn-primario">Preparar bolsa</button>
          </div>
        )}
      </div>

      {nextSwap && (
        <div className="card-marca mb-6">
          <p className="rotulo mb-2">Próxima troca</p>
          <p className="font-display leading-snug tracking-tight text-ink" style={{ fontSize: '22px', fontWeight: 200 }}>
            {format(nextSwap, "EEEE, dd 'de' MMMM", { locale: ptBR })}.
          </p>
        </div>
      )}

      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <section className="min-w-0">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="section-title">Itens de sempre</h2>
            <span className="rotulo">{items.length}</span>
          </div>
          {items.length === 0 ? (
            <div className="card"><p className="corpo">Ainda sem itens padrão.</p></div>
          ) : (
            <div className="card-lista">
              {items.map(it => (
                <div key={it.id} className="linha-item">
                  <span className="ponto bg-bussola" />
                  <span className="text-[15px] font-normal text-ink flex-1">{it.name}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="min-w-0">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="section-title">Não esquecer de devolver</h2>
            <span className="rotulo">{shipments.length}</span>
          </div>
          {shipments.length === 0 ? (
            <div className="card"><p className="corpo">Sem pendências para a próxima troca.</p></div>
          ) : (
            <div className="card-lista">
              {shipments.map(s => (
                <div key={s.id} className="linha-item">
                  <span className="ponto bg-alerta" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-normal text-ink truncate">{s.name}</p>
                    <p className="apoio">Enviado em {format(parseISO(s.sent_at), 'dd/MM')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {showPrepare && (
        <PrepareBagModal
          familyId={family.id}
          childId={child.id}
          displayName={displayName}
          member={getCurrentUserMember()}
          nextSwap={nextSwap}
          items={items}
          pendingReturns={shipments}
          onClose={() => setShowPrepare(false)}
          onSaved={() => { setShowPrepare(false); load() }}
        />
      )}
    </div>
  )
}

function ItemsEditor({ familyId, childId, displayName, member, initialItems, onDone, onCancel }) {
  const [rows, setRows] = useState(() => (initialItems.length ? initialItems : []).map(i => ({ id: i.id, name: i.name, existing: true })))
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  function addRow() {
    const name = newName.trim()
    if (!name) return
    setRows(prev => [...prev, { id: crypto.randomUUID(), name, existing: false }])
    setNewName('')
  }

  function removeRow(id) {
    setRows(prev => prev.filter(r => r.id !== id))
  }

  async function save() {
    setSaving(true)
    const existingIds = new Set(initialItems.map(i => i.id))
    const currentIds = new Set(rows.filter(r => r.existing).map(r => r.id))
    const toInsert = rows.filter(r => !r.existing).map(r => ({
      id: r.id, family_id: familyId, child_id: childId, name: r.name,
      created_by: member?.id || null,
    }))
    const toDeactivate = [...existingIds].filter(id => !currentIds.has(id))

    if (toInsert.length) await supabase.from('bag_items').insert(toInsert)
    if (toDeactivate.length) await supabase.from('bag_items').update({ active: false }).in('id', toDeactivate)

    setSaving(false)
    onDone()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <p className="rotulo mb-2">Bolsa de {displayName}</p>
        <h1 className="page-title">O que costuma ir?</h1>
        <p className="corpo mt-3">Adicione os itens que acompanham {displayName} em todas as trocas — faixa do jiu-jítsu, almofada de dormir, livros da escola…</p>
      </div>

      <div className="card mb-4">
        {rows.length === 0 && <p className="corpo mb-4">Nenhum item ainda.</p>}
        {rows.length > 0 && (
          <div className="space-y-1 mb-4">
            {rows.map(r => (
              <div key={r.id} className="flex items-center gap-3 py-3 border-b border-linha-suave last:border-0">
                <span className="ponto bg-bussola" />
                <span className="text-[15px] font-normal text-ink flex-1">{r.name}</span>
                <button onClick={() => removeRow(r.id)} className="btn-texto">Remover</button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Ex: Faixa do jiu-jítsu"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addRow() } }}
          />
          <button onClick={addRow} className="btn-secundario">+ Adicionar</button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={save} disabled={saving || rows.length === 0} className="btn-primario flex-1 min-w-[160px]">
          {saving ? 'Salvando…' : 'Salvar Bolsa'}
        </button>
        <button onClick={onCancel} className="btn-secundario">Cancelar</button>
      </div>
    </div>
  )
}

function PrepareBagModal({ familyId, childId, displayName, member, nextSwap, items, pendingReturns, onClose, onSaved }) {
  const [extras, setExtras] = useState([]) // [{ id, name, must_return }]
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const swapDateStr = nextSwap ? format(nextSwap, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')

  async function confirm() {
    setSaving(true)
    // 1. Marcar pendências como devolvidas
    if (pendingReturns.length) {
      const ids = pendingReturns.map(s => s.id)
      await supabase.from('bag_shipments').update({ returned_at: new Date().toISOString() }).in('id', ids)
    }
    // 2. Inserir extras
    const inserts = extras.filter(e => e.name.trim()).map(e => ({
      family_id: familyId,
      child_id: childId,
      name: e.name.trim(),
      sent_at: swapDateStr,
      must_return: e.must_return,
      created_by: member?.id || null,
    }))
    if (inserts.length) await supabase.from('bag_shipments').insert(inserts)
    setSaving(false)
    onSaved()
  }

  function addExtra(name, mustReturn) {
    setExtras(prev => [...prev, { id: crypto.randomUUID(), name, must_return: mustReturn }])
    setShowAdd(false)
  }

  function removeExtra(id) {
    setExtras(prev => prev.filter(e => e.id !== id))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-profundo/40" onClick={onClose}>
      <div className="bg-white w-full max-w-lg p-6 sm:rounded-faixa rounded-t-faixa shadow-modal max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="rotulo">Preparar bolsa</p>
            <h3 className="section-title mt-1">
              {nextSwap ? `Troca em ${format(nextSwap, "dd/MM, EEEE", { locale: ptBR })}` : 'Próxima troca'}
            </h3>
          </div>
          <button onClick={onClose} className="btn-icon" aria-label="Fechar">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-5">
          <p className="rotulo mb-3">O que costuma ir</p>
          {items.length === 0 ? (
            <p className="corpo mb-4">Nenhum item padrão cadastrado.</p>
          ) : (
            <div className="space-y-1 mb-5">
              {items.map(it => (
                <div key={it.id} className="flex items-center gap-3 py-2">
                  <span className="ponto bg-bussola" />
                  <span className="text-[15px] font-normal text-ink">{it.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {pendingReturns.length > 0 && (
          <div className="mt-2">
            <p className="rotulo mb-3">Não esquecer de devolver</p>
            <div className="space-y-1 mb-5">
              {pendingReturns.map(s => (
                <div key={s.id} className="flex items-center gap-3 py-2">
                  <span className="ponto bg-alerta" />
                  <span className="text-[15px] font-normal text-ink">{s.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-2">
          <p className="rotulo mb-3">Vai algo diferente dessa vez?</p>
          {extras.length > 0 && (
            <div className="space-y-1 mb-3">
              {extras.map(e => (
                <div key={e.id} className="flex items-center gap-3 py-2">
                  <span className="ponto" style={{ backgroundColor: e.must_return ? '#6B5CE7' : '#9896B0' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-normal text-ink truncate">{e.name}</p>
                    <p className="apoio">{e.must_return ? 'Precisa voltar' : 'Só nessa troca'}</p>
                  </div>
                  <button onClick={() => removeExtra(e.id)} className="btn-texto">Remover</button>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setShowAdd(true)} className="btn-secundario w-full">+ Adicionar item</button>
        </div>

        <div className="mt-6 flex gap-2 flex-wrap">
          <button onClick={confirm} disabled={saving} className="btn-primario flex-1 min-w-[160px]">
            {saving ? 'Registrando…' : 'Bolsa pronta'}
          </button>
          <button onClick={onClose} className="btn-secundario">Cancelar</button>
        </div>

        {showAdd && <AddExtraModal onAdd={addExtra} onClose={() => setShowAdd(false)} />}
      </div>
    </div>
  )
}

function AddExtraModal({ onAdd, onClose }) {
  const [name, setName] = useState('')
  const [mustReturn, setMustReturn] = useState(null) // null | true | false

  function submit() {
    if (!name.trim() || mustReturn === null) return
    onAdd(name.trim(), mustReturn)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-profundo/40" onClick={onClose}>
      <div className="bg-white w-full max-w-md p-6 rounded-faixa shadow-modal" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">Adicionar item</h3>
          <button onClick={onClose} className="btn-icon" aria-label="Fechar">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <label className="input-label">O que vai?</label>
        <input
          className="input mb-5"
          placeholder="Ex: Certificado das Olimpíadas"
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <p className="rotulo mb-3">Esse item precisa voltar?</p>
        <div className="flex gap-2 mb-6">
          {[
            { key: true,  label: 'Sim' },
            { key: false, label: 'Não' },
          ].map(o => (
            <button
              key={String(o.key)}
              onClick={() => setMustReturn(o.key)}
              className={`flex-1 min-h-[48px] rounded-btn border transition-colors text-[15px] font-normal ${
                mustReturn === o.key
                  ? 'border-bussola bg-bussola-select text-ink'
                  : 'border-linha bg-white text-ink-body hover:border-[#D9DCF7]'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={submit} disabled={!name.trim() || mustReturn === null} className="btn-primario flex-1 disabled:opacity-40">
            Adicionar
          </button>
          <button onClick={onClose} className="btn-secundario">Cancelar</button>
        </div>
      </div>
    </div>
  )
}
