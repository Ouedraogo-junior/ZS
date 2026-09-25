// src/pages/public/AvisSection.tsx
import { useEffect, useState } from 'react'
import { getErrorMessage, getPublicAvis, type Avis } from '@/lib/api'
import { Stars } from '@/components/common/Stars'

function AvisSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 bg-border/60 rounded-2xl" />
      ))}
    </div>
  )
}

export function AvisSection() {
  const [avis, setAvis] = useState<Avis[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getPublicAvis().then(setAvis).catch(err => setError(getErrorMessage(err)))
  }, [])

  const moyenne = avis && avis.length > 0
    ? (avis.reduce((s, a) => s + a.note, 0) / avis.length).toFixed(1)
    : null

  return (
    <section id="avis" className="px-6 py-16 md:py-20 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-text">Avis de nos clients</h2>
          {moyenne && (
            <div className="inline-flex items-center gap-2 bg-white rounded-full px-5 py-2.5 shadow-sm mt-4">
              <Stars note={Math.round(parseFloat(moyenne))} size={18} />
              <span className="font-display font-bold text-text">{moyenne}</span>
              <span className="text-muted text-sm">/5 · {avis!.length} avis</span>
            </div>
          )}
        </div>

        {error && <p className="text-danger text-sm text-center bg-danger/10 rounded-xl py-2.5 px-3 mb-4">{error}</p>}

        {!avis ? (
          <AvisSkeleton />
        ) : avis.length === 0 ? (
          <p className="text-muted text-sm text-center">Aucun avis pour l'instant — soyez le premier à en laisser un.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {avis.map(a => (
              <div key={a.id} className="bg-background rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-text text-sm">{a.nom_client}</span>
                  <Stars note={a.note} />
                </div>
                {a.commentaire && <p className="text-muted text-sm leading-relaxed">{a.commentaire}</p>}
                {a.agence && <p className="text-secondary text-xs mt-2 font-semibold">{a.agence.nom}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}