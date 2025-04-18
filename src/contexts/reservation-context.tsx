"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"
import {
  getUserReservations as apiFetchReservations,
  createReservation as apiCreateReservation,
  cancelReservation as apiCancelReservation,
} from "../services/api-service"
import { useAuth } from "./auth-context"

// Define the API-compatible interface
interface Reservation {
  _id: string;
  userId: string;
  facilityId: string;
  facilityName: string;
  date: string;
  timeSlot: string;
  duration?: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  updatedAt: string;
  notes?: string;
  attendees?: number;
}

// Define reservation creation data
interface ReservationCreateData {
  facilityId: string;
  facilityName: string;
  date: string;
  timeSlot: string;
  attendees?: number;
  notes?: string;
}

interface ReservationContextType {
  reservations: Reservation[]
  fetchReservations: (userId: string) => Promise<void>
  createReservation: (data: ReservationCreateData) => Promise<Reservation>
  cancelReservation: (reservationId: string) => Promise<Reservation>
}

const ReservationContext = createContext<ReservationContextType | null>(null)

export const ReservationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const { token } = useAuth()

  const fetchReservations = async (userId: string) => {
    if (!token) {
      throw new Error("Authentication token is required");
    }
    
    try {
      const data = await apiFetchReservations(userId, token)
      setReservations(data)
    } catch (error) {
      console.error("Error fetching reservations:", error)
      throw error
    }
  }

  const createReservation = async (data: ReservationCreateData) => {
    if (!token) {
      throw new Error("Authentication token is required");
    }
    
    try {
      const newReservation = await apiCreateReservation(data, token)
      setReservations((prev) => [...prev, newReservation])
      return newReservation
    } catch (error) {
      console.error("Error creating reservation:", error)
      throw error
    }
  }

  const cancelReservation = async (reservationId: string) => {
    if (!token) {
      throw new Error("Authentication token is required");
    }
    
    try {
      const updatedReservation = await apiCancelReservation(reservationId, token)

      // Update local state
      setReservations((prev) =>
        prev.map((reservation) =>
          reservation._id === reservationId ? { ...reservation, status: "cancelled" } : reservation,
        ),
      )

      return updatedReservation
    } catch (error) {
      console.error("Error cancelling reservation:", error)
      throw error
    }
  }

  return (
    <ReservationContext.Provider
      value={{
        reservations,
        fetchReservations,
        createReservation,
        cancelReservation,
      }}
    >
      {children}
    </ReservationContext.Provider>
  )
}

export const useReservation = () => {
  const context = useContext(ReservationContext)
  if (!context) {
    throw new Error("useReservation must be used within a ReservationProvider")
  }
  return context
}
