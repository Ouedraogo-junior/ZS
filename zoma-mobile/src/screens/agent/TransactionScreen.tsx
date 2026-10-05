// src/screens/agent/TransactionScreen.tsx
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
import { SelectField } from '../../components/SelectField'
import {
  getReseauxMobileMoney,
  getPlateformesParis,
  submitTransaction,
  getErrorMessage,
  type ReferenceItem,
} from '../../lib/api'

interface TransactionScreenProps {
  base?: '/agent' | '/staff'
  // false quand un en-tête natif (avec bouton retour) est déjà affiché
  // par la pile parente — évite un titre en double (cas du gérant).
  showHeader?: boolean
}

export function TransactionScreen({ base = '/agent', showHeader = true }: TransactionScreenProps) {
  const [reseaux, setReseaux] = useState<ReferenceItem[]>([])
  const [plateformes, setPlateformes] = useState<ReferenceItem[]>([])
  const [loadingRef, setLoadingRef] = useState(true)

  const [type, setType] = useState<'depot' | 'retrait'>('depot')
  const [reseauId, setReseauId] = useState<number | null>(null)
  const [plateformeId, setPlateformeId] = useState<number | null>(null)
  const [montant, setMontant] = useState('')
  const [telephoneClient, setTelephoneClient] = useState('')
  const [referencePaiement, setReferencePaiement] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    Promise.all([getReseauxMobileMoney(), getPlateformesParis()])
      .then(([r, p]) => {
        setReseaux(r)
        setPlateformes(p)
      })
      .catch(err => setError(getErrorMessage(err)))
      .finally(() => setLoadingRef(false))
  }, [])

  const montantNombre = parseInt(montant, 10)
  const canSubmit =
    reseauId !== null &&
    plateformeId !== null &&
    montantNombre > 0 &&
    telephoneClient.trim().length >= 8 &&
    !submitting

  const resetForm = () => {
    setReseauId(null)
    setPlateformeId(null)
    setMontant('')
    setTelephoneClient('')
    setReferencePaiement('')
  }

  const handleSubmit = async () => {
    if (!canSubmit || reseauId === null || plateformeId === null) return
    setSubmitting(true)
    setError(null)
    try {
      await submitTransaction(
        {
          type,
          reseau_mobile_money_id: reseauId,
          plateforme_paris_id: plateformeId,
          montant: montantNombre,
          telephone_client: telephoneClient.trim(),
          reference_paiement: referencePaiement.trim() || undefined,
        },
        base
      )
      resetForm()
      setSuccess(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingRef) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    )
  }

  if (success) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <CheckCircle2 color={colors.success} size={48} style={{ marginBottom: 16 }} />
        <Text style={styles.successTitle}>Transaction enregistrée</Text>
        <Pressable style={styles.button} onPress={() => setSuccess(false)}>
          <Text style={styles.buttonText}>Nouvelle transaction</Text>
        </Pressable>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.screen} edges={showHeader ? ['top'] : []}>
      {showHeader && <Text style={styles.title}>Nouvelle transaction</Text>}

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {error && <Text style={styles.error}>{error}</Text>}

          <Text style={styles.label}>Type</Text>
          <View style={styles.typeRow}>
            <Pressable
              style={[styles.typeButton, type === 'depot' && styles.typeButtonActive]}
              onPress={() => setType('depot')}
            >
              <Text style={[styles.typeButtonText, type === 'depot' && styles.typeButtonTextActive]}>Dépôt</Text>
            </Pressable>
            <Pressable
              style={[styles.typeButton, type === 'retrait' && styles.typeButtonActive]}
              onPress={() => setType('retrait')}
            >
              <Text style={[styles.typeButtonText, type === 'retrait' && styles.typeButtonTextActive]}>
                Retrait
              </Text>
            </Pressable>
          </View>

          <SelectField
            label="Réseau mobile money"
            placeholder="Choisir un réseau"
            value={reseauId}
            options={reseaux.map(r => ({ id: r.id, label: r.nom }))}
            onChange={setReseauId}
          />

          <SelectField
            label="Plateforme de paris"
            placeholder="Choisir une plateforme"
            value={plateformeId}
            options={plateformes.map(p => ({ id: p.id, label: p.nom }))}
            onChange={setPlateformeId}
          />

          <Text style={styles.label}>Montant (F CFA)</Text>
          <TextInput
            style={styles.input}
            value={montant}
            onChangeText={text => setMontant(text.replace(/\D/g, ''))}
            placeholder="10000"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
          />

          <Text style={styles.label}>Téléphone du client</Text>
          <TextInput
            style={styles.input}
            value={telephoneClient}
            onChangeText={setTelephoneClient}
            placeholder="07 00 00 00 00"
            placeholderTextColor={colors.muted}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Référence de paiement (optionnel)</Text>
          <TextInput
            style={styles.input}
            value={referencePaiement}
            onChangeText={setReferencePaiement}
            placeholder="REF123456"
            placeholderTextColor={colors.muted}
          />

          <Pressable
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>Enregistrer la transaction</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: 20, paddingBottom: 48 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, padding: 24 },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  error: {
    color: colors.danger,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    textAlign: 'center',
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 6, marginTop: 2 },
  input: {
    height: 50,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 18,
  },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  typeButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeButtonActive: { backgroundColor: colors.primary },
  typeButtonText: { fontWeight: '700', color: colors.text },
  typeButtonTextActive: { color: colors.white },
  button: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  successTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 24 },
})