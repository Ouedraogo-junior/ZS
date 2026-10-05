// src/screens/shared/AdminNonSupporteScreen.tsx
//
// L'admin reste sur le backoffice web pour l'instant (CDC/fil
// "application native" : seul l'admin reste web). Sans cet écran, un
// compte admin connecté sur mobile atterrirait sur le navigateur
// Gérant, qui appelle des routes réservées au gérant (/staff/dashboard)
// — échec silencieux plutôt qu'un message clair.
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../../theme/colors'
import { useAuth } from '../../hooks/useAuth'

export function AdminNonSupporteScreen() {
  const { logout } = useAuth()

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Text style={styles.title}>Espace administrateur</Text>
      <Text style={styles.text}>
        L'espace administrateur n'est pas encore disponible sur l'appli mobile — utilisez le
        backoffice web pour l'instant.
      </Text>
      <Pressable style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Se déconnecter</Text>
      </Pressable>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 12 },
  text: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  button: { backgroundColor: colors.danger, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24 },
  buttonText: { color: colors.white, fontWeight: '700' },
})