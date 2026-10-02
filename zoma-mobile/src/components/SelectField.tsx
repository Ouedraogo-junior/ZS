// src/components/SelectField.tsx
//
// Pas d'équivalent natif au <select> web en React Native — un champ qui
// ouvre une feuille modale avec la liste des options.
import { useState } from 'react'
import { View, Text, Pressable, Modal, FlatList, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../theme/colors'

interface Option {
  id: number
  label: string
}

interface Props {
  label: string
  placeholder: string
  value: number | null
  options: Option[]
  onChange: (id: number) => void
}

export function SelectField({ label, placeholder, value, options, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.id === value)
  // Même logique que pour la barre d'onglets : réserve la hauteur réelle
  // de la barre de navigation système, sinon la dernière option colle
  // dessus (voire devient difficile à toucher).
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <Text style={selected ? styles.valueText : styles.placeholderText}>
          {selected ? selected.label : placeholder}
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, { paddingBottom: 20 + insets.bottom }]}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={item => String(item.id)}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    onChange(item.id)
                    setOpen(false)
                  }}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 6 },
  field: {
    height: 50,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  valueText: { fontSize: 16, color: colors.text },
  placeholderText: { fontSize: 16, color: colors.muted },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    padding: 20,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
  option: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.background },
  optionText: { fontSize: 16, color: colors.text },
})