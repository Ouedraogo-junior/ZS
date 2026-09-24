// src/pages/staff/StaffApp.tsx
//
// Espace Gérant/Admin — pensé grand écran ET petit écran dès le départ
// (contrairement à l'espace Agent, volontairement mobile uniquement) :
// barre latérale sur desktop (lg+), navigation en haut sur mobile/tablette.
// Les onglets disponibles dépendent du rôle.
import { useState } from 'react'
import { LogOut, ShieldCheck, UserCog, Users } from 'lucide-react'
import { ZomaLogo } from '@/components/common/ZomaLogo'
import { AgentsScreen } from './AgentsScreen'
import { UsersScreen } from './UsersScreen'

type StaffScreen = 'agents' | 'users'

interface StaffAppProps {
  name: string
  role: 'gerant' | 'admin'
  agencyName: string | null
  onLogout: () => void
  onEditProfile: () => void
}

export default function StaffApp({ name, role, agencyName, onLogout, onEditProfile }: StaffAppProps) {
  const tabs =
    role === 'admin'
      ? [
          { id: 'agents' as const, label: 'Agents', icon: Users },
          { id: 'users' as const, label: 'Gérants & admins', icon: ShieldCheck },
        ]
      : [{ id: 'agents' as const, label: 'Agents', icon: Users }]

  const [screen, setScreen] = useState<StaffScreen>('agents')

  const subtitle = role === 'admin' ? 'Administrateur réseau' : `Gérant · ${agencyName}`

  return (
    <div className="min-h-screen min-h-dvh bg-background flex flex-col lg:flex-row">
      {/* Navigation mobile / tablette (en dessous de lg) */}
      <div className="lg:hidden bg-gradient-to-br from-primary to-primary-dark sticky top-0 z-30 shadow-lg">
        <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-white/10">
          <ZomaLogo variant="sidebar" subtitle={subtitle} />
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onEditProfile}
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/80 transition-all active:scale-90"
              aria-label="Mon profil"
            >
              <UserCog size={18} />
            </button>
            <button
              onClick={onLogout}
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/80 transition-all active:scale-90"
              aria-label="Déconnexion"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
        <nav className="flex gap-1.5 px-3 py-2 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon
            const active = screen === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setScreen(tab.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  active ? 'bg-white text-primary' : 'text-white/70'
                }`}
                style={{ touchAction: 'manipulation' }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Barre latérale desktop (lg et plus) */}
      <aside className="hidden lg:flex w-64 bg-gradient-to-b from-primary to-primary-dark min-h-dvh flex-col flex-shrink-0">
        <div className="p-5 pb-4 border-b border-white/10">
          <ZomaLogo variant="sidebar" subtitle={subtitle} />
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon
            const active = screen === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setScreen(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                  active ? 'bg-white text-primary font-bold shadow-sm' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span className="text-sm">{tab.label}</span>
              </button>
            )
          })}
        </nav>
        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-white font-medium text-xs truncate">{name}</p>
            <p className="text-secondary text-[10px] truncate">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onEditProfile}
              className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/80 transition-all active:scale-90"
              aria-label="Mon profil"
            >
              <UserCog size={16} />
            </button>
            <button
              onClick={onLogout}
              className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/80 transition-all active:scale-90"
              aria-label="Déconnexion"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        {screen === 'agents' && <AgentsScreen role={role} />}
        {screen === 'users' && role === 'admin' && <UsersScreen />}
      </main>
    </div>
  )
}