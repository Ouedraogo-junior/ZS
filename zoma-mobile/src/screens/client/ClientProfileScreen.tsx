// src/screens/client/ClientProfileScreen.tsx
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { colors } from '../../theme/colors'
import { useAuth } from '../../hooks/useAuth'

export function ClientProfileScreen() {
  const { state, logout } = useAuth()
  const client = state.status === 'client' ? state.client : null

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.nom}>{client?.nom}</Text>
        <Text style={styles.telephone}>{client?.telephone}</Text>
      </View>
      <Pressable style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Se déconnecter</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 20, marginBottom: 20, alignItems: 'center' },
  nom: { fontSize: 18, fontWeight: '800', color: colors.text },
  telephone: { fontSize: 14, color: colors.muted, marginTop: 4 },
  button: { backgroundColor: colors.danger, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: colors.white, fontWeight: '700' },
})