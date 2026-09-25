// src/pages/staff/ReclamationsScreen.tsx
//
// Réclamations clients — visible par gérant (son agence + non rattachées)
// et admin (toutes). Mobile : liste puis détail plein écran avec retour.
// Desktop (lg+) : les deux côte à côte.
import { useEffect, useState } from 'react'
import { ArrowLeft, MessageCircle, Send } from 'lucide-react'
import {
  getErrorMessage,
  getReclamation,
  getReclamations,
  prendreEnCharge,
  sendReclamationMessage,
  updateReclamationStatut,
  type Reclamation,
  type ReclamationDetail,
  type ReclamationStatut,
} from '@/lib/api'

const STATUTS: { id: ReclamationStatut | 'toutes'; label: string }[] = [
  { id: 'toutes', label: 'Toutes' },
  { id: 'nouveau', label: 'Nouveau' },
  { id: 'en_cours', label: 'En cours' },
  { id: 'resolu', label: 'Résolu' },
]

function statutBadgeClasses(statut: ReclamationStatut) {
  if (statut === 'nouveau') return 'bg-danger/10 text-danger'
  if (statut === 'en_cours') return 'bg-warning/10 text-warning'
  return 'bg-success/10 text-success'
}

function statutDotClasses(statut: ReclamationStatut) {
  if (statut === 'nouveau') return 'bg-danger'
  if (statut === 'en_cours') return 'bg-warning'
  return 'bg-success'
}

function statutLabel(statut: ReclamationStatut) {
  if (statut === 'nouveau') return 'Nouveau'
  if (statut === 'en_cours') return 'En cours'
  return 'Résolu'
}

