// src/navigation/ClientNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { getFocusedRouteNameFromRoute } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PlusCircle, ClipboardList, User } from 'lucide-react-native'
import { colors } from '../theme/colors'
import { NouvelleDemandeScreen } from '../screens/client/NouvelleDemandeScreen'
import { MesDemandesScreen } from '../screens/client/MesDemandesScreen'
import { DemandeDetailScreen } from '../screens/client/DemandeDetailScreen'
import { ClientProfileScreen } from '../screens/client/ClientProfileScreen'

export type MesDemandesStackParamList = {
  MesDemandesListe: undefined
  DemandeDetail: { demandeId: number }
}

export type ClientTabParamList = {
  NouvelleDemande: undefined
  MesDemandes: undefined
  Profil: undefined
}

const Tab = createBottomTabNavigator<ClientTabParamList>()
const MesDemandesStack = createNativeStackNavigator<MesDemandesStackParamList>()

function MesDemandesStackScreen() {
  return (
    <MesDemandesStack.Navigator screenOptions={{ headerShown: false }}>
      <MesDemandesStack.Screen name="MesDemandesListe" component={MesDemandesScreen} />
      <MesDemandesStack.Screen
        name="DemandeDetail"
        component={DemandeDetailScreen}
        options={{ headerShown: true, title: 'Détail de la demande' }}
      />
    </MesDemandesStack.Navigator>
  )
}

export function ClientNavigator() {
  // Sur Android avec barre de navigation à l'écran (pas de boutons
  // physiques), la barre d'onglets se superposerait aux boutons système
  // sans cette marge — insets.bottom donne la hauteur réelle à réserver,
  // quel que soit l'appareil (0 sur un téléphone à gestes/boutons
  // physiques, non nul sinon).
  const insets = useSafeAreaInsets()

  const tabBarStyleNormal = {
    height: 56 + insets.bottom + 10,
    paddingBottom: insets.bottom + 10,
    paddingTop: 8,
  }

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: tabBarStyleNormal,
      }}
    >
      <Tab.Screen
        name="NouvelleDemande"
        component={NouvelleDemandeScreen}
        options={{ title: 'Nouvelle demande', tabBarIcon: ({ color, size }) => <PlusCircle color={color} size={size} /> }}
      />
      <Tab.Screen
        name="MesDemandes"
        component={MesDemandesStackScreen}
        options={({ route }) => {
          // Masque la barre d'onglets uniquement sur l'écran de détail
          // (fil de messages) — reste visible sur la liste.
          const focusedRoute = getFocusedRouteNameFromRoute(route) ?? 'MesDemandesListe'
          return {
            title: 'Mes demandes',
            tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
            tabBarStyle: focusedRoute === 'DemandeDetail' ? { display: 'none' } : tabBarStyleNormal,
          }
        }}
      />
      <Tab.Screen
        name="Profil"
        component={ClientProfileScreen}
        options={{ title: 'Profil', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tab.Navigator>
  )
}