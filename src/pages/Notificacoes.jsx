import { useEffect, useState } from 'react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const KIND_META = {
  guard_swap_requested:  { label: 'Pedido de troca',    tone: 'bg-aurora text-[#7A2141]' },
  guard_swap_approved:   { label: 'Troca aprovada',     tone: 'bg-[#DCFCE7] text-[#166534]' },
  guard_swap_denied:     { label: 'Troca negada',       tone: 'bg-[#FEE4E5] text-[#B91C1C]' },
  guard_switch_eve:      { label: 'Véspera de troca',   tone: 'bg-aurora text-[#7A2141]' },
  decision_created:      { label: 'Novo combinado',     tone: 'bg-bussola-wash text-bussola' },
  consultation_created:  { label: 'Consulta',           tone: 'bg-[#EEF0FF] text-[#4C48A9]' },
  consultation_upcoming: { label: 'Consulta amanhã',    tone: 'bg-[#EEF0FF] text-[#4C48A9]' },
  expense_created:       { label: 'Nova despesa',       tone: 'bg-[#FEF3C7] text-[#92400E]' },
  expense_settled:       { label: 'Acerto de despesa',  tone: 'bg-[#DCFCE7] text-[#166534]' },
  document_created:      { label: 'Novo documento',     tone: 'bg-[#E0E7FF] text-[#3730A3]' },
}

const ENTITY_PATH = {
  guard_swap:    '/agenda',
  guard_pattern: '/agenda',
  decision:      '/decisoes',
  consultation:  '/saude',
  expense:       '/despesas',
  document:      '/documentos',
}

export default function Notificacoes() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all | unread

  useEffect(() => {
    if (!isSupabaseConfigured || !user) { setLoading(false); return }
    load()
    const channel = supabase
      .channel(`notif-list-${user.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `recipient_user_id=eq.${user.id}` },
        () => load()
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)
    setItems(data || [])
    setLoading(false)
  }

  async function markRead(id) {
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id)
  }

  async function markAllRead() {
    const ids = items.filter(n => !n.read_at).map(n => n.id)
    if (!ids.length) return
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).in('id', ids)
  }

  const shown = filter === 'unread' ? items.filter(n => !n.read_at) : items
  const unread = items.filter(n => !n.read_at).length

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="rotulo mb-2">Central de avisos</p>
          <h1 className="page-title">Notificações</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/preferencias" className="btn-secundario text-sm">Preferências</Link>
          {unread > 0 && (
            <button onClick={markAllRead} className="btn-secundario text-sm">Marcar tudo como lido</button>
          )}
        </div>
      </div>

      <div className="flex gap-1 bg-nevoa rounded-xl p-1 mb-5 w-fit">
        {[
          { id: 'all',    label: `Todas (${items.length})` },
          { id: 'unread', label: `Não lidas (${unread})` },
        ].map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === t.id ? 'bg-white text-ink shadow-sm' : 'text-ink-mute hover:text-ink'
            }`}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="esqueleto h-20" />)}</div>
      ) : shown.length === 0 ? (
        <div className="card py-10 text-center">
          <p className="font-display leading-[1.1]" style={{ fontSize: '26px', fontWeight: 200 }}>
            {filter === 'unread' ? <>Tudo <em className="italic font-semibold">em dia</em>.</> : <>Nenhuma <em className="italic font-semibold">notificação</em> por aqui.</>}
          </p>
          <p className="corpo mt-2">Você receberá avisos quando algo relevante acontecer.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {shown.map(n => {
            const meta = KIND_META[n.kind] || { label: n.kind, tone: 'bg-nevoa text-ink-mute' }
            const path = ENTITY_PATH[n.entity_type] || '/'
            const linkTo = n.entity_id ? `${path}?highlight=${n.entity_id}` : path
            return (
              <Link
                key={n.id} to={linkTo}
                onClick={() => !n.read_at && markRead(n.id)}
                className={`card block hover:border-bussola/40 transition-colors ${!n.read_at ? 'border-l-4 border-l-bussola' : ''}`}
                style={{ padding: '14px 16px' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded ${meta.tone}`}>{meta.label}</span>
                      {!n.read_at && <span className="w-1.5 h-1.5 rounded-full bg-bussola" />}
                    </div>
                    <p className="text-[15px] font-medium text-ink leading-tight">{n.title}</p>
                    {n.body && <p className="text-[13px] text-ink-mute mt-1">{n.body}</p>}
                  </div>
                  <span className="text-[11px] text-ink-mute whitespace-nowrap flex-shrink-0 mt-1">
                    {formatDistanceToNow(parseISO(n.created_at), { locale: ptBR, addSuffix: true })}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
