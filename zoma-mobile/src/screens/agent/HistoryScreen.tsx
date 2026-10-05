// src/screens/agent/HistoryScreen.tsx
import { useCallback, useEffect, useState } from 'react'
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import { ArrowDownCircle, ArrowUpCircle, ChevronRight } from 'lucide-react-native'
import { colors } from '../../theme/colors'
import { getTransactions, getErrorMessage, type Transaction } from '../../lib/api'
import type { AgentTabParamList } from '../../navigation/AgentNavigator'

type TypeFilter = 'tous' | 'depot' | 'retrait'
type Props = Partial<BottomTabScreenProps<AgentTabParamList, 'Historique'>> & {
  base?: '/agent' | '/staff'
  // false quand un en-tête natif est déjà affiché par la pile parente
  // (cas du gérant) — évite un titre en double.
  showHeader?: boolean
}

export function HistoryScreen({ navigation, base = '/agent', showHeader = true }: Props) {
  const [filter, setFilter] = useState<TypeFilter>('tous')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (targetPage: number, mode: 'initial' | 'refresh' | 'more') => {
      if (mode === 'initial') setLoading(true)
      if (mode === 'refresh') setRefreshing(true)
      if (mode === 'more') setLoadingMore(true)
      setError(null)
      try {
        const result = await getTransactions(
          {
            type: filter === 'tous' ? undefined : filter,
            page: targetPage,
          },
          base
        )
        setTransactions(prev => (mode === 'more' ? [...prev, ...result.data] : result.data))
        setPage(result.current_page)
        setLastPage(result.last_page)
      } catch (err) {
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
        setRefreshing(false)
        setLoadingMore(false)
      }
    },
    [filter, base]
  )

  useEffect(() => {
    load(1, 'initial')
  }, [load])

  const onRefresh = () => load(1, 'refresh')
  const onEndReached = () => {
    if (!loadingMore && page < lastPage) load(page + 1, 'more')
  }

  return (
    <SafeAreaView style={styles.screen} edges={showHeader ? ['top'] : []}>
      {showHeader && <Text style={styles.title}>Historique</Text>}

      <View style={styles.filterRow}>
        {(['tous', 'depot', 'retrait'] as const).map(value => (
          <Pressable
            key={value}
            style={[styles.filterPill, filter === value && styles.filterPillActive]}
            onPress={() => setFilter(value)}
          >
            <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>
              {value === 'tous' ? 'Toutes' : value === 'depot' ? 'Dépôts' : 'Retraits'}
            </Text>
          </Pressable>
        ))}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReachedThreshold={0.4}
          onEndReached={onEndReached}
          ListEmptyComponent={<Text style={styles.empty}>Aucune transaction pour l'instant.</Text>}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} color={colors.primary} /> : null}
          renderItem={({ item }) => {
            const demandeId = item.demande?.id
            const peutOuvrir = base === '/agent' && !!demandeId && !!navigation

            return (
              <Pressable
                style={styles.card}
                disabled={!peutOuvrir}
                onPress={() =>
                  peutOuvrir &&
                  navigation!.navigate('Demandes', {
                    screen: 'AgentDemandeDetail',
                    params: { demandeId: demandeId!, retourVersHistorique: true },
                  })
                }
              >
                <View style={[styles.iconBox, item.type === 'depot' ? styles.iconBoxDepot : styles.iconBoxRetrait]}>
                  {item.type === 'depot' ? (
                    <ArrowDownCircle color={colors.primary} size={18} />
                  ) : (
                    <ArrowUpCircle color={colors.danger} size={18} />
                  )}
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{item.plateforme_paris.nom}</Text>
                  <Text style={styles.cardSubtitle}>
                    {item.reseau_mobile_money.nom} ·{' '}
                    {new Date(item.created_at).toLocaleString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <Text style={[styles.cardMontant, item.type === 'depot' ? styles.montantDepot : styles.montantRetrait]}>
                  {item.type === 'retrait' ? '−' : '+'}
                  {item.montant.toLocaleString('fr-FR')}
                </Text>
                {peutOuvrir && <ChevronRight size={16} color={colors.muted} />}
              </Pressable>
            )
          }}
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
  listContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 8 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 40 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 14, padding: 12, gap: 12 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iconBoxDepot: { backgroundColor: '#E6EEFB' },
  iconBoxRetrait: { backgroundColor: '#FBE6E8' },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  cardSubtitle: { fontSize: 12, color: colors.muted, marginTop: 2 },
  cardMontant: { fontSize: 15, fontWeight: '800' },
  montantDepot: { color: colors.primary },
  montantRetrait: { color: colors.danger },
})