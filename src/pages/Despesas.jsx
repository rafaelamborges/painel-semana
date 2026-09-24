import { useState, useEffect, useMemo } from 'react'
import { format, parseISO, startOfMonth, endOfMonth, addMonths, isSameMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useFamily } from '../context/FamilyContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const CATEGORIES = [
  { id: 'educacao',   label: 'Educação' },
  { id: 'saude',      label: 'Saúde' },
  { id: 'atividades', label: 'Atividades' },
  { id: 'vestuario',  label: 'Vestuário' },
  { id: 'alimentacao',label: 'Alimentação' },
  { id: 'transporte', label: 'Transporte' },
  { id: 'presentes',  label: 'Presentes' },
  { id: 'outros',     label: 'Outros' },
]

const CAT_TONE = {
  educacao:    { bg: 'bg-[#EEF0FF]', text: 'text-[#4C48A9]' },
  saude:       { bg: 'bg-[#FFE8EE]', text: 'text-[#B91C4B]' },
  atividades:  { bg: 'bg-[#E0F5F0]', text: 'text-[#0F766E]' },
  vestuario:   { bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]' },
  alimentacao: { bg: 'bg-[#FEE2E2]', text: 'text-[#B91C1C]' },
  transporte:  { bg: 'bg-[#E0E7FF]', text: 'text-[#3730A3]' },
  presentes:   { bg: 'bg-[#FCE7F3]', text: 'text-[#9D174D]' },
  outros:      { bg: 'bg-[#F0F0F5]', text: 'text-[#5F5D7A]' },
}

const brl = (cents) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format((cents || 0) / 100)

