// src/screens/agent/AgentProfileScreen.tsx
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../../theme/colors'
import { useAuth } from '../../hooks/useAuth'

export function AgentProfileScreen() {
  const { state, logout } = useAuth()
  const profile = state.status === 'staff' ? state.profile : null

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={styles.title}>Profil</Text>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.nom}>{profile?.nom}</Text>
          <Text style={styles.pseudo}>@{profile?.pseudo}</Text>
          {profile?.agence && <Text style={styles.agence}>{profile.agence}</Text>}
        </View>
        <Pressable style={styles.button} onPress={logout}>
          <Text style={styles.buttonText}>Se déconnecter</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  content: { padding: 20 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 20, marginBottom: 20, alignItems: 'center' },
  nom: { fontSize: 18, fontWeight: '800', color: colors.text },
  pseudo: { fontSize: 14, color: colors.muted, marginTop: 4 },
  agence: { fontSize: 13, color: colors.secondary, fontWeight: '600', marginTop: 8 },
  button: { backgroundColor: colors.danger, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: colors.white, fontWeight: '700' },
})