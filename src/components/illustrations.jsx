// Warm, playful SVG illustrations for empty states, hero blocks, and the mascot.
// All illustrations pair with the indigo brand palette by adding warm accents
// (peach, honey, dusty rose, mint) — no palette overhaul needed.

const PALETTE = {
  indigo:      '#4F46E5',
  indigoSoft:  '#C7D2FE',
  indigoWash:  '#EEF2FF',
  peach:       '#FDBA74',
  peachSoft:   '#FED7AA',
  peachWash:   '#FFF7ED',
  honey:       '#FBBF24',
  honeyWash:   '#FEF3C7',
  rose:        '#F472B6',
  roseSoft:    '#FBCFE8',
  mint:        '#6EE7B7',
  mintSoft:    '#A7F3D0',
  sky:         '#7DD3FC',
  skySoft:     '#BAE6FD',
  slate:       '#334155',
  slateSoft:   '#94A3B8',
  cream:       '#FEF9F4',
}

// The mascot: a friendly compass with a smiling face and a needle pointing NE.
// Scales via `size`. Add `wave` to nudge one arm up for a greeting variant.
export function CompassMascot({ size = 80, wave = false, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" className={className}>
      {/* Warm halo */}
      <circle cx="60" cy="60" r="58" fill={PALETTE.peachWash} />
      <circle cx="60" cy="60" r="46" fill={PALETTE.cream} stroke={PALETTE.indigo} strokeWidth="3" />
      {/* Cardinal ticks */}
      {[0, 90, 180, 270].map((deg, i) => (
        <rect key={i} x="59" y="17" width="2" height="6" rx="1" fill={PALETTE.slateSoft}
          transform={`rotate(${deg} 60 60)`} />
      ))}
      {/* Needle */}
      <polygon points="60,26 66,60 60,56 54,60" fill={PALETTE.indigo} transform="rotate(35 60 60)" />
      <polygon points="60,94 54,60 60,64 66,60" fill={PALETTE.slateSoft} transform="rotate(35 60 60)" />
      <circle cx="60" cy="60" r="4" fill={PALETTE.honey} stroke={PALETTE.indigo} strokeWidth="1.5" />
      {/* Face */}
      <circle cx="49" cy="70" r="2.2" fill={PALETTE.slate} />
      <circle cx="71" cy="70" r="2.2" fill={PALETTE.slate} />
      <circle cx="46" cy="75" r="2.6" fill={PALETTE.rose} opacity="0.55" />
      <circle cx="74" cy="75" r="2.6" fill={PALETTE.rose} opacity="0.55" />
      <path d="M53 79 Q60 84 67 79" stroke={PALETTE.slate} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Arms */}
      <path d={wave ? "M18 62 Q10 42 22 34" : "M18 62 Q12 72 22 82"}
        stroke={PALETTE.indigo} strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M102 62 Q108 72 98 82"
        stroke={PALETTE.indigo} strokeWidth="4" strokeLinecap="round" fill="none" />
      {wave && <circle cx="22" cy="32" r="4" fill={PALETTE.honey} />}
    </svg>
  )
}

