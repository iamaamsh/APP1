import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { StatusBar } from "expo-status-bar"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { useEffect } from "react"
import { GestureHandlerRootView } from "react-native-gesture-handler"

import LoginScreen from "./src/screens/login-screen"
import MainTabs from "./src/navigation/main-tabs"
import { AuthProvider } from "./src/contexts/auth-context"
import { ReservationProvider } from "./src/contexts/reservation-context"
import { NetworkProvider } from "./src/utils/network-status"
import { registerForPushNotifications } from "./src/utils/notifications"

const Stack = createNativeStackNavigator()

export default function App() {
  // Request notification permissions on app start
  useEffect(() => {
    registerForPushNotifications()
      .then(token => {
        if (token) {
          console.log("Push token:", token)
          // In a real app, you would send this token to your backend
        }
      })
      .catch(err => console.log("Failed to get push token:", err))
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NetworkProvider>
          <AuthProvider>
            <ReservationProvider>
              <NavigationContainer>
                <StatusBar style="auto" />
                <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="Login" component={LoginScreen} />
                  <Stack.Screen name="MainTabs" component={MainTabs} />
                </Stack.Navigator>
              </NavigationContainer>
            </ReservationProvider>
          </AuthProvider>
        </NetworkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
