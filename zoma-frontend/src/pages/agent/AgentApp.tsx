// src/pages/agent/AgentApp.tsx
import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { agentLogout, agentMe, getToken, setToken, setUnauthorizedHandler, type AgentSession } from '@/lib/api'
import { useIdleTimeout } from '@/lib/useIdleTimeout'
import { LoginScreen } from './LoginScreen'
import { TransactionScreen } from './TransactionScreen'

export default function AgentApp() {
  const [session, setSession] = useState<AgentSession | null>(null)
  // Le temps de vérifier un éventuel token déjà en localStorage, pour ne
  // pas afficher l'écran de connexion en un éclair avant de le remplacer.
  const [checkingSession, setCheckingSession] = useState(true)

  // Si un futur appel API renvoie 401 (token expiré ou révoqué), on revient
  // automatiquement à l'écran de connexion.
  useEffect(() => {
    setUnauthorizedHandler(() => setSession(null))
    return () => setUnauthorizedHandler(null)
  }, [])

  // Restauration de session après rechargement de page : si un token est
  // déjà stocké, on vérifie qu'il est toujours valide via /agent/me plutôt
  // que de redemander pseudo+PIN à chaque F5.
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setCheckingSession(false)
      return
    }
    agentMe()
      .then(({ agent }) => setSession({ token, agent }))
      .catch(() => setToken(null))
      .finally(() => setCheckingSession(false))
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      await agentLogout()
    } catch {
      // Le token est peut-être déjà invalide côté serveur — on déconnecte
      // quand même localement, l'important est que l'agent ne reste pas coincé.
    }
    setToken(null)
    setSession(null)
  }, [])

  // Déconnexion locale après 60 min d'inactivité — même durée que le
  // contrôle backend (CheckIdleTimeout::MAX_INACTIVITE_MINUTES). Actif
  // seulement une fois connecté.
  useIdleTimeout(60, handleLogout, session !== null)

  if (checkingSession) {
    return (
      <div className="flex justify-center bg-border min-h-screen">
        <div className="w-full max-w-[390px] min-h-screen bg-white shadow-2xl relative flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center bg-border min-h-screen">
      <div className="w-full max-w-[390px] min-h-screen bg-white shadow-2xl relative">
        {!session ? (
          <LoginScreen onLogin={(s) => { setToken(s.token); setSession(s) }} />
        ) : (
          <TransactionScreen agentName={session.agent.nom} agencyName={session.agent.agence} onLogout={handleLogout} />
        )}
      </div>
    </div>
  )
}