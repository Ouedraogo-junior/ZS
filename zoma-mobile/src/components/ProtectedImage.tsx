// src/components/ProtectedImage.tsx
//
// Image servie par une route authentifiée (preuve de paiement, capture
// de l'ID bookmaker) : téléchargement via la fonction `charger` fournie,
// miniature, et agrandissement plein écran au toucher.
import { useEffect, useState } from 'react'
import { View, Text, Pressable, Image, Modal, ActivityIndicator, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { X } from 'lucide-react-native'
import { colors } from '../theme/colors'

interface Props {
  label: string
  /**
   * Télécharge l'image et renvoie une URI affichable. Doit être STABLE
   * entre deux rendus (useCallback) : un changement de référence relance
   * le téléchargement.
   */
  charger: () => Promise<string>
}

export function ProtectedImage({ label, charger }: Props) {
  const insets = useSafeAreaInsets()
  const [uri, setUri] = useState<string | null>(null)
  const [erreur, setErreur] = useState(false)
  const [enGrand, setEnGrand] = useState(false)

  useEffect(() => {
    // Si on quitte l'écran avant la fin du téléchargement, on évite de
    // mettre à jour un état qui n'intéresse plus personne.
    let annule = false
    setUri(null)
    setErreur(false)

    charger()
      .then(resultat => { if (!annule) setUri(resultat) })
      .catch(() => { if (!annule) setErreur(true) })

    return () => { annule = true }
  }, [charger])

  return (
    <View style={styles.box}>
      <Text style={styles.label}>{label}</Text>

      {erreur ? (
        <Text style={styles.erreur}>Impossible de charger l'image.</Text>
      ) : uri ? (
        <Pressable onPress={() => setEnGrand(true)}>
          <Image source={{ uri }} style={styles.image} resizeMode="contain" />
          <Text style={styles.hint}>Toucher pour agrandir</Text>
        </Pressable>
      ) : (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
      )}

      {uri && (
        <Modal visible={enGrand} transparent animationType="fade" onRequestClose={() => setEnGrand(false)}>
          <View style={styles.viewerBackdrop}>
            <Pressable style={[styles.viewerClose, { top: insets.top + 10 }]} onPress={() => setEnGrand(false)}>
              <X color={colors.white} size={24} />
            </Pressable>
            <Image source={{ uri }} style={styles.viewerImage} resizeMode="contain" />
          </View>
        </Modal>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.white, borderRadius: 16, padding: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 10 },
  image: { width: '100%', height: 260, borderRadius: 12, backgroundColor: colors.background },
  hint: { textAlign: 'center', color: colors.secondary, fontSize: 12, fontWeight: '600', marginTop: 8 },
  erreur: {
    color: colors.danger,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 10,
    textAlign: 'center',
  },
  viewerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  viewerClose: {
    position: 'absolute',
    right: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerImage: { width: '100%', height: '80%' },
})