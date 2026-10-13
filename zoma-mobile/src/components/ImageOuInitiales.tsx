// src/components/ImageOuInitiales.tsx
//
// Affiche une image distante (logo, photo d'agence) — ou, quand il n'y en
// a pas encore ou qu'elle ne se charge pas, une tuile colorée avec des
// initiales : un bouton n'est jamais vide, même avant que l'admin n'ait
// envoyé le moindre logo.
import { useEffect, useState } from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'

// Teintes assez foncées pour que le texte blanc reste lisible. Même nom →
// même couleur à chaque affichage (voir teinteDe).
const TEINTES = ['#0B3D91', '#0685F1', '#1F9D55', '#C77700', '#B42332', '#6B46C1']

function teinteDe(texte: string): string {
  const somme = texte.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return TEINTES[somme % TEINTES.length]
}

/** "Orange Money" → "OM", "1xBet" → "1X", "Koudougou" → "KO". */
function initialesDe(texte: string): string {
  const mots = texte.trim().split(/\s+/).filter(Boolean)
  if (mots.length === 0) return '?'
  const lettres = mots.length > 1 ? mots[0][0] + mots[1][0] : mots[0].slice(0, 2)
  return lettres.toUpperCase()
}

interface Props {
  uri?: string | null
  /** Texte dont on tire les initiales et la couleur de repli. */
  texte: string
  /** Hauteur en pixels — et largeur aussi, sauf si `largeur` est précisée. */
  taille: number
  /** Largeur différente de la hauteur (bandeau rectangulaire). */
  largeur?: number
  rayon?: number
  /** "contain" pour un logo (jamais rogné), "cover" pour une photo. */
  ajuste?: 'contain' | 'cover'
}

export function ImageOuInitiales({ uri, texte, taille, largeur = taille, rayon = 12, ajuste = 'contain' }: Props) {
  const [echec, setEchec] = useState(false)

  // Si l'admin remplace le logo, l'URL change : on retente le chargement.
  useEffect(() => setEchec(false), [uri])

  if (uri && !echec) {
    return (
      <Image
        source={{ uri }}
        style={{ width: largeur, height: taille, borderRadius: rayon }}
        resizeMode={ajuste}
        onError={() => setEchec(true)}
        accessibilityIgnoresInvertColors
      />
    )
  }

  return (
    <View
      style={[styles.tuile, { width: largeur, height: taille, borderRadius: rayon, backgroundColor: teinteDe(texte) }]}
    >
      <Text style={[styles.initiales, { fontSize: Math.round(taille * 0.36) }]}>{initialesDe(texte)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  tuile: { alignItems: 'center', justifyContent: 'center' },
  initiales: { color: '#FFFFFF', fontWeight: '800' },
})