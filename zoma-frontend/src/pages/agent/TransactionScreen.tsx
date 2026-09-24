// src/pages/agent/TransactionScreen.tsx
import { useEffect, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Delete, LogOut, UserCog } from 'lucide-react'
import {
  createTransaction,
  getErrorMessage,
  getPlateformesParis,
  getReseauxMobileMoney,
  type ReferenceItem,
  type Transaction,
} from '@/lib/api'

interface TransactionScreenProps {
  agentName: string
  agencyName: string
  onLogout: () => void
  onEditProfile: () => void
}

export function TransactionScreen({ agentName, agencyName, onLogout, onEditProfile }: TransactionScreenProps) {
  // Listes de référence, chargées depuis le backend au montage — jamais
  // codées en dur (CDC section 13/14).
  const [reseaux, setReseaux] = useState<ReferenceItem[] | null>(null)
  const [plateformes, setPlateformes] = useState<ReferenceItem[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getReseauxMobileMoney(), getPlateformesParis()])
      .then(([r, p]) => { setReseaux(r); setPlateformes(p) })
      .catch(err => setLoadError(getErrorMessage(err)))
  }, [])

  const [type, setType] = useState<'depot' | 'retrait'>('depot')
  const [reseauId, setReseauId] = useState<number | null>(null)
  const [plateformeId, setPlateformeId] = useState<number | null>(null)
  const [amount, setAmount] = useState('')
  const [phone, setPhone] = useState('')
  const [ref, setRef] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saved, setSaved] = useState<Transaction | null>(null)

  const numKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'delete']

  const canSubmit = reseauId !== null && plateformeId !== null && amount !== '' && phone.trim() !== '' && !submitting

  const resetForm = () => {
    setAmount(''); setPhone(''); setRef(''); setReseauId(null); setPlateformeId(null)
  }

  const handleSave = async () => {
    if (!canSubmit || reseauId === null || plateformeId === null) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const { transaction } = await createTransaction({
        type,
        reseau_mobile_money_id: reseauId,
        plateforme_paris_id: plateformeId,
        montant: parseInt(amount, 10),
        telephone_client: phone.trim(),
        reference_paiement: ref.trim() || undefined,
      })
      setSaved(transaction)
      resetForm()
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

  if (!reseaux || !plateformes) {
    return (
      <div className="min-h-screen min-h-dvh bg-background flex flex-col">
        <div className="bg-gradient-to-br from-primary to-primary-dark px-5 pt-5 pb-5 h-[88px]" />
        <div className="flex-1 px-4 pt-4 flex flex-col gap-4 animate-pulse">
          <div className="h-12 bg-border/60 rounded-2xl" />
          <div className="flex gap-3">
            <div className="h-16 flex-1 bg-border/60 rounded-2xl" />
            <div className="h-16 flex-1 bg-border/60 rounded-2xl" />
          </div>
          <div className="flex gap-2">
            <div className="h-11 w-20 bg-border/60 rounded-xl" />
            <div className="h-11 w-24 bg-border/60 rounded-xl" />
            <div className="h-11 w-16 bg-border/60 rounded-xl" />
          </div>
          <div className="h-20 bg-border/60 rounded-2xl" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-[52px] bg-border/60 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (saved) {
    return (
      <div className="min-h-screen min-h-dvh bg-white flex flex-col items-center justify-center px-6 gap-6">
        <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center animate-pop-in">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12.5l4.5 4.5L19 7"
              stroke="var(--color-success)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-draw-check"
            />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-text">Transaction enregistrée</h2>
          <p className="text-muted mt-2 text-sm">Transaction n°{saved.id}</p>
          <p className={`font-display font-bold text-2xl mt-3 ${saved.type === 'depot' ? 'text-primary' : 'text-danger'}`}>
            {saved.montant.toLocaleString('fr-FR')} F CFA
          </p>
          <p className="text-sm text-muted mt-1">
            {saved.type === 'depot' ? 'Dépôt' : 'Retrait'} · {saved.reseau_mobile_money.nom} · {saved.plateforme_paris.nom}
          </p>
        </div>
        <button
          onClick={() => setSaved(null)}
          className="font-display w-full max-w-xs h-14 rounded-2xl bg-primary text-white font-bold text-base shadow-lg shadow-primary/25 transition-all duration-150 active:scale-[0.98]"
          style={{ touchAction: 'manipulation' }}
        >
          Nouvelle transaction
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen min-h-dvh bg-background flex flex-col">
      <div className="bg-gradient-to-br from-primary to-primary-dark px-5 pt-5 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/60 text-xs">Bonjour,</p>
            <p className="font-display text-white font-bold text-base">{agentName}</p>
            <p className="text-secondary text-xs font-medium">{agencyName}</p>
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
      </div>

      <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4 flex flex-col gap-4">
        {submitError && (
          <p className="text-danger text-sm text-center bg-danger/10 rounded-xl py-2.5 px-3">{submitError}</p>
        )}

        {/* Type toggle */}
        <div className="bg-white rounded-2xl p-1 flex shadow-sm">
          {(['depot', 'retrait'] as const).map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`font-display flex-1 h-13 py-3 rounded-xl font-bold text-sm transition-all duration-150 active:scale-[0.97] flex items-center justify-center gap-1.5 ${
                type === t
                  ? t === 'depot' ? 'bg-primary text-white shadow' : 'bg-danger text-white shadow'
                  : 'text-muted'
              }`}
              style={{ touchAction: 'manipulation' }}
            >
              {t === 'depot' ? <ArrowDownCircle size={18} /> : <ArrowUpCircle size={18} />}
              {t === 'depot' ? 'Dépôt' : 'Retrait'}
            </button>
          ))}
        </div>

        {/* Réseau mobile money */}
        <div>
          <p className="text-muted text-xs font-semibold uppercase tracking-wider mb-2">Réseau Mobile Money</p>
          <div className="flex gap-3">
            {reseaux.map(r => (
              <button
                key={r.id}
                onClick={() => setReseauId(r.id)}
                className={`flex-1 h-16 rounded-2xl border flex items-center justify-center transition-all duration-150 active:scale-[0.97] ${
                  reseauId === r.id
                    ? 'border-secondary bg-secondary/10 ring-2 ring-secondary/30'
                    : 'border-border bg-white shadow-sm'
                }`}
                style={{ touchAction: 'manipulation' }}
              >
                <span className="text-[13px] font-semibold text-text">{r.nom}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Plateforme de paris */}
        <div>
          <p className="text-muted text-xs font-semibold uppercase tracking-wider mb-2">Plateforme de paris</p>
          <div className="flex gap-2 flex-wrap">
            {plateformes.map(p => (
              <button
                key={p.id}
                onClick={() => setPlateformeId(p.id)}
                className={`px-4 h-11 rounded-xl border text-sm font-semibold transition-all duration-150 active:scale-[0.97] ${
                  plateformeId === p.id
                    ? 'border-secondary bg-secondary text-white shadow-sm shadow-secondary/30'
                    : 'border-border bg-white text-text shadow-sm'
                }`}
                style={{ touchAction: 'manipulation' }}
              >
                {p.nom}
              </button>
            ))}
          </div>
        </div>

        {/* Montant */}
        <div>
          <p className="text-muted text-xs font-semibold uppercase tracking-wider mb-2">Montant (F CFA)</p>
          <div className="bg-white rounded-2xl px-5 py-4 text-right shadow-sm mb-2">
            <span className="font-display text-4xl font-bold text-primary">
              {amount ? parseInt(amount, 10).toLocaleString('fr-FR') : '0'}
            </span>
            <span className="text-muted text-sm ml-2">F CFA</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {numKeys.map((k, i) => (
              <button
                key={i}
                onClick={() => {
                  if (k === 'delete') setAmount(a => a.slice(0, -1))
                  else if (k === '000') setAmount(a => a + '000')
                  else setAmount(a => a.length < 9 ? a + k : a)
                }}
                className="font-display h-[52px] rounded-xl bg-white shadow-sm text-primary font-bold text-lg transition-all duration-100 active:scale-90 active:bg-primary active:text-white active:shadow-none flex items-center justify-center"
                style={{ touchAction: 'manipulation' }}
              >
                {k === 'delete' ? <Delete size={20} /> : k}
              </button>
            ))}
          </div>
        </div>

        {/* Téléphone */}
        <div>
          <p className="text-muted text-xs font-semibold uppercase tracking-wider mb-2">Téléphone client</p>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="07 00 00 00 00"
            className="w-full h-14 px-4 rounded-2xl bg-white border-2 border-border text-text text-lg transition-all duration-150 focus:border-secondary focus:outline-none focus:ring-4 focus:ring-secondary/15"
          />
        </div>

        {/* Référence */}
        <div>
          <p className="text-muted text-xs font-semibold uppercase tracking-wider mb-2">
            Référence <span className="normal-case font-normal">(optionnel)</span>
          </p>
          <input
            type="text"
            value={ref}
            onChange={e => setRef(e.target.value)}
            placeholder="BT2024..."
            className="w-full h-14 px-4 rounded-2xl bg-white border-2 border-border text-text text-lg transition-all duration-150 focus:border-secondary focus:outline-none focus:ring-4 focus:ring-secondary/15"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!canSubmit}
          className={`font-display w-full h-16 rounded-2xl text-white font-bold text-lg transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:shadow-none ${
            type === 'depot' ? 'bg-primary shadow-lg shadow-primary/25' : 'bg-danger shadow-lg shadow-danger/25'
          }`}
          style={{ touchAction: 'manipulation' }}
        >
          {submitting ? 'Enregistrement...' : type === 'depot' ? 'Enregistrer le dépôt' : 'Enregistrer le retrait'}
        </button>
      </div>
    </div>
  )
}