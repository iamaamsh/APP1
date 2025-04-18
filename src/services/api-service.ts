import axios, { AxiosError } from "axios"
import { Platform, Alert } from "react-native"
import AsyncStorage from '@react-native-async-storage/async-storage';

// API URL Options - CHANGE THESE VALUES AS NEEDED
const API_URLS = {
  // Use this when your device is on the same network as your computer
  localNetwork: "http://192.168.100.27:5000/api",
  
  // Use this when testing in an emulator
  emulator: "http://10.0.2.2:5000/api",
  
  // Use this when your backend is deployed to the cloud (production)
  production: "https://your-production-server.com/api",
  
  // Use this as a fallback
  localhost: "http://localhost:5000/api"
};

// Default URL to try first
export let ACTIVE_API_URL = API_URLS.localNetwork;

// Create axios instance with timeout - we'll update the baseURL after initialization
const api = axios.create({
  baseURL: ACTIVE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15 second timeout
});

// Try to get the last working URL from storage - but don't block app startup
setTimeout(async () => {
  try {
    const savedUrl = await AsyncStorage.getItem('WORKING_API_URL');
    if (savedUrl) {
      console.log('[API] Using saved working URL:', savedUrl);
      ACTIVE_API_URL = savedUrl;
      api.defaults.baseURL = savedUrl;
    }
  } catch (error) {
    console.log('[API] No saved URL found, using default');
  }
}, 1000); // Delay initialization by 1 second to not block app startup

// Function to test if a URL is accessible
const testApiUrl = async (url: string): Promise<boolean> => {
  try {
    const testApi = axios.create({
      baseURL: url,
      timeout: 3000,
    });
    
    await testApi.get('/');
    return true;
  } catch (error) {
    return false;
  }
};

// Function to try different URLs until one works
const findWorkingApiUrl = async (): Promise<string | null> => {
  // Try all URLs in this order
  const urlsToTry = [
    API_URLS.localNetwork,
    API_URLS.emulator,
    API_URLS.localhost,
    API_URLS.production,
  ];
  
  for (const url of urlsToTry) {
    console.log('[API] Testing URL:', url);
    if (await testApiUrl(url)) {
      console.log('[API] Found working URL:', url);
      await AsyncStorage.setItem('WORKING_API_URL', url);
      return url;
    }
  }
  
  return null;
};

// Update the API base URL
const updateApiBaseUrl = (newUrl: string) => {
  ACTIVE_API_URL = newUrl;
  api.defaults.baseURL = newUrl;
  console.log('[API] Updated base URL to:', newUrl);
};

// Handle network errors more gracefully
const handleApiError = (error: any, customMessage: string): Error => {
  let errorMessage = customMessage;
  
  if (error.message === 'Network Error') {
    errorMessage = 'Cannot connect to server. Please check that:\n' +
      '1. The backend server is running\n' +
      '2. Your device is connected to the network\n' +
      '3. The server IP address is correct';
    
    console.error('[API] Network error:', error);
    
    // Show a more detailed alert about the connection issue
    Alert.alert(
      'Connection Error',
      errorMessage,
      [{ text: 'OK' }]
    );
  } else if (error.response) {
    errorMessage = error.response.data?.message || customMessage;
    console.error('[API] Server error:', error.response.status, error.response.data);
  } else {
    console.error('[API] Unknown error:', error);
  }
  
  return new Error(errorMessage);
};

// Add request interceptor for debugging
api.interceptors.request.use(
  config => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  error => {
    console.error('[API] Request Error:', error)
    return Promise.reject(error)
  }
)

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log(`[API] Response ${response.status} from ${response.config.url}`)
    return response
  },
  error => {
    console.error('[API] Response Error:', error.message)
    return Promise.reject(error)
  }
)

