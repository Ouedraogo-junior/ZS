// src/components/FormulaireClavier.tsx
//
// Écran de formulaire dont le contenu défile quand le clavier s'affiche :
// le champ en cours de saisie reste toujours visible, et on peut faire
// défiler pour atteindre les autres champs et le bouton.
//
// Sans clavier, le contenu est centré verticalement (flexGrow + justifyContent) ;
// avec le clavier, l'espace se réduit et le ScrollView prend le relais.
// keyboardShouldPersistTaps="handled" : un appui sur le bouton fonctionne du
// premier coup, sans devoir d'abord fermer le clavier.
import type { ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../theme/colors'

export function FormulaireClavier({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.fond} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.fond} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.contenu}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  fond: { flex: 1, backgroundColor: colors.white },
  contenu: { flexGrow: 1, justifyContent: 'center', padding: 24 },
})