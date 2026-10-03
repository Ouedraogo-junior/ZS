// src/screens/client/MesDemandesScreen.tsx
import { useCallback, useState } from 'react'
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { colors } from '../../theme/colors'
import { getDemandes, getErrorMessage, type Demande } from '../../lib/api'
import type { MesDemandesStackParamList } from '../../navigation/ClientNavigator'

type Props = NativeStackScreenProps<MesDemandesStackParamList, 'MesDemandesListe'>

function StatutBadge({ statut }: { statut: Demande['statut'] }) {
  const estValidee = statut === 'validee'
  return (
    <View style={[styles.badge, estValidee ? styles.badgeValidee : styles.badgeAttente]}>
      <Text style={[styles.badgeText, estValidee ? styles.badgeTextValidee : styles.badgeTextAttente]}>
        {estValidee ? 'Validée' : 'En attente'}
      </Text>
    </View>
  )
}

export function MesDemandesScreen({ navigation }: Props) {
  const [demandes, setDemandes] = useState<Demande[] | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    getDemandes()
      .then(setDemandes)
      .catch(err => setError(getErrorMessage(err)))
  }, [])

  // Recharge à chaque fois que l'onglet redevient actif — pas besoin
  // d'attendre le websocket pour voir une demande fraîchement validée.
  useFocusEffect(load)

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  if (!demandes) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Mes demandes</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={demandes}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>Aucune demande pour l'instant.</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('DemandeDetail', { demandeId: item.id })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                {item.type === 'depot' ? 'Dépôt' : 'Retrait'} — {item.plateforme_paris.nom}
              </Text>
              <StatutBadge statut={item.statut} />
            </View>
            <Text style={styles.cardSubtitle}>
              {item.agence.nom} · {item.reseau_mobile_money.nom}
            </Text>
            <Text style={styles.cardMontant}>{item.montant.toLocaleString('fr-FR')} F CFA</Text>
          </Pressable>
        )}
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
    marginHorizontal: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  listContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, gap: 10 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, flexShrink: 1 },
  cardSubtitle: { fontSize: 13, color: colors.muted, marginBottom: 8 },
  cardMontant: { fontSize: 16, fontWeight: '800', color: colors.primary },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeAttente: { backgroundColor: '#FEF3C7' },
  badgeValidee: { backgroundColor: '#D1FAE5' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeTextAttente: { color: '#B45309' },
  badgeTextValidee: { color: '#047857' },
})