// Define interfaces for API responses
interface ApiErrorResponse {
  message: string;
  error?: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
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

interface LoginResponse {
  user: User;
  token: string;
}

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

interface ReservationCreateData {
  facilityId: string;
  facilityName: string;
  date: string;
  timeSlot: string;
  attendees?: number;
  notes?: string;
}

interface DashboardData {
  user: User;
  reservations: Reservation[];
  activeReservations: number;
  completedReservations: number;
}

// Add token to requests
const authHeader = (token: string) => {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
}

// Auth services
export const login = async (identifier: string, password: string): Promise<LoginResponse> => {
  try {
    // First try with current URL
    try {
      const response = await api.post("/auth/login", { identifier, password });
      return response.data;
    } catch (error: any) {
      // If we get a network error, try to find a working URL
      if (error.message === 'Network Error') {
        console.log('[API] Network error, trying to find working URL...');
        const workingUrl = await findWorkingApiUrl();
        
        if (workingUrl) {
          // Found a working URL, update and retry
          updateApiBaseUrl(workingUrl);
          const response = await api.post("/auth/login", { identifier, password });
          return response.data;
        }
      }
      
      // If it's not a network error or we couldn't find a working URL, rethrow
      throw error;
    }
  } catch (error: any) {
    throw handleApiError(error, "Login failed");
  }
}

export const verifyToken = async (token: string): Promise<{ valid: boolean }> => {
  try {
    const response = await api.get("/auth/verify", authHeader(token))
    return response.data
  } catch (error) {
    return { valid: false }
  }
}

export const logout = async (token: string): Promise<void> => {
  try {
    await api.post("/auth/logout", {}, authHeader(token))
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>
    console.error("API logout error:", axiosError)
  }
}

// User profile services
export const getUserProfile = async (token: string): Promise<User> => {
  try {
    const response = await api.get("/users/profile", authHeader(token))
    return response.data
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>
    console.error("API profile error:", axiosError)
    throw new Error(axiosError.response?.data?.message || "Failed to fetch user profile")
  }
}

export const updateUserProfile = async (profileData: Partial<User>, token: string): Promise<User> => {
  try {
    const response = await api.put("/users/profile", profileData, authHeader(token))
    return response.data
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>
    console.error("API update profile error:", axiosError)
    throw new Error(axiosError.response?.data?.message || "Failed to update profile")
  }
}

// Dashboard services
export const fetchUserDashboardData = async (userId: string, token?: string): Promise<DashboardData> => {
  try {
    // Get user profile and reservations
    const [profileRes, reservationsRes] = await Promise.all([
      api.get("/users/profile", token ? authHeader(token) : {}),
      api.get(`/reservations/user/${userId}`, token ? authHeader(token) : {})
    ])

    const reservations = reservationsRes.data;
    
    // Compute dashboard metrics
    const activeReservations = reservations.filter(
      (res: Reservation) => res.status === "confirmed" || res.status === "pending"
    ).length;
    
    const completedReservations = reservations.filter(
      (res: Reservation) => res.status === "completed"
    ).length;

    return {
      user: profileRes.data,
      reservations,
      activeReservations,
      completedReservations
    }
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>
    console.error("API dashboard error:", axiosError)
    throw new Error(axiosError.response?.data?.message || "Failed to fetch dashboard data")
  }
}

// Reservation services
export const getUserReservations = async (userId: string, token: string): Promise<Reservation[]> => {
  try {
    // Skip API call if userId is empty (used by our mock fallback)
    if (!userId) {
      return [];
    }
    
    const response = await fetch(`${ACTIVE_API_URL}/reservations/user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user reservations:', error);
    throw error;
  }
};

export const createReservation = async (reservationData: ReservationCreateData, token: string): Promise<Reservation> => {
  try {
    const response = await fetch(`${ACTIVE_API_URL}/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(reservationData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating reservation:', error);
    throw error;
  }
};

export const cancelReservation = async (reservationId: string, token: string): Promise<Reservation> => {
  try {
    // Try the /cancel endpoint
    const response = await fetch(`${ACTIVE_API_URL}/reservations/${reservationId}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      // If that fails, try a standard update approach
      const updateResponse = await fetch(`${ACTIVE_API_URL}/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'cancelled' })
      });

      if (!updateResponse.ok) {
        throw new Error(`Failed to cancel reservation: ${updateResponse.status}`);
      }
      
      return await updateResponse.json();
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    throw error;
  }
};

export const getAvailableTimeSlots = async (facilityId: string, date: string, token: string): Promise<string[]> => {
  try {
    const response = await fetch(`${ACTIVE_API_URL}/facilities/${facilityId}/available-slots?date=${date}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch available time slots: ${response.status}`);
    }

    const data = await response.json();
    return data.availableSlots;
  } catch (error) {
    console.error('Error fetching available time slots:', error);
    throw error;
  }
};
