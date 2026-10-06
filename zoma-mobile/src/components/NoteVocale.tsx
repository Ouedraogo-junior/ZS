// src/components/NoteVocale.tsx
//
// Lecteur d'une note vocale dans une bulle de message.
//
// - Rien n'est téléchargé tant qu'on n'appuie pas sur lecture : une
//   conversation peut contenir beaucoup de notes, et les données mobiles
//   coûtent cher pour les clients.
// - Une seule note joue à la fois : en lancer une met la précédente en pause.
import { useEffect, useMemo, useState } from 'react'
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native'
import { Play, Pause } from 'lucide-react-native'
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync, type AudioSource } from 'expo-audio'
import { colors } from '../theme/colors'
import { sourceNoteVocale, type MessagesBase } from '../lib/api'
import { formaterDuree } from '../lib/noteVocale'

interface Props {
  base: MessagesBase
  demandeId: number
  messageId: number
  dureeSecondes: number | null
  /** Vrai quand la note est affichée sur un fond foncé (bulle bleue). */
  surFondSombre?: boolean
}

// --- Une seule note à la fois ---------------------------------------------
let pauseNoteCourante: (() => void) | null = null

function prendreLaMain(pause: () => void) {
  if (pauseNoteCourante && pauseNoteCourante !== pause) {
    try {
      pauseNoteCourante()
    } catch {
      // Lecteur déjà libéré (écran quitté) : rien à mettre en pause.
    }
  }
  pauseNoteCourante = pause
}

function libererLaMain(pause: () => void) {
  if (pauseNoteCourante === pause) pauseNoteCourante = null
}

// --- Présentation (identique avant et pendant la lecture) -----------------
interface VueProps {
  enLecture: boolean
  chargement: boolean
  progression: number // 0 à 1
  texte: string
  erreur: string | null
  surFondSombre: boolean
  onPress: () => void
}

function VueLecteur({ enLecture, chargement, progression, texte, erreur, surFondSombre, onPress }: VueProps) {
  const couleurTexte = surFondSombre ? colors.white : colors.text

  return (
    <View>
      <View style={styles.ligne}>
        <Pressable
          style={[styles.bouton, { backgroundColor: surFondSombre ? 'rgba(255,255,255,0.25)' : colors.primary }]}
          onPress={onPress}
          disabled={chargement}
          accessibilityLabel={enLecture ? 'Mettre en pause' : 'Écouter la note vocale'}
        >
          {chargement ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : enLecture ? (
            <Pause size={18} color={colors.white} fill={colors.white} />
          ) : (
            <Play size={18} color={colors.white} fill={colors.white} />
          )}
        </Pressable>

        <View style={styles.piste}>
          <View style={[styles.pisteFond, { backgroundColor: surFondSombre ? 'rgba(255,255,255,0.3)' : colors.border }]}>
            <View
              style={[
                styles.pisteProgres,
                { width: `${Math.round(progression * 100)}%`, backgroundColor: surFondSombre ? colors.white : colors.primary },
              ]}
            />
          </View>
          <Text style={[styles.duree, { color: couleurTexte }]}>{texte}</Text>
        </View>
      </View>

      {erreur && <Text style={[styles.erreur, { color: surFondSombre ? colors.white : colors.danger }]}>{erreur}</Text>}
    </View>
  )
}

// --- Lecteur actif : monté seulement après le premier appui ---------------
function LecteurActif({
  source,
  dureeSecondes,
  surFondSombre,
}: {
  source: AudioSource
  dureeSecondes: number | null
  surFondSombre: boolean
}) {
  const player = useAudioPlayer(source)
  const statut = useAudioPlayerStatus(player)
  const pause = useMemo(() => () => player.pause(), [player])

  // Lecture automatique dès le montage (l'utilisateur vient d'appuyer sur lecture).
  useEffect(() => {
    let annule = false
    prendreLaMain(pause)

    // playsInSilentMode : sinon le commutateur "silencieux" d'un iPhone
    // couperait le son des notes vocales.
    setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false })
      .catch(() => {})
      .finally(() => {
        if (!annule) player.play()
      })

    return () => {
      annule = true
      libererLaMain(pause)
    }
  }, [player, pause])

  const total = statut.duration > 0 ? statut.duration : (dureeSecondes ?? 0)
  const position = total > 0 ? Math.min(statut.currentTime, total) : statut.currentTime
  const progression = total > 0 ? position / total : 0
  const chargement = !statut.isLoaded && !statut.error

  const basculer = async () => {
    if (statut.playing) {
      player.pause()
      return
    }
    prendreLaMain(pause)
    // Après la fin, le lecteur reste à la fin : on revient au début.
    if (statut.didJustFinish || (total > 0 && statut.currentTime >= total - 0.1)) {
      await player.seekTo(0)
    }
    player.play()
  }

  const texte = position > 0 ? `${formaterDuree(position)} / ${formaterDuree(total)}` : formaterDuree(total)

  return (
    <VueLecteur
      enLecture={statut.playing}
      chargement={chargement}
      progression={progression}
      texte={texte}
      erreur={statut.error ? 'Lecture impossible.' : null}
      surFondSombre={surFondSombre}
      onPress={basculer}
    />
  )
}

// --- Composant public ------------------------------------------------------
export function NoteVocale({ base, demandeId, messageId, dureeSecondes, surFondSombre = false }: Props) {
  const [source, setSource] = useState<AudioSource | null>(null)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const demarrer = async () => {
    setChargement(true)
    setErreur(null)
    try {
      setSource(await sourceNoteVocale(base, demandeId, messageId))
    } catch {
      setErreur('Impossible de charger la note vocale.')
    } finally {
      setChargement(false)
    }
  }

  if (source) {
    return <LecteurActif source={source} dureeSecondes={dureeSecondes} surFondSombre={surFondSombre} />
  }

  return (
    <VueLecteur
      enLecture={false}
      chargement={chargement}
      progression={0}
      texte={dureeSecondes ? formaterDuree(dureeSecondes) : 'Note vocale'}
      erreur={erreur}
      surFondSombre={surFondSombre}
      onPress={demarrer}
    />
  )
}

const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 190 },
  bouton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  piste: { flex: 1, gap: 4 },
  pisteFond: { height: 4, borderRadius: 2, overflow: 'hidden' },
  pisteProgres: { height: 4, borderRadius: 2 },
  duree: { fontSize: 11, fontWeight: '600' },
  erreur: { fontSize: 11, marginTop: 4 },
})