// src/lib/useIdleTimeout.ts
import { useEffect, useRef } from 'react'

const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'] as const

/**
 * Appelle onIdle après `minutes` sans activité utilisateur (souris, clavier,
 * tactile, défilement). Miroir côté frontend du contrôle d'inactivité
 * backend (CheckIdleTimeout.php) : sans ce hook, la déconnexion n'aurait
 * lieu qu'à la prochaine action de l'agent qui échouerait en 401. Ici,
 * elle est immédiate, même sans interaction.
 *
 * onIdle doit être une fonction stable (useCallback) : sinon l'effet se
 * ré-exécute à chaque rendu et le minuteur repart de zéro à tort.
 */
export function useIdleTimeout(minutes: number, onIdle: () => void, enabled: boolean = true): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled) return

    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(onIdle, minutes * 60_000)
    }

    reset()
    ACTIVITY_EVENTS.forEach(event => window.addEventListener(event, reset))

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      ACTIVITY_EVENTS.forEach(event => window.removeEventListener(event, reset))
    }
  }, [minutes, onIdle, enabled])
}