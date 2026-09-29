import { Link } from 'react-router-dom'

// Card compacto de atalho usado em Home e Documentos.
// Vive em componentes/ pra que os consumers não puxem o arquivo inteiro de Perfil.
export default function PerfilAtalhoCard({ child, profile }) {
  const p = profile || child?.profile || {}
  const filled = [
    p.full_name, p.cpf, p.blood_type, p.emergency_hospital,
    p.health_plan_operator, p.emergency_contact_name,
  ].filter(Boolean).length
  const total = 6

  return (
    <Link
      to="/perfil"
      className="card block hover:border-bussola/40 transition-colors"
      style={{ padding: '18px 20px' }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-bussola-wash flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-bussola" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium text-ink">Perfil de {child?.name}</p>
          <p className="apoio mt-0.5">
            {filled === total
              ? 'Cartão completo — pronto pra emergência'
              : filled === 0
                ? 'Ainda não preenchido'
                : `${filled} de ${total} dados essenciais preenchidos`}
          </p>
          {p.blood_type && (
            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded bg-alerta/10 text-alerta text-[11px] font-semibold">
              Tipo sanguíneo {p.blood_type}
            </span>
          )}
        </div>
        <svg className="w-4 h-4 text-ink-mute flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}
