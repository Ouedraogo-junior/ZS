// src/components/ComposeurMessage.tsx
//
// Zone de saisie d'une conversation : texte OU note vocale.
//
// Sans texte saisi, un bouton micro remplace le bouton "Envoyer" (comme
// WhatsApp) — une icône se comprend sans savoir lire. Un appui démarre
// l'enregistrement ; on peut alors l'annuler (corbeille) ou l'envoyer.
// À la durée maximale, l'enregistrement s'arrête et part automatiquement.
import { useEffect, useRef, useState } from 'react'
import { View, Text, TextInput, Pressable, ActivityIndicator, Keyboard, StyleSheet } from 'react-native'
import { Mic, Trash2, Send } from 'lucide-react-native'
import {
  useAudioRecorder,
  useAudioRecorderState,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio'
import { colors } from '../theme/colors'
import { getErrorMessage } from '../lib/api'
import {
  DUREE_MAX_NOTE_VOCALE,
  DUREE_MIN_NOTE_VOCALE_MS,
  OPTIONS_NOTE_VOCALE,
  formaterDuree,
} from '../lib/noteVocale'

interface Props {
  placeholder?: string
  /** Doit rejeter (throw) en cas d'échec — le message d'erreur est alors remonté via onErreur. */
  onEnvoyerTexte: (texte: string) => Promise<void>
  onEnvoyerAudio: (uri: string, dureeSecondes: number) => Promise<void>
  onErreur: (message: string) => void
}

export function ComposeurMessage({
  placeholder = 'Écrire un message...',
  onEnvoyerTexte,
  onEnvoyerAudio,
  onErreur,
}: Props) {
  const recorder = useAudioRecorder(OPTIONS_NOTE_VOCALE)
  const etat = useAudioRecorderState(recorder, 250)

  const [texte, setTexte] = useState('')
  const [enregistre, setEnregistre] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  // Empêche un double envoi (appui sur "envoyer" au moment même où
  // l'arrêt automatique à la durée maximale se déclenche).
  const termineRef = useRef(false)

  const envoyerTexte = async () => {
    const contenu = texte.trim()
    if (!contenu || envoi) return
    setEnvoi(true)
    try {
      await onEnvoyerTexte(contenu)
      setTexte('')
    } catch (err) {
      onErreur(getErrorMessage(err))
    } finally {
      setEnvoi(false)
    }
  }

  const demarrerEnregistrement = async () => {
    if (envoi) return
    try {
      const permission = await requestRecordingPermissionsAsync()
      if (!permission.granted) {
        onErreur("Autorisez l'accès au micro pour envoyer une note vocale.")
        return
      }
      Keyboard.dismiss()
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true })
      await recorder.prepareToRecordAsync()
      termineRef.current = false
      recorder.record()
      setEnregistre(true)
    } catch {
      onErreur("Impossible de démarrer l'enregistrement.")
    }
  }

  const terminerEnregistrement = async (envoyer: boolean) => {
    if (termineRef.current) return
    termineRef.current = true

    // La durée se lit AVANT l'arrêt : elle est remise à zéro ensuite.
    const dureeMs = recorder.getStatus().durationMillis
    setEnregistre(false)

    try {
      await recorder.stop()
    } catch {
      // Rien à arrêter : l'enregistrement n'avait pas vraiment démarré.
    }
    await setAudioModeAsync({ allowsRecording: false }).catch(() => {})

    const uri = recorder.uri
    if (!envoyer || !uri) return
    // Enregistrement trop court : appui accidentel, on le jette.
    if (dureeMs < DUREE_MIN_NOTE_VOCALE_MS) return

    setEnvoi(true)
    try {
      await onEnvoyerAudio(uri, Math.max(1, Math.round(dureeMs / 1000)))
    } catch (err) {
      onErreur(getErrorMessage(err))
    } finally {
      setEnvoi(false)
    }
  }

  // Arrêt et envoi automatiques à la durée maximale.
  useEffect(() => {
    if (enregistre && etat.durationMillis >= DUREE_MAX_NOTE_VOCALE * 1000) {
      terminerEnregistrement(true)
    }
  }, [enregistre, etat.durationMillis])

  if (enregistre) {
    return (
      <View style={styles.ligne}>
        <View style={styles.pointRouge} />
        <Text style={styles.chrono}>
          {formaterDuree(etat.durationMillis / 1000)} / {formaterDuree(DUREE_MAX_NOTE_VOCALE)}
        </Text>
        <View style={{ flex: 1 }} />
        <Pressable
          style={[styles.boutonRond, styles.boutonAnnuler]}
          onPress={() => terminerEnregistrement(false)}
          accessibilityLabel="Annuler l'enregistrement"
        >
          <Trash2 size={20} color={colors.danger} />
        </Pressable>
        <Pressable
          style={[styles.boutonRond, styles.boutonEnvoyer]}
          onPress={() => terminerEnregistrement(true)}
          accessibilityLabel="Envoyer la note vocale"
        >
          <Send size={20} color={colors.white} />
        </Pressable>
      </View>
    )
  }

  const peutEnvoyerTexte = texte.trim().length > 0

  return (
    <View style={styles.ligne}>
      <TextInput
        style={styles.input}
        value={texte}
        onChangeText={setTexte}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline
      />

      {envoi ? (
        <View style={styles.boutonRond}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : peutEnvoyerTexte ? (
        <Pressable style={styles.sendButton} onPress={envoyerTexte}>
          <Text style={styles.sendButtonText}>Envoyer</Text>
        </Pressable>
      ) : (
        <Pressable
          style={[styles.boutonRond, styles.boutonEnvoyer]}
          onPress={demarrerEnregistrement}
          accessibilityLabel="Enregistrer une note vocale"
        >
          <Mic size={22} color={colors.white} />
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  ligne: {
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
  boutonRond: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  boutonEnvoyer: { backgroundColor: colors.primary },
  boutonAnnuler: { backgroundColor: '#FEE2E2' },
  pointRouge: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.danger, marginLeft: 6, alignSelf: 'center' },
  chrono: { fontSize: 15, fontWeight: '700', color: colors.text, alignSelf: 'center' },
})