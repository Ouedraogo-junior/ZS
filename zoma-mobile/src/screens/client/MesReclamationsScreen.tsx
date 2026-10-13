// src/screens/client/MesReclamationsScreen.tsx
//
// Onglet « Réclamations » du client : le bouton pour en faire une nouvelle, et
// l'état de chacune (reçue, en cours, résolue). Rechargée à chaque retour sur
// l'écran et par tirer-pour-actualiser ; la notification « prise en charge /
// résolue » y mène. Une réclamation faite à la voix se réécoute ici.
import { useCallback, useState } from 'react'
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../../theme/colors'
import { NoteVocale } from '../../components/NoteVocale'
import { getMesReclamations, sourceAudio, getErrorMessage, type MaReclamation } from '../../lib/api'
import type { ReclamationsClientStackParamList } from '../../navigation/ClientNavigator'

type Props = NativeStackScreenProps<ReclamationsClientStackParamList, 'ReclamationsListe'>

const STATUTS: Record<MaReclamation['statut'], { libelle: string; fond: string; texte: string }> = {
  nouveau: { libelle: 'Reçue', fond: '#FEF3C7', texte: '#B45309' },
  en_cours: { libelle: 'En cours', fond: '#DBEAFE', texte: '#1D4ED8' },
  resolu: { libelle: 'Résolue', fond: '#D1FAE5', texte: '#047857' },
}

export function MesReclamationsScreen({ navigation }: Props) {
  const [reclamations, setReclamations] = useState<MaReclamation[] | null>(null)
  const [actualisation, setActualisation] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const charger = useCallback(async () => {
    try {
      setReclamations(await getMesReclamations())
      setErreur(null)
    } catch (err) {
      setErreur(getErrorMessage(err))
      // Évite un écran bloqué sur le chargement si le premier appel échoue.
      setReclamations(prev => prev ?? [])
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      charger()
    }, [charger])
  )

  const actualiser = async () => {
    setActualisation(true)
    await charger()
    setActualisation(false)
  }

  if (!reclamations) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Réclamations</Text>

      {erreur && <Text style={styles.error}>{erreur}</Text>}

      <FlatList
        data={reclamations}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={actualisation} onRefresh={actualiser} />}
        ListHeaderComponent={
          <Pressable style={styles.nouvelle} onPress={() => navigation.navigate('ReclamationForm')}>
            <Text style={styles.nouvelleText}>+ Nouvelle réclamation</Text>
          </Pressable>
        }
        ListEmptyComponent={<Text style={styles.empty}>Vous n'avez fait aucune réclamation.</Text>}
        renderItem={({ item }) => {
          const statut = STATUTS[item.statut]
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.agence?.nom ?? 'Agence'}</Text>
                <View style={[styles.badge, { backgroundColor: statut.fond }]}>
                  <Text style={[styles.badgeText, { color: statut.texte }]}>{statut.libelle}</Text>
                </View>
              </View>
              <Text style={styles.cardMeta}>
                {new Date(item.created_at).toLocaleDateString('fr-FR')}
                {item.reference_transaction ? ` · ${item.reference_transaction}` : ''}
              </Text>
              {!!item.description && (
                <Text style={styles.cardDescription} numberOfLines={4}>
                  {item.description}
                </Text>
              )}
              {item.has_audio && (
                <View style={[styles.vocal, !!item.description && { marginTop: 10 }]}>
                  <NoteVocale
                    dureeSecondes={item.audio_duree}
                    obtenirSource={() => sourceAudio(`/client/reclamations/${item.id}/audio`)}
                  />
                </View>
              )}
            </View>
          )
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  error: {
    color: colors.danger,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 10,
    margin: 12,
    textAlign: 'center',
  },
  vocal: { alignSelf: 'flex-start' },
  listContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, gap: 10 },
  nouvelle: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 6,
  },
  nouvelleText: { color: colors.white, fontWeight: '700' },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, flexShrink: 1 },
  cardMeta: { fontSize: 12, color: colors.muted, marginBottom: 8 },
  cardDescription: { fontSize: 14, color: colors.text },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700' },
})