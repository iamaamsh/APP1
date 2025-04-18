"use client"

import React, { useEffect, useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from "react-native"
import { useAuth } from "../contexts/auth-context"
import { fetchUserDashboardData } from "../services/api-service"
import Ionicons from "@expo/vector-icons/Ionicons"
import LoadingSpinner from "../components/loading-spinner"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useNetworkRefresh } from "../hooks/useNetworkRefresh"
import { useNetworkStatus } from "../utils/network-status"
import NotificationCenter from "../components/notification-center"
import { scheduleNotification } from "../utils/notifications"

// Define the types for dashboard data from API
interface Reservation {
  _id: string;
  userId: string;
  facilityId: string;
  facilityName: string;
  date: string;
  timeSlot: string;
  duration?: number;
  status: string;
  notes?: string;
  attendees?: number;
  equipment?: string[];
  createdAt: string;
  updatedAt: string;
}

interface DashboardData {
  user: {
    _id: string;
    name: string;
    email: string;
    membershipNumber: string;
    membershipType: string;
    games: string[];
    membershipApproval: {
      formPurchased: {
        status: boolean;
        formPrice: number;
      };
      interview: {
        status: boolean;
        date: string;
      };
      membershipFee: {
        amount: number;
        status: string;
      };
      approvalStatus: string;
    };
  };
  reservations: Reservation[];
  activeReservations: number;
  completedReservations: number;
}

type RootStackParamList = {
  Dashboard: undefined;
  Reservations: undefined;
  Profile: undefined;
};

type DashboardScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
};

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  const { user, token } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [notificationModalVisible, setNotificationModalVisible] = useState(false)
  const { isConnected } = useNetworkStatus()

  const loadDashboardData = async () => {
    if (!user?._id) return;
    
    try {
      setLoading(true)
      const data = await fetchUserDashboardData(user._id, token || undefined)
      setDashboardData(data)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      if (isConnected) {
        Alert.alert("Error", "Failed to load dashboard data. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  // Network refresh hook to reload data when connection is restored
  const { refreshing: networkRefreshing, handleRefresh } = useNetworkRefresh(loadDashboardData)

  const onRefresh = async () => {
    if (!isConnected) {
      Alert.alert("No Connection", "Please check your internet connection and try again.")
      return;
    }
    
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
  }

  useEffect(() => {
    loadDashboardData()
  }, [user])

  // Handle notification press
  const handleNotificationPress = (notification: any) => {
    if (notification.data?.type === 'reservation_reminder') {
      // Navigate to reservations screen
      navigation.navigate('Reservations');
    }
  };

  if (loading && !dashboardData) {
    return <LoadingSpinner message="Loading dashboard..." />
  }

  // Format the membership type for display
  const formatMembershipType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1) + " Membership";
  }

  // Get upcoming reservations (only confirmed and pending)
  const upcomingReservations = dashboardData?.reservations
    .filter(res => res.status === "confirmed" || res.status === "pending")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4); // Take only the first 4 for display

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing || networkRefreshing} 
            onRefresh={onRefresh} 
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Welcome, {user?.name || "User"}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.notificationButton} 
              onPress={() => setNotificationModalVisible(true)}
            >
              <Ionicons name="notifications-outline" size={24} color="#25a244" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.bookButton} 
              onPress={() => navigation.navigate("Reservations")}
            >
              <Text style={styles.bookButtonText}>Book a facility</Text>
            </TouchableOpacity>
          </View>
        </View>

        {!isConnected && (
          <View style={styles.offlineIndicator}>
            <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
            <Text style={styles.offlineText}>You're offline. Pull down to try again when connected.</Text>
          </View>
        )}

        {/* Membership Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Membership</Text>

          <View style={styles.card}>
            <View style={styles.membershipHeader}>
              <Text style={styles.membershipType}>
                {dashboardData?.user ? formatMembershipType(dashboardData.user.membershipType) : "Membership"}
              </Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {dashboardData?.user?.membershipApproval?.approvalStatus || "Pending"}
                </Text>
              </View>
            </View>

            <Text style={styles.membershipId}>
              Membership: {dashboardData?.user?.membershipNumber || "N/A"}
            </Text>

            <View style={styles.divider} />

            <Text style={styles.subsectionTitle}>Games Included</Text>
            {dashboardData?.user?.games && dashboardData.user.games.length > 0 ? (
              <View style={styles.gamesList}>
                {dashboardData.user.games.map((game, index) => (
                  <Text key={index} style={styles.gameItem}>
                    • {game.charAt(0).toUpperCase() + game.slice(1)}
                  </Text>
                ))}
              </View>
            ) : (
              <Text style={styles.grayText}>No games selected</Text>
            )}

            <View style={styles.divider} />

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Form Purchase</Text>
              <Text style={styles.pendingStatus}>
                {dashboardData?.user?.membershipApproval?.formPurchased?.status ? "Completed" : "Pending"}
              </Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Interview</Text>
              <Text style={styles.pendingStatus}>
                {dashboardData?.user?.membershipApproval?.interview?.status ? "Completed" : "Pending"}
              </Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Membership Fee</Text>
              <Text style={styles.pendingStatus}>
                {dashboardData?.user?.membershipApproval?.membershipFee?.status || "Pending"}
              </Text>
            </View>
          </View>
        </View>

        {/* Upcoming Reservations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Upcoming Reservations</Text>

          {upcomingReservations && upcomingReservations.length > 0 ? (
            upcomingReservations.map((reservation: Reservation) => (
              <View key={reservation._id} style={styles.reservationItem}>
                <View style={styles.reservationIcon}>
                  <Ionicons name={getCourtIcon(reservation.facilityName) as any} size={20} color="#25a244" />
                </View>
                <View style={styles.reservationContent}>
                  <Text style={styles.reservationTitle}>{reservation.facilityName}</Text>
                  <View style={styles.reservationTime}>
                    <Ionicons name={"time-outline" as any} size={14} color="#6b7280" />
                    <Text style={styles.timeText}>
                      {formatDate(reservation.date)} at {reservation.timeSlot}
                    </Text>
                  </View>
                </View>
                <View style={[styles.reservationStatus, { backgroundColor: getStatusColor(reservation.status) }]}>
                  <Text style={styles.reservationStatusText}>{reservation.status}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No upcoming reservations</Text>
              <TouchableOpacity style={styles.createButton} onPress={() => navigation.navigate("Reservations")}>
                <Text style={styles.createButtonText}>Book a facility</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.viewAllButton} onPress={() => navigation.navigate("Reservations")}>
            <Text style={styles.viewAllText}>View all reservations</Text>
          </TouchableOpacity>
        </View>

        {/* Active Reservations Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reservations Overview</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{dashboardData?.activeReservations || 0}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{dashboardData?.completedReservations || 0}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <NotificationCenter 
        visible={notificationModalVisible} 
        onClose={() => setNotificationModalVisible(false)} 
        onNotificationPress={handleNotificationPress}
      />
    </>
  )
}

// Format date for display
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'numeric', 
    year: 'numeric' 
  });
}

// Helper function to get icon based on court type
const getCourtIcon = (title: string): string => {
  const facilityName = title.toLowerCase();
  if (facilityName.includes("squash")) return "tennisball-outline";
  if (facilityName.includes("tennis")) return "tennisball-outline";
  if (facilityName.includes("basketball")) return "basketball-outline";
  if (facilityName.includes("badminton")) return "tennisball-outline";
  if (facilityName.includes("gym")) return "barbell-outline";
  if (facilityName.includes("swim")) return "water-outline";
  if (facilityName.includes("table")) return "disc-outline"; // For table tennis
  return "tennisball-outline";
}

// Helper function to get status color
const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case "confirmed":
      return "#e6f7ed";
    case "completed":
      return "#e6f2fe";
    case "cancelled":
      return "#fee2e2";
    case "pending":
      return "#fff7ed";
    default:
      return "#f3f4f6";
  }
}

// Add styles for new components
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 24,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  bookButton: {
    backgroundColor: "#ffffff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  bookButtonText: {
    color: "#25a244",
    fontWeight: "500",
    fontSize: 14,
  },
  notificationButton: {
    padding: 8,
    marginRight: 8,
  },
  offlineIndicator: {
    backgroundColor: '#ef4444',
    padding: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  section: {
    marginTop: 16,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    marginHorizontal: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
  },
  membershipHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  membershipType: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  statusBadge: {
    backgroundColor: "#fff7ed",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    color: "#f59e0b",
    fontSize: 12,
    fontWeight: "500",
  },
  membershipId: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 12,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 4,
  },
  grayText: {
    fontSize: 14,
    color: "#6b7280",
  },
  gamesList: {
    marginTop: 4,
  },
  gameItem: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: "#111827",
  },
  pendingStatus: {
    fontSize: 14,
    color: "#f59e0b",
  },
  reservationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  reservationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e6f7ed",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  reservationContent: {
    flex: 1,
  },
  reservationTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 4,
  },
  reservationTime: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 13,
    color: "#6b7280",
    marginLeft: 4,
  },
  reservationStatus: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  reservationStatusText: {
    fontSize: 12,
    color: "#25a244",
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 12,
  },
  createButton: {
    backgroundColor: "#25a244",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  createButtonText: {
    color: "#ffffff",
    fontWeight: "500",
  },
  viewAllButton: {
    marginTop: 16,
    alignItems: "center",
  },
  viewAllText: {
    color: "#25a244",
    fontSize: 14,
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 16,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#25a244",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#e5e7eb",
  },
});
