// src/screens/gerant/ReclamationsListScreen.tsx
import { useCallback, useState } from 'react'
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { colors } from '../../theme/colors'
import { getReclamations, getErrorMessage, type Reclamation, type ReclamationStatut } from '../../lib/api'
import type { ReclamationsStackParamList } from '../../navigation/ReclamationsTypes'

type Props = NativeStackScreenProps<ReclamationsStackParamList, 'ReclamationsListe'>
type Filtre = 'toutes' | ReclamationStatut

const STATUT_LABELS: Record<ReclamationStatut, string> = {
  nouveau: 'Nouveau',
  en_cours: 'En cours',
  resolu: 'Résolu',
}

const STATUT_COLORS: Record<ReclamationStatut, { bg: string; text: string }> = {
  nouveau: { bg: '#FEE2E2', text: '#B91C1C' },
  en_cours: { bg: '#FEF3C7', text: '#B45309' },
  resolu: { bg: '#D1FAE5', text: '#047857' },
}

function StatutBadge({ statut }: { statut: ReclamationStatut }) {
  const c = STATUT_COLORS[statut]
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{STATUT_LABELS[statut]}</Text>
    </View>
  )
}

export function ReclamationsListScreen({ navigation }: Props) {
  const [filtre, setFiltre] = useState<Filtre>('toutes')
  const [reclamations, setReclamations] = useState<Reclamation[] | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    getReclamations()
      .then(setReclamations)
      .catch(err => setError(getErrorMessage(err)))
  }, [])

  useFocusEffect(load)

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const liste = reclamations?.filter(r => filtre === 'toutes' || r.statut === filtre) ?? []

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={styles.title}>Réclamations</Text>

      <View style={styles.filterRow}>
        {(['toutes', 'nouveau', 'en_cours', 'resolu'] as const).map(value => (
          <Pressable
            key={value}
            style={[styles.filterPill, filtre === value && styles.filterPillActive]}
            onPress={() => setFiltre(value)}
          >
            <Text style={[styles.filterText, filtre === value && styles.filterTextActive]}>
              {value === 'toutes' ? 'Toutes' : STATUT_LABELS[value]}
            </Text>
          </Pressable>
        ))}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {!reclamations ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={liste}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.empty}>Aucune réclamation ici.</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate('ReclamationDetail', { reclamationId: item.id })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.nom_client}</Text>
                <StatutBadge statut={item.statut} />
              </View>
              <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
              <Text style={styles.cardMeta}>
                {item.agence?.nom ?? 'Sans agence précisée'} ·{' '}
                {new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </Text>
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
  filterRow: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 8, flexWrap: 'wrap' },
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
  listContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24, gap: 10 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, flexShrink: 1 },
  cardDescription: { fontSize: 13, color: colors.muted, marginBottom: 8, lineHeight: 18 },
  cardMeta: { fontSize: 11, color: colors.muted },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700' },
})