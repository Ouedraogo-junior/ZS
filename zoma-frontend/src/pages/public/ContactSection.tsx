// src/pages/public/ContactSection.tsx
import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { getErrorMessage, getPublicAgences, submitAvis, submitReclamation, type Agence } from '@/lib/api'
import { Stars } from '@/components/common/Stars'

function AgenceSelect({
  value,
  onChange,
  agences,
}: {
  value: number | ''
  onChange: (v: number | '') => void
  agences: Agence[] | null
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value ? Number(e.target.value) : '')}
      className="w-full h-12 px-4 rounded-xl border-2 border-border focus:border-secondary focus:outline-none focus:ring-4 focus:ring-secondary/15 text-text bg-white"
    >
      <option value="">Agence concernée (optionnel)</option>
      {agences?.map(a => (
        <option key={a.id} value={a.id}>{a.nom} — {a.ville}</option>
      ))}
    </select>
  )
}

function AvisForm({ agences }: { agences: Agence[] | null }) {
  const [nom, setNom] = useState('')
  const [note, setNote] = useState(0)
  const [commentaire, setCommentaire] = useState('')
  const [agenceId, setAgenceId] = useState<number | ''>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const canSubmit = nom.trim() && note > 0 && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await submitAvis({
        nom_client: nom.trim(),
        note,
        commentaire: commentaire.trim() || undefined,
        ...(agenceId ? { agence_id: agenceId } : {}),
      })
      setSent(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm flex flex-col items-center justify-center h-full">
        <CheckCircle2 className="text-success" size={40} />
        <p className="font-display font-bold text-text mt-4">Merci pour votre avis !</p>
        <p className="text-muted text-sm mt-1">Il est publié sur notre page.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
      <h3 className="font-display font-bold text-text text-xl mb-1">Laisser un avis</h3>
      <p className="text-muted text-sm mb-5">Votre retour nous aide à nous améliorer.</p>

      {error && <p className="text-danger text-sm text-center bg-danger/10 rounded-xl py-2.5 px-3 mb-4">{error}</p>}

      <div className="flex flex-col gap-4">
        <div>
          <label className="text-muted text-sm font-semibold">Note</label>
          <div className="mt-2">
            <Stars note={note} size={28} onChange={setNote} />
          </div>
        </div>
        <input
          value={nom}
          onChange={e => setNom(e.target.value)}
          placeholder="Votre nom"
          className="w-full h-12 px-4 rounded-xl border-2 border-border focus:border-secondary focus:outline-none focus:ring-4 focus:ring-secondary/15 text-text"
        />
        <AgenceSelect value={agenceId} onChange={setAgenceId} agences={agences} />
        <textarea
          value={commentaire}
          onChange={e => setCommentaire(e.target.value)}
          placeholder="Votre commentaire (optionnel)"
          rows={3}
          className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-secondary focus:outline-none focus:ring-4 focus:ring-secondary/15 text-text resize-none"
        />
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="h-12 rounded-xl bg-primary text-white font-display font-bold text-sm disabled:opacity-40 transition-all active:scale-[0.98]"
        >
          {submitting ? 'Envoi...' : "Envoyer l'avis"}
        </button>
      </div>
    </div>
  )
}

function ReclamationForm({ agences }: { agences: Agence[] | null }) {
  const [nom, setNom] = useState('')
  const [contact, setContact] = useState('')
  const [description, setDescription] = useState('')
  const [reference, setReference] = useState('')
  const [agenceId, setAgenceId] = useState<number | ''>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const canSubmit = nom.trim() && contact.trim() && description.trim() && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await submitReclamation({
        nom_client: nom.trim(),
        contact_client: contact.trim(),
        description: description.trim(),
        reference_transaction: reference.trim() || undefined,
        ...(agenceId ? { agence_id: agenceId } : {}),
      })
      setSent(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm flex flex-col items-center justify-center h-full">
        <CheckCircle2 className="text-success" size={40} />
        <p className="font-display font-bold text-text mt-4">Réclamation envoyée</p>
        <p className="text-muted text-sm mt-1">Notre équipe va la traiter rapidement.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
      <h3 className="font-display font-bold text-text text-xl mb-1">Signaler un problème</h3>
      <p className="text-muted text-sm mb-5">Décrivez votre situation, nous vous répondons rapidement.</p>

      {error && <p className="text-danger text-sm text-center bg-danger/10 rounded-xl py-2.5 px-3 mb-4">{error}</p>}

      <div className="flex flex-col gap-4">
        <input
          value={nom}
          onChange={e => setNom(e.target.value)}
          placeholder="Votre nom"
          className="w-full h-12 px-4 rounded-xl border-2 border-border focus:border-secondary focus:outline-none focus:ring-4 focus:ring-secondary/15 text-text"
        />
        <input
          value={contact}
          onChange={e => setContact(e.target.value)}
          placeholder="Téléphone ou email"
          className="w-full h-12 px-4 rounded-xl border-2 border-border focus:border-secondary focus:outline-none focus:ring-4 focus:ring-secondary/15 text-text"
        />
        <AgenceSelect value={agenceId} onChange={setAgenceId} agences={agences} />
        <input
          value={reference}
          onChange={e => setReference(e.target.value)}
          placeholder="Référence de transaction (optionnel)"
          className="w-full h-12 px-4 rounded-xl border-2 border-border focus:border-secondary focus:outline-none focus:ring-4 focus:ring-secondary/15 font-mono text-text"
        />
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Décrivez le problème"
          rows={4}
          className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-secondary focus:outline-none focus:ring-4 focus:ring-secondary/15 text-text resize-none"
        />
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="h-12 rounded-xl bg-danger text-white font-display font-bold text-sm disabled:opacity-40 transition-all active:scale-[0.98]"
        >
          {submitting ? 'Envoi...' : 'Envoyer la réclamation'}
        </button>
      </div>
    </div>
  )
}

export function ContactSection() {
  const [agences, setAgences] = useState<Agence[] | null>(null)

  useEffect(() => {
    getPublicAgences().then(setAgences).catch(() => setAgences([]))
  }, [])

  return (
    <section id="contact" className="px-6 py-16 md:py-20 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-text">Nous contacter</h2>
          <p className="text-muted mt-2">Laissez un avis ou signalez un problème</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <AvisForm agences={agences} />
          <ReclamationForm agences={agences} />
        </div>
      </div>
    </section>
  )
}