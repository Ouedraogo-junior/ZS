// src/navigation/AgentNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Wallet, Inbox, History, ClipboardCheck, User } from 'lucide-react-native'
import { colors } from '../theme/colors'
import { TransactionScreen } from '../screens/agent/TransactionScreen'
import { HistoryScreen } from '../screens/agent/HistoryScreen'
import { HandoverScreen } from '../screens/agent/HandoverScreen'
import { AgentProfileScreen } from '../screens/agent/AgentProfileScreen'
import { AgentDemandesListScreen } from '../screens/agent/AgentDemandesListScreen'
import { AgentDemandeDetailScreen } from '../screens/agent/AgentDemandeDetailScreen'
import type { AgentDemandesStackParamList } from './AgentDemandesTypes'

export type AgentTabParamList = {
  Transaction: undefined
  Demandes: undefined
  Historique: undefined
  Releve: undefined
  Profil: undefined
}

const Tab = createBottomTabNavigator<AgentTabParamList>()
const DemandesStack = createNativeStackNavigator<AgentDemandesStackParamList>()

function AgentDemandesStackScreen() {
  return (
    <DemandesStack.Navigator screenOptions={{ headerShown: false }}>
      <DemandesStack.Screen name="AgentDemandesListe" component={AgentDemandesListScreen} />
      <DemandesStack.Screen
        name="AgentDemandeDetail"
        component={AgentDemandeDetailScreen}
        options={{ headerShown: true, title: 'Détail de la demande' }}
      />
    </DemandesStack.Navigator>
  )
}

export function AgentNavigator() {
  // Même correctif que côté client : sans ça, la barre d'onglets se
  // superpose à la barre de navigation Android sur certains téléphones.
  const insets = useSafeAreaInsets()

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 56 + insets.bottom + 10,
          paddingBottom: insets.bottom + 10,
          paddingTop: 8,
        },
      }}
    >
      <Tab.Screen
        name="Transaction"
        component={TransactionScreen}
        options={{ title: 'Transaction', tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Demandes"
        component={AgentDemandesStackScreen}
        options={{ title: 'Demandes', tabBarIcon: ({ color, size }) => <Inbox color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Historique"
        component={HistoryScreen}
        options={{ title: 'Historique', tabBarIcon: ({ color, size }) => <History color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Releve"
        component={HandoverScreen}
        options={{ title: 'Relève', tabBarIcon: ({ color, size }) => <ClipboardCheck color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Profil"
        component={AgentProfileScreen}
        options={{ title: 'Profil', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tab.Navigator>
  )
}