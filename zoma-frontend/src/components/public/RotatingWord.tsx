// src/components/public/RotatingWord.tsx
//
// Fait défiler une liste d'éléments (texte simple ou JSX) en fondu.
// Technique "grid stack" : tous les éléments occupent la même cellule de
// grille, donc le conteneur se dimensionne automatiquement sur le plus
// grand d'entre eux (y compris s'il s'étale sur deux lignes) — pas besoin
// de calculer une largeur/hauteur à la main.
import { useEffect, useState, type ReactNode } from 'react'

export function RotatingWord({
  words,
  interval = 2800,
  className = '',
}: {
  words: ReactNode[]
  interval?: number
  className?: string
}) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setIndex(i => (i + 1) % words.length), interval)
    return () => clearInterval(timer)
  }, [words.length, interval])

  return (
    <span className={`grid ${className}`}>
      {words.map((word, i) => (
        <span
          key={i}
          className="[grid-area:1/1] transition-opacity duration-500 ease-in-out"
          style={{ opacity: i === index ? 1 : 0 }}
        >
          {word}
        </span>
      ))}
    </span>
  )
}