// src/screens/client/NouvelleDemandeScreen.tsx
import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CheckCircle2, Camera } from 'lucide-react-native'
import * as ImagePicker from 'expo-image-picker'
import { colors } from '../../theme/colors'
import { SelectField } from '../../components/SelectField'
import { compresserImage } from '../../lib/image'
import {
  getAgences,
  getReseauxMobileMoney,
  getPlateformesParis,
  submitDemande,
  getErrorMessage,
  type Agence,
  type ReferenceItem,
} from '../../lib/api'

export function NouvelleDemandeScreen() {
  const [agences, setAgences] = useState<Agence[]>([])
  const [reseaux, setReseaux] = useState<ReferenceItem[]>([])
  const [plateformes, setPlateformes] = useState<ReferenceItem[]>([])
  const [loadingRef, setLoadingRef] = useState(true)

  const [agenceId, setAgenceId] = useState<number | null>(null)
  const [type, setType] = useState<'depot' | 'retrait'>('depot')
  const [reseauId, setReseauId] = useState<number | null>(null)
  const [plateformeId, setPlateformeId] = useState<number | null>(null)
  const [montant, setMontant] = useState('')
  const [idBookmaker, setIdBookmaker] = useState('')
  const [idCaptureUri, setIdCaptureUri] = useState<string | null>(null)
  const [telephoneMM, setTelephoneMM] = useState('')
  const [preuveUri, setPreuveUri] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    Promise.all([getAgences(), getReseauxMobileMoney(), getPlateformesParis()])
      .then(([a, r, p]) => {
        setAgences(a)
        setReseaux(r)
        setPlateformes(p)
      })
      .catch(err => setError(getErrorMessage(err)))
      .finally(() => setLoadingRef(false))
  }, [])

  // Ouvre la galerie et renvoie l'image choisie déjà compressée (ou null).
  // Pas de compression dans le sélecteur lui-même (quality: 1) : une
  // seule passe, via compresserImage, sinon l'image serait recompressée
  // deux fois et perdrait en netteté pour rien.
  const choisirImage = async (): Promise<string | null> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      setError("Autorisation d'accès aux photos refusée.")
      return null
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    })
    if (result.canceled || !result.assets[0]) return null
    const asset = result.assets[0]
    return compresserImage(asset.uri, asset.width)
  }

  const choisirPreuve = async () => {
    const uri = await choisirImage()
    if (uri) setPreuveUri(uri)
  }

  const choisirIdCapture = async () => {
    const uri = await choisirImage()
    if (uri) setIdCaptureUri(uri)
  }

  const montantNombre = parseInt(montant, 10)
  const canSubmit =
    agenceId !== null &&
    reseauId !== null &&
    plateformeId !== null &&
    montantNombre > 0 &&
    (idBookmaker.trim().length > 0 || idCaptureUri !== null) &&
    (type === 'depot' ? preuveUri !== null : telephoneMM.trim().length > 0) &&
    !submitting

  const resetForm = () => {
    setAgenceId(null)
    setReseauId(null)
    setPlateformeId(null)
    setMontant('')
    setIdBookmaker('')
    setIdCaptureUri(null)
    setTelephoneMM('')
    setPreuveUri(null)
  }

  const handleSubmit = async () => {
    if (!canSubmit || agenceId === null || reseauId === null || plateformeId === null) return
    setSubmitting(true)
    setError(null)
    try {
      await submitDemande({
        agence_id: agenceId,
        type,
        reseau_mobile_money_id: reseauId,
        plateforme_paris_id: plateformeId,
        montant: montantNombre,
        id_bookmaker: idBookmaker.trim() || undefined,
        idCaptureUri: idCaptureUri ?? undefined,
        telephone_mobile_money: type === 'retrait' ? telephoneMM.trim() : undefined,
        preuveUri: type === 'depot' ? (preuveUri ?? undefined) : undefined,
      })
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
        <Text style={styles.successTitle}>Demande envoyée</Text>
        <Text style={styles.successText}>
          Votre demande est en attente de traitement par un agent de l'agence choisie.
        </Text>
        <Pressable style={styles.button} onPress={() => setSuccess(false)}>
          <Text style={styles.buttonText}>Faire une nouvelle demande</Text>
        </Pressable>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={styles.title}>Nouvelle demande</Text>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
      {error && <Text style={styles.error}>{error}</Text>}

      {/* Type */}
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
          <Text style={[styles.typeButtonText, type === 'retrait' && styles.typeButtonTextActive]}>Retrait</Text>
        </Pressable>
      </View>

      <SelectField
        label="Agence"
        placeholder="Choisir une agence"
        value={agenceId}
        options={agences.map(a => ({ id: a.id, label: `${a.nom} — ${a.ville}` }))}
        onChange={setAgenceId}
      />

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

      <Text style={styles.label}>Votre ID sur la plateforme</Text>
      <TextInput
        style={styles.input}
        value={idBookmaker}
        onChangeText={setIdBookmaker}
        placeholder="Identifiant du compte"
        placeholderTextColor={colors.muted}
      />
      {idCaptureUri ? (
        <View style={styles.idCaptureBox}>
          <Image source={{ uri: idCaptureUri }} style={styles.idCapturePreview} resizeMode="contain" />
          <View style={styles.idCaptureActions}>
            <Pressable onPress={choisirIdCapture}>
              <Text style={styles.actionLink}>Changer la photo</Text>
            </Pressable>
            <Pressable onPress={() => setIdCaptureUri(null)}>
              <Text style={styles.actionLinkDanger}>Retirer</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable style={styles.uploadButton} onPress={choisirIdCapture}>
          <Camera size={18} color={colors.secondary} />
          <Text style={styles.uploadButtonText}>Ou joindre une photo de mon compte</Text>
        </Pressable>
      )}

      {type === 'retrait' && (
        <>
          <Text style={styles.label}>Numéro mobile money (pour recevoir les fonds)</Text>
          <TextInput
            style={styles.input}
            value={telephoneMM}
            onChangeText={setTelephoneMM}
            placeholder="07 00 00 00 00"
            placeholderTextColor={colors.muted}
            keyboardType="phone-pad"
          />
        </>
      )}

      {type === 'depot' && (
        <>
          <Text style={styles.label}>Preuve de paiement</Text>
          {preuveUri ? (
            <Pressable onPress={choisirPreuve}>
              <Image source={{ uri: preuveUri }} style={styles.preview} />
              <Text style={styles.changePhoto}>Changer la photo</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.uploadButton} onPress={choisirPreuve}>
              <Text style={styles.uploadButtonText}>Ajouter une capture d'écran</Text>
            </Pressable>
          )}
        </>
      )}

      <Pressable style={[styles.button, !canSubmit && styles.buttonDisabled]} onPress={handleSubmit} disabled={!canSubmit}>
        {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Envoyer la demande</Text>}
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
  uploadButton: {
    height: 50,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  uploadButtonText: { color: colors.secondary, fontWeight: '600' },
  idCaptureBox: { marginBottom: 18 },
  idCapturePreview: { width: '100%', height: 140, borderRadius: 12, backgroundColor: colors.background },
  idCaptureActions: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 8 },
  actionLink: { color: colors.secondary, fontWeight: '600' },
  actionLinkDanger: { color: colors.danger, fontWeight: '600' },
  preview: { width: '100%', height: 180, borderRadius: 12, marginBottom: 6 },
  changePhoto: { color: colors.secondary, fontWeight: '600', textAlign: 'center', marginBottom: 18 },
  button: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  successTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 10 },
  successText: { fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 28, lineHeight: 20 },
})