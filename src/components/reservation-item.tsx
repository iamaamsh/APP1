import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"

interface ReservationItemProps {
  reservation: {
    _id: string;
    facilityId: string;
    facilityName: string;
    date: string;
    timeSlot: string;
    status: string;
    notes?: string;
    attendees?: number;
  }
  onCancel: () => void
  isPast: boolean
}

export default function ReservationItem({ reservation, onCancel, isPast }: ReservationItemProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "#10b981" // green
      case "pending":
        return "#f59e0b" // amber
      case "cancelled":
        return "#ef4444" // red
      default:
        return "#6b7280" // gray
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{reservation.facilityName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(reservation.status) + "20" }]}>
          <Text style={[styles.statusText, { color: getStatusColor(reservation.status) }]}>
            {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={18} color="#6b7280" />
          <Text style={styles.detailText}>{formatDate(reservation.date)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={18} color="#6b7280" />
          <Text style={styles.detailText}>{reservation.timeSlot}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={18} color="#6b7280" />
          <Text style={styles.detailText}>{reservation.facilityName}</Text>
        </View>
        {reservation.attendees && (
          <View style={styles.detailItem}>
            <Ionicons name="people-outline" size={18} color="#6b7280" />
            <Text style={styles.detailText}>{reservation.attendees} {reservation.attendees === 1 ? 'person' : 'people'}</Text>
          </View>
        )}
      </View>

      {!isPast && reservation.status !== "cancelled" && (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel Reservation</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    margin: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  details: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    color: "#6b7280",
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: "#fee2e2",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#ef4444",
    fontWeight: "500",
  },
})
