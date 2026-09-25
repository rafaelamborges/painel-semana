import { useSearchParams } from 'react-router-dom'
import Guarda from './Guarda'
import AgendaEventos from './AgendaEventos'

const TABS = [
  { id: 'rotina',  label: 'Rotina' },
  { id: 'eventos', label: 'Próximos eventos' },
]

export default function Agenda() {
  const [params, setParams] = useSearchParams()
  const tab = TABS.some(t => t.id === params.get('tab')) ? params.get('tab') : 'rotina'

  function setTab(next) {
    const p = new URLSearchParams(params)
    p.set('tab', next)
    setParams(p, { replace: true })
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <p className="rotulo mb-2">Compasso</p>
        <h1 className="page-title">Agenda</h1>
      </div>

      <div className="flex gap-5 sm:gap-7 mb-6 border-b border-linha overflow-x-auto scrollbar-hide">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`aba whitespace-nowrap ${tab === t.id ? 'aba-ativa' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'rotina'  && <Guarda embedded />}
      {tab === 'eventos' && <AgendaEventos embedded />}
    </div>
  )
}
