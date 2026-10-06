// src/screens/gerant/ReclamationDetailScreen.tsx
import { useCallback, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useHeaderHeight } from '@react-navigation/elements'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MessageCircle } from 'lucide-react-native'
import { colors } from '../../theme/colors'
import { versNumeroWhatsApp } from '../../lib/phone'
import {
  getReclamation,
  prendreEnCharge,
  updateReclamationStatut,
  sendReclamationMessage,
  getErrorMessage,
  type Reclamation,
  type ReclamationStatut,
} from '../../lib/api'
import type { ReclamationsStackParamList } from '../../navigation/ReclamationsTypes'

type Props = NativeStackScreenProps<ReclamationsStackParamList, 'ReclamationDetail'>

const STATUTS: ReclamationStatut[] = ['nouveau', 'en_cours', 'resolu']
const STATUT_LABELS: Record<ReclamationStatut, string> = {
  nouveau: 'Nouveau',
  en_cours: 'En cours',
  resolu: 'Résolu',
}

export function ReclamationDetailScreen({ route }: Props) {
  const { reclamationId } = route.params
  const headerHeight = useHeaderHeight()
  const [reclamation, setReclamation] = useState<Reclamation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [texte, setTexte] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [actionEnCours, setActionEnCours] = useState(false)

  const load = useCallback(() => {
    getReclamation(reclamationId)
      .then(setReclamation)
      .catch(err => setError(getErrorMessage(err)))
  }, [reclamationId])

  useFocusEffect(load)

  const ouvrirWhatsApp = () => {
    if (!reclamation) return
    const numero = versNumeroWhatsApp(reclamation.contact_client)
    const texteMessage = `Bonjour ${reclamation.nom_client}, je vous contacte au sujet de votre réclamation.`
    Linking.openURL(`https://wa.me/${numero}?text=${encodeURIComponent(texteMessage)}`)
  }

  const handlePrendreEnCharge = async () => {
    setActionEnCours(true)
    setError(null)
    try {
      const updated = await prendreEnCharge(reclamationId)
      setReclamation(prev => (prev ? { ...prev, ...updated } : updated))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setActionEnCours(false)
    }
  }

  const changerStatut = async (statut: ReclamationStatut) => {
    setActionEnCours(true)
    setError(null)
    try {
      const updated = await updateReclamationStatut(reclamationId, statut)
      setReclamation(prev => (prev ? { ...prev, ...updated } : updated))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setActionEnCours(false)
    }
  }

  const envoyerNote = async () => {
    if (!texte.trim() || envoi) return
    setEnvoi(true)
    try {
      const message = await sendReclamationMessage(reclamationId, texte.trim())
      setTexte('')
      setReclamation(prev => (prev ? { ...prev, messages: [...(prev.messages ?? []), message] } : prev))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setEnvoi(false)
    }
  }

  if (!reclamation) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.summary}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>{reclamation.nom_client}</Text>
            <Pressable style={styles.whatsappButton} onPress={ouvrirWhatsApp}>
              <MessageCircle color={colors.white} size={16} />
            </Pressable>
          </View>
          <Text style={styles.contact}>{reclamation.contact_client}</Text>
          <Text style={styles.description}>{reclamation.description}</Text>

          {reclamation.reference_transaction && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Référence</Text>
              <Text style={styles.infoValue}>{reclamation.reference_transaction}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Agence</Text>
            <Text style={styles.infoValue}>{reclamation.agence?.nom ?? 'Non précisée'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Prise en charge par</Text>
            <Text style={styles.infoValue}>{reclamation.assigne_a?.nom ?? 'Personne pour l\'instant'}</Text>
          </View>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {!reclamation.assigne_a_id && (
          <Pressable style={styles.primaryButton} onPress={handlePrendreEnCharge} disabled={actionEnCours}>
            {actionEnCours ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryButtonText}>Prendre en charge</Text>}
          </Pressable>
        )}

        <View style={styles.statutRow}>
          {STATUTS.map(statut => (
            <Pressable
              key={statut}
              style={[styles.statutPill, reclamation.statut === statut && styles.statutPillActive]}
              onPress={() => changerStatut(statut)}
              disabled={actionEnCours || reclamation.statut === statut}
            >
              <Text style={[styles.statutPillText, reclamation.statut === statut && styles.statutPillTextActive]}>
                {STATUT_LABELS[statut]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.notesTitle}>Notes internes</Text>
        {(reclamation.messages ?? []).length === 0 && (
          <Text style={styles.emptyNotes}>Aucune note pour l'instant.</Text>
        )}
        {(reclamation.messages ?? []).map(message => (
          <View key={message.id} style={styles.noteCard}>
            <View style={styles.noteHeader}>
              <Text style={styles.noteAuteur}>{message.auteur?.nom ?? 'Équipe'}</Text>
              <Text style={styles.noteDate}>
                {new Date(message.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <Text style={styles.noteText}>{message.message}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={texte}
          onChangeText={setTexte}
          placeholder="Ajouter une note..."
          placeholderTextColor={colors.muted}
          multiline
        />
        <Pressable style={styles.sendButton} onPress={envoyerNote} disabled={envoi || !texte.trim()}>
          <Text style={styles.sendButtonText}>{envoi ? '...' : 'Ajouter'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 24, gap: 14 },
  summary: { backgroundColor: colors.white, borderRadius: 16, padding: 16 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  whatsappButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contact: { fontSize: 13, color: colors.secondary, fontWeight: '600', marginTop: 2, marginBottom: 10 },
  description: { fontSize: 14, color: colors.text, lineHeight: 20, marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  infoLabel: { fontSize: 13, color: colors.muted },
  infoValue: { fontSize: 13, fontWeight: '700', color: colors.text },
  error: {
    color: colors.danger,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 10,
    textAlign: 'center',
  },
  primaryButton: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  primaryButtonText: { color: colors.white, fontWeight: '700' },
  statutRow: { flexDirection: 'row', gap: 8 },
  statutPill: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.white, alignItems: 'center' },
  statutPillActive: { backgroundColor: colors.primary },
  statutPillText: { fontSize: 12, fontWeight: '700', color: colors.muted },
  statutPillTextActive: { color: colors.white },
  notesTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 6 },
  emptyNotes: { color: colors.muted, fontSize: 13 },
  noteCard: { backgroundColor: colors.white, borderRadius: 12, padding: 12 },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  noteAuteur: { fontSize: 12, fontWeight: '700', color: colors.primary },
  noteDate: { fontSize: 11, color: colors.muted },
  noteText: { fontSize: 13, color: colors.text, lineHeight: 18 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  sendButton: { backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12 },
  sendButtonText: { color: colors.white, fontWeight: '700', fontSize: 14 },
})