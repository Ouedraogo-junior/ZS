// src/pages/agent/AgentApp.tsx
//
// Ne gère plus sa propre session (connexion, restauration, inactivité) —
// tout ça vit maintenant dans App.tsx, commun à tous les rôles. Ici,
// uniquement la navigation entre les écrans une fois connecté.
import { useState } from 'react'
import { ArrowLeftRight, FileEdit, History } from 'lucide-react'
import { TransactionScreen } from './TransactionScreen'
import { HistoryScreen } from './HistoryScreen'
import { HandoverScreen } from './HandoverScreen'

type AgentScreen = 'transaction' | 'history' | 'handover'

const NAV_TABS = [
  { id: 'transaction', label: 'Transaction', icon: FileEdit },
  { id: 'history', label: 'Historique', icon: History },
  { id: 'handover', label: 'Relève', icon: ArrowLeftRight },
] as const

interface AgentAppProps {
  agentName: string
  agencyName: string
  onLogout: () => void
  onEditProfile: () => void
}

export default function AgentApp({ agentName, agencyName, onLogout, onEditProfile }: AgentAppProps) {
  const [screen, setScreen] = useState<AgentScreen>('transaction')

  return (
    <div className="flex justify-center bg-gradient-to-br from-background to-border min-h-screen min-h-dvh">
      <div className="w-full max-w-[390px] min-h-screen min-h-dvh bg-white shadow-2xl relative">
        {screen === 'transaction' && (
          <TransactionScreen agentName={agentName} agencyName={agencyName} onLogout={onLogout} onEditProfile={onEditProfile} />
        )}
        {screen === 'history' && <HistoryScreen agencyName={agencyName} onLogout={onLogout} onEditProfile={onEditProfile} />}
        {screen === 'handover' && <HandoverScreen agentName={agentName} onLogout={onLogout} onEditProfile={onEditProfile} />}

        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-border z-40 pb-[env(safe-area-inset-bottom)]">
          <div className="flex">
            {NAV_TABS.map(tab => {
              const Icon = tab.icon
              const active = screen === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setScreen(tab.id)}
                  className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${
                    active ? 'text-primary' : 'text-muted'
                  }`}
                  style={{ touchAction: 'manipulation' }}
                >
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                  <span className="text-xs font-medium">{tab.label}</span>
                  <div className={`h-0.5 rounded-full transition-all ${active ? 'w-5 bg-primary' : 'w-0'}`} />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}