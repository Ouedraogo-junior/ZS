// src/navigation/GerantNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { getFocusedRouteNameFromRoute } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LayoutDashboard, Inbox, MessageSquareWarning, User } from 'lucide-react-native'
import { colors } from '../theme/colors'
import { GerantDashboardScreen } from '../screens/gerant/GerantDashboardScreen'
import { ReclamationsListScreen } from '../screens/gerant/ReclamationsListScreen'
import { ReclamationDetailScreen } from '../screens/gerant/ReclamationDetailScreen'
import { GerantProfileScreen } from '../screens/gerant/GerantProfileScreen'
import { AgentDemandesListScreen } from '../screens/agent/AgentDemandesListScreen'
import { AgentDemandeDetailScreen } from '../screens/agent/AgentDemandeDetailScreen'
import { TransactionScreen } from '../screens/agent/TransactionScreen'
import { HistoryScreen } from '../screens/agent/HistoryScreen'
import type { AgentDemandesStackParamList } from './AgentDemandesTypes'
import type { ReclamationsStackParamList } from './ReclamationsTypes'
import type { GerantDashboardStackParamList } from './GerantDashboardTypes'

export type GerantTabParamList = {
  Dashboard: undefined
  Demandes: undefined
  Reclamations: undefined
  Profil: undefined
}

const Tab = createBottomTabNavigator<GerantTabParamList>()
// Même forme de paramètres que côté agent (voir AgentDemandesTypes) —
// pas de duplication de type, même si "retourVersHistorique" ne sert
// jamais ici (le gérant n'a pas d'onglet Historique).
const DemandesStack = createNativeStackNavigator<AgentDemandesStackParamList>()
const ReclamationsStack = createNativeStackNavigator<ReclamationsStackParamList>()
const DashboardStack = createNativeStackNavigator<GerantDashboardStackParamList>()

function GerantDashboardStackScreen() {
  return (
    <DashboardStack.Navigator screenOptions={{ headerShown: false, headerTintColor: colors.primary }}>
      <DashboardStack.Screen name="GerantDashboardAccueil" component={GerantDashboardScreen} />
      <DashboardStack.Screen name="GerantTransaction" options={{ headerShown: true, title: 'Nouvelle transaction' }}>
        {() => <TransactionScreen base="/staff" showHeader={false} />}
      </DashboardStack.Screen>
      <DashboardStack.Screen name="GerantHistorique" options={{ headerShown: true, title: 'Historique' }}>
        {() => <HistoryScreen base="/staff" showHeader={false} />}
      </DashboardStack.Screen>
    </DashboardStack.Navigator>
  )
}

function ReclamationsStackScreen() {
  return (
    <ReclamationsStack.Navigator screenOptions={{ headerShown: false, headerTintColor: colors.primary }}>
      <ReclamationsStack.Screen name="ReclamationsListe" component={ReclamationsListScreen} />
      <ReclamationsStack.Screen
        name="ReclamationDetail"
        component={ReclamationDetailScreen}
        options={{ headerShown: true, title: 'Détail de la réclamation' }}
      />
    </ReclamationsStack.Navigator>
  )
}

function GerantDemandesStackScreen() {
  return (
    <DemandesStack.Navigator screenOptions={{ headerShown: false, headerTintColor: colors.primary }}>
      <DemandesStack.Screen name="AgentDemandesListe">
        {props => <AgentDemandesListScreen {...props} base="/staff" />}
      </DemandesStack.Screen>
      <DemandesStack.Screen
        name="AgentDemandeDetail"
        options={{ headerShown: true, title: 'Détail de la demande' }}
      >
        {props => <AgentDemandeDetailScreen {...props} base="/staff" />}
      </DemandesStack.Screen>
    </DemandesStack.Navigator>
  )
}

export function GerantNavigator() {
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
        name="Dashboard"
        component={GerantDashboardStackScreen}
        options={({ route }) => {
          const focusedRoute = getFocusedRouteNameFromRoute(route) ?? 'GerantDashboardAccueil'
          return {
            title: 'Tableau de bord',
            tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
            tabBarStyle: focusedRoute === 'GerantDashboardAccueil' ? tabBarStyleNormal : { display: 'none' },
            lazy: false,
          }
        }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            const state = navigation.getState()
            const dashboardRoute = state.routes.find(r => r.name === 'Dashboard')
            const pileInterne = dashboardRoute && 'state' in dashboardRoute ? dashboardRoute.state : undefined

            if (pileInterne && pileInterne.index! > 0) {
              e.preventDefault()
              navigation.navigate('Dashboard', { screen: 'GerantDashboardAccueil' })
            }
          },
        })}
      />
      <Tab.Screen
        name="Demandes"
        component={GerantDemandesStackScreen}
        options={({ route }) => {
          const focusedRoute = getFocusedRouteNameFromRoute(route) ?? 'AgentDemandesListe'
          return {
            title: 'Demandes',
            tabBarIcon: ({ color, size }) => <Inbox color={color} size={size} />,
            tabBarStyle: focusedRoute === 'AgentDemandeDetail' ? { display: 'none' } : tabBarStyleNormal,
            lazy: false,
          }
        }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            const state = navigation.getState()
            const demandesRoute = state.routes.find(r => r.name === 'Demandes')
            const pileInterne = demandesRoute && 'state' in demandesRoute ? demandesRoute.state : undefined

            if (pileInterne && pileInterne.index! > 0) {
              e.preventDefault()
              navigation.navigate('Demandes', { screen: 'AgentDemandesListe' })
            }
          },
        })}
      />
      <Tab.Screen
        name="Reclamations"
        component={ReclamationsStackScreen}
        options={({ route }) => {
          const focusedRoute = getFocusedRouteNameFromRoute(route) ?? 'ReclamationsListe'
          return {
            title: 'Réclamations',
            tabBarIcon: ({ color, size }) => <MessageSquareWarning color={color} size={size} />,
            tabBarStyle: focusedRoute === 'ReclamationDetail' ? { display: 'none' } : tabBarStyleNormal,
            lazy: false,
          }
        }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            const state = navigation.getState()
            const reclamationsRoute = state.routes.find(r => r.name === 'Reclamations')
            const pileInterne = reclamationsRoute && 'state' in reclamationsRoute ? reclamationsRoute.state : undefined

            if (pileInterne && pileInterne.index! > 0) {
              e.preventDefault()
              navigation.navigate('Reclamations', { screen: 'ReclamationsListe' })
            }
          },
        })}
      />
      <Tab.Screen
        name="Profil"
        component={GerantProfileScreen}
        options={{ title: 'Profil', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tab.Navigator>
  )
}