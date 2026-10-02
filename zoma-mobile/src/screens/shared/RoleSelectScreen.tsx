// src/screens/shared/RoleSelectScreen.tsx
import { View, Text, Pressable, StyleSheet } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { colors } from '../../theme/colors'
import type { RootStackParamList } from '../../navigation/RootNavigator'

type Props = NativeStackScreenProps<RootStackParamList, 'RoleSelect'>

export function RoleSelectScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.logoBox}>
        <Text style={styles.logoText}>
          <Text style={{ color: colors.secondary }}>Z</Text>
          <Text style={{ color: colors.primary }}>S</Text>
        </Text>
      </View>
      <Text style={styles.title}>ZOMA SERVICES</Text>
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
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: { fontSize: 28, fontWeight: '900' },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
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