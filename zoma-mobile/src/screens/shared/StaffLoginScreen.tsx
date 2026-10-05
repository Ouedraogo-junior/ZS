// src/screens/shared/StaffLoginScreen.tsx
import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../../theme/colors'
import { useAuth } from '../../hooks/useAuth'
import { getErrorMessage } from '../../lib/api'

export function StaffLoginScreen() {
  const { loginAsStaff } = useAuth()
  const [pseudo, setPseudo] = useState('')
  const [pin, setPin] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = pseudo.trim().length > 0 && pin.length === 4 && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await loginAsStaff(pseudo.trim(), pin)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Text style={styles.title}>Connexion</Text>
      <Text style={styles.subtitle}>Agent ou gérant</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.label}>Pseudo</Text>
      <TextInput
        style={styles.input}
        value={pseudo}
        onChangeText={setPseudo}
        placeholder="Votre pseudo"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
      />

      <Text style={styles.label}>Code PIN (4 chiffres)</Text>
      <TextInput
        style={styles.input}
        value={pin}
        onChangeText={text => setPin(text.replace(/\D/g, '').slice(0, 4))}
        placeholder="••••"
        placeholderTextColor={colors.muted}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={4}
      />

      <Pressable style={[styles.button, !canSubmit && styles.buttonDisabled]} onPress={handleSubmit} disabled={!canSubmit}>
        {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Se connecter</Text>}
      </Pressable>
    </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 6, marginBottom: 24 },
  error: {
    color: colors.danger,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    textAlign: 'center',
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 6 },
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
  button: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: 15 },
})