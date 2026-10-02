// src/navigation/RootNavigator.tsx
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ActivityIndicator, View } from 'react-native'
import { useAuth } from '../hooks/useAuth'
import { colors } from '../theme/colors'
import { RoleSelectScreen } from '../screens/shared/RoleSelectScreen'
import { ClientLoginScreen } from '../screens/client/ClientLoginScreen'
import { StaffLoginScreen } from '../screens/shared/StaffLoginScreen'
import { ClientNavigator } from './ClientNavigator'
import { AgentHomeScreen } from '../screens/agent/AgentHomeScreen'
import { GerantHomeScreen } from '../screens/gerant/GerantHomeScreen'

export type RootStackParamList = {
  RoleSelect: undefined
  ClientLogin: undefined
  StaffLogin: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export function RootNavigator() {
  const { state } = useAuth()

  if (state.status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <NavigationContainer>
      {state.status === 'guest' && (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
          <Stack.Screen name="ClientLogin" component={ClientLoginScreen} />
          <Stack.Screen name="StaffLogin" component={StaffLoginScreen} />
        </Stack.Navigator>
      )}

      {state.status === 'client' && <ClientNavigator />}

      {/* Agent/gérant : toujours temporaires, à remplacer aux étapes
          suivantes (Transactions, Demandes, Relève...). */}
      {state.status === 'staff' && state.role === 'agent' && <AgentHomeScreen />}
      {state.status === 'staff' && (state.role === 'gerant' || state.role === 'admin') && <GerantHomeScreen />}
    </NavigationContainer>
  )
}