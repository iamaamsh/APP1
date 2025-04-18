import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"

interface DashboardCardProps {
  title: string
  value: number
  icon: string
  color: string
  onPress?: () => void
}

export default function DashboardCard({ title, value, icon, color, onPress }: DashboardCardProps) {
  return (
    <TouchableOpacity style={[styles.card, { borderLeftColor: color }]} onPress={onPress} disabled={!onPress}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: "48%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
  },
  iconContainer: {
    alignItems: "flex-end",
  },
  value: {
    fontSize: 28,
    fontWeight: "bold",
    marginVertical: 8,
    color: "#1f2937",
  },
  title: {
    fontSize: 14,
    color: "#6b7280",
  },
})
