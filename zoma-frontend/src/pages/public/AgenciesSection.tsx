// src/pages/public/AgenciesSection.tsx
import { useEffect, useState } from 'react'
import { Clock, MapPin, Phone } from 'lucide-react'
import { getErrorMessage, getPublicAgences, type Agence } from '@/lib/api'

function AgenciesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-36 bg-border/60 rounded-2xl" />
      ))}
    </div>
  )
}

export function AgenciesSection() {
  const [agences, setAgences] = useState<Agence[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getPublicAgences().then(setAgences).catch(err => setError(getErrorMessage(err)))
  }, [])

  return (
    <section id="agences" className="px-6 py-16 md:py-20 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-text">Nos agences</h2>
          <p className="text-muted mt-2">Service continu 24h/24, 7j/7 — Orange Money et Moov Money acceptés</p>
        </div>

        {error && <p className="text-danger text-sm text-center bg-danger/10 rounded-xl py-2.5 px-3 mb-4">{error}</p>}

        {!agences ? (
          <AgenciesSkeleton />
        ) : agences.length === 0 ? (
          <p className="text-muted text-sm text-center">Aucune agence disponible pour l'instant.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agences.map(a => (
              <div key={a.id} className="bg-white rounded-2xl p-5 shadow-sm">
                <h3 className="font-display font-bold text-text text-lg">{a.nom}</h3>
                <div className="flex items-start gap-2 mt-3">
                  <MapPin size={16} className="text-secondary flex-shrink-0 mt-0.5" />
                  <p className="text-muted text-sm">{a.adresse ? `${a.adresse}, ` : ''}{a.ville}</p>
                </div>
                {a.telephone && (
                  <div className="flex items-center gap-2 mt-2">
                    <Phone size={16} className="text-secondary flex-shrink-0" />
                    <a href={`tel:${a.telephone}`} className="text-muted text-sm hover:text-secondary transition-colors">
                      {a.telephone}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Clock size={16} className="text-success flex-shrink-0" />
                  <span className="text-success text-sm font-semibold">Ouvert 24h/24</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}