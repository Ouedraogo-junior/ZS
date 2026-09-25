// src/components/common/Stars.tsx
import { Star } from 'lucide-react'

interface StarsProps {
  note: number
  size?: number
  /** Fournir onChange rend le composant cliquable (saisie de note). */
  onChange?: (note: number) => void
}

export function Stars({ note, size = 14, onChange }: StarsProps) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => {
        const icon = (
          <Star
            size={size}
            className={i <= note ? 'text-warning fill-warning' : 'text-border fill-border'}
          />
        )
        return onChange ? (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className="transition-transform active:scale-90"
            aria-label={`${i} étoile${i > 1 ? 's' : ''}`}
          >
            {icon}
          </button>
        ) : (
          <span key={i}>{icon}</span>
        )
      })}
    </div>
  )
}