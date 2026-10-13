// src/components/GrilleChoix.tsx
//
// Choix parmi quelques options sous forme de grands boutons avec logo —
// pensé pour un client qui ne sait pas lire : un logo se reconnaît d'un
// coup d'œil. Le nom reste écrit dessous pour ceux qui savent lire.
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native'
import { Check } from 'lucide-react-native'
import { colors } from '../theme/colors'
import { ImageOuInitiales } from './ImageOuInitiales'

export interface ChoixItem {
  id: number
  nom: string
  logo_url?: string | null
}

interface Props {
  titre: string
  items: ChoixItem[]
  value: number | null
  onChange: (id: number) => void
  /** Force le nombre de colonnes ; par défaut, choisi selon le nombre d'options. */
  colonnes?: 3 | 4
}

const ECART = 8
// Marge horizontale totale du formulaire (20 de chaque côté).
const MARGES = 40

/**
 * 3 ou 4 tuiles par ligne, jamais plus gros : 4 options tiennent sur une
 * seule ligne, 5 ou 6 se répartissent en 3 + 2/3 (pas de tuile orpheline
 * isolée), 7 et plus en lignes de 4. Une ou deux options restent à la
 * taille d'une colonne sur trois, alignées à gauche.
 */
function colonnesPour(nombre: number): 3 | 4 {
  if (nombre === 4 || nombre >= 7) return 4
  return 3
}

export function GrilleChoix({ titre, items, value, onChange, colonnes: colonnesForcees }: Props) {
  const { width } = useWindowDimensions()

  const colonnes = colonnesForcees ?? colonnesPour(items.length)
  const largeur = Math.floor((width - MARGES - ECART * (colonnes - 1)) / colonnes)

  // Tout s'adapte à la largeur de la tuile : le logo en occupe environ la
  // moitié (36 px à 4 colonnes, 50 px à 3), le nom passe en plus petit.
  const compact = colonnes === 4
  const tailleLogo = Math.max(34, Math.round(largeur * 0.5))

  return (
    <View style={styles.wrapper}>
      <Text style={styles.titre}>{titre}</Text>

      {items.length === 0 ? (
        <Text style={styles.vide}>Aucun choix disponible pour le moment.</Text>
      ) : (
        <View style={styles.grille}>
          {items.map(item => {
            const choisi = item.id === value
            return (
              <Pressable
                key={item.id}
                style={[
                  styles.tuile,
                  { width: largeur, minHeight: compact ? 92 : 100 },
                  choisi && styles.tuileChoisie,
                ]}
                onPress={() => onChange(item.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: choisi }}
                accessibilityLabel={item.nom}
              >
                <ImageOuInitiales uri={item.logo_url} texte={item.nom} taille={tailleLogo} rayon={10} />
                <Text
                  style={[styles.nom, compact && styles.nomCompact, choisi && styles.nomChoisi]}
                  numberOfLines={2}
                >
                  {item.nom}
                </Text>
                {choisi && (
                  <View style={[styles.coche, compact && styles.cocheCompacte]}>
                    <Check size={compact ? 11 : 13} color={colors.white} strokeWidth={3} />
                  </View>
                )}
              </Pressable>
            )
          })}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 18 },
  titre: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 8 },
  vide: { fontSize: 13, color: colors.muted },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: ECART },
  tuile: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  tuileChoisie: { borderColor: colors.primary, backgroundColor: '#EAF1FB' },
  nom: { fontSize: 12, fontWeight: '600', color: colors.text, textAlign: 'center' },
  nomCompact: { fontSize: 11 },
  nomChoisi: { color: colors.primary, fontWeight: '800' },
  coche: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cocheCompacte: { width: 17, height: 17, borderRadius: 9 },
})