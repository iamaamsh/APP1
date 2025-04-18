import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationData {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

// Register for push notifications
export async function registerForPushNotifications() {
  let token;
  
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#25a244',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }
      
      try {
        // Try to get the push token
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        
        // If no projectId is available, we're likely in Expo Go
        // Just return null without an error
        if (!projectId) {
          console.log('No projectId found. Push notifications will not be available in Expo Go.');
          return null;
        }
        
        token = (await Notifications.getExpoPushTokenAsync({
          projectId
        })).data;
      } catch (error) {
        console.log('Error getting push token:', error);
        return null;
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  } catch (error) {
    console.log('Error in registerForPushNotifications:', error);
    return null;
  }
}

// Schedule a local notification
export async function scheduleNotification(notification: PushNotificationData, trigger: any = null) {
  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
      },
      trigger,
    });
  } catch (error) {
    console.log('Error scheduling notification:', error);
    return null;
  }
}

// Schedule a reservation reminder
export async function scheduleReservationReminder(reservationId: string, facilityName: string, date: string, timeSlot: string) {
  try {
    // In Expo Go, we'll just show an immediate notification instead of scheduling
    // This is a workaround since scheduling with specific triggers doesn't work well in Expo Go
    return await scheduleNotification(
      {
        title: 'Reservation Confirmed',
        body: `Your reservation at ${facilityName} on ${new Date(date).toLocaleDateString()} at ${timeSlot} has been confirmed.`,
        data: { type: 'reservation_confirmation', reservationId },
      }
    );
  } catch (error) {
    console.log('Error with reservation notification:', error);
    return null;
  }
}

// Cancel a notification
export async function cancelNotification(notificationId: string) {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

// Handle received notification
export function addNotificationReceivedListener(listener: (notification: Notifications.Notification) => void) {
  return Notifications.addNotificationReceivedListener(listener);
}

// Handle notification response
export function addNotificationResponseReceivedListener(listener: (response: Notifications.NotificationResponse) => void) {
  return Notifications.addNotificationResponseReceivedListener(listener);
}

// Remove notification subscription
export function removeNotificationSubscription(subscription: Notifications.Subscription) {
  Notifications.removeNotificationSubscription(subscription);
} 