// src/components/public/HeroCarousel.tsx
//
// Fond animé du hero : dégradés qui se fondent les uns dans les autres,
// avec un léger effet de zoom continu (façon "Ken Burns"). Pour utiliser
// une vraie photo sur un slide, déposez le fichier dans public/hero/
// (ex. public/hero/agence-1.jpg) et renseignez son chemin dans le champ
// "image" du slide correspondant ci-dessous — le dégradé reste utilisé
// en repli pour tout slide sans image.
import { useEffect, useState } from 'react'

const SLIDES: { gradient: string; image?: string }[] = [
  { gradient: 'radial-gradient(circle at 30% 20%, #0685F1 0%, #0B3D91 55%, #082C6B 100%)', image: '/hero/team.jpeg' },
  { gradient: 'radial-gradient(circle at 75% 75%, #0685F1 0%, #0B3D91 55%, #082C6B 100%)', image: '/hero/team_2.jpeg' },
  { gradient: 'radial-gradient(circle at 50% 40%, #25D366 0%, #0685F1 35%, #0B3D91 100%)' },
]

const INTERVAL_MS = 6000

export function HeroCarousel() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setIndex(i => (i + 1) % SLIDES.length), INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden">
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity ease-in-out animate-hero-pan"
          style={{
            backgroundImage: slide.image ? `url(${slide.image})` : slide.gradient,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: i === index ? 1 : 0,
            transitionDuration: '2000ms',
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/60" />
    </div>
  )
}