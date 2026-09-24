// src/pages/staff/AgentsScreen.tsx
import { useEffect, useState } from 'react'
import { KeyRound, Plus, X } from 'lucide-react'
import {
  createStaffAgent,
  getAgences,
  getErrorMessage,
  getStaffAgents,
  resetAgentPin,
  updateAgentStatut,
  type Agence,
  type StaffAgent,
} from '@/lib/api'

interface AgentsScreenProps {
  /** Un gérant crée toujours pour sa propre agence ; un admin doit choisir. */
  role: 'gerant' | 'admin'
}

function AgentsSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-20 bg-border/60 rounded-2xl" />
      ))}
    </div>
  )
}

function CreateAgentModal({
  role,
  onClose,
  onCreated,
}: {
  role: 'gerant' | 'admin'
  onClose: () => void
  onCreated: (a: StaffAgent) => void
}) {
  const [nom, setNom] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [pin, setPin] = useState('')
  const [agenceId, setAgenceId] = useState<number | ''>('')
  const [agences, setAgences] = useState<Agence[] | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (role === 'admin') {
      getAgences().then(setAgences).catch(err => setError(getErrorMessage(err)))
    }
  }, [role])

  const canSubmit =
    nom.trim() && pseudo.trim() && /^\d{4}$/.test(pin) && !submitting &&
    (role === 'gerant' || agenceId !== '')

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const agent = await createStaffAgent({
        nom: nom.trim(),
        pseudo: pseudo.trim(),
        pin,
        ...(role === 'admin' ? { agence_id: agenceId as number } : {}),
      })
      onCreated(agent)
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
          <h3 className="font-display font-bold text-text text-xl">Créer un agent</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-muted">
            <X size={16} />
          </button>
        </div>

        {error && <p className="text-danger text-sm text-center bg-danger/10 rounded-xl py-2.5 px-3 mb-4">{error}</p>}

        <div className="flex flex-col gap-4">
          {role === 'admin' && (
            <div>
              <label className="text-muted text-sm font-semibold">Agence</label>
              <select
                value={agenceId}
                onChange={e => setAgenceId(e.target.value ? Number(e.target.value) : '')}
                className="w-full h-12 mt-1.5 px-4 rounded-xl border-2 border-border focus:border-secondary focus:outline-none focus:ring-4 focus:ring-secondary/15 text-text bg-white"
              >
                <option value="">Sélectionner une agence</option>
                {agences?.map(a => (
                  <option key={a.id} value={a.id}>{a.nom} — {a.ville}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-muted text-sm font-semibold">Nom complet</label>
            <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Prénom Nom"
              className="w-full h-12 mt-1.5 px-4 rounded-xl border-2 border-border focus:border-secondary focus:outline-none focus:ring-4 focus:ring-secondary/15 text-text" />
          </div>
          <div>
            <label className="text-muted text-sm font-semibold">Identifiant (pseudo)</label>
            <input value={pseudo} onChange={e => setPseudo(e.target.value)} placeholder="prenom.nom"
              className="w-full h-12 mt-1.5 px-4 rounded-xl border-2 border-border focus:border-secondary focus:outline-none focus:ring-4 focus:ring-secondary/15 font-mono text-text" />
          </div>
          <div>
            <label className="text-muted text-sm font-semibold">PIN initial (4 chiffres)</label>
            <input value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              inputMode="numeric" placeholder="••••"
              className="w-full h-12 mt-1.5 px-4 rounded-xl border-2 border-border focus:border-secondary focus:outline-none focus:ring-4 focus:ring-secondary/15 font-mono tracking-widest text-center text-xl text-text" />
          </div>
          <div className="flex gap-3 mt-2">
            <button onClick={onClose}
              className="flex-1 h-12 rounded-xl border-2 border-border text-muted font-semibold text-sm">
              Annuler
            </button>
            <button onClick={handleSubmit} disabled={!canSubmit}
              className="flex-1 h-12 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-40 transition-all active:scale-[0.98]">
              {submitting ? 'Création...' : "Créer l'agent"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ResetPinModal({ agent, onClose, onDone }: { agent: StaffAgent; onClose: () => void; onDone: () => void }) {
  const [pin, setPin] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = /^\d{4}$/.test(pin) && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await resetAgentPin(agent.id, pin)
      onDone()
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-text/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="font-display font-bold text-text text-lg mb-1">Réinitialiser le PIN</h3>
        <p className="text-muted text-sm mb-5">{agent.nom}</p>

        {error && <p className="text-danger text-sm text-center bg-danger/10 rounded-xl py-2.5 px-3 mb-4">{error}</p>}

        <input value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          inputMode="numeric" placeholder="Nouveau PIN"
          className="w-full h-12 px-4 rounded-xl border-2 border-border focus:border-secondary focus:outline-none focus:ring-4 focus:ring-secondary/15 font-mono tracking-widest text-center text-xl text-text" />

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 h-12 rounded-xl border-2 border-border text-muted font-semibold text-sm">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={!canSubmit}
            className="flex-1 h-12 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-40 transition-all active:scale-[0.98]">
            {submitting ? '...' : 'Valider'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function AgentsScreen({ role }: AgentsScreenProps) {
  const [agents, setAgents] = useState<StaffAgent[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [resetTarget, setResetTarget] = useState<StaffAgent | null>(null)

  const load = () => {
    getStaffAgents().then(setAgents).catch(err => setError(getErrorMessage(err)))
  }

  useEffect(load, [])

  const toggleStatut = async (agent: StaffAgent) => {
    const statut = agent.statut === 'active' ? 'inactive' : 'active'
    try {
      const updated = await updateAgentStatut(agent.id, statut)
      setAgents(prev => prev?.map(a => a.id === agent.id ? updated : a) ?? null)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold text-text">Gestion des agents</h1>
          <p className="text-muted text-sm mt-0.5">
            {agents ? `${agents.filter(a => a.statut === 'active').length} actifs sur ${agents.length}` : '...'}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm self-start transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
          style={{ touchAction: 'manipulation' }}
        >
          <Plus size={18} /> Nouvel agent
        </button>
      </div>

      {error && <p className="text-danger text-sm text-center bg-danger/10 rounded-xl py-2.5 px-3 mb-4">{error}</p>}

      {!agents ? (
        <AgentsSkeleton />
      ) : (
        <div className="flex flex-col gap-3">
          {agents.map(agent => (
            <div key={agent.id} className="bg-white rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xs">{agent.nom.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-text truncate">{agent.nom}</p>
                  <p className="text-muted text-xs font-mono">{agent.pseudo}</p>
                </div>
              </div>

              {role === 'admin' && agent.agence && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-secondary/10 text-secondary font-semibold self-start sm:self-center flex-shrink-0">
                  {agent.agence.nom}
                </span>
              )}

              <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold self-start sm:self-center flex-shrink-0 ${
                agent.statut === 'active' ? 'bg-success/10 text-success' : 'bg-muted/10 text-muted'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${agent.statut === 'active' ? 'bg-success' : 'bg-muted'}`} />
                {agent.statut === 'active' ? 'Actif' : 'Inactif'}
              </span>

              <p className="text-muted text-xs sm:w-32 flex-shrink-0">
                {agent.last_login_at
                  ? new Date(agent.last_login_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                  : 'Jamais connecté'}
              </p>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setResetTarget(agent)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary/10 text-secondary transition-all active:scale-95"
                  style={{ touchAction: 'manipulation' }}
                >
                  <KeyRound size={14} /> Réinit. PIN
                </button>
                <button
                  onClick={() => toggleStatut(agent)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                    agent.statut === 'active' ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'
                  }`}
                  style={{ touchAction: 'manipulation' }}
                >
                  {agent.statut === 'active' ? 'Désactiver' : 'Activer'}
                </button>
              </div>
            </div>
          ))}

          {agents.length === 0 && (
            <p className="text-muted text-sm text-center py-8">Aucun agent pour l'instant.</p>
          )}
        </div>
      )}

      {showCreate && (
        <CreateAgentModal
          role={role}
          onClose={() => setShowCreate(false)}
          onCreated={agent => setAgents(prev => [...(prev ?? []), agent])}
        />
      )}
      {resetTarget && (
        <ResetPinModal agent={resetTarget} onClose={() => setResetTarget(null)} onDone={load} />
      )}
    </div>
  )
}