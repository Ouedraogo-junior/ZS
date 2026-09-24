// src/pages/agent/TransactionScreen.tsx
import { useEffect, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, CheckCircle2, Delete, Loader2, LogOut } from 'lucide-react'
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
}

export function TransactionScreen({ agentName, agencyName, onLogout }: TransactionScreenProps) {
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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 gap-3 text-center">
        <p className="text-danger font-semibold">{loadError}</p>
        <button onClick={() => window.location.reload()} className="text-secondary text-sm underline">
          Réessayer
        </button>
      </div>
    )
  }

  if (!reseaux || !plateformes) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    )
  }

  if (saved) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 gap-6">
        <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle2 className="text-success" size={48} strokeWidth={2.5} />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text">Transaction enregistrée</h2>
          <p className="text-muted mt-2 text-sm">Transaction n°{saved.id}</p>
          <p className={`font-bold text-2xl mt-3 ${saved.type === 'depot' ? 'text-primary' : 'text-danger'}`}>
            {saved.montant.toLocaleString('fr-FR')} F CFA
          </p>
          <p className="text-sm text-muted mt-1">
            {saved.type === 'depot' ? 'Dépôt' : 'Retrait'} · {saved.reseau_mobile_money.nom} · {saved.plateforme_paris.nom}
          </p>
        </div>
        <button
          onClick={() => setSaved(null)}
          className="w-full max-w-xs h-14 rounded-2xl bg-primary text-white font-bold text-base transition-all"
          style={{ touchAction: 'manipulation' }}
        >
          Nouvelle transaction
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-primary px-5 pt-5 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/60 text-xs">Bonjour,</p>
            <p className="text-white font-bold text-base">{agentName}</p>
            <p className="text-secondary text-xs font-medium">{agencyName}</p>
          </div>
          <button
            onClick={onLogout}
            className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/80 active:bg-white/20 transition-colors"
            style={{ touchAction: 'manipulation' }}
            aria-label="Déconnexion"
          >
            <LogOut size={18} />
          </button>
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
              className={`flex-1 h-13 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 ${
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
                className={`flex-1 h-16 rounded-2xl border-2 flex items-center justify-center transition-all ${
                  reseauId === r.id ? 'border-secondary bg-secondary/10' : 'border-border bg-white'
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
                className={`px-4 h-11 rounded-xl border-2 text-sm font-semibold transition-all ${
                  plateformeId === p.id ? 'border-secondary bg-secondary text-white' : 'border-border bg-white text-text'
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
            <span className="text-4xl font-bold text-primary">
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
                className="h-[52px] rounded-xl bg-white shadow-sm text-primary font-bold text-lg active:bg-primary active:text-white transition-all flex items-center justify-center"
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
            className="w-full h-14 px-4 rounded-2xl bg-white border-2 border-border text-text text-lg focus:border-secondary focus:outline-none"
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
            className="w-full h-14 px-4 rounded-2xl bg-white border-2 border-border text-text text-lg focus:border-secondary focus:outline-none"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!canSubmit}
          className={`w-full h-16 rounded-2xl text-white font-bold text-lg disabled:opacity-40 transition-all ${
            type === 'depot' ? 'bg-primary' : 'bg-danger'
          }`}
          style={{ touchAction: 'manipulation' }}
        >
          {submitting ? 'Enregistrement...' : type === 'depot' ? 'Enregistrer le dépôt' : 'Enregistrer le retrait'}
        </button>
      </div>
    </div>
  )
}