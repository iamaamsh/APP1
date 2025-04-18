"use client"

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ActivityIndicator,
  Platform
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../contexts/auth-context"
import { useReservation } from "../contexts/reservation-context"
import { createReservation as apiCreateReservation, getAvailableTimeSlots, ACTIVE_API_URL } from '../services/api-service';
import { useNetworkStatus } from "../utils/network-status"
import LottieView from 'lottie-react-native';
import { scheduleReservationReminder } from "../utils/notifications";
import DateTimePickerModal from "react-native-modal-datetime-picker"

// Define facility interface
interface Facility {
  id: string;
  name: string;
  type: string;
}

// Define component props
interface CreateReservationModalProps {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
}

// API call to get facilities - added this function
const fetchFacilities = async (token: string): Promise<Facility[]> => {
  try {
    const response = await fetch(`${ACTIVE_API_URL}/facilities`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch facilities');
    }

    const data = await response.json();
    return data.map((facility: any) => ({
      id: facility._id,
      name: facility.name,
      type: facility.type
    }));
  } catch (error) {
    console.error('Error fetching facilities:', error);
    throw error;
  }
};

const CreateReservationModal: React.FC<CreateReservationModalProps> = ({ visible, onClose, onSuccess }) => {
  const { user, token } = useAuth()
  const { createReservation } = useReservation()
  const { isConnected } = useNetworkStatus()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false)
  const [submissionSuccess, setSubmissionSuccess] = useState(false)
  
  // Add facilities loading state and state variable
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loadingFacilities, setLoadingFacilities] = useState(false)
  
  // Form data
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null)
  const [date, setDate] = useState(new Date())
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null)
  const [attendees, setAttendees] = useState('1')
  const [notes, setNotes] = useState('')
  
  // Load facilities when the modal opens
  useEffect(() => {
    if (visible && token) {
      const loadFacilities = async () => {
        try {
          setLoadingFacilities(true);
          const facilitiesData = await fetchFacilities(token);
          setFacilities(facilitiesData);
        } catch (error) {
          console.error('Error loading facilities:', error);
          Alert.alert('Error', 'Failed to load facilities. Please try again.');
        } finally {
          setLoadingFacilities(false);
        }
      };
      
      loadFacilities();
    }
  }, [visible, token]);
  
  // Function to fetch available time slots
  const fetchTimeSlots = async () => {
    if (!selectedFacility || !token) return
    
    if (!isConnected) {
      Alert.alert('No Connection', 'Please check your internet connection and try again.')
      return
    }
    
    try {
      setLoadingTimeSlots(true)
      // Format date as YYYY-MM-DD
      const formattedDate = date.toISOString().split('T')[0]
      const timeSlots = await getAvailableTimeSlots(selectedFacility.id, formattedDate, token)
      setAvailableTimeSlots(timeSlots)
      
      if (timeSlots.length === 0) {
        Alert.alert('No Available Times', 'There are no available time slots for this date. Please try another date.')
      }
    } catch (error) {
      console.error('Error fetching time slots:', error)
      Alert.alert('Error', 'Failed to load available time slots')
      setAvailableTimeSlots([])
    } finally {
      setLoadingTimeSlots(false)
    }
  }
  
  // When facility or date changes, fetch available time slots
  useEffect(() => {
    if (step === 2 && selectedFacility) {
      fetchTimeSlots()
    }
  }, [selectedFacility, date, step])
  
  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setStep(1)
      setSelectedFacility(null)
      setDate(new Date())
      setSelectedTimeSlot(null)
      setAttendees('1')
      setNotes('')
      setAvailableTimeSlots([])
    }
  }, [visible])
  
  const handleNextStep = () => {
    if (step === 1 && !selectedFacility) {
      Alert.alert('Error', 'Please select a facility')
      return
    }
    
    if (step === 2 && !selectedTimeSlot) {
      Alert.alert('Error', 'Please select a time slot')
      return
    }
    
    if (step < 3) {
      setStep(step + 1)
    } else {
      handleSubmit()
    }
  }
  
  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    } else {
      onClose()
    }
  }
  
  const handleSubmit = async () => {
    if (!selectedFacility || !selectedTimeSlot || !token || !user?._id) {
      Alert.alert('Error', 'Please fill all required fields')
      return
    }
    
    if (!isConnected) {
      Alert.alert('No Connection', 'Please check your internet connection and try again.')
      return
    }
    
    try {
      setLoading(true)
      
      // Prepare data for API
      const reservationData = {
        facilityId: selectedFacility.id,
        facilityName: selectedFacility.name,
        date: date.toISOString().split('T')[0], // YYYY-MM-DD
        timeSlot: selectedTimeSlot,
        attendees: parseInt(attendees, 10),
        notes: notes.trim() || undefined,
      }
      
      const newReservation = await apiCreateReservation(reservationData, token)
      
      // Schedule a reminder notification
      const notificationId = await scheduleReservationReminder(
        newReservation._id,
        newReservation.facilityName,
        newReservation.date,
        newReservation.timeSlot
      );
      
      if (notificationId) {
        console.log(`Scheduled notification with ID: ${notificationId}`);
      }
      
      setSubmissionSuccess(true)
      
      // Show success animation for 2 seconds before closing
      setTimeout(() => {
        setSubmissionSuccess(false)
        Alert.alert('Success', 'Reservation created successfully')
        onSuccess()
      }, 2000)
    } catch (error) {
      console.error('Error creating reservation:', error)
      Alert.alert('Error', 'Failed to create reservation')
    } finally {
      setLoading(false)
    }
  }
  
  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={[styles.stepDot, step >= 1 ? styles.activeStepDot : {}]} />
      <View style={styles.stepLine} />
      <View style={[styles.stepDot, step >= 2 ? styles.activeStepDot : {}]} />
      <View style={styles.stepLine} />
      <View style={[styles.stepDot, step >= 3 ? styles.activeStepDot : {}]} />
    </View>
  )
  
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Facility</Text>
      
      <ScrollView style={styles.facilitiesList}>
        {facilities.map((facility) => (
          <TouchableOpacity
            key={facility.id}
            style={[
              styles.facilityItem,
              selectedFacility?.id === facility.id ? styles.selectedFacilityItem : {}
            ]}
            onPress={() => setSelectedFacility(facility)}
          >
            <Ionicons 
              name={getFacilityIcon(facility.type) as any} 
              size={24} 
              color={selectedFacility?.id === facility.id ? "#25a244" : "#6b7280"} 
            />
            <Text style={[
              styles.facilityName,
              selectedFacility?.id === facility.id ? styles.selectedFacilityName : {}
            ]}>
              {facility.name}
            </Text>
            {selectedFacility?.id === facility.id && (
              <Ionicons name="checkmark-circle" size={24} color="#25a244" />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
  
  const renderStep2 = () => {
    // Create date options for the next 7 days
    const dateOptions = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      dateOptions.push(date);
    }
    
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Select Date & Time</Text>
        
        <Text style={styles.fieldLabel}>Date</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.datesContainer}
        >
          {dateOptions.map((dateOption, index) => {
            const isSelected = 
              dateOption.getDate() === date.getDate() && 
              dateOption.getMonth() === date.getMonth() && 
              dateOption.getFullYear() === date.getFullYear();
              
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dateItem,
                  isSelected ? styles.selectedDateItem : {}
                ]}
                onPress={() => {
                  setDate(dateOption);
                  setSelectedTimeSlot(null);
                }}
              >
                <Text style={[
                  styles.dateItemDay,
                  isSelected ? styles.selectedDateText : {}
                ]}>
                  {dateOption.toLocaleDateString('en-US', { weekday: 'short' })}
                </Text>
                <Text style={[
                  styles.dateItemDate,
                  isSelected ? styles.selectedDateText : {}
                ]}>
                  {dateOption.getDate()}
                </Text>
                <Text style={[
                  styles.dateItemMonth,
                  isSelected ? styles.selectedDateText : {}
                ]}>
                  {dateOption.toLocaleDateString('en-US', { month: 'short' })}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        
        <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Time Slot</Text>
        {loadingTimeSlots ? (
          <ActivityIndicator size="small" color="#25a244" style={{ marginTop: 10 }} />
        ) : availableTimeSlots.length > 0 ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.timeSlotsContainer}
          >
            {availableTimeSlots.map((slot) => (
              <TouchableOpacity
                key={slot}
                style={[
                  styles.timeSlotItem,
                  selectedTimeSlot === slot ? styles.selectedTimeSlotItem : {}
                ]}
                onPress={() => setSelectedTimeSlot(slot)}
              >
                <Text style={[
                  styles.timeSlotText,
                  selectedTimeSlot === slot ? styles.selectedTimeSlotText : {}
                ]}>
                  {slot}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.noTimeSlotsText}>
            No available time slots for this date
          </Text>
        )}
      </View>
    );
  }
  
  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Additional Information</Text>
      
      <View style={styles.formField}>
        <Text style={styles.fieldLabel}>Number of Attendees</Text>
        <TextInput
          style={styles.input}
          value={attendees}
          onChangeText={setAttendees}
          keyboardType="number-pad"
          placeholder="Enter number of attendees"
        />
      </View>
      
      <View style={styles.formField}>
        <Text style={styles.fieldLabel}>Notes (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any special requests or additional information"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>
      
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Reservation Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Facility:</Text>
          <Text style={styles.summaryValue}>{selectedFacility?.name}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Date:</Text>
          <Text style={styles.summaryValue}>
            {date.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Time:</Text>
          <Text style={styles.summaryValue}>{selectedTimeSlot}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Attendees:</Text>
          <Text style={styles.summaryValue}>{attendees}</Text>
        </View>
      </View>
    </View>
  )
  
  // Helper function to get facility icon
  const getFacilityIcon = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'tennis':
      case 'badminton':
        return 'tennisball-outline';
      case 'basketball':
        return 'basketball-outline';
      case 'squash':
        return 'fitness-outline';
      default:
        return 'calendar-outline';
    }
  }
  
  // Render loading overlay
  const renderLoadingOverlay = () => {
    if (!loading) return null;
    
    return (
      <View style={styles.loadingOverlay}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#25a244" />
          <Text style={styles.loadingText}>Creating reservation...</Text>
        </View>
      </View>
    );
  }
  
  // Render success animation
  const renderSuccessAnimation = () => {
    if (!submissionSuccess) return null;
    
    return (
      <View style={styles.loadingOverlay}>
        <View style={styles.loadingContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#25a244" />
          <Text style={styles.successText}>Reservation Confirmed!</Text>
        </View>
      </View>
    );
  }

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handlePrevStep} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#25a244" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {step === 1 ? 'New Reservation' : 
               step === 2 ? 'Select Time' : 
               'Confirm Details'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          {renderStepIndicator()}
          
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.footerButton} 
              onPress={handlePrevStep}
              disabled={loading || submissionSuccess}
            >
              <Text style={styles.footerButtonText}>
                {step === 1 ? 'Cancel' : 'Back'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.footerButton, 
                styles.primaryButton,
                (!isConnected || loading || submissionSuccess) && styles.disabledButton
              ]}
              onPress={handleNextStep}
              disabled={!isConnected || loading || submissionSuccess}
            >
              {loadingTimeSlots && step === 2 ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {step < 3 ? 'Next' : 'Confirm Reservation'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
          
          {renderLoadingOverlay()}
          {renderSuccessAnimation()}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    height: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#d1d5db',
  },
  activeStepDot: {
    backgroundColor: '#25a244',
    width: 12,
    height: 12,
  },
  stepLine: {
    height: 2,
    width: 40,
    backgroundColor: '#d1d5db',
  },
  stepContainer: {
    flex: 1,
    padding: 16,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 20,
  },
  facilitiesList: {
    flex: 1,
  },
  facilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 12,
  },
  selectedFacilityItem: {
    borderColor: '#25a244',
    backgroundColor: '#f0fdf4',
  },
  facilityName: {
    flex: 1,
    fontSize: 16,
    color: '#4b5563',
    marginLeft: 12,
  },
  selectedFacilityName: {
    color: '#25a244',
    fontWeight: '500',
  },
  dateContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1f2937',
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  timeSlotItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: '#f9fafb',
  },
  selectedTimeSlotItem: {
    borderColor: '#25a244',
    backgroundColor: '#f0fdf4',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#4b5563',
  },
  selectedTimeSlotText: {
    color: '#25a244',
    fontWeight: '500',
  },
  noTimeSlotsText: {
    color: '#6b7280',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
  },
  formField: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  textArea: {
    height: 100,
  },
  summaryContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  modalFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    padding: 16,
  },
  footerButton: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 6,
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4b5563',
  },
  primaryButton: {
    backgroundColor: '#25a244',
  },
  primaryButtonText: {
    color: '#fff',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#4b5563',
  },
  successText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#25a244',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    opacity: 0.7,
  },
  datesContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  dateItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
  },
  selectedDateItem: {
    borderColor: '#25a244',
    backgroundColor: '#f0fdf4',
  },
  dateItemDay: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
  },
  dateItemDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4b5563',
    marginVertical: 4,
  },
  dateItemMonth: {
    fontSize: 14,
    color: '#4b5563',
  },
  selectedDateText: {
    color: '#25a244',
    fontWeight: '500',
  },
})

export default CreateReservationModal
