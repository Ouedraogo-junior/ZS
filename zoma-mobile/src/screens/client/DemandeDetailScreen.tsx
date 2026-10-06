// src/screens/client/DemandeDetailScreen.tsx
import { useCallback, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useHeaderHeight } from '@react-navigation/elements'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../../theme/colors'
import { ComposeurMessage } from '../../components/ComposeurMessage'
import { NoteVocale } from '../../components/NoteVocale'
import {
  getDemande,
  sendDemandeMessage,
  envoyerNoteVocale,
  getErrorMessage,
  type Demande,
  type DemandeMessage,
} from '../../lib/api'
import type { MesDemandesStackParamList } from '../../navigation/ClientNavigator'

type Props = NativeStackScreenProps<MesDemandesStackParamList, 'DemandeDetail'>

export function DemandeDetailScreen({ route }: Props) {
  const { demandeId } = route.params
  const headerHeight = useHeaderHeight()
  const [demande, setDemande] = useState<Demande | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    getDemande(demandeId)
      .then(setDemande)
      .catch(err => setError(getErrorMessage(err)))
  }, [demandeId])

  useFocusEffect(load)

  const ajouterMessage = (message: DemandeMessage) =>
    setDemande(prev => (prev ? { ...prev, messages: [...(prev.messages ?? []), message] } : prev))

  // Les deux fonctions laissent remonter l'erreur : ComposeurMessage la
  // transmet à setError (via onErreur).
  const envoyerTexte = async (texte: string) => {
    ajouterMessage(await sendDemandeMessage(demandeId, texte))
  }

  const envoyerAudio = async (uri: string, dureeSecondes: number) => {
    ajouterMessage(await envoyerNoteVocale('/client', demandeId, uri, dureeSecondes))
  }

  if (!demande) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  const estValidee = demande.statut === 'validee'

  // Même règle que côté agent : la discussion reste ouverte 24h après
  // validation, pour signaler un souci directement ici avant de passer
  // par une réclamation.
  const UNE_JOURNEE_MS = 24 * 60 * 60 * 1000
  const discussionOuverte =
    !estValidee || Date.now() - new Date(demande.updated_at).getTime() < UNE_JOURNEE_MS

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={headerHeight}
    >
      <View style={styles.summary}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>
            {demande.type === 'depot' ? 'Dépôt' : 'Retrait'} — {demande.plateforme_paris.nom}
          </Text>
          <View style={[styles.badge, estValidee ? styles.badgeValidee : styles.badgeAttente]}>
            <Text style={[styles.badgeText, estValidee ? styles.badgeTextValidee : styles.badgeTextAttente]}>
              {estValidee ? 'Validée' : 'En attente'}
            </Text>
          </View>
        </View>
        <Text style={styles.summaryLine}>{demande.montant.toLocaleString('fr-FR')} F CFA</Text>
        <Text style={styles.summaryMeta}>
          {demande.agence.nom} · {demande.reseau_mobile_money.nom} ·{' '}
          {demande.id_bookmaker ? `ID ${demande.id_bookmaker}` : 'ID envoyé en photo'}
        </Text>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        style={styles.thread}
        contentContainerStyle={styles.threadContent}
        data={demande.messages ?? []}
        keyExtractor={item => String(item.id)}
        ListEmptyComponent={
          <Text style={styles.emptyThread}>
            Un souci, une précision à apporter ? Écrivez un message ci-dessous.
          </Text>
        }
        renderItem={({ item }) => <MessageBubble message={item} demandeId={demandeId} />}
      />

      {!discussionOuverte ? (
        <View style={styles.inputFerme}>
          <Text style={styles.inputFermeText}>
            Demande validée — pour tout souci sur cette transaction, contactez votre agence.
          </Text>
        </View>
      ) : (
        <ComposeurMessage
          onEnvoyerTexte={envoyerTexte}
          onEnvoyerAudio={envoyerAudio}
          onErreur={setError}
        />
      )}
    </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function MessageBubble({ message, demandeId }: { message: DemandeMessage; demandeId: number }) {
  const estClient = message.auteur_type === 'client'
  return (
    <View style={[styles.bubbleRow, estClient ? styles.bubbleRowClient : styles.bubbleRowAgent]}>
      <View style={[styles.bubble, estClient ? styles.bubbleClient : styles.bubbleAgent]}>
        {message.has_audio && (
          <NoteVocale
            base="/client"
            demandeId={demandeId}
            messageId={message.id}
            dureeSecondes={message.audio_duree}
            surFondSombre={estClient}
          />
        )}
        {!!message.message && (
          <Text style={[estClient ? styles.bubbleTextClient : styles.bubbleTextAgent, message.has_audio && { marginTop: 8 }]}>
            {message.message}
          </Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  summary: { backgroundColor: colors.white, padding: 18, borderBottomWidth: 1, borderBottomColor: colors.border },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: colors.text, flexShrink: 1 },
  summaryLine: { fontSize: 20, fontWeight: '800', color: colors.primary, marginBottom: 4 },
  summaryMeta: { fontSize: 12, color: colors.muted },
  error: {
    color: colors.danger,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 10,
    margin: 12,
    textAlign: 'center',
  },
  thread: { flex: 1 },
  threadContent: { padding: 16, gap: 10, flexGrow: 1 },
  emptyThread: { color: colors.muted, textAlign: 'center', marginTop: 24, paddingHorizontal: 24 },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowClient: { justifyContent: 'flex-end' },
  bubbleRowAgent: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleClient: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleAgent: { backgroundColor: colors.white, borderBottomLeftRadius: 4 },
  bubbleTextClient: { color: colors.white, fontSize: 14 },
  bubbleTextAgent: { color: colors.text, fontSize: 14 },
  inputFerme: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputFermeText: { fontSize: 12, color: colors.muted, textAlign: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeAttente: { backgroundColor: '#FEF3C7' },
  badgeValidee: { backgroundColor: '#D1FAE5' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeTextAttente: { color: '#B45309' },
  badgeTextValidee: { color: '#047857' },
})