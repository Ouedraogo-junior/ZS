// src/components/EnregistreurNoteVocale.tsx
//
// Enregistrement d'une note vocale AVANT envoi, pour un formulaire (la
// réclamation) — contrairement à ComposeurMessage, qui envoie dès la fin de
// l'enregistrement. Pensé pour quelqu'un qui ne sait pas lire : de grosses
// icônes, peu de texte, et on peut s'écouter avant d'envoyer.
//
//   1. un grand bouton micro : appui = l'enregistrement démarre ;
//   2. pendant l'enregistrement : durée, corbeille (annuler), coche (terminer) ;
//   3. ensuite : la note s'écoute sur place, et la corbeille permet de recommencer.
//
// À la durée maximale, l'enregistrement s'arrête et est conservé.
import { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, StyleSheet, Keyboard } from 'react-native'
import { Mic, Trash2, Check } from 'lucide-react-native'
import {
  useAudioRecorder,
  useAudioRecorderState,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio'
import { colors } from '../theme/colors'
import { NoteVocale } from './NoteVocale'
import {
  DUREE_MAX_NOTE_VOCALE,
  DUREE_MIN_NOTE_VOCALE_MS,
  OPTIONS_NOTE_VOCALE,
  formaterDuree,
} from '../lib/noteVocale'

export interface EnregistrementVocal {
  uri: string
  dureeSecondes: number
}

interface Props {
  valeur: EnregistrementVocal | null
  onChange: (valeur: EnregistrementVocal | null) => void
  onErreur: (message: string) => void
  /** Pendant l'envoi du formulaire : on fige l'enregistreur. */
  desactive?: boolean
}

export function EnregistreurNoteVocale({ valeur, onChange, onErreur, desactive = false }: Props) {
  const recorder = useAudioRecorder(OPTIONS_NOTE_VOCALE)
  const etat = useAudioRecorderState(recorder, 250)
  const [enregistre, setEnregistre] = useState(false)
  // Évite un double traitement (appui sur la coche au moment même où
  // l'arrêt automatique à la durée maximale se déclenche).
  const termineRef = useRef(false)

  const demarrer = async () => {
    if (desactive) return
    try {
      const permission = await requestRecordingPermissionsAsync()
      if (!permission.granted) {
        onErreur("Autorisez l'accès au micro pour enregistrer un message vocal.")
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

  const terminer = async (garder: boolean) => {
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

    if (!garder || !recorder.uri) return
    if (dureeMs < DUREE_MIN_NOTE_VOCALE_MS) {
      onErreur('Enregistrement trop court. Appuyez sur le micro et parlez.')
      return
    }
    onChange({ uri: recorder.uri, dureeSecondes: Math.max(1, Math.round(dureeMs / 1000)) })
  }

  // Arrêt automatique à la durée maximale (la note est conservée, pas envoyée).
  useEffect(() => {
    if (enregistre && etat.durationMillis >= DUREE_MAX_NOTE_VOCALE * 1000) {
      terminer(true)
    }
  }, [enregistre, etat.durationMillis])

  if (enregistre) {
    return (
      <View style={styles.carte}>
        <View style={styles.ligne}>
          <View style={styles.pointRouge} />
          <Text style={styles.chrono}>
            {formaterDuree(etat.durationMillis / 1000)} / {formaterDuree(DUREE_MAX_NOTE_VOCALE)}
          </Text>
          <View style={{ flex: 1 }} />
          <Pressable
            style={[styles.boutonRond, styles.boutonAnnuler]}
            onPress={() => terminer(false)}
            accessibilityLabel="Annuler l'enregistrement"
          >
            <Trash2 size={22} color={colors.danger} />
          </Pressable>
          <Pressable
            style={[styles.boutonRond, styles.boutonTerminer]}
            onPress={() => terminer(true)}
            accessibilityLabel="Terminer l'enregistrement"
          >
            <Check size={24} color={colors.white} />
          </Pressable>
        </View>
        <Text style={styles.aide}>Parlez maintenant, puis appuyez sur la coche verte.</Text>
      </View>
    )
  }

  if (valeur) {
    return (
      <View style={styles.carte}>
        <View style={styles.ligne}>
          <View style={{ flex: 1 }}>
            {/* Lecture du fichier local : pas de réseau, pas d'en-tête. */}
            <NoteVocale
              dureeSecondes={valeur.dureeSecondes}
              obtenirSource={async () => ({ uri: valeur.uri })}
            />
          </View>
          <Pressable
            style={[styles.boutonRond, styles.boutonAnnuler]}
            onPress={() => onChange(null)}
            disabled={desactive}
            accessibilityLabel="Supprimer et recommencer"
          >
            <Trash2 size={22} color={colors.danger} />
          </Pressable>
        </View>
        <Text style={styles.aide}>Écoutez votre message. La corbeille permet de recommencer.</Text>
      </View>
    )
  }

  return (
    <Pressable
      style={[styles.carte, styles.carteMicro, desactive && { opacity: 0.5 }]}
      onPress={demarrer}
      disabled={desactive}
      accessibilityLabel="Enregistrer un message vocal"
    >
      <View style={styles.gros}>
        <Mic size={34} color={colors.white} />
      </View>
      <Text style={styles.titreMicro}>Parler au lieu d'écrire</Text>
      <Text style={styles.aide}>Appuyez sur le micro et expliquez votre problème (2 minutes au plus).</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  carte: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
  },
  carteMicro: { alignItems: 'center', paddingVertical: 20 },
  gros: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  titreMicro: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 4 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  boutonRond: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  boutonAnnuler: { backgroundColor: '#FEE2E2' },
  boutonTerminer: { backgroundColor: colors.success },
  pointRouge: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.danger, marginLeft: 4 },
  chrono: { fontSize: 16, fontWeight: '700', color: colors.text },
  aide: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 10 },
})