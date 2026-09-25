// src/pages/staff/ConfigScreen.tsx
//
// Configuration réseau — réservé à l'admin : agences, réseaux mobile
// money, plateformes de paris (CDC section 13/14 : listes configurables,
// jamais codées en dur).
import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import {
  createAgence,
  createPlateforme,
  createReseau,
  getAgencesConfig,
  getErrorMessage,
  getPlateformesConfig,
  getReseauxConfig,
  updateAgence,
  updateAgenceStatut,
  updatePlateformeStatut,
  updateReseauStatut,
  type AgenceConfig,
  type ConfigItem,
} from '@/lib/api'

function AgenceModal({
  agence,
  onClose,
  onSaved,
}: {
  agence: AgenceConfig | null
  onClose: () => void
  onSaved: (a: AgenceConfig) => void
}) {
  const [nom, setNom] = useState(agence?.nom ?? '')
  const [adresse, setAdresse] = useState(agence?.adresse ?? '')
  const [ville, setVille] = useState(agence?.ville ?? '')
  const [telephone, setTelephone] = useState(agence?.telephone ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = nom.trim() && adresse.trim() && ville.trim() && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const data = { nom: nom.trim(), adresse: adresse.trim(), ville: ville.trim(), telephone: telephone.trim() || undefined }
      const saved = agence ? await updateAgence(agence.id, data) : await createAgence(data)
      onSaved(saved)
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
          <h3 className="font-display font-bold text-text text-xl">{agence ? "Modifier l'agence" : 'Nouvelle agence'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-muted">
            <X size={16} />
          </button>
        </div>

        {error && <p className="text-danger text-sm text-center bg-danger/10 rounded-xl py-2.5 px-3 mb-4">{error}</p>}

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-muted text-sm font-semibold">Nom</label>
            <input value={nom} onChange={e => setNom(e.target.value)}
              className="w-full h-12 mt-1.5 px-4 rounded-xl border-2 border-border focus:border-secondary focus:outline-none focus:ring-4 focus:ring-secondary/15 text-text" />
          </div>
          <div>
            <label className="text-muted text-sm font-semibold">Adresse</label>
            <input value={adresse} onChange={e => setAdresse(e.target.value)}
              className="w-full h-12 mt-1.5 px-4 rounded-xl border-2 border-border focus:border-secondary focus:outline-none focus:ring-4 focus:ring-secondary/15 text-text" />
          </div>
          <div>
            <label className="text-muted text-sm font-semibold">Ville</label>
            <input value={ville} onChange={e => setVille(e.target.value)}
              className="w-full h-12 mt-1.5 px-4 rounded-xl border-2 border-border focus:border-secondary focus:outline-none focus:ring-4 focus:ring-secondary/15 text-text" />
          </div>
          <div>
            <label className="text-muted text-sm font-semibold">Téléphone (optionnel)</label>
            <input value={telephone ?? ''} onChange={e => setTelephone(e.target.value)}
              className="w-full h-12 mt-1.5 px-4 rounded-xl border-2 border-border focus:border-secondary focus:outline-none focus:ring-4 focus:ring-secondary/15 text-text" />
          </div>
          <div className="flex gap-3 mt-2">
            <button onClick={onClose} className="flex-1 h-12 rounded-xl border-2 border-border text-muted font-semibold text-sm">
              Annuler
            </button>
            <button onClick={handleSubmit} disabled={!canSubmit}
              className="flex-1 h-12 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-40 transition-all active:scale-[0.98]">
              {submitting ? '...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SimpleConfigList({
  title,
  items,
  onCreate,
  onToggle,
  placeholder,
}: {
  title: string
  items: ConfigItem[] | null
  onCreate: (nom: string) => Promise<void>
  onToggle: (item: ConfigItem) => Promise<void>
  placeholder: string
}) {
  const [newNom, setNewNom] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!newNom.trim()) return
    setCreating(true)
    setError(null)
    try {
      await onCreate(newNom.trim())
      setNewNom('')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm">
      <h3 className="font-display font-bold text-text mb-4">{title}</h3>

      {error && <p className="text-danger text-sm text-center bg-danger/10 rounded-xl py-2 px-3 mb-3">{error}</p>}

      {!items ? (
        <div className="flex flex-col gap-2 animate-pulse mb-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-border/60 rounded-xl" />)}
        </div>
      ) : (
        <div className="flex flex-col gap-2 mb-4">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between bg-background rounded-xl px-4 py-3">
              <span className="font-medium text-text text-sm">{item.nom}</span>
              <button
                onClick={() => onToggle(item)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                  item.statut === 'actif' ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'
                }`}
              >
                {item.statut === 'actif' ? 'Désactiver' : 'Activer'}
              </button>
            </div>
          ))}
          {items.length === 0 && <p className="text-muted text-sm text-center py-4">Aucun élément pour l'instant.</p>}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={newNom}
          onChange={e => setNewNom(e.target.value)}
          placeholder={placeholder}
          className="flex-1 min-w-0 h-11 px-4 rounded-xl border-2 border-border focus:border-secondary focus:outline-none text-sm text-text"
        />
        <button
          onClick={handleCreate}
          disabled={creating || !newNom.trim()}
          className="px-4 h-11 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 transition-all active:scale-95 flex-shrink-0"
        >
          {creating ? '...' : 'Ajouter'}
        </button>
      </div>
    </div>
  )
}

export function ConfigScreen() {
  const [agences, setAgences] = useState<AgenceConfig[] | null>(null)
  const [reseaux, setReseaux] = useState<ConfigItem[] | null>(null)
  const [plateformes, setPlateformes] = useState<ConfigItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [modalAgence, setModalAgence] = useState<AgenceConfig | null | 'new'>(null)

  useEffect(() => {
    getAgencesConfig().then(setAgences).catch(err => setError(getErrorMessage(err)))
    getReseauxConfig().then(setReseaux).catch(err => setError(getErrorMessage(err)))
    getPlateformesConfig().then(setPlateformes).catch(err => setError(getErrorMessage(err)))
  }, [])

  const toggleAgenceStatut = async (agence: AgenceConfig) => {
    try {
      const updated = await updateAgenceStatut(agence.id, agence.statut === 'active' ? 'inactive' : 'active')
      setAgences(prev => prev?.map(a => a.id === agence.id ? updated : a) ?? null)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="font-display text-xl md:text-2xl font-bold text-text">Configuration</h1>
        <p className="text-muted text-sm mt-0.5">Agences, réseaux mobile money et plateformes de paris</p>
      </div>

      {error && <p className="text-danger text-sm text-center bg-danger/10 rounded-xl py-2.5 px-3 mb-4">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <SimpleConfigList
          title="Réseaux mobile money"
          items={reseaux}
          placeholder="Nouveau réseau..."
          onCreate={async nom => {
            const created = await createReseau(nom)
            setReseaux(prev => [...(prev ?? []), created])
          }}
          onToggle={async item => {
            const updated = await updateReseauStatut(item.id, item.statut === 'actif' ? 'inactif' : 'actif')
            setReseaux(prev => prev?.map(r => r.id === item.id ? updated : r) ?? null)
          }}
        />
        <SimpleConfigList
          title="Plateformes de paris"
          items={plateformes}
          placeholder="Nouvelle plateforme..."
          onCreate={async nom => {
            const created = await createPlateforme(nom)
            setPlateformes(prev => [...(prev ?? []), created])
          }}
          onToggle={async item => {
            const updated = await updatePlateformeStatut(item.id, item.statut === 'actif' ? 'inactif' : 'actif')
            setPlateformes(prev => prev?.map(p => p.id === item.id ? updated : p) ?? null)
          }}
        />
      </div>

      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-text">Agences</h3>
          <button
            onClick={() => setModalAgence('new')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold transition-all active:scale-95"
          >
            <Plus size={16} /> Nouvelle agence
          </button>
        </div>

        {!agences ? (
          <div className="flex flex-col gap-2 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-border/60 rounded-xl" />)}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {agences.map(a => (
              <div key={a.id} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-background rounded-xl px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text text-sm">{a.nom}</p>
                  <p className="text-muted text-xs">{a.adresse}, {a.ville}{a.telephone ? ` · ${a.telephone}` : ''}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    a.statut === 'active' ? 'bg-success/10 text-success' : 'bg-muted/10 text-muted'
                  }`}>
                    {a.statut === 'active' ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => setModalAgence(a)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary/10 text-secondary transition-all active:scale-95"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => toggleAgenceStatut(a)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                      a.statut === 'active' ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'
                    }`}
                  >
                    {a.statut === 'active' ? 'Désactiver' : 'Activer'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalAgence && (
        <AgenceModal
          agence={modalAgence === 'new' ? null : modalAgence}
          onClose={() => setModalAgence(null)}
          onSaved={saved => setAgences(prev => {
            if (!prev) return [saved]
            const exists = prev.some(a => a.id === saved.id)
            return exists ? prev.map(a => a.id === saved.id ? saved : a) : [...prev, saved]
          })}
        />
      )}
    </div>
  )
}