// src/screens/agent/HandoverScreen.tsx
import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CheckCircle2 } from 'lucide-react-native'
import { colors } from '../../theme/colors'
import {
  prepareReleve,
  submitReleve,
  getErrorMessage,
  type ReleveNetworkPreparation,
  type Releve,
} from '../../lib/api'

export function HandoverScreen() {
  const [reseaux, setReseaux] = useState<ReleveNetworkPreparation[] | null>(null)
  const [soldesReels, setSoldesReels] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultat, setResultat] = useState<Releve[] | null>(null)

  useEffect(() => {
    load()
  }, [])

  const load = () => {
    setLoading(true)
    setError(null)
    prepareReleve()
      .then(data => setReseaux(data.reseaux))
      .catch(err => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }

  const canSubmit =
    reseaux !== null &&
    reseaux.length > 0 &&
    reseaux.every(r => soldesReels[r.reseau_mobile_money_id]?.trim()) &&
    !submitting

  const handleSubmit = async () => {
    if (!canSubmit || !reseaux) return
    setSubmitting(true)
    setError(null)
    try {
      const data = await submitReleve(
        reseaux.map(r => ({
          reseau_mobile_money_id: r.reseau_mobile_money_id,
          solde_reel: parseInt(soldesReels[r.reseau_mobile_money_id] ?? '0', 10),
        }))
      )
      setResultat(data.releves)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const recommencer = () => {
    setResultat(null)
    setSoldesReels({})
    load()
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    )
  }

  if (resultat) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.centered}>
          <CheckCircle2 color={colors.success} size={48} style={{ marginBottom: 16 }} />
          <Text style={styles.successTitle}>Relève enregistrée</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          {resultat.map(releve => (
            <View key={releve.id} style={styles.card}>
              <Text style={styles.cardTitle}>{releve.reseau_mobile_money.nom}</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Solde théorique</Text>
                <Text style={styles.rowValue}>{releve.solde_theorique.toLocaleString('fr-FR')}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Solde réel</Text>
                <Text style={styles.rowValue}>{releve.solde_reel.toLocaleString('fr-FR')}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Écart</Text>
                <Text style={[styles.rowValue, releve.ecart === 0 ? styles.ecartNul : styles.ecartNonNul]}>
                  {releve.ecart > 0 ? '+' : ''}
                  {releve.ecart.toLocaleString('fr-FR')}
                </Text>
              </View>
            </View>
          ))}
          <Pressable style={styles.button} onPress={recommencer}>
            <Text style={styles.buttonText}>Nouvelle relève</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={styles.title}>Relève d'équipe</Text>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {error && <Text style={styles.error}>{error}</Text>}

          {reseaux?.length === 0 && (
            <Text style={styles.empty}>Aucun réseau configuré pour l'instant.</Text>
          )}

          {reseaux?.map(reseau => {
            const soldeReelTexte = soldesReels[reseau.reseau_mobile_money_id] ?? ''
            const soldeReelNombre = parseInt(soldeReelTexte, 10)
            const ecart = !isNaN(soldeReelNombre) ? soldeReelNombre - reseau.solde_theorique : null

            return (
              <View key={reseau.reseau_mobile_money_id} style={styles.card}>
                <Text style={styles.cardTitle}>{reseau.reseau}</Text>

                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Dépôts</Text>
                  <Text style={styles.rowValue}>{reseau.depots.toLocaleString('fr-FR')}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Retraits</Text>
                  <Text style={styles.rowValue}>{reseau.retraits.toLocaleString('fr-FR')}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Solde théorique</Text>
                  <Text style={[styles.rowValue, styles.soldeTheorique]}>
                    {reseau.solde_theorique.toLocaleString('fr-FR')}
                  </Text>
                </View>

                <Text style={styles.label}>Solde réel compté</Text>
                <TextInput
                  style={styles.input}
                  value={soldeReelTexte}
                  onChangeText={text =>
                    setSoldesReels(prev => ({ ...prev, [reseau.reseau_mobile_money_id]: text.replace(/\D/g, '') }))
                  }
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                />

                {ecart !== null && (
                  <Text style={[styles.ecartText, ecart === 0 ? styles.ecartNul : styles.ecartNonNul]}>
                    Écart : {ecart > 0 ? '+' : ''}
                    {ecart.toLocaleString('fr-FR')}
                  </Text>
                )}
              </View>
            )
          })}

          <Pressable style={[styles.button, !canSubmit && styles.buttonDisabled]} onPress={handleSubmit} disabled={!canSubmit}>
            {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Valider la relève</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { padding: 20, paddingBottom: 48, gap: 16 },
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
    textAlign: 'center',
  },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 24 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  rowLabel: { fontSize: 13, color: colors.muted },
  rowValue: { fontSize: 13, fontWeight: '700', color: colors.text },
  soldeTheorique: { color: colors.primary, fontSize: 14 },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted, marginTop: 10, marginBottom: 6 },
  input: {
    height: 46,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.text,
  },
  ecartText: { fontSize: 13, fontWeight: '700', marginTop: 8, textAlign: 'right' },
  ecartNul: { color: colors.success },
  ecartNonNul: { color: colors.danger },
  button: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  successTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
})