// Hero for the Login screen and welcome moments — mascot + a family of three
// holding hands under a warm sky, all rendered as friendly shapes.
export function HeroFamily({ className = '' }) {
  return (
    <svg viewBox="0 0 320 200" fill="none" className={className}>
      {/* Sky wash */}
      <rect width="320" height="200" fill="url(#skyGrad)" rx="20" />
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={PALETTE.peachWash} />
          <stop offset="100%" stopColor={PALETTE.indigoWash} />
        </linearGradient>
      </defs>
      {/* Sun */}
      <circle cx="260" cy="52" r="22" fill={PALETTE.honey} opacity="0.85" />
      <circle cx="260" cy="52" r="30" fill={PALETTE.honey} opacity="0.2" />
      {/* Distant hills */}
      <path d="M0 150 Q60 120 120 140 T240 130 T320 145 L320 200 L0 200 Z" fill={PALETTE.mintSoft} />
      <path d="M0 165 Q80 145 160 158 T320 160 L320 200 L0 200 Z" fill={PALETTE.mint} opacity="0.6" />
      {/* Family — Parent A (indigo) */}
      <g transform="translate(70 100)">
        <circle cx="0" cy="0" r="12" fill={PALETTE.slate} />
        <circle cx="0" cy="-2" r="10" fill="#FCD9BC" />
        <rect x="-14" y="10" width="28" height="42" rx="10" fill={PALETTE.indigo} />
        <rect x="-14" y="46" width="10" height="20" rx="4" fill={PALETTE.slate} />
        <rect x="4" y="46" width="10" height="20" rx="4" fill={PALETTE.slate} />
      </g>
      {/* Child (honey shirt) */}
      <g transform="translate(115 115)">
        <circle cx="0" cy="-2" r="9" fill="#FCD9BC" />
        <path d="M-9 -8 Q0 -18 9 -8" fill={PALETTE.slate} />
        <rect x="-10" y="8" width="20" height="30" rx="8" fill={PALETTE.honey} />
        <rect x="-10" y="34" width="7" height="18" rx="3" fill={PALETTE.slate} />
        <rect x="3" y="34" width="7" height="18" rx="3" fill={PALETTE.slate} />
      </g>
      {/* Parent B (rose) */}
      <g transform="translate(160 100)">
        <circle cx="0" cy="-2" r="10" fill="#FCD9BC" />
        <path d="M-12 -6 Q0 -16 12 -6 L12 4 Q0 -2 -12 4 Z" fill={PALETTE.slate} />
        <rect x="-14" y="10" width="28" height="42" rx="10" fill={PALETTE.rose} />
        <rect x="-14" y="46" width="10" height="20" rx="4" fill={PALETTE.slate} />
        <rect x="4" y="46" width="10" height="20" rx="4" fill={PALETTE.slate} />
      </g>
      {/* Hands connecting */}
      <path d="M84 130 Q100 128 105 130" stroke={PALETTE.slate} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M125 130 Q140 128 146 130" stroke={PALETTE.slate} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Compass floating */}
      <g transform="translate(232 118)">
        <circle cx="0" cy="0" r="18" fill="#fff" stroke={PALETTE.indigo} strokeWidth="2" />
        <polygon points="0,-12 3,0 0,-2 -3,0" fill={PALETTE.indigo} transform="rotate(30)" />
        <polygon points="0,12 -3,0 0,2 3,0" fill={PALETTE.slateSoft} transform="rotate(30)" />
        <circle cx="0" cy="0" r="2" fill={PALETTE.honey} />
      </g>
    </svg>
  )
}

