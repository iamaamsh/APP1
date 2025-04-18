"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../contexts/auth-context"
import { useReservation } from "../contexts/reservation-context"
import ReservationItem from "../components/reservation-item"
import CreateReservationModal from "../components/create-reservation-modal"
import LoadingSpinner from "../components/loading-spinner"

export default function ReservationsScreen() {
  const { user } = useAuth()
  const { reservations, fetchReservations, cancelReservation } = useReservation()
  const [modalVisible, setModalVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("upcoming")

  const loadReservations = async () => {
    if (!user) {
      console.error("No user found");
      return;
    }
    
    try {
      setLoading(true)
      await fetchReservations(user._id)
    } catch (error) {
      console.error("Error loading reservations:", error)
      Alert.alert("Error", "Failed to load reservations")
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadReservations()
    setRefreshing(false)
  }

  useEffect(() => {
    if (user) {
      loadReservations()
    }
  }, [user])

  const handleCancelReservation = (reservationId: string) => {
    Alert.alert("Cancel Reservation", "Are you sure you want to cancel this reservation?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            const result = await cancelReservation(reservationId);
            
            if (result && result.status === 'cancelled') {
              Alert.alert("Success", "Reservation cancelled successfully");
            } else {
              Alert.alert("Note", "Reservation status updated locally. Changes will sync when connection is restored.");
            }
            
            // Refresh the list after cancellation
            await loadReservations();
          } catch (error) {
            console.error("Error cancelling reservation:", error);
            Alert.alert(
              "Error", 
              "Failed to cancel reservation on the server. The reservation has been marked as cancelled locally."
            );
            
            // No need to manually update state since the reservation context already does this
            // Just refresh the list to show updated state
            await loadReservations();
          } finally {
            setLoading(false);
          }
        },
      },
    ])
  }

  const filteredReservations = reservations.filter((reservation) => {
    const reservationDate = new Date(reservation.date);
    const now = new Date();

    if (activeTab === "upcoming") {
      return reservationDate >= now && reservation.status !== "cancelled";
    } else if (activeTab === "past") {
      return reservationDate < now || reservation.status === "cancelled";
    }
    return true;
  });

  if (loading && reservations.length === 0) {
    return <LoadingSpinner message="Loading reservations..." />
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Reservations</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "upcoming" && styles.activeTab]}
          onPress={() => setActiveTab("upcoming")}
        >
          <Text style={[styles.tabText, activeTab === "upcoming" && styles.activeTabText]}>Upcoming</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "past" && styles.activeTab]}
          onPress={() => setActiveTab("past")}
        >
          <Text style={[styles.tabText, activeTab === "past" && styles.activeTabText]}>Past</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredReservations}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ReservationItem
            reservation={item}
            onCancel={() => handleCancelReservation(item._id)}
            isPast={activeTab === "past"}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>
              {loading ? "Loading reservations..." : `No ${activeTab} reservations found`}
            </Text>
            {!loading && activeTab === "upcoming" && (
              <TouchableOpacity style={styles.createButton} onPress={() => setModalVisible(true)}>
                <Text style={styles.createButtonText}>Make a Reservation</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        contentContainerStyle={filteredReservations.length === 0 ? { flex: 1 } : null}
      />

      <CreateReservationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={() => {
          setModalVisible(false)
          loadReservations()
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  addButton: {
    backgroundColor: "#3b82f6",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tab: {
    paddingVertical: 12,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#3b82f6",
  },
  tabText: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#3b82f6",
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  createButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 16,
  },
})
