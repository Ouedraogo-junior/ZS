// src/pages/public/TeamSection.tsx
//
// Noms réels à ajouter plus tard (après discussion avec l'équipe) —
// TEAM_MEMBERS[].name reste en placeholder jusque-là.
//
// Photos : dès que vous en avez une, déposez le fichier dans
// public/team/ (ex. public/team/direction.jpg) et renseignez son chemin
// dans le champ "photo" ci-dessous (ex. "/team/direction.jpg"). Sans
// photo, l'icône générique reste affichée — les deux peuvent cohabiter
// pendant que vous complétez l'équipe petit à petit.
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, User } from 'lucide-react'

const TEAM_MEMBERS: { role: string; name: string; photo: string | null }[] = [
  { role: 'Fondateur & Direction', name: '[Nom à ajouter]', photo: null },
  { role: "Le staff ZOMA SERVICE", name: 'Le staff ZOMA SERVICE', photo: '/team/team_2.jpeg' },
  { role: 'Relation client', name: '[Nom à ajouter]', photo: null },
  { role: 'Agent superviseur', name: 'Anderson ILBOUDO', photo: '/team/anderson.jpeg' },
]

const INTERVAL_MS = 5000

export function TeamSection() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setIndex(i => (i + 1) % TEAM_MEMBERS.length), INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  const goTo = (i: number) => setIndex((i + TEAM_MEMBERS.length) % TEAM_MEMBERS.length)

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-text">Notre équipe</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="text-center lg:text-left">
            <p className="text-muted leading-relaxed max-w-md mx-auto lg:mx-0">
              Une équipe d'agents formés et disponibles, engagée à traiter chaque transaction avec
              rigueur et à répondre rapidement à vos questions, en agence comme à distance.
            </p>
          </div>

          <div className="max-w-md mx-auto lg:mx-0 w-full">
            <div className="relative">
              {TEAM_MEMBERS.map((member, i) => (
                <div
                  key={i}
                  className="transition-opacity duration-500 ease-in-out"
                  style={{
                    opacity: i === index ? 1 : 0,
                    position: i === index ? 'relative' : 'absolute',
                    inset: 0,
                    pointerEvents: i === index ? 'auto' : 'none',
                  }}
                >
                  <div className="aspect-square rounded-3xl bg-background border border-border flex items-center justify-center shadow-sm overflow-hidden">
                    {member.photo ? (
                      <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="text-border" size={96} strokeWidth={1.2} />
                    )}
                  </div>
                  <div className="text-center mt-5">
                    <p className="font-display font-bold text-text text-xl">{member.name}</p>
                    <p className="text-secondary text-sm font-semibold mt-1">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => goTo(index - 1)}
                className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-muted transition-all active:scale-90 hover:bg-border"
                aria-label="Membre précédent"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex gap-2">
                {TEAM_MEMBERS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-primary' : 'w-2 bg-border'}`}
                    aria-label={`Aller au membre ${i + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={() => goTo(index + 1)}
                className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-muted transition-all active:scale-90 hover:bg-border"
                aria-label="Membre suivant"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}