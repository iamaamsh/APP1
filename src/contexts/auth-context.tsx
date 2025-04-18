"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { login as apiLogin, verifyToken, logout as apiLogout } from "../services/api-service"

// Define User interface to match API response
interface User {
  _id: string;
  name: string;
  email: string;
  membershipNumber: string;
  membershipType: string;
  games: string[];
  familyMembers?: {
    name: string;
    relationship: string;
    dateOfBirth: string;
  }[];
  role: string;
  isActive: boolean;
  isPaused: boolean;
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
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const loadUserFromStorage = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user")
        const storedToken = await AsyncStorage.getItem("token")

        if (storedUser && storedToken) {
          // Verify token validity with the API
          const tokenValid = await verifyToken(storedToken)
          
          if (tokenValid.valid) {
            setUser(JSON.parse(storedUser))
            setToken(storedToken)
          } else {
            // Token is invalid, clear storage
            await AsyncStorage.removeItem("user")
            await AsyncStorage.removeItem("token")
          }
        }
      } catch (error) {
        console.error("Error loading user from storage:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUserFromStorage()
  }, [])

  const login = async (identifier: string, password: string) => {
    try {
      const response = await apiLogin(identifier, password)

      // Save user and token to state
      setUser(response.user)
      setToken(response.token)

      // Save to AsyncStorage
      await AsyncStorage.setItem("user", JSON.stringify(response.user))
      await AsyncStorage.setItem("token", response.token)
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      if (token) {
        // Call API logout
        await apiLogout(token)
      }
      
      // Clear state
      setUser(null)
      setToken(null)

      // Clear AsyncStorage
      await AsyncStorage.removeItem("user")
      await AsyncStorage.removeItem("token")
    } catch (error) {
      console.error("Logout error:", error)
      
      // Even if API logout fails, clear local state
      setUser(null)
      setToken(null)
      await AsyncStorage.removeItem("user")
      await AsyncStorage.removeItem("token")
      
      throw error
    }
  }

  return <AuthContext.Provider value={{ user, token, loading, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
