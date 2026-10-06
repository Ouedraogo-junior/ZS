// src/screens/agent/AgentDemandeDetailScreen.tsx
import { useCallback, useLayoutEffect, useState } from 'react'
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
  Alert,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useHeaderHeight, HeaderBackButton } from '@react-navigation/elements'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AlertTriangle, Copy, Check } from 'lucide-react-native'
import * as Clipboard from 'expo-clipboard'
import { colors } from '../../theme/colors'
import { ProtectedImage } from '../../components/ProtectedImage'
import {
  getAgentDemande,
  validerDemande,
  sendAgentDemandeMessage,
  fetchDemandeImageDataUri,
  getErrorMessage,
  type AgentDemande,
  type DemandeMessage,
  type DemandesBase,
} from '../../lib/api'
import type { AgentDemandesStackParamList } from '../../navigation/AgentDemandesTypes'

// base permet de réutiliser cet écran pour le gérant ("/staff") et
// l'admin ("/admin") — voir AgentDemandesListScreen pour le même principe.
type Props = NativeStackScreenProps<AgentDemandesStackParamList, 'AgentDemandeDetail'> & { base?: DemandesBase }

export function AgentDemandeDetailScreen({ route, navigation, base = '/agent' }: Props) {
  const { demandeId, retourVersHistorique } = route.params
  const headerHeight = useHeaderHeight()

  // Atteint depuis l'onglet Historique (navigation croisée) : le bouton
  // retour natif ramènerait vers la liste des demandes (la pile sur
  // laquelle cet écran a été empilé), pas vers l'historique d'où
  // l'agent vient réellement — on personnalise donc son comportement.
  useLayoutEffect(() => {
    if (retourVersHistorique) {
      navigation.setOptions({
        headerLeft: () => (
          <HeaderBackButton
            tintColor={colors.primary}
            onPress={() => navigation.getParent()?.navigate('Historique')}
          />
        ),
      })
    }
  }, [retourVersHistorique, navigation])
  const [demande, setDemande] = useState<AgentDemande | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [texte, setTexte] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [validation, setValidation] = useState(false)
  const [champCopie, setChampCopie] = useState<string | null>(null)

  const copier = async (champ: string, valeur: string) => {
    await Clipboard.setStringAsync(valeur)
    setChampCopie(champ)
    setTimeout(() => setChampCopie(null), 1500)
  }

  const load = useCallback(() => {
    getAgentDemande(demandeId, base)
      .then(setDemande)
      .catch(err => setError(getErrorMessage(err)))
  }, [demandeId, base])

  useFocusEffect(load)

  // Chargeurs stables (useCallback) : ProtectedImage relance le
  // téléchargement si leur référence change.
  const chargerPreuve = useCallback(
    () => fetchDemandeImageDataUri(demandeId, 'preuve', base),
    [demandeId, base]
  )
  const chargerIdCapture = useCallback(
    () => fetchDemandeImageDataUri(demandeId, 'id-capture', base),
    [demandeId, base]
  )

  const envoyerMessage = async () => {
    if (!texte.trim() || envoi) return
    setEnvoi(true)
    try {
      const message = await sendAgentDemandeMessage(demandeId, texte.trim(), base)
      setTexte('')
      setDemande(prev => (prev ? { ...prev, messages: [...(prev.messages ?? []), message] } : prev))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setEnvoi(false)
    }
  }

  const confirmerValidation = () => {
    if (!demande) return
    const message =
      demande.type === 'retrait'
        ? "Vérifiez l'identité du client avant d'envoyer les fonds. Confirmer la validation ?"
        : 'Confirmer la validation de cette demande ?'
    Alert.alert('Valider la demande', message, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Valider', style: 'default', onPress: lancerValidation },
    ])
  }

  const lancerValidation = async () => {
    setValidation(true)
    setError(null)
    try {
      const data = await validerDemande(demandeId, base)
      setDemande(data.demande)
    } catch (err) {
      setError(getErrorMessage(err))
      // Si un autre agent a validé entre-temps (409), le bouton
      // "Valider" ne doit pas rester affiché comme si de rien n'était —
      // on recharge pour refléter le vrai statut.
      load()
    } finally {
      setValidation(false)
    }
  }

  if (!demande) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  const estEnAttente = demande.statut === 'en_attente'

  // La discussion reste ouverte 24h après validation — le temps pour
  // le client de signaler un souci directement ici, sans repasser par
  // une réclamation, avant que le fil ne se ferme définitivement.
  const UNE_JOURNEE_MS = 24 * 60 * 60 * 1000
  const discussionOuverte =
    estEnAttente || Date.now() - new Date(demande.updated_at).getTime() < UNE_JOURNEE_MS

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>
            {demande.type === 'depot' ? 'Dépôt' : 'Retrait'} — {demande.plateforme_paris.nom}
          </Text>
          <Text style={styles.summaryMontant}>{demande.montant.toLocaleString('fr-FR')} F CFA</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Agence</Text>
            <Text style={styles.infoValue}>{demande.agence.nom}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Client</Text>
            <Text style={styles.infoValue}>{demande.client.nom}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Téléphone</Text>
            <Text style={styles.infoValue}>{demande.client.telephone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Réseau</Text>
            <Text style={styles.infoValue}>{demande.reseau_mobile_money.nom}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID bookmaker</Text>
            {demande.id_bookmaker ? (
              <Pressable style={styles.copyableValue} onPress={() => copier('id_bookmaker', demande.id_bookmaker!)}>
                <Text style={styles.infoValue}>{demande.id_bookmaker}</Text>
                {champCopie === 'id_bookmaker' ? (
                  <Check size={15} color={colors.success} />
                ) : (
                  <Copy size={15} color={colors.secondary} />
                )}
              </Pressable>
            ) : (
              <Text style={styles.infoValue}>En photo, ci-dessous</Text>
            )}
          </View>
          {demande.telephone_mobile_money && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Numéro pour les fonds</Text>
              <Pressable
                style={styles.copyableValue}
                onPress={() => copier('telephone_mobile_money', demande.telephone_mobile_money!)}
              >
                <Text style={styles.infoValue}>{demande.telephone_mobile_money}</Text>
                {champCopie === 'telephone_mobile_money' ? (
                  <Check size={15} color={colors.success} />
                ) : (
                  <Copy size={15} color={colors.secondary} />
                )}
              </Pressable>
            </View>
          )}
        </View>

        {demande.id_bookmaker_capture && (
          <ProtectedImage label="Capture de l'ID bookmaker" charger={chargerIdCapture} />
        )}

        {demande.preuve_paiement && (
          <ProtectedImage label="Preuve de paiement" charger={chargerPreuve} />
        )}

        {demande.type === 'retrait' && estEnAttente && (
          <View style={styles.warningBox}>
            <AlertTriangle color="#B45309" size={18} />
            <Text style={styles.warningText}>
              Vérifiez l'identité du client avant d'envoyer les fonds.
            </Text>
          </View>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        {!estEnAttente && (demande.agent || demande.user) && (
          <View style={styles.summary}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Traitée par</Text>
              <Text style={styles.infoValue}>{demande.agent?.nom ?? demande.user?.nom}</Text>
            </View>
          </View>
        )}

        {estEnAttente ? (
          <Pressable style={styles.validerButton} onPress={confirmerValidation} disabled={validation}>
            {validation ? <ActivityIndicator color={colors.white} /> : <Text style={styles.validerText}>Valider la demande</Text>}
          </Pressable>
        ) : (
          <View style={styles.valideeBadge}>
            <Text style={styles.valideeBadgeText}>Demande déjà validée</Text>
          </View>
        )}

        <Text style={styles.threadTitle}>Messages</Text>
        {(demande.messages ?? []).length === 0 && (
          <Text style={styles.emptyThread}>Aucun message pour l'instant.</Text>
        )}
        {(demande.messages ?? []).map((message: DemandeMessage) => {
          // 'agent' et 'gerant' sont tous deux "côté staff" — même
          // alignement, peu importe lequel des deux a écrit.
          const cotePersonnel = message.auteur_type !== 'client'
          return (
            <View key={message.id} style={[styles.bubbleRow, cotePersonnel ? styles.bubbleRowAgent : styles.bubbleRowClient]}>
              <View style={[styles.bubble, cotePersonnel ? styles.bubbleAgent : styles.bubbleClient]}>
                <Text style={cotePersonnel ? styles.bubbleTextAgent : styles.bubbleTextClient}>{message.message}</Text>
              </View>
            </View>
          )
        })}
      </ScrollView>

      {discussionOuverte ? (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={texte}
            onChangeText={setTexte}
            placeholder="Écrire un message..."
            placeholderTextColor={colors.muted}
            multiline
          />
          <Pressable style={styles.sendButton} onPress={envoyerMessage} disabled={envoi || !texte.trim()}>
            <Text style={styles.sendButtonText}>{envoi ? '...' : 'Envoyer'}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.inputFerme}>
          <Text style={styles.inputFermeText}>
            Demande validée — pour tout souci sur cette transaction, passez par une réclamation.
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 24, gap: 14 },
  summary: { backgroundColor: colors.white, borderRadius: 16, padding: 16 },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 2 },
  summaryMontant: { fontSize: 22, fontWeight: '800', color: colors.primary, marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  infoLabel: { fontSize: 13, color: colors.muted },
  infoValue: { fontSize: 13, fontWeight: '700', color: colors.text },
  copyableValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
  },
  warningText: { flex: 1, fontSize: 13, color: '#92400E', fontWeight: '600' },
  error: {
    color: colors.danger,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 10,
    textAlign: 'center',
  },
  validerButton: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  validerText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  valideeBadge: { backgroundColor: '#D1FAE5', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  valideeBadgeText: { color: '#047857', fontWeight: '700' },
  threadTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 6 },
  emptyThread: { color: colors.muted, fontSize: 13 },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowAgent: { justifyContent: 'flex-end' },
  bubbleRowClient: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleAgent: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleClient: { backgroundColor: colors.white, borderBottomLeftRadius: 4 },
  bubbleTextAgent: { color: colors.white, fontSize: 14 },
  bubbleTextClient: { color: colors.text, fontSize: 14 },
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
  inputFerme: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputFermeText: { fontSize: 12, color: colors.muted, textAlign: 'center' },
})