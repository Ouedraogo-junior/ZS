// src/hooks/useAuth.tsx
//
// Session globale de l'appli — équivalent mobile de AuthenticatedApp.tsx
// côté web, mais sous forme de contexte React puisque la navigation (pas
// de simple routage d'URL ici) en dépend pour savoir quel écran afficher.
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import {
  setUnauthorizedHandler,
  loginClient as apiLoginClient,
  getClientMe,
  logoutClient as apiLogoutClient,
  loginStaff as apiLoginStaff,
  getStaffMe,
  logoutStaff as apiLogoutStaff,
  type ClientProfile,
  type StaffProfile,
  type StaffRole,
} from '../lib/api'
import { getSessionType, clearSession } from '../lib/storage'

type AuthState =
  | { status: 'loading' }
  | { status: 'guest' }
  | { status: 'client'; client: ClientProfile }
  | { status: 'staff'; role: StaffRole; profile: StaffProfile }

interface AuthContextValue {
  state: AuthState
  loginAsClient: (nom: string, telephone: string) => Promise<void>
  loginAsStaff: (pseudo: string, pin: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  const logout = useCallback(async () => {
    const type = await getSessionType()
    try {
      if (type === 'client') await apiLogoutClient()
      else if (type === 'staff') await apiLogoutStaff()
    } catch {
      // Le token peut déjà être invalide côté serveur — on nettoie
      // localement dans tous les cas.
    }
    await clearSession()
    setState({ status: 'guest' })
  }, [])

  // Restauration de la session au démarrage de l'appli, à partir du
  // token stocké sur l'appareil.
  useEffect(() => {
    setUnauthorizedHandler(() => setState({ status: 'guest' }))

    ;(async () => {
      const type = await getSessionType()

      if (type === 'client') {
        try {
          const client = await getClientMe()
          setState({ status: 'client', client })
          return
        } catch {
          await clearSession()
        }
      } else if (type === 'staff') {
        try {
          const { role, profile } = await getStaffMe()
          setState({ status: 'staff', role, profile })
          return
        } catch {
          await clearSession()
        }
      }

      setState({ status: 'guest' })
    })()
  }, [])

  const loginAsClient = useCallback(async (nom: string, telephone: string) => {
    const client = await apiLoginClient(nom, telephone)
    setState({ status: 'client', client })
  }, [])

  const loginAsStaff = useCallback(async (pseudo: string, pin: string) => {
    const { role, profile } = await apiLoginStaff(pseudo, pin)
    setState({ status: 'staff', role, profile })
  }, [])

  return (
    <AuthContext.Provider value={{ state, loginAsClient, loginAsStaff, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé à l\'intérieur de <AuthProvider>')
  return ctx
}