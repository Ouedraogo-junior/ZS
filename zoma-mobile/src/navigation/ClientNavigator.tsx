// src/navigation/ClientNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { getFocusedRouteNameFromRoute, type NavigatorScreenParams } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PlusCircle, ClipboardList, MessageSquareWarning, User } from 'lucide-react-native'
import { colors } from '../theme/colors'
import { NouvelleDemandeScreen } from '../screens/client/NouvelleDemandeScreen'
import { MesDemandesScreen } from '../screens/client/MesDemandesScreen'
import { DemandeDetailScreen } from '../screens/client/DemandeDetailScreen'
import { ClientProfileScreen } from '../screens/client/ClientProfileScreen'
import { MesReclamationsScreen } from '../screens/client/MesReclamationsScreen'
import { ReclamationFormScreen } from '../screens/client/ReclamationFormScreen'

export type MesDemandesStackParamList = {
  MesDemandesListe: undefined
  DemandeDetail: { demandeId: number }
}

export type ReclamationsClientStackParamList = {
  ReclamationsListe: undefined
  /** Avec demandeId : réclamation sur cette demande (resume = ligne affichée) ; sans : le client choisit l'agence. */
  ReclamationForm: { demandeId?: number; resume?: string } | undefined
}

export type ClientTabParamList = {
  NouvelleDemande: undefined
  MesDemandes: NavigatorScreenParams<MesDemandesStackParamList> | undefined
  Reclamations: NavigatorScreenParams<ReclamationsClientStackParamList> | undefined
  Profil: undefined
}

const Tab = createBottomTabNavigator<ClientTabParamList>()
const MesDemandesStack = createNativeStackNavigator<MesDemandesStackParamList>()
const ReclamationsStack = createNativeStackNavigator<ReclamationsClientStackParamList>()

function MesDemandesStackScreen() {
  return (
    <MesDemandesStack.Navigator screenOptions={{ headerShown: false, headerTintColor: colors.primary }}>
      <MesDemandesStack.Screen name="MesDemandesListe" component={MesDemandesScreen} />
      <MesDemandesStack.Screen
        name="DemandeDetail"
        component={DemandeDetailScreen}
        options={{ headerShown: true, title: 'Détail de la demande' }}
      />
    </MesDemandesStack.Navigator>
  )
}

function ReclamationsStackScreen() {
  return (
    <ReclamationsStack.Navigator screenOptions={{ headerShown: false, headerTintColor: colors.primary }}>
      <ReclamationsStack.Screen name="ReclamationsListe" component={MesReclamationsScreen} />
      <ReclamationsStack.Screen
        name="ReclamationForm"
        component={ReclamationFormScreen}
        options={{ headerShown: true, title: 'Nouvelle réclamation' }}
      />
    </ReclamationsStack.Navigator>
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
            // Même raison que côté agent : évite le léger délai du
            // premier montage en le faisant dès le démarrage de l'appli.
            lazy: false,
          }
        }}
        listeners={({ navigation }) => ({
          // Ne réinitialise QUE si la pile interne n'est pas déjà à la
          // racine (liste) — sinon on intercepte inutilement CHAQUE appui
          // sur l'onglet, y compris le cas le plus fréquent, ce qui
          // ajoutait un travail redondant perceptible.
          tabPress: (e) => {
            const state = navigation.getState()
            const route = state.routes.find(r => r.name === 'MesDemandes')
            const pileInterne = route && 'state' in route ? route.state : undefined

            if (pileInterne && pileInterne.index! > 0) {
              e.preventDefault()
              navigation.navigate('MesDemandes', { screen: 'MesDemandesListe' })
            }
          },
        })}
      />
      <Tab.Screen
        name="Reclamations"
        component={ReclamationsStackScreen}
        options={({ route }) => {
          // La barre d'onglets est masquée sur le formulaire (le clavier la
          // ferait remonter au-dessus des champs).
          const focusedRoute = getFocusedRouteNameFromRoute(route) ?? 'ReclamationsListe'
          return {
            title: 'Réclamations',
            tabBarIcon: ({ color, size }) => <MessageSquareWarning color={color} size={size} />,
            tabBarStyle: focusedRoute === 'ReclamationForm' ? { display: 'none' } : tabBarStyleNormal,
            // Montée dès le démarrage : une notification ou le bouton d'une
            // demande peut ouvrir le formulaire sans que l'onglet ait jamais
            // été affiché — la liste doit alors déjà être sous le formulaire.
            lazy: false,
          }
        }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            const state = navigation.getState()
            const route = state.routes.find(r => r.name === 'Reclamations')
            const pileInterne = route && 'state' in route ? route.state : undefined

            if (pileInterne && pileInterne.index! > 0) {
              e.preventDefault()
              navigation.navigate('Reclamations', { screen: 'ReclamationsListe' })
            }
          },
        })}
      />
      <Tab.Screen
        name="Profil"
        component={ClientProfileScreen}
        options={{ title: 'Profil', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tab.Navigator>
  )
}