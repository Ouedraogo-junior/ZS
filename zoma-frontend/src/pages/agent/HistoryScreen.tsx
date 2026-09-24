// src/pages/agent/HistoryScreen.tsx
import { useEffect, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Inbox, LogOut, UserCog } from 'lucide-react'
import { getErrorMessage, getTransactions, type Transaction } from '@/lib/api'

interface HistoryScreenProps {
  agencyName: string
  onLogout: () => void
  onEditProfile: () => void
}

type Filter = 'all' | 'depot' | 'retrait'

function HistorySkeleton() {
  return (
    <div className="flex-1 px-4 pb-24 pt-4 flex flex-col gap-2 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-[72px] bg-border/60 rounded-2xl" />
      ))}
    </div>
  )
}

export function HistoryScreen({ agencyName, onLogout, onEditProfile }: HistoryScreenProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const [transactions, setTransactions] = useState<Transaction[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setTransactions(null)
    setError(null)
    getTransactions(filter === 'all' ? undefined : { type: filter })
      .then(res => setTransactions(res.data))
      .catch(err => setError(getErrorMessage(err)))
  }, [filter])

  const totalDepots = (transactions ?? [])
    .filter(t => t.type === 'depot')
    .reduce((s, t) => s + t.montant, 0)
  const totalRetraits = (transactions ?? [])
    .filter(t => t.type === 'retrait')
    .reduce((s, t) => s + t.montant, 0)

  return (
    <div className="min-h-screen min-h-dvh bg-background flex flex-col">
      <div className="bg-gradient-to-br from-primary to-primary-dark px-5 pt-5 pb-5">
        <div className="flex items-start justify-between mb-1">
          <h1 className="font-display text-white font-bold text-lg">Historique du poste</h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onEditProfile}
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/80 transition-all duration-150 active:scale-90 active:bg-white/20"
              style={{ touchAction: 'manipulation' }}
              aria-label="Mon profil"
            >
              <UserCog size={18} />
            </button>
            <button
              onClick={onLogout}
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/80 transition-all duration-150 active:scale-90 active:bg-white/20"
              style={{ touchAction: 'manipulation' }}
              aria-label="Déconnexion"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
        <p className="text-white/60 text-xs mb-4">
          {agencyName} · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-2xl p-3">
            <p className="text-white/60 text-xs">Total dépôts</p>
            <p className="font-display text-white font-bold text-lg">{totalDepots.toLocaleString('fr-FR')} F</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3">
            <p className="text-white/60 text-xs">Total retraits</p>
            <p className="font-display text-white font-bold text-lg">{totalRetraits.toLocaleString('fr-FR')} F</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 flex gap-2">
        {([
          { id: 'all', label: 'Tout' },
          { id: 'depot', label: 'Dépôts' },
          { id: 'retrait', label: 'Retraits' },
        ] as const).map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 h-8 rounded-full text-xs font-semibold transition-all duration-150 active:scale-95 ${
              filter === f.id ? 'bg-primary text-white' : 'bg-white text-muted border border-border'
            }`}
            style={{ touchAction: 'manipulation' }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="px-4">
          <p className="text-danger text-sm text-center bg-danger/10 rounded-xl py-2.5 px-3">{error}</p>
        </div>
      )}

      {!error && !transactions && <HistorySkeleton />}

      {!error && transactions && transactions.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-6 pb-24">
          <Inbox className="text-border" size={40} />
          <p className="text-muted text-sm">Aucune transaction pour l'instant.</p>
        </div>
      )}

      {!error && transactions && transactions.length > 0 && (
        <div className="flex-1 overflow-y-auto px-4 pb-24 flex flex-col gap-2">
          {transactions.map(t => (
            <div key={t.id} className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                t.type === 'depot' ? 'bg-primary/10' : 'bg-danger/10'
              }`}>
                {t.type === 'depot'
                  ? <ArrowDownCircle className="text-primary" size={20} />
                  : <ArrowUpCircle className="text-danger" size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-text text-sm">{t.plateforme_paris.nom}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-secondary/10 text-secondary">
                    {t.reseau_mobile_money.nom}
                  </span>
                </div>
                <p className="text-muted text-xs mt-0.5">
                  {t.telephone_client} · {new Date(t.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
                {t.reference_paiement && (
                  <p className="text-secondary text-xs font-mono">{t.reference_paiement}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`font-display font-bold text-base ${t.type === 'depot' ? 'text-primary' : 'text-danger'}`}>
                  {t.type === 'retrait' ? '−' : '+'}{t.montant.toLocaleString('fr-FR')}
                </p>
                <p className="text-muted text-xs">F CFA</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}