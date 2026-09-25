// src/pages/staff/StaffTransactionsScreen.tsx
import { useEffect, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  getAgences,
  getErrorMessage,
  getPlateformesParis,
  getReseauxMobileMoney,
  getStaffAgents,
  getStaffTransactions,
  type Agence,
  type ReferenceItem,
  type StaffAgent,
  type StaffTransactionsFilters,
  type StaffTransactionsResult,
} from '@/lib/api'

interface StaffTransactionsScreenProps {
  role: 'gerant' | 'admin'
}

function TransactionsSkeleton() {
  return (
    <div className="flex flex-col gap-2 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-16 bg-border/60 rounded-2xl" />
      ))}
    </div>
  )
}

export function StaffTransactionsScreen({ role }: StaffTransactionsScreenProps) {
  const [agences, setAgences] = useState<Agence[] | null>(null)
  const [agents, setAgents] = useState<StaffAgent[] | null>(null)
  const [reseaux, setReseaux] = useState<ReferenceItem[] | null>(null)
  const [plateformes, setPlateformes] = useState<ReferenceItem[] | null>(null)

  const [filters, setFilters] = useState<StaffTransactionsFilters>({ page: 1 })
  const [result, setResult] = useState<StaffTransactionsResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getStaffAgents().then(setAgents).catch(() => setAgents([]))
    getReseauxMobileMoney().then(setReseaux).catch(() => setReseaux([]))
    getPlateformesParis().then(setPlateformes).catch(() => setPlateformes([]))
    if (role === 'admin') getAgences().then(setAgences).catch(() => setAgences([]))
  }, [role])

  useEffect(() => {
    setResult(null)
    getStaffTransactions(filters).then(setResult).catch(err => setError(getErrorMessage(err)))
  }, [filters])

  const updateFilter = (patch: Partial<StaffTransactionsFilters>) => {
    setFilters(prev => ({ ...prev, ...patch, page: 1 }))
  }

  const solde = result ? result.totaux.depots - result.totaux.retraits : 0

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="font-display text-xl md:text-2xl font-bold text-text">Historique des transactions</h1>
        <p className="text-muted text-sm mt-0.5">
          {role === 'gerant' ? 'Toutes les transactions de votre agence' : 'Toutes les transactions du réseau'}
        </p>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm mb-5">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {role === 'admin' && (
            <select
              value={filters.agence_id ?? ''}
              onChange={e => updateFilter({ agence_id: e.target.value ? Number(e.target.value) : undefined })}
              className="h-10 px-3 rounded-xl border-2 border-border text-sm text-text bg-white"
            >
              <option value="">Toutes les agences</option>
              {agences?.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
            </select>
          )}
          <select
            value={filters.agent_id ?? ''}
            onChange={e => updateFilter({ agent_id: e.target.value ? Number(e.target.value) : undefined })}
            className="h-10 px-3 rounded-xl border-2 border-border text-sm text-text bg-white"
          >
            <option value="">Tous les agents</option>
            {agents?.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
          </select>
          <select
            value={filters.type ?? ''}
            onChange={e => updateFilter({ type: (e.target.value || undefined) as 'depot' | 'retrait' | undefined })}
            className="h-10 px-3 rounded-xl border-2 border-border text-sm text-text bg-white"
          >
            <option value="">Dépôts et retraits</option>
            <option value="depot">Dépôts</option>
            <option value="retrait">Retraits</option>
          </select>
          <select
            value={filters.reseau_mobile_money_id ?? ''}
            onChange={e => updateFilter({ reseau_mobile_money_id: e.target.value ? Number(e.target.value) : undefined })}
            className="h-10 px-3 rounded-xl border-2 border-border text-sm text-text bg-white"
          >
            <option value="">Tous les réseaux</option>
            {reseaux?.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
          </select>
          <select
            value={filters.plateforme_paris_id ?? ''}
            onChange={e => updateFilter({ plateforme_paris_id: e.target.value ? Number(e.target.value) : undefined })}
            className="h-10 px-3 rounded-xl border-2 border-border text-sm text-text bg-white"
          >
            <option value="">Toutes les plateformes</option>
            {plateformes?.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
          <div className="flex gap-2">
            <input
              type="date"
              value={filters.du ?? ''}
              onChange={e => updateFilter({ du: e.target.value || undefined })}
              className="h-10 px-2 rounded-xl border-2 border-border text-sm text-text bg-white flex-1 min-w-0"
              aria-label="Du"
            />
            <input
              type="date"
              value={filters.au ?? ''}
              onChange={e => updateFilter({ au: e.target.value || undefined })}
              className="h-10 px-2 rounded-xl border-2 border-border text-sm text-text bg-white flex-1 min-w-0"
              aria-label="Au"
            />
          </div>
        </div>
      </div>

      {error && <p className="text-danger text-sm text-center bg-danger/10 rounded-xl py-2.5 px-3 mb-4">{error}</p>}

      {/* Totaux du filtre actif */}
      {result && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <p className="font-display font-bold text-primary text-xl">{result.totaux.depots.toLocaleString('fr-FR')}</p>
            <p className="text-muted text-xs mt-1">Total dépôts (F CFA)</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <p className="font-display font-bold text-danger text-xl">{result.totaux.retraits.toLocaleString('fr-FR')}</p>
            <p className="text-muted text-xs mt-1">Total retraits (F CFA)</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <p className={`font-display font-bold text-xl ${solde >= 0 ? 'text-success' : 'text-danger'}`}>
              {solde >= 0 ? '+' : ''}{solde.toLocaleString('fr-FR')}
            </p>
            <p className="text-muted text-xs mt-1">Solde net ({result.total} transactions)</p>
          </div>
        </div>
      )}

      {/* Liste */}
      {!result ? (
        <TransactionsSkeleton />
      ) : result.data.length === 0 ? (
        <p className="text-muted text-sm text-center py-8">Aucune transaction pour ces critères.</p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {result.data.map(t => (
              <div key={t.id} className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  t.type === 'depot' ? 'bg-primary/10' : 'bg-danger/10'
                }`}>
                  {t.type === 'depot'
                    ? <ArrowDownCircle className="text-primary" size={18} />
                    : <ArrowUpCircle className="text-danger" size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-text text-sm">{t.plateforme_paris.nom}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-secondary/10 text-secondary">
                      {t.reseau_mobile_money.nom}
                    </span>
                  </div>
                  <p className="text-muted text-xs mt-0.5">
                    Par <span className="font-semibold">{t.agent.nom}</span>
                    {role === 'admin' && <> · {t.agence.nom}</>}
                    {' · '}
                    {new Date(t.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <p className={`font-display font-bold text-sm flex-shrink-0 ${t.type === 'depot' ? 'text-primary' : 'text-danger'}`}>
                  {t.type === 'retrait' ? '−' : '+'}{t.montant.toLocaleString('fr-FR')}
                </p>
              </div>
            ))}
          </div>

          {result.last_page > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: (prev.page ?? 1) - 1 }))}
                disabled={result.current_page <= 1}
                className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-muted disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-muted text-sm">Page {result.current_page} / {result.last_page}</span>
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: (prev.page ?? 1) + 1 }))}
                disabled={result.current_page >= result.last_page}
                className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-muted disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}