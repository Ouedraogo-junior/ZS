// src/screens/gerant/GerantDashboardScreen.tsx
import { useCallback, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { ArrowDownCircle, ArrowUpCircle, Receipt, Users, MessageSquareWarning } from 'lucide-react-native'
import { colors } from '../../theme/colors'
import { getGerantDashboard, getErrorMessage, type GerantDashboard } from '../../lib/api'

function joursCourts(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short' })
}

export function GerantDashboardScreen() {
  const [data, setData] = useState<GerantDashboard | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    getGerantDashboard()
      .then(setData)
      .catch(err => setError(getErrorMessage(err)))
  }, [])

  useFocusEffect(load)

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    )
  }

  const maxTendance = Math.max(...data.tendance_7_jours.map(j => Math.max(j.depots, j.retraits)), 1)

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={styles.title}>Tableau de bord</Text>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: '#E6EEFB' }]}>
              <ArrowDownCircle color={colors.primary} size={18} />
            </View>
            <Text style={[styles.kpiValue, { color: colors.primary }]}>
              {data.volume_depots_jour.toLocaleString('fr-FR')}
            </Text>
            <Text style={styles.kpiLabel}>Dépôts du jour</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: '#FBE6E8' }]}>
              <ArrowUpCircle color={colors.danger} size={18} />
            </View>
            <Text style={[styles.kpiValue, { color: colors.danger }]}>
              {data.volume_retraits_jour.toLocaleString('fr-FR')}
            </Text>
            <Text style={styles.kpiLabel}>Retraits du jour</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: '#E6F0FB' }]}>
              <Receipt color={colors.secondary} size={18} />
            </View>
            <Text style={styles.kpiValue}>{data.transactions_jour}</Text>
            <Text style={styles.kpiLabel}>Transactions</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: '#E7F8EF' }]}>
              <Users color={colors.success} size={18} />
            </View>
            <Text style={styles.kpiValue}>
              {data.agents_actifs}
              <Text style={styles.kpiValueMuted}> / {data.agents_total}</Text>
            </Text>
            <Text style={styles.kpiLabel}>Agents actifs</Text>
          </View>

          <View style={[styles.kpiCard, styles.kpiCardWide]}>
            <View style={[styles.kpiIcon, { backgroundColor: '#FEF3C7' }]}>
              <MessageSquareWarning color="#B45309" size={18} />
            </View>
            <Text style={styles.kpiValue}>{data.reclamations_en_attente}</Text>
            <Text style={styles.kpiLabel}>Réclamations en attente</Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Activité des 7 derniers jours</Text>
          <View style={styles.chartBars}>
            {data.tendance_7_jours.map(jour => (
              <View key={jour.date} style={styles.chartBarColumn}>
                <View style={styles.chartBarGroup}>
                  <View style={[styles.bar, styles.barDepot, { height: `${(jour.depots / maxTendance) * 100}%` }]} />
                  <View style={[styles.bar, styles.barRetrait, { height: `${(jour.retraits / maxTendance) * 100}%` }]} />
                </View>
                <Text style={styles.chartBarLabel}>{joursCourts(jour.date)}</Text>
              </View>
            ))}
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.legendText}>Dépôts</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
              <Text style={styles.legendText}>Retraits</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
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
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  error: {
    color: colors.danger,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 10,
    textAlign: 'center',
  },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: { width: '47%', backgroundColor: colors.white, borderRadius: 16, padding: 14 },
  kpiCardWide: { width: '100%' },
  kpiIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  kpiValue: { fontSize: 20, fontWeight: '800', color: colors.text },
  kpiValueMuted: { fontSize: 14, fontWeight: '600', color: colors.muted },
  kpiLabel: { fontSize: 12, color: colors.muted, marginTop: 4 },
  chartCard: { backgroundColor: colors.white, borderRadius: 16, padding: 16 },
  chartTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 16 },
  chartBars: { flexDirection: 'row', height: 140, alignItems: 'flex-end', justifyContent: 'space-between' },
  chartBarColumn: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  chartBarGroup: { flexDirection: 'row', gap: 3, alignItems: 'flex-end', height: '100%' },
  bar: { width: 8, borderRadius: 3, minHeight: 2 },
  barDepot: { backgroundColor: colors.primary },
  barRetrait: { backgroundColor: colors.danger },
  chartBarLabel: { fontSize: 10, color: colors.muted, marginTop: 6, textTransform: 'capitalize' },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: colors.muted },
})