// src/screens/agent/AgentHomeScreen.tsx
//
// Temporaire — juste pour valider le flux de connexion de bout en bout.
// Sera remplacé par le vrai navigateur agent (transactions, demandes,
// relève, historique...) aux étapes suivantes.
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { colors } from '../../theme/colors'
import { useAuth } from '../../hooks/useAuth'

export function AgentHomeScreen() {
  const { state, logout } = useAuth()
  const profile = state.status === 'staff' ? state.profile : null

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bonjour {profile?.nom} 👋</Text>
      <Text style={styles.subtitle}>{profile?.agence} — Espace agent, écrans à venir</Text>
      <Pressable style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Se déconnecter</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: 32, textAlign: 'center' },
  button: { backgroundColor: colors.danger, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24 },
  buttonText: { color: colors.white, fontWeight: '700' },
})