// src/App.tsx
//
// Racine de l'app : un seul écran de connexion pour tout le monde, puis
// aiguillage automatique vers le bon espace selon le rôle renvoyé par le
// backend. Possède la session, la restauration après rechargement, la
// déconnexion et le minuteur d'inactivité — plus aucun de ces espaces ne
// gère sa propre authentification individuellement.
import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { getToken, logout, me, setToken, setUnauthorizedHandler, type Session } from '@/lib/api'
import { useIdleTimeout } from '@/lib/useIdleTimeout'
import { LoginScreen } from './pages/LoginScreen'
import { ProfileModal } from './components/common/ProfileModal'
import AgentApp from './pages/agent/AgentApp'
import StaffApp from './pages/staff/StaffApp'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [showProfile, setShowProfile] = useState(false)

  useEffect(() => {
    setUnauthorizedHandler(() => setSession(null))
    return () => setUnauthorizedHandler(null)
  }, [])

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setCheckingSession(false)
      return
    }
    me()
      .then(({ role, profile }) => setSession({ token, role, profile }))
      .catch(() => setToken(null))
      .finally(() => setCheckingSession(false))
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      await logout()
    } catch {
      // Token déjà invalide côté serveur — on déconnecte quand même localement.
    }
    setToken(null)
    setSession(null)
  }, [])

  // Même durée pour tout le monde (CheckIdleTimeout backend, 60 min).
  useIdleTimeout(60, handleLogout, session !== null)

  if (checkingSession) {
    return (
      <div className="min-h-screen min-h-dvh flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    )
  }

  if (!session) {
    return <LoginScreen onLogin={(s) => { setToken(s.token); setSession(s) }} />
  }

  if (session.role === 'agent') {
    return (
      <>
        <AgentApp
          agentName={session.profile.nom}
          agencyName={session.profile.agence ?? ''}
          onLogout={handleLogout}
          onEditProfile={() => setShowProfile(true)}
        />
        {showProfile && (
          <ProfileModal
            profile={session.profile}
            onClose={() => setShowProfile(false)}
            onUpdated={profile => setSession(prev => prev ? { ...prev, profile } : prev)}
          />
        )}
      </>
    )
  }

  return (
    <>
      <StaffApp
        name={session.profile.nom}
        role={session.role}
        agencyName={session.profile.agence}
        onLogout={handleLogout}
        onEditProfile={() => setShowProfile(true)}
      />
      {showProfile && (
        <ProfileModal
          profile={session.profile}
          onClose={() => setShowProfile(false)}
          onUpdated={profile => setSession(prev => prev ? { ...prev, profile } : prev)}
        />
      )}
    </>
  )
}