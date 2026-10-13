// src/screens/client/ReclamationFormScreen.tsx
//
// Le client décrit son problème ; le gérant de l'agence le reçoit. Deux
// façons d'arriver ici :
//  - depuis une demande : l'agence et la demande sont déjà connues, le
//    client n'a que le texte à écrire ;
//  - depuis le profil ou la liste : il choisit l'agence concernée (celle de
//    sa dernière demande est pré-sélectionnée).
// Son nom et son numéro viennent de son compte, il n'a rien à retaper.
// Il peut écrire, OU parler (note vocale) s'il ne sait pas lire ni écrire,
// ou les deux.
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
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { colors } from '../../theme/colors'
import { ChoixAgence } from '../../components/ChoixAgence'
import { EnregistreurNoteVocale, type EnregistrementVocal } from '../../components/EnregistreurNoteVocale'
import { getLastAgenceId } from '../../lib/storage'
import { getAgences, envoyerReclamation, getErrorMessage, type Agence } from '../../lib/api'
import type { ReclamationsClientStackParamList } from '../../navigation/ClientNavigator'

type Props = NativeStackScreenProps<ReclamationsClientStackParamList, 'ReclamationForm'>

const LONGUEUR_MAX = 2000
const LONGUEUR_MIN = 5

export function ReclamationFormScreen({ navigation, route }: Props) {
  const demandeId = route.params?.demandeId
  const resume = route.params?.resume
  const surUneDemande = demandeId !== undefined

  const [agences, setAgences] = useState<Agence[]>([])
  const [agenceId, setAgenceId] = useState<number | null>(null)
  const [chargement, setChargement] = useState(!surUneDemande)
  const [description, setDescription] = useState('')
  const [vocal, setVocal] = useState<EnregistrementVocal | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoyee, setEnvoyee] = useState(false)

  // La liste des agences ne sert que si le client n'arrive pas depuis une demande.
  useEffect(() => {
    if (surUneDemande) return

    Promise.all([getAgences(), getLastAgenceId().catch(() => null)])
      .then(([liste, derniere]) => {
        setAgences(liste)
        if (derniere !== null && liste.some(a => a.id === derniere)) {
          setAgenceId(derniere)
        } else if (liste.length === 1) {
          setAgenceId(liste[0].id)
        }
      })
      .catch(err => setErreur(getErrorMessage(err)))
      .finally(() => setChargement(false))
  }, [surUneDemande])

  const texte = description.trim()
  // Un texte (assez long) ou une note vocale ; un texte trop court est refusé par
  // le serveur même accompagné d'une note, on l'évite donc dès ici.
  const contenuValide = texte.length >= LONGUEUR_MIN || (texte.length === 0 && vocal !== null)
  const peutEnvoyer = contenuValide && (surUneDemande || agenceId !== null) && !envoi

  const envoyer = async () => {
    if (!peutEnvoyer) return
    setEnvoi(true)
    setErreur(null)
    try {
      await envoyerReclamation({
        description: texte || undefined,
        audio: vocal ?? undefined,
        ...(surUneDemande ? { demande_id: demandeId } : { agence_id: agenceId ?? undefined }),
      })
      setEnvoyee(true)
    } catch (err) {
      setErreur(getErrorMessage(err))
    } finally {
      setEnvoi(false)
    }
  }

  if (chargement) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    )
  }

  if (envoyee) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <CheckCircle2 color={colors.success} size={48} style={{ marginBottom: 16 }} />
        <Text style={styles.successTitle}>Réclamation envoyée</Text>
        <Text style={styles.successText}>
          Le gérant de l'agence a été prévenu. Vous serez notifié dès qu'il s'en occupe, et vous pouvez suivre
          son avancement à tout moment.
        </Text>
        <Pressable style={styles.button} onPress={() => navigation.popTo('ReclamationsListe')}>
          <Text style={styles.buttonText}>Suivre mes réclamations</Text>
        </Pressable>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {erreur && <Text style={styles.error}>{erreur}</Text>}

          {surUneDemande ? (
            <View style={styles.contexte}>
              <Text style={styles.contexteLabel}>Réclamation sur la demande</Text>
              <Text style={styles.contexteTexte}>{resume ?? `Demande n°${demandeId}`}</Text>
            </View>
          ) : (
            <ChoixAgence agences={agences} value={agenceId} onChange={setAgenceId} />
          )}

          <Text style={styles.label}>Que s'est-il passé ?</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Expliquez votre problème : montant, heure, ce qui n'a pas fonctionné…"
            placeholderTextColor={colors.muted}
            multiline
            textAlignVertical="top"
            maxLength={LONGUEUR_MAX}
          />
          <Text style={styles.compteur}>
            {description.length} / {LONGUEUR_MAX}
          </Text>

          <Text style={styles.ou}>ou</Text>
          <EnregistreurNoteVocale valeur={vocal} onChange={setVocal} onErreur={setErreur} desactive={envoi} />
          <View style={{ height: 24 }} />

          <Pressable style={[styles.button, !peutEnvoyer && styles.buttonDisabled]} onPress={envoyer} disabled={!peutEnvoyer}>
            {envoi ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Envoyer la réclamation</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  // 20 de marge de chaque côté : ChoixAgence calcule la largeur de ses cartes là-dessus.
  content: { padding: 20, paddingBottom: 40 },
  error: {
    color: colors.danger,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    textAlign: 'center',
  },
  contexte: { backgroundColor: colors.white, borderRadius: 14, padding: 14, marginBottom: 6 },
  contexteLabel: { fontSize: 12, color: colors.muted, marginBottom: 2 },
  contexteTexte: { fontSize: 15, fontWeight: '700', color: colors.text },
  label: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 16, marginBottom: 8 },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    minHeight: 140,
  },
  compteur: { fontSize: 11, color: colors.muted, textAlign: 'right', marginTop: 4, marginBottom: 8 },
  ou: { fontSize: 13, fontWeight: '700', color: colors.muted, textAlign: 'center', marginBottom: 8 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.white, fontWeight: '700' },
  successTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8 },
  successText: { color: colors.muted, textAlign: 'center', marginBottom: 24 },
})