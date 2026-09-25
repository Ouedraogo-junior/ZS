// src/pages/staff/GerantDashboardScreen.tsx
import { useEffect, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, MessageSquareWarning, Receipt, Users } from 'lucide-react'
import { getErrorMessage, getGerantDashboard, type GerantDashboard } from '@/lib/api'

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

function joursCourts(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short' })
}

export function GerantDashboardScreen({ agencyName }: { agencyName: string }) {
  const [data, setData] = useState<GerantDashboard | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getGerantDashboard().then(setData).catch(err => setError(getErrorMessage(err)))
  }, [])

  const maxTendance = data
    ? Math.max(...data.tendance_7_jours.map(j => Math.max(j.depots, j.retraits)), 1)
    : 1

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="font-display text-xl md:text-2xl font-bold text-text">Tableau de bord</h1>
        <p className="text-muted text-sm mt-0.5">
          {agencyName} · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
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
                <ArrowDownCircle className="text-primary" size={18} />
              </div>
              <p className="font-display font-bold text-primary text-2xl leading-none">{data.volume_depots_jour.toLocaleString('fr-FR')}</p>
              <p className="text-text text-sm font-semibold mt-2">Dépôts du jour</p>
              <p className="text-muted text-xs">F CFA</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-danger/10 flex items-center justify-center mb-3">
                <ArrowUpCircle className="text-danger" size={18} />
              </div>
              <p className="font-display font-bold text-danger text-2xl leading-none">{data.volume_retraits_jour.toLocaleString('fr-FR')}</p>
              <p className="text-text text-sm font-semibold mt-2">Retraits du jour</p>
              <p className="text-muted text-xs">F CFA</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center mb-3">
                <Receipt className="text-secondary" size={18} />
              </div>
              <p className="font-display font-bold text-text text-2xl leading-none">{data.transactions_jour}</p>
              <p className="text-text text-sm font-semibold mt-2">Transactions</p>
              <p className="text-muted text-xs">Aujourd'hui</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center mb-3">
                <Users className="text-success" size={18} />
              </div>
              <p className="font-display font-bold text-text text-2xl leading-none">{data.agents_actifs}<span className="text-muted text-base"> / {data.agents_total}</span></p>
              <p className="text-text text-sm font-semibold mt-2">Agents actifs</p>
              <p className="text-muted text-xs">Sur l'agence</p>
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
            <h3 className="font-display font-bold text-text mb-5">Activité des 7 derniers jours</h3>
            <div className="flex items-end gap-3 h-40">
              {data.tendance_7_jours.map(jour => (
                <div key={jour.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div className="flex items-end gap-0.5 h-full w-full justify-center">
                    <div
                      className="w-1/3 bg-primary rounded-t"
                      style={{ height: `${(jour.depots / maxTendance) * 100}%` }}
                      title={`Dépôts : ${jour.depots.toLocaleString('fr-FR')} F`}
                    />
                    <div
                      className="w-1/3 bg-danger rounded-t"
                      style={{ height: `${(jour.retraits / maxTendance) * 100}%` }}
                      title={`Retraits : ${jour.retraits.toLocaleString('fr-FR')} F`}
                    />
                  </div>
                  <span className="text-muted text-[10px] capitalize">{joursCourts(jour.date)}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 justify-center">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
                <span className="text-muted text-xs">Dépôts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-danger" />
                <span className="text-muted text-xs">Retraits</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}