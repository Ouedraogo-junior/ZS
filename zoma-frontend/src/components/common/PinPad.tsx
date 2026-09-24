// src/components/common/PinPad.tsx
import { Delete } from 'lucide-react'

interface PinPadProps {
  value: string
  onChange: (value: string) => void
  /** Longueur du PIN attendue (4 par défaut, cf. CDC section 3). */
  length?: number
  disabled?: boolean
}

/**
 * Pavé numérique pour la saisie du PIN — utilisé par l'écran de connexion
 * agent, et à réutiliser pour les futurs écrans de connexion gérant/admin
 * (même mécanisme pseudo+PIN).
 */
export function PinPad({ value, onChange, length = 4, disabled = false }: PinPadProps) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete']

  return (
    <div className="grid grid-cols-3 gap-3">
      {keys.map((key, i) => (
        <button
          key={i}
          disabled={key === '' || disabled}
          onClick={() => {
            if (key === 'delete') onChange(value.slice(0, -1))
            else if (key && value.length < length) onChange(value + key)
          }}
          className={`font-display h-[60px] rounded-2xl text-xl font-bold select-none flex items-center justify-center transition-all duration-100 active:scale-90 ${
            key === '' ? 'invisible' :
            key === 'delete' ? 'bg-border text-muted active:bg-border/70' :
            'bg-white text-primary shadow-sm active:bg-primary active:text-white active:shadow-none'
          } ${disabled ? 'opacity-50' : ''}`}
          style={{ touchAction: 'manipulation' }}
        >
          {key === 'delete' ? <Delete size={22} /> : key}
        </button>
      ))}
    </div>
  )
}