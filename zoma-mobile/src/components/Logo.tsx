// src/components/Logo.tsx
//
// Logo officiel ZOMA SERVICES (cadre + « Paris sportifs - Transactions
// mobiles »). Image dans mobile/assets/logo.png, de proportions 900 × 728.
import { Image, type StyleProp, type ImageStyle } from 'react-native'

const RATIO = 728 / 900

interface Props {
  /** Largeur en points ; la hauteur suit les proportions du logo. */
  largeur?: number
  style?: StyleProp<ImageStyle>
}

export function Logo({ largeur = 200, style }: Props) {
  return (
    <Image
      source={require('../../assets/logo.png')}
      style={[{ width: largeur, height: largeur * RATIO }, style]}
      resizeMode="contain"
      accessibilityLabel="ZOMA SERVICES"
    />
  )
}