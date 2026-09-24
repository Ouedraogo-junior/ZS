// src/components/common/ProfileModal.tsx
//
// Modification de son propre profil (nom, pseudo, PIN) — partagé entre
// l'espace Agent et l'espace Gérant/Admin, seul le déclencheur diffère
// selon l'écran.
import { useState } from 'react'
import { X } from 'lucide-react'
import { getErrorMessage, updateProfile, type Session } from '@/lib/api'

interface ProfileModalProps {
  profile: Session['profile']
  onClose: () => void
  onUpdated: (profile: Session['profile']) => void
}

export function ProfileModal({ profile, onClose, onUpdated }: ProfileModalProps) {
  const [nom, setNom] = useState(profile.nom)
  const [pseudo, setPseudo] = useState(profile.pseudo)
  const [changePin, setChangePin] = useState(false)
  const [pinActuel, setPinActuel] = useState('')
  const [pin, setPin] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit =
    nom.trim() && pseudo.trim() && !submitting &&
    (!changePin || (/^\d{4}$/.test(pin) && pinActuel.trim()))

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const session = await updateProfile({
        nom: nom.trim(),
        pseudo: pseudo.trim(),
        ...(changePin ? { pin, pin_actuel: pinActuel } : {}),
      })
      onUpdated(session.profile)
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-text/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-text text-xl">Mon profil</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-muted">
            <X size={16} />
          </button>
        </div>

        {error && <p className="text-danger text-sm text-center bg-danger/10 rounded-xl py-2.5 px-3 mb-4">{error}</p>}

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-muted text-sm font-semibold">Nom complet</label>
            <input value={nom} onChange={e => setNom(e.target.value)}
              className="w-full h-12 mt-1.5 px-4 rounded-xl border-2 border-border focus:border-secondary focus:outline-none focus:ring-4 focus:ring-secondary/15 text-text" />
          </div>
          <div>
            <label className="text-muted text-sm font-semibold">Identifiant (pseudo)</label>
            <input value={pseudo} onChange={e => setPseudo(e.target.value)}
              className="w-full h-12 mt-1.5 px-4 rounded-xl border-2 border-border focus:border-secondary focus:outline-none focus:ring-4 focus:ring-secondary/15 font-mono text-text" />
          </div>

          {!changePin ? (
            <button onClick={() => setChangePin(true)} className="text-secondary text-sm font-semibold text-left">
              Changer mon PIN
            </button>
          ) : (
            <div className="bg-background rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-text text-sm font-semibold">Changer mon PIN</span>
                <button onClick={() => { setChangePin(false); setPin(''); setPinActuel('') }} className="text-muted text-xs underline">
                  Annuler
                </button>
              </div>
              <div>
                <label className="text-muted text-xs font-semibold">PIN actuel</label>
                <input value={pinActuel} onChange={e => setPinActuel(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  inputMode="numeric" placeholder="••••"
                  className="w-full h-11 mt-1 px-4 rounded-xl border-2 border-border focus:border-secondary focus:outline-none font-mono tracking-widest text-center text-text" />
              </div>
              <div>
                <label className="text-muted text-xs font-semibold">Nouveau PIN (4 chiffres)</label>
                <input value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  inputMode="numeric" placeholder="••••"
                  className="w-full h-11 mt-1 px-4 rounded-xl border-2 border-border focus:border-secondary focus:outline-none font-mono tracking-widest text-center text-text" />
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-2">
            <button onClick={onClose} className="flex-1 h-12 rounded-xl border-2 border-border text-muted font-semibold text-sm">
              Annuler
            </button>
            <button onClick={handleSubmit} disabled={!canSubmit}
              className="flex-1 h-12 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-40 transition-all active:scale-[0.98]">
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}