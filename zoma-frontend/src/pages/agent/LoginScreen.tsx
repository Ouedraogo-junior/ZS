// src/pages/agent/LoginScreen.tsx
import { useState } from 'react'
import { agentLogin, getErrorMessage, ApiError, type AgentSession } from '@/lib/api'
import { ZomaLogo } from '@/components/common/ZomaLogo'
import { PinPad } from '@/components/common/PinPad'

function lockoutMessage(lockedUntil: string): string {
  const minutes = Math.ceil((new Date(lockedUntil).getTime() - Date.now()) / 60000)
  if (minutes <= 0) return 'Compte temporairement verrouillé. Réessayez dans un instant.'
  return `Compte temporairement verrouillé suite à plusieurs échecs. Réessayez dans ${minutes} min.`
}

export function LoginScreen({ onLogin }: { onLogin: (session: AgentSession) => void }) {
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
      const session = await agentLogin(username.trim(), pin)
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
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-primary pt-12 pb-10 px-6 flex flex-col items-center">
        <ZomaLogo variant="mobile" />
        <p className="text-white/60 text-sm mt-4 tracking-wide">Espace Agent</p>
      </div>

      <div className="flex-1 px-6 pt-7 pb-6 flex flex-col gap-5">
        <div>
          <label className="block text-muted text-sm font-medium mb-2">Identifiant</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            disabled={loading}
            placeholder="Votre pseudo"
            className="w-full h-14 px-4 rounded-2xl border-2 border-border text-text text-lg focus:border-secondary focus:outline-none transition-colors disabled:opacity-60"
          />
        </div>

        {error && (
          <p className="text-danger text-sm text-center bg-danger/10 rounded-xl py-2.5 px-3">{error}</p>
        )}

        <div>
          <label className="block text-muted text-sm font-medium mb-4">Code PIN à 4 chiffres</label>
          <div className="flex justify-center gap-5 mb-6">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                i < pin.length ? 'bg-primary border-primary scale-110' : 'bg-transparent border-border'
              }`} />
            ))}
          </div>
          <PinPad value={pin} onChange={setPin} disabled={loading} />
        </div>

        <button
          onClick={handleLogin}
          disabled={!canSubmit}
          className="w-full h-16 rounded-2xl bg-primary text-white font-bold text-lg transition-all disabled:opacity-40 mt-2"
          style={{ touchAction: 'manipulation' }}
        >
          {loading ? 'Connexion...' : 'Connexion'}
        </button>
      </div>
    </div>
  )
}