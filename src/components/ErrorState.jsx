import { useState } from 'react'

// Padrão de erro reutilizável — para empty states de carregamento, 404, 403, falhas gerais.
// Encaixa dentro de qualquer página.
export default function ErrorState({
  title = 'Algo não deu certo.',
  subtitle,
  primaryAction,
  secondaryAction,
  detail,
  variant = 'alerta', // 'alerta' | 'neutro' | 'aurora'
}) {
  const [showDetail, setShowDetail] = useState(false)

  const toneBg = {
    alerta: 'bg-aurora',
    neutro: 'bg-nevoa',
    aurora: 'bg-aurora',
  }[variant]

  const iconColor = {
    alerta: '#B91C4B',
    neutro: '#9896B0',
    aurora: '#B91C4B',
  }[variant]

  return (
    <div className="card max-w-md w-full text-center py-10 px-6">
      <div
        className={`w-14 h-14 ${toneBg} rounded-full flex items-center justify-center mx-auto mb-5`}
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      </div>

      <h2 className="font-display leading-[1.1]" style={{ fontSize: '26px', fontWeight: 200 }}>
        {title}
      </h2>

      {subtitle && (
        <p className="corpo mt-3 max-w-sm mx-auto">{subtitle}</p>
      )}

      <div className="mt-6 flex gap-2 flex-wrap justify-center">
        {primaryAction && (
          <button onClick={primaryAction.onClick} className="btn-primario">
            {primaryAction.label}
          </button>
        )}
        {secondaryAction && (
          <button onClick={secondaryAction.onClick} className="btn-secundario">
            {secondaryAction.label}
          </button>
        )}
      </div>

      {detail && (
        <div className="mt-6 text-left">
          <button
            onClick={() => setShowDetail(s => !s)}
            className="btn-texto text-ink-mute text-[12px]"
          >
            {showDetail ? 'Esconder detalhes técnicos' : 'Ver detalhes técnicos'}
          </button>
          {showDetail && (
            <pre className="mt-2 text-[11px] bg-nevoa p-3 rounded-lg text-ink-mute whitespace-pre-wrap break-all font-mono">
              {detail}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
