// src/screens/agent/AgentDemandesListScreen.tsx
import { useCallback, useState } from 'react'
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { colors } from '../../theme/colors'
import { getAgentDemandes, getErrorMessage, type AgentDemande } from '../../lib/api'
import type { AgentDemandesStackParamList } from '../../navigation/AgentDemandesTypes'

type Props = NativeStackScreenProps<AgentDemandesStackParamList, 'AgentDemandesListe'>
type Filtre = 'en_attente' | 'validee'

function StatutBadge({ statut }: { statut: AgentDemande['statut'] }) {
  const estValidee = statut === 'validee'
  return (
    <View style={[styles.badge, estValidee ? styles.badgeValidee : styles.badgeAttente]}>
      <Text style={[styles.badgeText, estValidee ? styles.badgeTextValidee : styles.badgeTextAttente]}>
        {estValidee ? 'Validée' : 'En attente'}
      </Text>
    </View>
  )
}

export function AgentDemandesListScreen({ navigation }: Props) {
  const [filtre, setFiltre] = useState<Filtre>('en_attente')
  const [demandes, setDemandes] = useState<AgentDemande[] | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    getAgentDemandes(filtre)
      .then(setDemandes)
      .catch(err => setError(getErrorMessage(err)))
  }, [filtre])

  useFocusEffect(load)

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={styles.title}>Demandes</Text>

      <View style={styles.filterRow}>
        <Pressable
          style={[styles.filterPill, filtre === 'en_attente' && styles.filterPillActive]}
          onPress={() => {
            setFiltre('en_attente')
            setDemandes(null)
          }}
        >
          <Text style={[styles.filterText, filtre === 'en_attente' && styles.filterTextActive]}>En attente</Text>
        </Pressable>
        <Pressable
          style={[styles.filterPill, filtre === 'validee' && styles.filterPillActive]}
          onPress={() => {
            setFiltre('validee')
            setDemandes(null)
          }}
        >
          <Text style={[styles.filterText, filtre === 'validee' && styles.filterTextActive]}>Validées</Text>
        </Pressable>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {!demandes ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={demandes}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.empty}>Aucune demande ici.</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate('AgentDemandeDetail', { demandeId: item.id })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>
                  {item.type === 'depot' ? 'Dépôt' : 'Retrait'} — {item.plateforme_paris.nom}
                </Text>
                <StatutBadge statut={item.statut} />
              </View>
              <Text style={styles.cardSubtitle}>
                {item.client.nom} · {item.client.telephone}
              </Text>
              <Text style={styles.cardMontant}>{item.montant.toLocaleString('fr-FR')} F CFA</Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  filterRow: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 8 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.white },
  filterPillActive: { backgroundColor: colors.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: colors.muted },
  filterTextActive: { color: colors.white },
  error: {
    color: colors.danger,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
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