// src/pages/agent/HandoverScreen.tsx
import { useEffect, useState } from 'react'
import { LogOut, Smartphone, UserCog } from 'lucide-react'
import {
  getErrorMessage,
  prepareReleve,
  submitReleve,
  type Releve,
  type ReleveNetworkPreparation,
} from '@/lib/api'

interface HandoverScreenProps {
  agentName: string
  onLogout: () => void
  onEditProfile: () => void
}

function HandoverSkeleton() {
  return (
    <div className="flex-1 px-4 pb-24 pt-4 flex flex-col gap-4 animate-pulse">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="h-[220px] bg-border/60 rounded-2xl" />
      ))}
    </div>
  )
}

function ecartTone(ecart: number): 'ok' | 'warn' | 'danger' {
  if (ecart === 0) return 'ok'
  if (Math.abs(ecart) < 1000) return 'warn'
  return 'danger'
}

export function HandoverScreen({ agentName, onLogout, onEditProfile }: HandoverScreenProps) {
  const [reseaux, setReseaux] = useState<ReleveNetworkPreparation[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [soldesReels, setSoldesReels] = useState<Record<number, string>>({})

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saved, setSaved] = useState<Releve[] | null>(null)

  useEffect(() => {
    prepareReleve()
      .then(res => setReseaux(res.reseaux))
      .catch(err => setLoadError(getErrorMessage(err)))
  }, [])

  const allFilled = reseaux !== null && reseaux.every(r => soldesReels[r.reseau_mobile_money_id]?.trim())

  const handleValidate = async () => {
    if (!reseaux || !allFilled) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const { releves } = await submitReleve({
        soldes: reseaux.map(r => ({
          reseau_mobile_money_id: r.reseau_mobile_money_id,
          solde_reel: parseInt(soldesReels[r.reseau_mobile_money_id], 10),
        })),
      })
      setSaved(releves)
    } catch (err) {
      setSubmitError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loadError) {
    return (
      <div className="min-h-screen min-h-dvh bg-white flex flex-col items-center justify-center px-6 gap-3 text-center">
        <p className="text-danger font-semibold">{loadError}</p>
        <button onClick={() => window.location.reload()} className="text-secondary text-sm underline">
          Réessayer
        </button>
      </div>
    )
  }

  if (saved) {
    return (
      <div className="min-h-screen min-h-dvh bg-white flex flex-col items-center justify-center px-6 gap-6">
        <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center animate-pop-in">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
            <path d="M5 12.5l4.5 4.5L19 7" stroke="var(--color-success)" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" className="animate-draw-check" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-text">Relève validée</h2>
          <p className="text-muted mt-2 text-sm">Transmise au gérant.</p>
        </div>
        <div className="w-full max-w-xs flex flex-col gap-2">
          {saved.map(r => (
            <div key={r.id} className="bg-background rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-text">{r.reseau_mobile_money.nom}</span>
              <span className={`text-sm font-bold ${
                ecartTone(r.ecart) === 'ok' ? 'text-success' : ecartTone(r.ecart) === 'warn' ? 'text-warning' : 'text-danger'
              }`}>
                {r.ecart > 0 ? '+' : ''}{r.ecart.toLocaleString('fr-FR')} F
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen min-h-dvh bg-background flex flex-col">
      <div className="bg-gradient-to-br from-primary to-primary-dark px-5 pt-5 pb-5 flex items-start justify-between">
        <div>
          <h1 className="font-display text-white font-bold text-lg">Relève d'équipe</h1>
          <p className="text-white/60 text-xs">
            {agentName} · {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
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

      {!reseaux ? (
        <HandoverSkeleton />
      ) : (
        <div className="flex-1 overflow-y-auto p-4 pb-24 flex flex-col gap-4">
          {submitError && (
            <p className="text-danger text-sm text-center bg-danger/10 rounded-xl py-2.5 px-3">{submitError}</p>
          )}

          {reseaux.map(r => {
            const saisi = soldesReels[r.reseau_mobile_money_id] ?? ''
            const ecart = saisi.trim() ? parseInt(saisi, 10) - r.solde_theorique : null
            const tone = ecart !== null ? ecartTone(ecart) : null

            return (
              <div key={r.reseau_mobile_money_id} className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="text-secondary" size={18} />
                  </div>
                  <span className="font-display font-bold text-text text-base">{r.reseau}</span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-background rounded-xl p-3 text-center">
                    <p className="text-muted text-[10px] font-medium uppercase tracking-wide">Dépôts</p>
                    <p className="font-display font-bold text-primary text-base mt-0.5">{r.depots.toLocaleString('fr-FR')}</p>
                  </div>
                  <div className="bg-background rounded-xl p-3 text-center">
                    <p className="text-muted text-[10px] font-medium uppercase tracking-wide">Retraits</p>
                    <p className="font-display font-bold text-danger text-base mt-0.5">{r.retraits.toLocaleString('fr-FR')}</p>
                  </div>
                  <div className="bg-secondary/10 rounded-xl p-3 text-center">
                    <p className="text-muted text-[10px] font-medium uppercase tracking-wide">Solde théo.</p>
                    <p className="font-display font-bold text-text text-base mt-0.5">{r.solde_theorique.toLocaleString('fr-FR')}</p>
                  </div>
                </div>

                <label className="text-muted text-xs font-semibold uppercase tracking-wide">
                  Solde réel constaté (F CFA)
                </label>
                <input
                  type="number"
                  value={saisi}
                  onChange={e => setSoldesReels(prev => ({ ...prev, [r.reseau_mobile_money_id]: e.target.value }))}
                  placeholder="Saisir le solde réel"
                  className="w-full h-14 px-4 mt-2 rounded-2xl border-2 border-border text-text text-lg transition-all duration-150 focus:border-secondary focus:outline-none focus:ring-4 focus:ring-secondary/15"
                />

                {ecart !== null && (
                  <div className={`mt-3 p-3 rounded-xl flex items-center justify-between ${
                    tone === 'ok' ? 'bg-success/10' : tone === 'warn' ? 'bg-warning/10' : 'bg-danger/10'
                  }`}>
                    <span className="text-sm font-semibold text-text">Écart constaté</span>
                    <span className={`font-display font-bold text-base ${
                      tone === 'ok' ? 'text-success' : tone === 'warn' ? 'text-warning' : 'text-danger'
                    }`}>
                      {ecart > 0 ? '+' : ''}{ecart.toLocaleString('fr-FR')} F{ecart === 0 && ' ✓'}
                    </span>
                  </div>
                )}
              </div>
            )
          })}

          <button
            onClick={handleValidate}
            disabled={!allFilled || submitting}
            className="font-display w-full h-16 rounded-2xl bg-primary text-white font-bold text-lg shadow-lg shadow-primary/25 transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
            style={{ touchAction: 'manipulation' }}
          >
            {submitting ? 'Validation...' : 'Valider la relève'}
          </button>
        </div>
      )}
    </div>
  )
}