function whatsappLink(contact: string, ref: string): string | null {
  const digits = contact.replace(/\D/g, '')
  if (digits.length < 8) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(`Bonjour, concernant votre réclamation réf. ${ref} : `)}`
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-24 bg-border/60 rounded-2xl" />
      ))}
    </div>
  )
}

export function ReclamationsScreen() {
  const [reclamations, setReclamations] = useState<Reclamation[] | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [filter, setFilter] = useState<ReclamationStatut | 'toutes'>('toutes')

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)
  const [detail, setDetail] = useState<ReclamationDetail | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)

  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [claiming, setClaiming] = useState(false)

  const loadList = () => {
    getReclamations().then(setReclamations).catch(err => setListError(getErrorMessage(err)))
  }

  useEffect(loadList, [])

  useEffect(() => {
    if (selectedId === null) return
    setDetail(null)
    setDetailError(null)
    getReclamation(selectedId).then(setDetail).catch(err => setDetailError(getErrorMessage(err)))
  }, [selectedId])

  const filtered = (reclamations ?? []).filter(r => filter === 'toutes' || r.statut === filter)

  const openReclamation = (id: number) => {
    setSelectedId(id)
    setMobileDetailOpen(true)
  }

  const refreshAfterChange = (updated: Reclamation) => {
    setReclamations(prev => prev?.map(r => r.id === updated.id ? updated : r) ?? null)
    setDetail(prev => prev ? { ...prev, ...updated } : prev)
  }

  const handlePrendreEnCharge = async () => {
    if (!detail) return
    setClaiming(true)
    try {
      const updated = await prendreEnCharge(detail.id)
      refreshAfterChange(updated)
    } catch (err) {
      setDetailError(getErrorMessage(err))
    } finally {
      setClaiming(false)
    }
  }

  const handleStatutChange = async (statut: ReclamationStatut) => {
    if (!detail) return
    try {
      const updated = await updateReclamationStatut(detail.id, statut)
      refreshAfterChange(updated)
    } catch (err) {
      setDetailError(getErrorMessage(err))
    }
  }

  const handleSend = async () => {
    if (!detail || !reply.trim()) return
    setSending(true)
    try {
      const message = await sendReclamationMessage(detail.id, reply.trim())
      setDetail(prev => prev ? { ...prev, messages: [...prev.messages, message] } : prev)
      setReply('')
    } catch (err) {
      setDetailError(getErrorMessage(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="font-display text-xl md:text-2xl font-bold text-text mb-6">Réclamations clients</h1>

      <div className="flex flex-col lg:flex-row gap-5 lg:h-[calc(100vh-180px)]">
        {/* Liste — visible seule sur mobile tant que rien n'est ouvert */}
        <div className={`${mobileDetailOpen ? 'hidden' : 'flex'} lg:flex w-full lg:w-80 flex-col gap-3 flex-shrink-0`}>
          <div className="flex gap-1.5 flex-wrap">
            {STATUTS.map(s => (
              <button
                key={s.id}
                onClick={() => setFilter(s.id)}
                className={`px-3 h-7 rounded-full text-xs font-semibold transition-all ${
                  filter === s.id ? 'bg-primary text-white' : 'bg-white text-muted border border-border'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {listError && <p className="text-danger text-sm text-center bg-danger/10 rounded-xl py-2.5 px-3">{listError}</p>}

          {!reclamations ? (
            <ListSkeleton />
          ) : filtered.length === 0 ? (
            <p className="text-muted text-sm text-center py-8">Aucune réclamation.</p>
          ) : (
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 lg:max-h-none max-h-[calc(100vh-320px)]">
              {filtered.map(r => (
                <button
                  key={r.id}
                  onClick={() => openReclamation(r.id)}
                  className={`text-left bg-white rounded-2xl p-4 shadow-sm border-2 transition-all ${
                    selectedId === r.id ? 'border-secondary' : 'border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-semibold text-text text-sm">{r.nom_client}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 flex-shrink-0 ${statutBadgeClasses(r.statut)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statutDotClasses(r.statut)}`} />
                      {statutLabel(r.statut)}
                    </span>
                  </div>
                  <p className="text-muted text-xs line-clamp-2">{r.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-muted text-[10px]">{r.agence?.nom ?? 'Agence non précisée'}</span>
                    <span className="text-muted text-[10px]">
                      {new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Détail */}
        <div className={`${mobileDetailOpen ? 'flex' : 'hidden'} lg:flex flex-1 flex-col`}>
          {!selectedId ? (
            <div className="flex-1 bg-white rounded-2xl border border-border items-center justify-center hidden lg:flex">
              <p className="text-muted text-sm">Sélectionnez une réclamation</p>
            </div>
          ) : !detail ? (
            <div className="flex-1 bg-white rounded-2xl border border-border animate-pulse h-64" />
          ) : (
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-border flex flex-col overflow-hidden h-[calc(100vh-200px)] lg:h-full">
              <div className="px-4 lg:px-6 py-4 border-b border-background flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <button onClick={() => setMobileDetailOpen(false)} className="lg:hidden w-8 h-8 rounded-lg bg-background flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ArrowLeft size={16} />
                  </button>
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-text text-lg truncate">{detail.nom_client}</h3>
                    <p className="text-muted text-sm truncate">
                      {detail.contact_client}
                      {detail.reference_transaction && <> · Réf : <span className="font-mono text-secondary">{detail.reference_transaction}</span></>}
                    </p>
                  </div>
                </div>
                <select
                  value={detail.statut}
                  onChange={e => handleStatutChange(e.target.value as ReclamationStatut)}
                  className="text-sm px-3 py-2 rounded-xl border-2 border-border outline-none text-text font-semibold bg-white flex-shrink-0"
                >
                  <option value="nouveau">Nouveau</option>
                  <option value="en_cours">En cours</option>
                  <option value="resolu">Résolu</option>
                </select>
              </div>

              {detailError && <p className="text-danger text-sm text-center bg-danger/10 py-2.5 px-3 m-4 rounded-xl">{detailError}</p>}

              <div className="px-4 lg:px-6 py-4 bg-background border-b border-border">
                <p className="text-text text-sm leading-relaxed">{detail.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-muted text-xs">
                    {detail.assigne_a ? `Pris en charge par ${detail.assigne_a.nom}` : 'Non pris en charge'}
                  </span>
                  {!detail.assigne_a && (
                    <button
                      onClick={handlePrendreEnCharge}
                      disabled={claiming}
                      className="text-xs font-semibold text-secondary underline disabled:opacity-40"
                    >
                      {claiming ? '...' : 'Prendre en charge'}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 lg:p-5 flex flex-col gap-3">
                {detail.messages.length === 0 && (
                  <p className="text-muted text-sm text-center py-4">Aucun échange pour l'instant.</p>
                )}
                {detail.messages.map(m => (
                  <div key={m.id} className={`flex ${m.auteur_type === 'staff' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] sm:max-w-sm px-4 py-3 rounded-2xl ${
                      m.auteur_type === 'staff'
                        ? 'bg-primary text-white rounded-br-sm'
                        : 'bg-background text-text border border-border rounded-bl-sm'
                    }`}>
                      <p className="text-sm leading-relaxed">{m.message}</p>
                      <p className={`text-xs mt-1.5 ${m.auteur_type === 'staff' ? 'text-white/50' : 'text-muted'}`}>
                        {m.auteur?.nom ?? 'Client'} · {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 lg:p-4 border-t border-border flex flex-wrap gap-2">
                <input
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Ajouter un message..."
                  className="flex-1 min-w-[140px] h-11 px-4 rounded-xl border-2 border-border focus:border-secondary focus:outline-none text-sm text-text"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !reply.trim()}
                  className="px-4 h-11 rounded-xl bg-primary text-white font-semibold text-sm flex items-center gap-2 disabled:opacity-40 transition-all active:scale-[0.98]"
                >
                  <Send size={16} /> Envoyer
                </button>
                {whatsappLink(detail.contact_client, String(detail.id)) && (
                  <a
                    href={whatsappLink(detail.contact_client, String(detail.id))!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 h-11 rounded-xl bg-success text-white font-semibold text-sm flex items-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <MessageCircle size={16} /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}