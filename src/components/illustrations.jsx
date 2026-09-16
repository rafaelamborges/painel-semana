/**
 * Compasso — estados vazios e símbolos.
 *
 * Antes: mascote ilustrado + ilustrações temáticas.
 * Agora (Brand Book v1.0): estado vazio com par canônico (Newsreader 200/26 + Lexend 300)
 * e ação em texto. Sem mascote, sem ilustração infantil.
 *
 * As exportações antigas (`CompassMascot`, `HeroFamily`, `EmptyCalendar`, `EmptyDoctor`,
 * `EmptyDocuments`, `EmptyDecisions`, `EmptyReminders`, `EmptyAchievements`, `EmptySwaps`,
 * `EmptyTherapy`, `EmptyGeneric`) continuam existindo como componentes vazios/símbolos
 * geométricos para que arquivos que ainda as importam não quebrem — mas nada mais
 * renderiza uma ilustração figurativa.
 */

export function CompassSymbol({ size = 44 }) {
  const inner = Math.round(size * 0.32)
  return (
    <div
      className="rounded-full border-2 border-bussola flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div className="bg-bussola" style={{ width: inner, height: inner, transform: 'rotate(45deg)' }} />
    </div>
  )
}

/**
 * <EmptyState title="…" subtitle="…" action={…} />
 * Ignora o `art` — o brand book pede um par canônico em Newsreader.
 * Se o título tiver marcadores `<em>uma palavra</em>`, respeite; se não, o próprio texto vem.
 */
export function EmptyState({ title, subtitle, action, canonical, className = '' }) {
  return (
    <div className={`flex flex-col items-center text-center px-4 py-6 ${className}`}>
      <p className="font-display leading-[1.1] tracking-[-0.02em] text-ink" style={{ fontSize: '26px', fontWeight: 200 }}>
        {canonical || title}
      </p>
      {subtitle && <p className="corpo mt-3 max-w-md">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/* Compat: as exportações abaixo eram ilustrações — agora são no-ops (retornam null),
 * porque o EmptyState não usa mais `art`. Manter para import-safety.
 */
const Noop = () => null
export const CompassMascot     = CompassSymbol
export const HeroFamily        = Noop
export const EmptyCalendar     = Noop
export const EmptyDoctor       = Noop
export const EmptyDocuments    = Noop
export const EmptyDecisions    = Noop
export const EmptyReminders    = Noop
export const EmptyAchievements = Noop
export const EmptySwaps        = Noop
export const EmptyTherapy      = Noop
export const EmptyGeneric      = Noop
