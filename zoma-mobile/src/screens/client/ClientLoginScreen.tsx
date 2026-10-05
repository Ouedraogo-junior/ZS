// src/screens/client/ClientLoginScreen.tsx
import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../../theme/colors'
import { useAuth } from '../../hooks/useAuth'
import { getErrorMessage } from '../../lib/api'

export function ClientLoginScreen() {
  const { loginAsClient } = useAuth()
  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = nom.trim().length > 0 && telephone.trim().length > 0 && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await loginAsClient(nom.trim(), telephone.trim())
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
      <Text style={styles.title}>Bienvenue</Text>
      <Text style={styles.subtitle}>
        Entrez votre nom et votre numéro — votre compte est créé automatiquement si c'est la première fois.
      </Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.label}>Votre nom</Text>
      <TextInput
        style={styles.input}
        value={nom}
        onChangeText={setNom}
        placeholder="Prénom Nom"
        placeholderTextColor={colors.muted}
      />

      <Text style={styles.label}>Numéro de téléphone</Text>
      <TextInput
        style={styles.input}
        value={telephone}
        onChangeText={setTelephone}
        placeholder="07 00 00 00 00"
        placeholderTextColor={colors.muted}
        keyboardType="phone-pad"
      />

      <Pressable style={[styles.button, !canSubmit && styles.buttonDisabled]} onPress={handleSubmit} disabled={!canSubmit}>
        {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Continuer</Text>}
      </Pressable>
    </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 6, marginBottom: 24, lineHeight: 20 },
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