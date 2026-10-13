// src/components/ChoixAgence.tsx
//
// Choix de l'agence par cartes, sur deux colonnes. Le client choisit selon
// SA LOCALITÉ (s'il est à Koudougou, il prend l'agence de Koudougou) : la
// ville est donc l'information principale de chaque carte, en gras. La
// photo de la devanture (si l'admin en a envoyé une) aide à reconnaître la
// bonne agence quand une ville en compte plusieurs.
//
// Une fois une agence choisie (ou mémorisée depuis la dernière demande),
// on n'affiche plus qu'elle, en carte détaillée (avec l'adresse), plus un
// lien « Changer d'agence » : le formulaire reste court pour un client qui
// revient.
import { useMemo, useState } from 'react'
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native'
import { Check } from 'lucide-react-native'
import { colors } from '../theme/colors'
import { ImageOuInitiales } from './ImageOuInitiales'
import type { Agence } from '../lib/api'

interface Props {
  agences: Agence[]
  value: number | null
  onChange: (id: number) => void
}

const ECART = 8
// Marge horizontale totale du formulaire (20 de chaque côté).
const MARGES = 40
const PADDING_CARTE = 8
const BORDURE = 2
const HAUTEUR_PHOTO = 60

/** Carte compacte de la liste : photo (ou initiales) en bandeau, ville, nom de l'agence. */
function CarteCompacte({
  agence,
  choisie,
  largeur,
  onPress,
}: {
  agence: Agence
  choisie: boolean
  largeur: number
  onPress: () => void
}) {
  const largeurPhoto = largeur - 2 * (PADDING_CARTE + BORDURE)

  return (
    <Pressable
      style={[styles.carteCompacte, { width: largeur }, choisie && styles.carteChoisie]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: choisie }}
      accessibilityLabel={`${agence.ville}, ${agence.nom}`}
    >
      <ImageOuInitiales
        uri={agence.photo_url}
        texte={agence.ville}
        taille={HAUTEUR_PHOTO}
        largeur={largeurPhoto}
        rayon={8}
        ajuste="cover"
      />
      <Text style={[styles.villeCompacte, choisie && styles.villeChoisie]} numberOfLines={1}>
        {agence.ville}
      </Text>
      <Text style={styles.nomCompact} numberOfLines={2}>
        {agence.nom}
      </Text>

      {choisie && (
        <View style={styles.cocheCompacte}>
          <Check size={12} color={colors.white} strokeWidth={3} />
        </View>
      )}
    </Pressable>
  )
}

/** Carte détaillée, seule à l'écran une fois l'agence choisie : photo, ville, nom, adresse. */
function CarteDetail({ agence, onPress }: { agence: Agence; onPress: () => void }) {
  return (
    <Pressable
      style={[styles.carteDetail, styles.carteChoisie]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: true }}
      accessibilityLabel={`${agence.ville}, ${agence.nom}`}
    >
      <ImageOuInitiales uri={agence.photo_url} texte={agence.ville} taille={52} rayon={10} ajuste="cover" />

      <View style={styles.textes}>
        <Text style={[styles.villeDetail, styles.villeChoisie]} numberOfLines={1}>
          {agence.ville}
        </Text>
        <Text style={styles.nomDetail} numberOfLines={1}>
          {agence.nom}
        </Text>
        <Text style={styles.adresse} numberOfLines={1}>
          {agence.adresse}
        </Text>
      </View>

      <View style={styles.cocheDetail}>
        <Check size={13} color={colors.white} strokeWidth={3} />
      </View>
    </Pressable>
  )
}

export function ChoixAgence({ agences, value, onChange }: Props) {
  const { width } = useWindowDimensions()
  const [ouvert, setOuvert] = useState(false)

  // Par ville, puis par nom : les agences d'une même ville se suivent.
  const triees = useMemo(
    () => [...agences].sort((a, b) => a.ville.localeCompare(b.ville, 'fr') || a.nom.localeCompare(b.nom, 'fr')),
    [agences]
  )

  const choisie = triees.find(a => a.id === value) ?? null
  const afficherListe = ouvert || choisie === null

  const largeurCarte = Math.floor((width - MARGES - ECART) / 2)

  return (
    <View style={styles.wrapper}>
      <Text style={styles.titre}>Agence</Text>

      {afficherListe ? (
        <View style={styles.grille}>
          {triees.map(agence => (
            <CarteCompacte
              key={agence.id}
              agence={agence}
              choisie={agence.id === value}
              largeur={largeurCarte}
              onPress={() => {
                onChange(agence.id)
                setOuvert(false)
              }}
            />
          ))}
          {triees.length === 0 && <Text style={styles.vide}>Aucune agence disponible pour le moment.</Text>}
        </View>
      ) : (
        <View style={styles.detail}>
          <CarteDetail agence={choisie!} onPress={() => setOuvert(true)} />
          <Pressable onPress={() => setOuvert(true)} accessibilityRole="button">
            <Text style={styles.lien}>Changer d'agence</Text>
          </Pressable>
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
  detail: { gap: 8 },

  carteChoisie: { borderColor: colors.primary, backgroundColor: '#EAF1FB' },
  villeChoisie: { color: colors.primary },

  // ── Carte compacte (liste sur deux colonnes) ──
  carteCompacte: {
    // Hauteur minimale = celle d'une carte dont le nom tient sur deux
    // lignes : toutes les cartes d'une même rangée restent alignées.
    minHeight: 132,
    alignItems: 'center',
    gap: 4,
    padding: PADDING_CARTE,
    borderRadius: 12,
    borderWidth: BORDURE,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  villeCompacte: { fontSize: 15, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: 2 },
  nomCompact: { fontSize: 11, color: colors.muted, textAlign: 'center' },
  cocheCompacte: {
    position: 'absolute',
    top: PADDING_CARTE + 4,
    right: PADDING_CARTE + 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Carte détaillée (agence choisie) ──
  carteDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
    borderRadius: 12,
    borderWidth: BORDURE,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  textes: { flex: 1 },
  villeDetail: { fontSize: 16, fontWeight: '800', color: colors.text },
  nomDetail: { fontSize: 12, color: colors.muted, marginTop: 1 },
  adresse: { fontSize: 11, color: colors.muted, marginTop: 1 },
  cocheDetail: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lien: { color: colors.secondary, fontWeight: '600', textAlign: 'center', paddingVertical: 4 },
})