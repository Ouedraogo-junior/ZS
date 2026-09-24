// src/pages/LoginScreen.tsx
//
// Écran de connexion unique — agents, gérants et administrateurs passent
// tous par ce même formulaire pseudo+PIN. Le rôle renvoyé par le backend
// détermine ensuite, côté App.tsx, vers quel espace on aiguille.
import { useState } from 'react'
import { login, getErrorMessage, ApiError, type Session } from '@/lib/api'
import { ZomaLogo } from '@/components/common/ZomaLogo'
import { PinPad } from '@/components/common/PinPad'

function lockoutMessage(lockedUntil: string): string {
  const minutes = Math.ceil((new Date(lockedUntil).getTime() - Date.now()) / 60000)
  if (minutes <= 0) return 'Compte temporairement verrouillé. Réessayez dans un instant.'
  return `Compte temporairement verrouillé suite à plusieurs échecs. Réessayez dans ${minutes} min.`
}

export function LoginScreen({ onLogin }: { onLogin: (session: Session) => void }) {
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = pin.length === 4 && username.trim().length > 0 && !loading

  const handleLogin = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      const session = await login(username.trim(), pin)
      onLogin(session)
    } catch (err) {
      setError(
        err instanceof ApiError && err.lockedUntil
          ? lockoutMessage(err.lockedUntil)
          : getErrorMessage(err)
      )
      setPin('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen min-h-dvh bg-gradient-to-br from-background to-border flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-br from-primary to-primary-dark pt-10 pb-8 px-6 flex flex-col items-center">
          <ZomaLogo variant="mobile" />
          <p className="text-white/60 text-sm mt-4 tracking-wide">Connexion</p>
        </div>

        <div className="p-6 flex flex-col gap-5">
          <div>
            <label className="block text-muted text-sm font-medium mb-2">Identifiant</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={loading}
              placeholder="Votre pseudo"
              className="w-full h-12 px-4 rounded-xl border-2 border-border text-text transition-all duration-150 focus:border-secondary focus:outline-none focus:ring-4 focus:ring-secondary/15 disabled:opacity-60"
            />
          </div>

          {error && (
            <p className="text-danger text-sm text-center bg-danger/10 rounded-xl py-2.5 px-3">{error}</p>
          )}

          <div>
            <label className="block text-muted text-sm font-medium mb-4">Code PIN à 4 chiffres</label>
            <div className="flex justify-center gap-5 mb-6">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  i < pin.length ? 'bg-primary border-primary scale-110' : 'bg-transparent border-border'
                }`} />
              ))}
            </div>
            <div className="max-w-[240px] mx-auto">
              <PinPad value={pin} onChange={setPin} disabled={loading} />
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={!canSubmit}
            className="font-display w-full h-13 py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
            style={{ touchAction: 'manipulation' }}
          >
            {loading ? 'Connexion...' : 'Connexion'}
          </button>
        </div>
      </div>
    </div>
  )
}