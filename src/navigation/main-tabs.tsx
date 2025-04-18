import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import Ionicons from "@expo/vector-icons/Ionicons"
import { ParamListBase, RouteProp } from "@react-navigation/native"
import { View } from "react-native"

import DashboardScreen from "../screens/dashboard-screen"
import ReservationsScreen from "../screens/reservations-screen"
import ProfileScreen from "../screens/profile-screen"
import NetworkAlertBanner from "../components/network-alert-banner"

type TabParamList = {
  Dashboard: undefined;
  Reservations: undefined;
  Profile: undefined;
}

const Tab = createBottomTabNavigator<TabParamList>()

export default function MainTabs() {
  return (
    <View style={{ flex: 1 }}>
      <NetworkAlertBanner />
      <Tab.Navigator
        screenOptions={({ route }: { route: RouteProp<ParamListBase, string> }) => ({
          tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
            let iconName: string = "help-circle";

            if (route.name === "Dashboard") {
              iconName = focused ? "home" : "home-outline";
            } else if (route.name === "Reservations") {
              iconName = focused ? "calendar" : "calendar-outline";
            } else if (route.name === "Profile") {
              iconName = focused ? "person" : "person-outline";
            }

            return <Ionicons name={iconName as any} size={size} color={color} />
          },
          tabBarActiveTintColor: "#25a244", // Updated to match green theme
          tabBarInactiveTintColor: "gray",
          headerShown: true,
          headerStyle: {
            backgroundColor: "#25a244", // Green header
          },
          headerTintColor: "#fff", // White text
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Reservations" component={ReservationsScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </View>
  )
}
