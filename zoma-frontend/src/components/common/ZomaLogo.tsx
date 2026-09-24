// src/components/common/ZomaLogo.tsx
interface ZomaLogoProps {
  /** 'mobile' : écran de connexion agent (grand, centré, vertical).
   *  'sidebar' : barre latérale gérant/admin (compact, horizontal). */
  variant?: 'mobile' | 'sidebar'
  /** Sous-titre affiché sous "ZOMA SERVICES" en variante sidebar
   *  (ex. "Gérant d'agence", "Administrateur réseau"). */
  subtitle?: string
}

export function ZomaLogo({ variant = 'mobile', subtitle }: ZomaLogoProps) {
  if (variant === 'sidebar') {
    return (
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
          <span className="font-display font-black text-xl leading-none">
            <span className="text-secondary">Z</span>
            <span className="text-primary">S</span>
          </span>
        </div>
        <div>
          <p className="font-display font-bold text-white text-sm leading-tight">ZOMA SERVICES</p>
          {subtitle && <p className="text-white/50 text-[11px]">{subtitle}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-lg">
        <span className="font-display text-3xl font-black leading-none">
          <span className="text-secondary">Z</span>
          <span className="text-primary">S</span>
        </span>
      </div>
      <span className="font-display text-white font-bold tracking-widest text-xs">ZOMA SERVICES</span>
    </div>
  )
}