export default function Despesas() {
  const { family, child, members, permissions, guardianLabels } = useFamily()
  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState([])
  const [settlements, setSettlements] = useState([])
  const [settings, setSettings] = useState(null)
  const [tab, setTab] = useState('todas') // todas | fixas | pontuais
  const [monthOffset, setMonthOffset] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [settleFor, setSettleFor] = useState(null)

  const monthDate = useMemo(() => addMonths(new Date(), monthOffset), [monthOffset])
  const monthStart = startOfMonth(monthDate)
  const monthEnd = endOfMonth(monthDate)

  useEffect(() => {
    if (!isSupabaseConfigured || !family) return
    load()
  }, [family])

  async function load() {
    setLoading(true)
    const [{ data: exps }, { data: setts }, { data: cfg }] = await Promise.all([
      supabase.from('expenses').select('*').eq('family_id', family.id).neq('status', 'arquivada').order('date', { ascending: false }),
      supabase.from('expense_settlements').select('*').in('expense_id',
        (await supabase.from('expenses').select('id').eq('family_id', family.id).neq('status','arquivada')).data?.map(e => e.id) || []
      ),
      supabase.from('expense_settings').select('*').eq('family_id', family.id).maybeSingle(),
    ])
    setExpenses(exps || [])
    setSettlements(setts || [])
    setSettings(cfg || null)
    setLoading(false)
  }

  const memberById = useMemo(() => {
    const m = new Map()
    for (const x of members) m.set(x.id, x)
    return m
  }, [members])

  const guardians = useMemo(() => members.filter(m => m.role === 'mother' || m.role === 'father'), [members])

  const defaultShares = useMemo(() => {
    if (settings?.default_shares && Object.keys(settings.default_shares).length) return settings.default_shares
    // padrão 50/50 entre guardiões
    if (guardians.length >= 2) {
      return { [guardians[0].id]: 50, [guardians[1].id]: 50 }
    }
    return {}
  }, [settings, guardians])

  // Filtra despesas do mês + tab
  const listExpenses = useMemo(() => {
    return expenses.filter(e => {
      const inMonth = isSameMonth(parseISO(e.date), monthDate)
      if (!inMonth) return false
      if (tab === 'fixas') return e.kind === 'fixa'
      if (tab === 'pontuais') return e.kind === 'pontual'
      return true
    })
  }, [expenses, monthDate, tab])

  const totalMonth = useMemo(() =>
    listExpenses.reduce((s, e) => s + Number(e.amount_cents || 0), 0)
  , [listExpenses])

  // Saldo entre guardiões (considerando todas as despesas abertas + acertos)
  const saldo = useMemo(() => {
    if (guardians.length < 2) return null
    const [A, B] = guardians
    let net = 0 // positivo: B deve pra A
    const settByExpense = new Map()
    for (const s of settlements) {
      if (!settByExpense.has(s.expense_id)) settByExpense.set(s.expense_id, [])
      settByExpense.get(s.expense_id).push(s)
    }
    for (const e of expenses) {
      if (e.status === 'arquivada') continue
      const shares = e.shares || defaultShares
      const amt = Number(e.amount_cents || 0)
      const shareA = Math.round(amt * (Number(shares[A.id]) || 0) / 100)
      const shareB = Math.round(amt * (Number(shares[B.id]) || 0) / 100)
      if (e.payer_id === A.id) {
        net += shareB // B deve sua parte pra A
      } else if (e.payer_id === B.id) {
        net -= shareA // A deve sua parte pra B
      }
      // acertos reduzem a dívida
      const setts = settByExpense.get(e.id) || []
      for (const s of setts) {
        const val = Number(s.amount_cents)
        if (s.member_id === B.id) net -= val // B pagou pra A
        else if (s.member_id === A.id) net += val // A pagou pra B
      }
    }
    return { A, B, net }
  }, [expenses, settlements, defaultShares, guardians])

  const canAdd = permissions?.canAdd
  const canEdit = permissions?.canEdit || permissions?.canAdd
  const canDelete = permissions?.canDelete

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="rotulo mb-2">Rateio da família {child?.name ? `· ${child.name}` : ''}</p>
          <h1 className="page-title">Despesas</h1>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={() => setShowSettings(true)} className="btn-secundario text-sm">
            Percentual padrão
          </button>
          {canAdd && (
            <button onClick={() => { setEditing(null); setShowForm(true) }} className="btn-primario text-sm">
              + Nova despesa
            </button>
          )}
        </div>
      </div>

      {/* Saldo */}
      {saldo && saldo.net !== 0 && (
        <div className="card mb-6" style={{ padding: '20px 22px' }}>
          <p className="rotulo mb-2">Saldo em aberto</p>
          {saldo.net > 0 ? (
            <p className="text-[22px] font-light text-ink">
              <strong className="font-medium" style={{ color: saldo.B.color || '#4DC9B8' }}>{saldo.B.name}</strong> deve <strong className="font-medium">{brl(saldo.net)}</strong> para <strong className="font-medium" style={{ color: saldo.A.color || '#5B8FF9' }}>{saldo.A.name}</strong>
            </p>
          ) : (
            <p className="text-[22px] font-light text-ink">
              <strong className="font-medium" style={{ color: saldo.A.color || '#5B8FF9' }}>{saldo.A.name}</strong> deve <strong className="font-medium">{brl(-saldo.net)}</strong> para <strong className="font-medium" style={{ color: saldo.B.color || '#4DC9B8' }}>{saldo.B.name}</strong>
            </p>
          )}
          <p className="apoio mt-2">
            Baseado em todas as despesas em aberto (não arquivadas).
          </p>
        </div>
      )}
      {saldo && saldo.net === 0 && expenses.length > 0 && (
        <div className="card mb-6" style={{ padding: '20px 22px' }}>
          <p className="rotulo mb-2">Saldo em aberto</p>
          <p className="text-[22px] font-light text-ink">Em dia entre <strong className="font-medium">{saldo.A.name}</strong> e <strong className="font-medium">{saldo.B.name}</strong>.</p>
        </div>
      )}

      {/* Tabs + mês */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex gap-1 bg-nevoa rounded-xl p-1">
          {[
            { id: 'todas',    label: 'Todas' },
            { id: 'fixas',    label: 'Fixas' },
            { id: 'pontuais', label: 'Pontuais' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id ? 'bg-white text-ink shadow-sm' : 'text-ink-mute hover:text-ink'
              }`}
            >{t.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setMonthOffset(o => o - 1)} className="btn-texto text-ink-mute">‹</button>
          <p className="text-sm font-medium min-w-[140px] text-center">
            {format(monthDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
          <button onClick={() => setMonthOffset(o => o + 1)} className="btn-texto text-ink-mute">›</button>
        </div>
      </div>

      {/* Total do mês */}
      {listExpenses.length > 0 && (
        <div className="flex justify-between items-baseline mb-3 px-1">
          <p className="apoio">{listExpenses.length} despesa{listExpenses.length > 1 ? 's' : ''}</p>
          <p className="text-sm text-ink-mute">Total do mês <strong className="text-ink font-medium">{brl(totalMonth)}</strong></p>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="esqueleto h-24" />)}</div>
      ) : listExpenses.length === 0 ? (
        <div className="card py-10 text-center">
          <p className="font-display leading-[1.1]" style={{ fontSize: '26px', fontWeight: 200 }}>
            Nenhuma <em className="italic font-semibold">despesa</em> em {format(monthDate, 'MMMM', { locale: ptBR })}.
          </p>
          <p className="corpo mt-2">Registre gastos para acompanhar o saldo entre coparentes.</p>
          {canAdd && (
            <button onClick={() => { setEditing(null); setShowForm(true) }} className="btn-primario mt-5">
              Nova despesa
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {listExpenses.map(e => (
            <ExpenseCard
              key={e.id}
              expense={e}
              settlements={settlements.filter(s => s.expense_id === e.id)}
              memberById={memberById}
              defaultShares={defaultShares}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={() => { setEditing(e); setShowForm(true) }}
              onSettle={() => setSettleFor(e)}
              onDelete={async () => {
                await supabase.from('expenses').delete().eq('id', e.id)
                load()
              }}
              onArchive={async () => {
                await supabase.from('expenses').update({ status: 'arquivada' }).eq('id', e.id)
                load()
              }}
            />
          ))}
        </div>
      )}

      {showForm && (
        <ExpenseForm
          expense={editing}
          family={family}
          child={child}
          members={members}
          defaultShares={defaultShares}
          guardians={guardians}
          onClose={() => { setShowForm(false); setEditing(null) }}
          onSaved={() => { setShowForm(false); setEditing(null); load() }}
        />
      )}

      {showSettings && (
        <SettingsForm
          family={family}
          settings={settings}
          guardians={guardians}
          onClose={() => setShowSettings(false)}
          onSaved={() => { setShowSettings(false); load() }}
        />
      )}

      {settleFor && (
        <SettleForm
          expense={settleFor}
          memberById={memberById}
          defaultShares={defaultShares}
          onClose={() => setSettleFor(null)}
          onSaved={() => { setSettleFor(null); load() }}
        />
      )}
    </div>
  )
}

function ExpenseCard({ expense, settlements, memberById, defaultShares, canEdit, canDelete, onEdit, onSettle, onDelete, onArchive }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const payer = memberById.get(expense.payer_id)
  const shares = expense.shares || defaultShares
  const tone = CAT_TONE[expense.category] || CAT_TONE.outros
  const catLabel = CATEGORIES.find(c => c.id === expense.category)?.label || 'Outros'
  const totalSettled = settlements.reduce((s, x) => s + Number(x.amount_cents || 0), 0)

  const shareLines = Object.entries(shares).map(([mid, pct]) => {
    const m = memberById.get(mid)
    if (!m) return null
    const amt = Math.round(Number(expense.amount_cents) * Number(pct) / 100)
    return { name: m.name || 'Membro', pct, amt, color: m.color, isPayer: mid === expense.payer_id }
  }).filter(Boolean)

  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded ${tone.bg} ${tone.text}`}>{catLabel}</span>
            {expense.kind === 'fixa' && (
              <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded bg-nevoa text-ink-mute">
                Fixa · {expense.recurrence === 'anual' ? 'anual' : 'mensal'}
              </span>
            )}
          </div>
          <p className="text-[15px] font-medium text-ink leading-tight">{expense.title}</p>
          <p className="apoio mt-0.5">
            {format(parseISO(expense.date), "dd 'de' MMM", { locale: ptBR })}
            {payer && <> · pago por <strong className="font-medium text-ink" style={{ color: payer.color }}>{payer.name}</strong></>}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[18px] font-medium text-ink leading-none">{brl(expense.amount_cents)}</p>
          {expense.receipt_url && (
            <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-bussola mt-1 inline-block hover:underline">
              Comprovante
            </a>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-linha flex items-center flex-wrap gap-x-4 gap-y-1">
        {shareLines.map(l => (
          <span key={l.name} className="inline-flex items-center gap-1.5 text-[12px]">
            <span className="w-2 h-2 rounded-full" style={{ background: l.color || '#9896B0' }} />
            <span className="text-ink-mute">{l.name}</span>
            <span className="text-ink font-medium">{brl(l.amt)}</span>
            <span className="text-ink-mute">({l.pct}%)</span>
          </span>
        ))}
      </div>

      {expense.notes && (
        <p className="mt-3 text-[13px] text-ink-mute border-t border-linha pt-3">{expense.notes}</p>
      )}

      {settlements.length > 0 && (
        <div className="mt-3 pt-3 border-t border-linha space-y-1">
          <p className="rotulo">Acertos</p>
          {settlements.map(s => {
            const m = memberById.get(s.member_id)
            return (
              <p key={s.id} className="text-[12px] text-ink-mute">
                {m?.name || 'Membro'} acertou <strong className="text-ink font-medium">{brl(s.amount_cents)}</strong> em {format(parseISO(s.settled_at), 'dd/MM/yy')}
                {s.notes && <> · {s.notes}</>}
              </p>
            )
          })}
          {totalSettled > 0 && (
            <p className="text-[11px] text-ink-mute pt-1">Total acertado: <strong className="text-ink font-medium">{brl(totalSettled)}</strong></p>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-linha">
        <button onClick={onSettle} className="btn-texto">Registrar acerto</button>
        {canEdit && !confirmDelete && (
          <button onClick={onEdit} className="btn-texto text-ink-mute">Editar</button>
        )}
        {canEdit && !confirmDelete && (
          <button onClick={onArchive} className="btn-texto text-ink-mute">Arquivar</button>
        )}
        {canDelete && (confirmDelete ? (
          <>
            <button onClick={() => setConfirmDelete(false)} className="btn-texto text-ink-mute">Cancelar</button>
            <button onClick={() => { setConfirmDelete(false); onDelete?.() }} className="btn-texto text-alerta">Confirmar exclusão</button>
          </>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="btn-texto text-ink-mute hover:text-alerta">Excluir</button>
        ))}
      </div>
    </div>
  )
}

function ExpenseForm({ expense, family, child, members, defaultShares, guardians, onClose, onSaved }) {
  const isEdit = !!expense
  const [title, setTitle] = useState(expense?.title || '')
  const [amount, setAmount] = useState(expense ? (Number(expense.amount_cents) / 100).toString().replace('.', ',') : '')
  const [date, setDate] = useState(expense?.date || format(new Date(), 'yyyy-MM-dd'))
  const [category, setCategory] = useState(expense?.category || 'outros')
  const [kind, setKind] = useState(expense?.kind || 'pontual')
  const [recurrence, setRecurrence] = useState(expense?.recurrence || 'mensal')
  const [dueDay, setDueDay] = useState(expense?.due_day || 1)
  const [payerId, setPayerId] = useState(expense?.payer_id || guardians[0]?.id || '')
  const [notes, setNotes] = useState(expense?.notes || '')
  const [customShares, setCustomShares] = useState(!!expense?.shares)
  const initialShares = expense?.shares || defaultShares
  const [shares, setShares] = useState(initialShares)
  const [receiptFile, setReceiptFile] = useState(null)
  const [receiptUrl, setReceiptUrl] = useState(expense?.receipt_url || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const parseAmount = () => {
    const raw = (amount || '').replace(/[^\d,]/g, '').replace(',', '.')
    const n = parseFloat(raw)
    return isNaN(n) ? 0 : Math.round(n * 100)
  }

  const sharesToUse = customShares ? shares : defaultShares
  const sharesSum = Object.values(sharesToUse).reduce((s, p) => s + Number(p || 0), 0)
  const validShares = Math.abs(sharesSum - 100) < 0.01

  async function save(e) {
    e.preventDefault()
    setError('')
    const amtCents = parseAmount()
    if (amtCents <= 0) { setError('Informe um valor válido.'); return }
    if (!validShares) { setError('A soma dos percentuais precisa dar 100%.'); return }
    setSaving(true)

    let finalReceiptUrl = receiptUrl
    if (receiptFile) {
      const ext = receiptFile.name.split('.').pop().toLowerCase()
      const path = `${family.id}/${crypto.randomUUID()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('expense-receipts')
        .upload(path, receiptFile, { upsert: false })
      if (upErr) { setError('Erro ao enviar comprovante: ' + upErr.message); setSaving(false); return }
      const { data: signed } = await supabase.storage.from('expense-receipts').createSignedUrl(path, 60 * 60 * 24 * 365)
      finalReceiptUrl = signed?.signedUrl || ''
    }

    const payload = {
      family_id: family.id,
      child_id: child?.id || null,
      title: title.trim(),
      amount_cents: amtCents,
      date,
      category,
      kind,
      recurrence: kind === 'fixa' ? recurrence : null,
      due_day: kind === 'fixa' && recurrence === 'mensal' ? Number(dueDay) : null,
      payer_id: payerId || null,
      shares: customShares ? shares : null,
      receipt_url: finalReceiptUrl || null,
      notes: notes.trim() || null,
    }

    const { error: err } = isEdit
      ? await supabase.from('expenses').update(payload).eq('id', expense.id)
      : await supabase.from('expenses').insert(payload)

    if (err) { setError(err.message); setSaving(false); return }
    onSaved()
  }

  return (
    <Modal onClose={onClose} title={isEdit ? 'Editar despesa' : 'Nova despesa'}>
      <form onSubmit={save} className="space-y-3">
        <div>
          <label className="rotulo mb-1 block">Título</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
            placeholder="Ex: Óculos, natação, mensalidade escola"
            className="input" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="rotulo mb-1 block">Valor (R$)</label>
            <input type="text" value={amount} onChange={e => setAmount(e.target.value)} required
              placeholder="0,00" inputMode="decimal" className="input" />
          </div>
          <div>
            <label className="rotulo mb-1 block">Data</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="input" />
          </div>
        </div>
        <div>
          <label className="rotulo mb-1 block">Categoria</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="input">
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>

        <div>
          <label className="rotulo mb-2 block">Tipo</label>
          <div className="flex gap-2">
            {[
              { id: 'pontual', label: 'Pontual' },
              { id: 'fixa',    label: 'Fixa (recorrente)' },
            ].map(k => (
              <button key={k.id} type="button" onClick={() => setKind(k.id)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  kind === k.id ? 'bg-bussola-wash border-bussola/40 text-bussola' : 'border-linha text-ink-mute'
                }`}>
                {k.label}
              </button>
            ))}
          </div>
        </div>

        {kind === 'fixa' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="rotulo mb-1 block">Recorrência</label>
              <select value={recurrence} onChange={e => setRecurrence(e.target.value)} className="input">
                <option value="mensal">Mensal</option>
                <option value="anual">Anual</option>
              </select>
            </div>
            {recurrence === 'mensal' && (
              <div>
                <label className="rotulo mb-1 block">Vencimento (dia)</label>
                <input type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)} className="input" />
              </div>
            )}
          </div>
        )}

        <div>
          <label className="rotulo mb-1 block">Quem pagou</label>
          <select value={payerId} onChange={e => setPayerId(e.target.value)} className="input">
            <option value="">— selecione —</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name || m.email || 'Membro'}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer py-1">
            <input type="checkbox" checked={customShares} onChange={e => setCustomShares(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-bussola" />
            <span className="text-sm text-ink">Usar percentual diferente do padrão para esta despesa</span>
          </label>

          <div className="mt-2 space-y-2">
            {(customShares ? Object.keys(shares).length ? Object.keys(shares) : guardians.map(g => g.id) : Object.keys(defaultShares)).map(mid => {
              const m = members.find(x => x.id === mid)
              const pct = customShares ? (shares[mid] ?? 0) : (defaultShares[mid] ?? 0)
              return (
                <div key={mid} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: m?.color || '#9896B0' }} />
                  <span className="text-sm flex-1 truncate">{m?.name || 'Membro'}</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number" min="0" max="100" value={pct}
                      disabled={!customShares}
                      onChange={e => setShares(s => ({ ...s, [mid]: Number(e.target.value) }))}
                      className="input w-20 text-right"
                    />
                    <span className="text-sm text-ink-mute">%</span>
                  </div>
                  <span className="text-sm text-ink-mute w-20 text-right tabular-nums">
                    {brl(Math.round(parseAmount() * Number(pct) / 100))}
                  </span>
                </div>
              )
            })}
            {customShares && !validShares && (
              <p className="text-[12px] text-alerta">Soma dos percentuais: {sharesSum}% (precisa ser 100%)</p>
            )}
          </div>
        </div>

        <div>
          <label className="rotulo mb-1 block">Comprovante (opcional)</label>
          <input type="file" accept="image/*,application/pdf" onChange={e => setReceiptFile(e.target.files?.[0] || null)}
            className="text-sm" />
          {receiptUrl && !receiptFile && (
            <p className="text-[12px] text-ink-mute mt-1">
              Já anexado · <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="text-bussola hover:underline">ver</a>
            </p>
          )}
        </div>

        <div>
          <label className="rotulo mb-1 block">Observações</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            placeholder="Detalhes, contexto, referência" className="input resize-none" />
        </div>

        {error && <p className="text-alerta text-sm">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secundario flex-1">Cancelar</button>
          <button type="submit" disabled={saving} className="btn-primario flex-1">
            {saving ? 'Salvando…' : isEdit ? 'Salvar' : 'Registrar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function SettingsForm({ family, settings, guardians, onClose, onSaved }) {
  const initial = settings?.default_shares && Object.keys(settings.default_shares).length
    ? settings.default_shares
    : (guardians.length >= 2 ? { [guardians[0].id]: 50, [guardians[1].id]: 50 } : {})
  const [shares, setShares] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const sum = Object.values(shares).reduce((s, p) => s + Number(p || 0), 0)
  const valid = Math.abs(sum - 100) < 0.01

  async function save(e) {
    e.preventDefault()
    if (!valid) { setError('A soma precisa dar 100%.'); return }
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('expense_settings')
      .upsert({ family_id: family.id, default_shares: shares, updated_at: new Date().toISOString() })
    if (err) { setError(err.message); setSaving(false); return }
    onSaved()
  }

  return (
    <Modal onClose={onClose} title="Percentual padrão de rateio">
      <form onSubmit={save} className="space-y-4">
        <p className="text-sm text-ink-mute">
          Aplicado em todas as novas despesas. Você pode sobrescrever caso a caso.
        </p>
        <div className="space-y-2">
          {guardians.map(g => (
            <div key={g.id} className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full flex-none" style={{ background: g.color || '#9896B0' }} />
              <span className="text-sm flex-1">{g.name}</span>
              <input
                type="number" min="0" max="100"
                value={shares[g.id] ?? 0}
                onChange={e => setShares(s => ({ ...s, [g.id]: Number(e.target.value) }))}
                className="input w-24 text-right"
              />
              <span className="text-sm text-ink-mute">%</span>
            </div>
          ))}
        </div>
        <p className={`text-[12px] ${valid ? 'text-ink-mute' : 'text-alerta'}`}>
          Soma: {sum}%
        </p>
        {error && <p className="text-alerta text-sm">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secundario flex-1">Cancelar</button>
          <button type="submit" disabled={saving} className="btn-primario flex-1">
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function SettleForm({ expense, memberById, defaultShares, onClose, onSaved }) {
  const shares = expense.shares || defaultShares
  const nonPayerIds = Object.keys(shares).filter(mid => mid !== expense.payer_id)
  const [memberId, setMemberId] = useState(nonPayerIds[0] || '')
  const [amount, setAmount] = useState('')
  const [settledAt, setSettledAt] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const pct = Number(shares[memberId] || 0)
    const expected = Math.round(Number(expense.amount_cents) * pct / 100)
    setAmount((expected / 100).toString().replace('.', ','))
  }, [memberId])

  const parseAmount = () => {
    const raw = (amount || '').replace(/[^\d,]/g, '').replace(',', '.')
    const n = parseFloat(raw)
    return isNaN(n) ? 0 : Math.round(n * 100)
  }

  async function save(e) {
    e.preventDefault()
    const cents = parseAmount()
    if (cents <= 0) { setError('Informe um valor válido.'); return }
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('expense_settlements').insert({
      expense_id: expense.id,
      member_id: memberId,
      amount_cents: cents,
      settled_at: settledAt,
      notes: notes.trim() || null,
    })
    if (err) { setError(err.message); setSaving(false); return }
    onSaved()
  }

  return (
    <Modal onClose={onClose} title="Registrar acerto">
      <form onSubmit={save} className="space-y-3">
        <p className="text-sm text-ink-mute">
          {expense.title} — {brl(expense.amount_cents)}
        </p>
        <div>
          <label className="rotulo mb-1 block">Quem acertou</label>
          <select value={memberId} onChange={e => setMemberId(e.target.value)} className="input">
            {nonPayerIds.map(mid => (
              <option key={mid} value={mid}>{memberById.get(mid)?.name || 'Membro'}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="rotulo mb-1 block">Valor (R$)</label>
            <input type="text" value={amount} onChange={e => setAmount(e.target.value)} required className="input" />
          </div>
          <div>
            <label className="rotulo mb-1 block">Data</label>
            <input type="date" value={settledAt} onChange={e => setSettledAt(e.target.value)} required className="input" />
          </div>
        </div>
        <div>
          <label className="rotulo mb-1 block">Observações</label>
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ex: Pix enviado 15/09" className="input" />
        </div>
        {error && <p className="text-alerta text-sm">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secundario flex-1">Cancelar</button>
          <button type="submit" disabled={saving} className="btn-primario flex-1">
            {saving ? 'Salvando…' : 'Registrar acerto'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-ink">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-linha-suave">
            <svg className="w-4 h-4 text-ink-mute" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
