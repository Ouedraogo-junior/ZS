// src/screens/gerant/ReclamationsScreen.tsx
//
// Temporaire — à construire à l'étape suivante (liste, détail, prise
// en charge, fil de messages, lien WhatsApp).
import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../../theme/colors'

export function ReclamationsScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={styles.title}>Réclamations</Text>
      <View style={styles.content}>
        <Text style={styles.text}>Écran à venir.</Text>
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
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.muted },
})