"use client"

import React, { useState, useEffect } from "react"
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  Switch,
  TextInput,
  ActivityIndicator,
  Modal
} from "react-native"
import Ionicons from "@expo/vector-icons/Ionicons"
import { useAuth } from "../contexts/auth-context"
import { getUserProfile, updateUserProfile } from "../services/api-service"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"

// Interface for navigation
type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  Reservations: undefined;
  Profile: undefined;
};

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Profile'>;
};

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user, token, logout } = useAuth()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  })
  const [editMode, setEditMode] = useState(false)
  
  // Get complete profile data
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    if (!token) return;
    
    try {
      setRefreshing(true);
      const userData = await getUserProfile(token);
      setProfileData({
        name: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true)
      await logout()
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      })
    } catch (error) {
      Alert.alert("Error", "Failed to log out")
    } finally {
      setLoading(false)
    }
  }

  const confirmLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: handleLogout, style: "destructive" },
    ])
  }

  const toggleNotifications = () => {
    setNotificationsEnabled((previous) => !previous)
    // In a real app, you would save this preference to your backend
  }

  const handleEditProfile = () => {
    setEditMode(true);
  }

  const handleCancelEdit = () => {
    // Revert to original data
    setProfileData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
    setEditMode(false);
  }

  const handleSaveProfile = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      
      // Basic validation
      if (!profileData.name.trim()) {
        Alert.alert("Error", "Name cannot be empty");
        return;
      }
      
      if (!profileData.email.trim() || !profileData.email.includes('@')) {
        Alert.alert("Error", "Please enter a valid email");
        return;
      }
      
      // Save to API
      await updateUserProfile({
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
      }, token);
      
      setEditMode(false);
      Alert.alert("Success", "Profile updated successfully");
      
      // Refresh profile data
      await fetchUserProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setLoading(false);
    }
  }

  const handleChangePassword = () => {
    // This would be implemented in a real app
    Alert.alert("Coming Soon", "Password change functionality will be available in a future update.");
  }

  return (
    <ScrollView style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#25a244" />
        </View>
      )}
      
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <Text style={styles.profileInitial}>
            {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
        {!editMode ? (
          <>
            <Text style={styles.name}>{profileData.name || "User"}</Text>
            <Text style={styles.email}>{profileData.email}</Text>
            <TouchableOpacity 
              style={styles.editProfileButton} 
              onPress={handleEditProfile}
            >
              <Text style={styles.editProfileButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.editFormContainer}>
            <Text style={styles.editFormLabel}>Name</Text>
            <TextInput
              style={styles.editFormInput}
              value={profileData.name}
              onChangeText={(text) => setProfileData({...profileData, name: text})}
              placeholder="Your name"
            />
            
            <Text style={styles.editFormLabel}>Email</Text>
            <TextInput
              style={styles.editFormInput}
              value={profileData.email}
              onChangeText={(text) => setProfileData({...profileData, email: text})}
              placeholder="Your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <Text style={styles.editFormLabel}>Phone</Text>
            <TextInput
              style={styles.editFormInput}
              value={profileData.phone}
              onChangeText={(text) => setProfileData({...profileData, phone: text})}
              placeholder="Your phone number"
              keyboardType="phone-pad"
            />
            
            <View style={styles.editFormButtons}>
              <TouchableOpacity 
                style={[styles.editFormButton, styles.editFormCancelButton]} 
                onPress={handleCancelEdit}
              >
                <Text style={styles.editFormCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.editFormButton, styles.editFormSaveButton]} 
                onPress={handleSaveProfile}
              >
                <Text style={styles.editFormSaveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>

        {!editMode && (
          <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
            <View style={styles.menuItemContent}>
              <Ionicons name={"person-outline" as any} size={22} color="#4b5563" />
              <Text style={styles.menuItemText}>Edit Profile</Text>
            </View>
            <Ionicons name={"chevron-forward" as any} size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.menuItem} onPress={handleChangePassword}>
          <View style={styles.menuItemContent}>
            <Ionicons name={"lock-closed-outline" as any} size={22} color="#4b5563" />
            <Text style={styles.menuItemText}>Change Password</Text>
          </View>
          <Ionicons name={"chevron-forward" as any} size={20} color="#9ca3af" />
        </TouchableOpacity>

        <View style={styles.menuItem}>
          <View style={styles.menuItemContent}>
            <Ionicons name={"notifications-outline" as any} size={22} color="#4b5563" />
            <Text style={styles.menuItemText}>Notifications</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: "#d1d5db", true: "#bfdbfe" }}
            thumbColor={notificationsEnabled ? "#3b82f6" : "#f4f4f5"}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Membership</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Member ID</Text>
          <Text style={styles.infoValue}>{user?.membershipNumber || "N/A"}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Type</Text>
          <Text style={styles.infoValue}>
            {user?.membershipType ? 
              user.membershipType.charAt(0).toUpperCase() + user.membershipType.slice(1) : 
              "N/A"
            }
          </Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Status</Text>
          <View style={[
            styles.statusBadge, 
            {backgroundColor: user?.isActive ? "#e6f7ed" : "#fee2e2"}
          ]}>
            <Text style={[
              styles.statusText, 
              {color: user?.isActive ? "#059669" : "#dc2626"}
            ]}>
              {user?.isActive ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App</Text>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemContent}>
            <Ionicons name={"help-circle-outline" as any} size={22} color="#4b5563" />
            <Text style={styles.menuItemText}>Help & Support</Text>
          </View>
          <Ionicons name={"chevron-forward" as any} size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemContent}>
            <Ionicons name={"document-text-outline" as any} size={22} color="#4b5563" />
            <Text style={styles.menuItemText}>Terms & Privacy Policy</Text>
          </View>
          <Ionicons name={"chevron-forward" as any} size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemContent}>
            <Ionicons name={"information-circle-outline" as any} size={22} color="#4b5563" />
            <Text style={styles.menuItemText}>About</Text>
          </View>
          <Ionicons name={"chevron-forward" as any} size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#25a244",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  profileInitial: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  email: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 4,
  },
  editProfileButton: {
    marginTop: 12,
    backgroundColor: "#e6f7ed",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  editProfileButtonText: {
    color: "#25a244",
    fontWeight: "500",
  },
  editFormContainer: {
    width: '100%',
    marginTop: 16,
  },
  editFormLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4b5563",
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  editFormInput: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    width: '100%',
    marginBottom: 16,
  },
  editFormButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  editFormButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    flex: 1,
    alignItems: 'center',
  },
  editFormCancelButton: {
    backgroundColor: "#f3f4f6",
    marginRight: 8,
  },
  editFormCancelButtonText: {
    color: "#4b5563",
    fontWeight: "500",
  },
  editFormSaveButton: {
    backgroundColor: "#25a244",
    marginLeft: 8,
  },
  editFormSaveButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  section: {
    backgroundColor: "#fff",
    marginTop: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    marginLeft: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemText: {
    fontSize: 16,
    color: "#1f2937",
    marginLeft: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  infoLabel: {
    fontSize: 16,
    color: "#4b5563",
  },
  infoValue: {
    fontSize: 16,
    color: "#1f2937",
    fontWeight: "500",
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  logoutButton: {
    margin: 20,
    backgroundColor: "#ef4444",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
