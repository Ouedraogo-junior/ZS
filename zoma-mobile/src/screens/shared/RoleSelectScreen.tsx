// src/screens/shared/RoleSelectScreen.tsx
import { View, Text, Pressable, StyleSheet } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { colors } from '../../theme/colors'
import { Logo } from '../../components/Logo'
import type { RootStackParamList } from '../../navigation/RootNavigator'

type Props = NativeStackScreenProps<RootStackParamList, 'RoleSelect'>

export function RoleSelectScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Logo largeur={240} style={styles.logo} />
      <Text style={styles.subtitle}>Dépôt et retrait pour vos comptes de paris sportifs</Text>

      <View style={styles.buttons}>
        <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('ClientLogin')}>
          <Text style={styles.primaryButtonText}>Je suis client</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('StaffLogin')}>
          <Text style={styles.secondaryButtonText}>Je suis agent ou gérant</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: { marginBottom: 12 },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 40,
  },
  buttons: { width: '100%', gap: 12 },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  secondaryButton: {
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: { color: colors.text, fontWeight: '700', fontSize: 15 },
})