// A generic empty-state layout: illustration + title + subtitle + optional CTA
export function EmptyState({ art, title, subtitle, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center text-center px-4 py-8 ${className}`}>
      {art}
      <p className="mt-4 text-sm font-semibold text-slate-700">{title}</p>
      {subtitle && <p className="mt-1 text-xs text-slate-500 max-w-xs">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ── Scene illustrations for empty states ──────────────────────────────

export function EmptyCalendar({ size = 120 }) {
  return (
    <svg width={size} height={size * 0.83} viewBox="0 0 160 130" fill="none">
      <ellipse cx="80" cy="118" rx="60" ry="6" fill={PALETTE.slate} opacity="0.06" />
      <rect x="30" y="24" width="100" height="82" rx="12" fill="#fff" stroke={PALETTE.indigoSoft} strokeWidth="2" />
      <rect x="30" y="24" width="100" height="20" rx="12" fill={PALETTE.peach} />
      <rect x="30" y="36" width="100" height="8" fill={PALETTE.peach} />
      <circle cx="52" cy="22" r="4" fill={PALETTE.slate} />
      <circle cx="108" cy="22" r="4" fill={PALETTE.slate} />
      <rect x="49" y="14" width="6" height="14" rx="2" fill={PALETTE.slate} />
      <rect x="105" y="14" width="6" height="14" rx="2" fill={PALETTE.slate} />
      {/* Highlight day */}
      <circle cx="80" cy="72" r="14" fill={PALETTE.honeyWash} />
      <circle cx="80" cy="72" r="14" fill="none" stroke={PALETTE.honey} strokeWidth="2" strokeDasharray="3 3" />
      <path d="M74 72 L78 76 L86 68" stroke={PALETTE.honey} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Little heart */}
      <path d="M118 90 Q120 86 122 88 Q124 86 126 88 Q126 92 122 96 Q118 92 118 90 Z" fill={PALETTE.rose} />
    </svg>
  )
}

export function EmptyDoctor({ size = 120 }) {
  return (
    <svg width={size} height={size * 0.83} viewBox="0 0 160 130" fill="none">
      <ellipse cx="80" cy="118" rx="52" ry="6" fill={PALETTE.slate} opacity="0.06" />
      {/* Doctor */}
      <circle cx="80" cy="48" r="18" fill="#FCD9BC" />
      <path d="M62 46 Q80 26 98 46 L98 40 Q80 32 62 40 Z" fill={PALETTE.slate} />
      <rect x="56" y="66" width="48" height="42" rx="10" fill="#fff" stroke={PALETTE.indigo} strokeWidth="2" />
      {/* Stethoscope */}
      <path d="M68 68 Q60 82 66 96" stroke={PALETTE.indigo} strokeWidth="2.5" fill="none" />
      <circle cx="66" cy="96" r="4" fill={PALETTE.indigo} />
      {/* Heart badge */}
      <path d="M84 82 Q86 78 88 80 Q90 78 92 80 Q92 84 88 88 Q84 84 84 82 Z" fill={PALETTE.rose} />
      {/* Face */}
      <circle cx="74" cy="48" r="1.6" fill={PALETTE.slate} />
      <circle cx="86" cy="48" r="1.6" fill={PALETTE.slate} />
      <path d="M74 55 Q80 59 86 55" stroke={PALETTE.slate} strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export function EmptyDocuments({ size = 120 }) {
  return (
    <svg width={size} height={size * 0.83} viewBox="0 0 160 130" fill="none">
      <ellipse cx="80" cy="118" rx="52" ry="6" fill={PALETTE.slate} opacity="0.06" />
      {/* Folder */}
      <path d="M28 46 Q28 40 34 40 L64 40 L72 48 L126 48 Q132 48 132 54 L132 100 Q132 106 126 106 L34 106 Q28 106 28 100 Z"
        fill={PALETTE.peach} />
      <rect x="40" y="58" width="80" height="52" rx="6" fill="#fff" stroke={PALETTE.indigoSoft} strokeWidth="2" />
      <rect x="50" y="70" width="50" height="4" rx="2" fill={PALETTE.indigoSoft} />
      <rect x="50" y="80" width="60" height="4" rx="2" fill={PALETTE.indigoSoft} />
      <rect x="50" y="90" width="40" height="4" rx="2" fill={PALETTE.indigoSoft} />
      {/* Star */}
      <path d="M120 46 L122 52 L128 52 L123 56 L125 62 L120 58 L115 62 L117 56 L112 52 L118 52 Z" fill={PALETTE.honey} />
    </svg>
  )
}

export function EmptyDecisions({ size = 120 }) {
  return (
    <svg width={size} height={size * 0.83} viewBox="0 0 160 130" fill="none">
      <ellipse cx="80" cy="118" rx="52" ry="6" fill={PALETTE.slate} opacity="0.06" />
      {/* Two speech bubbles */}
      <path d="M22 38 Q22 28 32 28 L70 28 Q80 28 80 38 L80 62 Q80 72 70 72 L44 72 L34 82 L36 72 L32 72 Q22 72 22 62 Z"
        fill={PALETTE.indigoWash} stroke={PALETTE.indigo} strokeWidth="2" />
      <path d="M138 58 Q138 48 128 48 L94 48 Q84 48 84 58 L84 82 Q84 92 94 92 L116 92 L126 102 L124 92 L128 92 Q138 92 138 82 Z"
        fill={PALETTE.peachWash} stroke={PALETTE.peach} strokeWidth="2" />
      {/* Handshake circle in middle */}
      <circle cx="80" cy="66" r="12" fill={PALETTE.honeyWash} stroke={PALETTE.honey} strokeWidth="2" />
      <path d="M74 66 L78 70 L86 62" stroke={PALETTE.honey} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

export function EmptyReminders({ size = 120 }) {
  return (
    <svg width={size} height={size * 0.83} viewBox="0 0 160 130" fill="none">
      <ellipse cx="80" cy="118" rx="52" ry="6" fill={PALETTE.slate} opacity="0.06" />
      {/* Bell */}
      <path d="M56 92 L104 92 Q104 98 96 98 L64 98 Q56 98 56 92 Z" fill={PALETTE.slate} />
      <path d="M50 88 Q50 70 60 60 L60 46 Q60 40 66 40 L94 40 Q100 40 100 46 L100 60 Q110 70 110 88 Z" fill={PALETTE.honey} />
      <path d="M50 88 L110 88" stroke={PALETTE.slate} strokeWidth="2" />
      <rect x="74" y="30" width="12" height="10" rx="4" fill={PALETTE.slate} />
      {/* Clapper */}
      <circle cx="80" cy="106" r="4" fill={PALETTE.slate} />
      {/* Sparkles */}
      <circle cx="36" cy="52" r="3" fill={PALETTE.rose} />
      <circle cx="124" cy="60" r="3" fill={PALETTE.mint} />
      <circle cx="130" cy="90" r="2" fill={PALETTE.honey} />
      <circle cx="30" cy="90" r="2" fill={PALETTE.indigo} />
    </svg>
  )
}

export function EmptyAchievements({ size = 120 }) {
  return (
    <svg width={size} height={size * 0.83} viewBox="0 0 160 130" fill="none">
      <ellipse cx="80" cy="118" rx="52" ry="6" fill={PALETTE.slate} opacity="0.06" />
      {/* Trophy */}
      <path d="M50 40 L110 40 L108 78 Q108 88 98 92 L62 92 Q52 88 52 78 Z" fill={PALETTE.honey} />
      <path d="M50 46 Q38 46 38 58 Q38 68 50 70" fill="none" stroke={PALETTE.honey} strokeWidth="4" />
      <path d="M110 46 Q122 46 122 58 Q122 68 110 70" fill="none" stroke={PALETTE.honey} strokeWidth="4" />
      <rect x="70" y="92" width="20" height="10" fill={PALETTE.slate} />
      <rect x="60" y="102" width="40" height="6" rx="2" fill={PALETTE.slate} />
      {/* Star on trophy */}
      <path d="M80 52 L83 60 L91 60 L84 65 L87 73 L80 68 L73 73 L76 65 L69 60 L77 60 Z" fill="#fff" />
      {/* Confetti */}
      <rect x="28" y="30" width="4" height="4" fill={PALETTE.rose} transform="rotate(20 30 32)" />
      <rect x="130" y="34" width="4" height="4" fill={PALETTE.mint} transform="rotate(-30 132 36)" />
      <circle cx="24" cy="60" r="2" fill={PALETTE.indigo} />
      <circle cx="136" cy="66" r="2" fill={PALETTE.peach} />
    </svg>
  )
}

export function EmptySwaps({ size = 120 }) {
  return (
    <svg width={size} height={size * 0.83} viewBox="0 0 160 130" fill="none">
      <ellipse cx="80" cy="118" rx="52" ry="6" fill={PALETTE.slate} opacity="0.06" />
      {/* Two hands passing a heart */}
      <path d="M30 78 Q28 68 38 66 L58 62 L62 76 L36 82 Q28 84 30 78 Z" fill={PALETTE.indigoSoft} />
      <path d="M130 78 Q132 68 122 66 L102 62 L98 76 L124 82 Q132 84 130 78 Z" fill={PALETTE.peachSoft} />
      {/* Heart */}
      <path d="M70 44 Q80 34 80 44 Q80 34 90 44 Q90 58 80 68 Q70 58 70 44 Z" fill={PALETTE.rose} />
      {/* Sparkle around heart */}
      <circle cx="60" cy="38" r="2" fill={PALETTE.honey} />
      <circle cx="100" cy="34" r="2.5" fill={PALETTE.mint} />
      <circle cx="104" cy="56" r="2" fill={PALETTE.indigo} />
    </svg>
  )
}

export function EmptyTherapy({ size = 120 }) {
  return (
    <svg width={size} height={size * 0.83} viewBox="0 0 160 130" fill="none">
      <ellipse cx="80" cy="118" rx="52" ry="6" fill={PALETTE.slate} opacity="0.06" />
      {/* Brain-like heart */}
      <path d="M50 66 Q30 66 30 46 Q30 30 48 30 Q60 30 62 44 Q80 30 96 40 Q118 32 122 52 Q132 58 128 74 Q132 92 108 92 Q90 100 76 90 Q54 96 50 78 Q40 76 50 66 Z"
        fill={PALETTE.roseSoft} />
      <path d="M62 44 Q60 30 48 30" fill="none" stroke={PALETTE.rose} strokeWidth="2" />
      <path d="M96 40 Q118 32 122 52" fill="none" stroke={PALETTE.rose} strokeWidth="2" />
      <path d="M50 66 Q40 76 50 78" fill="none" stroke={PALETTE.rose} strokeWidth="2" />
      {/* Sparkles */}
      <circle cx="42" cy="98" r="3" fill={PALETTE.honey} />
      <circle cx="120" cy="100" r="3" fill={PALETTE.mint} />
      <path d="M136 40 L138 44 L142 44 L139 47 L140 51 L136 49 L132 51 L133 47 L130 44 L134 44 Z" fill={PALETTE.honey} />
    </svg>
  )
}

export function EmptyGeneric({ size = 120 }) {
  return <CompassMascot size={size} wave />
}
