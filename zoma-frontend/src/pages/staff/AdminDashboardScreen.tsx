// src/pages/staff/AdminDashboardScreen.tsx
import { useEffect, useState } from 'react'
import { Building2, MessageSquareWarning, Receipt, Users, Wallet } from 'lucide-react'
import { getAdminDashboard, getErrorMessage, type AdminDashboard } from '@/lib/api'

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 bg-border/60 rounded-2xl" />
        ))}
      </div>
      <div className="h-64 bg-border/60 rounded-2xl" />
    </div>
  )
}

export function AdminDashboardScreen() {
  const [data, setData] = useState<AdminDashboard | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAdminDashboard().then(setData).catch(err => setError(getErrorMessage(err)))
  }, [])

  const maxVolume = data && data.comparatif_agences.length > 0
    ? Math.max(...data.comparatif_agences.map(a => a.volume), 1)
    : 1

  const palette = ['#0B3D91', '#0685F1', '#F5A623', '#25D366', '#4A5568']

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="font-display text-xl md:text-2xl font-bold text-text">Tableau de bord réseau</h1>
        <p className="text-muted text-sm mt-0.5">
          Vue consolidée · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {error && <p className="text-danger text-sm text-center bg-danger/10 rounded-xl py-2.5 px-3 mb-4">{error}</p>}

      {!data ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <Wallet className="text-primary" size={18} />
              </div>
              <p className="font-display font-bold text-primary text-2xl leading-none">{(data.volume_jour / 1000).toFixed(0)}k</p>
              <p className="text-text text-sm font-semibold mt-2">Volume réseau</p>
              <p className="text-muted text-xs">F CFA, aujourd'hui</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center mb-3">
                <Receipt className="text-secondary" size={18} />
              </div>
              <p className="font-display font-bold text-text text-2xl leading-none">{data.transactions_jour}</p>
              <p className="text-text text-sm font-semibold mt-2">Transactions</p>
              <p className="text-muted text-xs">Réseau entier</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center mb-3">
                <Building2 className="text-success" size={18} />
              </div>
              <p className="font-display font-bold text-text text-2xl leading-none">{data.agences_actives}</p>
              <p className="text-text text-sm font-semibold mt-2">Agences actives</p>
              <p className="text-muted text-xs">Dans le réseau</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <Users className="text-primary" size={18} />
              </div>
              <p className="font-display font-bold text-text text-2xl leading-none">{data.agents_actifs}</p>
              <p className="text-text text-sm font-semibold mt-2">Agents actifs</p>
              <p className="text-muted text-xs">Toutes agences</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-warning/10 flex items-center justify-center mb-3">
                <MessageSquareWarning className="text-warning" size={18} />
              </div>
              <p className="font-display font-bold text-text text-2xl leading-none">{data.reclamations_en_attente}</p>
              <p className="text-text text-sm font-semibold mt-2">Réclamations</p>
              <p className="text-muted text-xs">En attente</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm">
            <h3 className="font-display font-bold text-text mb-5">Comparatif par agence — volume du jour</h3>
            {data.comparatif_agences.length === 0 ? (
              <p className="text-muted text-sm text-center py-6">Aucune transaction aujourd'hui.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {data.comparatif_agences.map((a, i) => {
                  const pct = (a.volume / maxVolume) * 100
                  return (
                    <div key={a.agence_id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="w-full sm:w-36 flex-shrink-0">
                        <p className="font-semibold text-text text-sm truncate">{a.agence}</p>
                      </div>
                      <div className="flex-1 flex items-center gap-3">
                        <div className="flex-1 h-8 bg-background rounded-lg overflow-hidden">
                          <div
                            className="h-full rounded-lg flex items-center px-3 transition-all"
                            style={{ width: `${pct}%`, background: palette[i % palette.length] }}
                          >
                            {pct > 30 && (
                              <span className="text-white text-xs font-bold whitespace-nowrap">
                                {a.volume.toLocaleString('fr-FR')} F
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-muted text-xs w-16 text-right flex-shrink-0">{a.transactions} tx</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}