// src/pages/public/PlatformsSection.tsx
import { useEffect, useState } from 'react'
import { getErrorMessage, getPublicPlateformesParis, getPublicReseauxMobileMoney, type ReferenceItem } from '@/lib/api'

function PillSkeleton() {
  return (
    <div className="flex flex-wrap gap-2 justify-center animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-10 w-28 bg-border/60 rounded-full" />
      ))}
    </div>
  )
}

export function PlatformsSection() {
  const [reseaux, setReseaux] = useState<ReferenceItem[] | null>(null)
  const [plateformes, setPlateformes] = useState<ReferenceItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getPublicReseauxMobileMoney(), getPublicPlateformesParis()])
      .then(([r, p]) => { setReseaux(r); setPlateformes(p) })
      .catch(err => setError(getErrorMessage(err)))
  }, [])

  return (
    <section className="px-6 py-16 md:py-20 bg-primary">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-white">Ce que nous prenons en charge</h2>
        <p className="text-white/70 mt-2 mb-10">Tous les réseaux mobile money et plateformes de paris majeurs</p>

        {error && <p className="text-white text-sm bg-white/10 rounded-xl py-2.5 px-3 mb-6">{error}</p>}

        <div className="mb-10">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-4">Réseaux mobile money</p>
          {!reseaux ? <PillSkeleton /> : (
            <div className="flex flex-wrap gap-3 justify-center">
              {reseaux.map(r => (
                <span key={r.id} className="bg-white text-primary font-display font-bold px-5 py-2.5 rounded-full shadow-lg">
                  {r.nom}
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-4">Plateformes de paris</p>
          {!plateformes ? <PillSkeleton /> : (
            <div className="flex flex-wrap gap-3 justify-center">
              {plateformes.map(p => (
                <span key={p.id} className="bg-white/10 backdrop-blur text-white font-semibold px-5 py-2.5 rounded-full border border-white/20">
                  {p.nom}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}