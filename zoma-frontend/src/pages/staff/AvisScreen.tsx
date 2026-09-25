// src/pages/staff/AvisScreen.tsx
//
// Modération des avis clients — réservé à l'admin.
import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteAvis, getAvisList, getErrorMessage, type Avis } from '@/lib/api'
import { Stars } from '@/components/common/Stars'

function AvisSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 bg-border/60 rounded-2xl" />
      ))}
    </div>
  )
}

export function AvisScreen() {
  const [avis, setAvis] = useState<Avis[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    getAvisList().then(setAvis).catch(err => setError(getErrorMessage(err)))
  }, [])

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      await deleteAvis(id)
      setAvis(prev => prev?.filter(a => a.id !== id) ?? null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  const moyenne = avis && avis.length > 0
    ? (avis.reduce((s, a) => s + a.note, 0) / avis.length).toFixed(1)
    : null

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold text-text">Avis clients</h1>
          <p className="text-muted text-sm mt-0.5">
            {avis ? `${avis.length} avis publiés` : '...'}
          </p>
        </div>
        {moyenne && (
          <div className="bg-white rounded-2xl px-5 py-3 shadow-sm flex items-center gap-3 self-start">
            <Stars note={Math.round(parseFloat(moyenne))} />
            <span className="font-display font-bold text-xl text-text">{moyenne}</span>
            <span className="text-muted text-sm">/5</span>
          </div>
        )}
      </div>

      {error && <p className="text-danger text-sm text-center bg-danger/10 rounded-xl py-2.5 px-3 mb-4">{error}</p>}

      {!avis ? (
        <AvisSkeleton />
      ) : avis.length === 0 ? (
        <p className="text-muted text-sm text-center py-8">Aucun avis pour l'instant.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {avis.map(a => (
            <div key={a.id} className="bg-white rounded-2xl shadow-sm p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs">{a.nom_client.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-text text-sm">{a.nom_client}</span>
                  {a.agence && <span className="text-muted text-xs">— {a.agence.nom}</span>}
                </div>
                <Stars note={a.note} />
                {a.commentaire && <p className="text-text text-sm mt-2 leading-relaxed">{a.commentaire}</p>}
                <p className="text-muted text-xs mt-1.5">
                  {new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => handleDelete(a.id)}
                disabled={deletingId === a.id}
                className="w-8 h-8 rounded-lg bg-danger/10 text-danger flex items-center justify-center flex-shrink-0 transition-all active:scale-90 disabled:opacity-40"
                aria-label="Supprimer l'avis"
                style={{ touchAction: 'manipulation' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}