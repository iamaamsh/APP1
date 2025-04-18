import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addNotificationReceivedListener, addNotificationResponseReceivedListener } from '../utils/notifications';

interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  timestamp: Date;
  data?: Record<string, any>;
}

const NotificationCenter: React.FC<{
  visible: boolean;
  onClose: () => void;
  onNotificationPress?: (notification: Notification) => void;
}> = ({ visible, onClose, onNotificationPress }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Handle incoming notifications
  useEffect(() => {
    // Listen for received notifications
    const receivedSubscription = addNotificationReceivedListener(notification => {
      const newNotification: Notification = {
        id: Math.random().toString(36).substring(2, 15),
        title: notification.request.content.title || 'New Notification',
        body: notification.request.content.body || '',
        read: false,
        timestamp: new Date(),
        data: notification.request.content.data as Record<string, any>,
      };
      
      setNotifications(prev => [newNotification, ...prev]);
    });
    
    // Listen for notification responses
    const responseSubscription = addNotificationResponseReceivedListener(response => {
      const notificationData = response.notification.request.content.data as Record<string, any>;
      
      // Mark as read
      const notificationId = notificationData.id || Math.random().toString(36).substring(2, 15);
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      
      // Handle the notification press if callback is provided
      if (onNotificationPress) {
        onNotificationPress({
          id: notificationId,
          title: response.notification.request.content.title || 'Notification',
          body: response.notification.request.content.body || '',
          read: true,
          timestamp: new Date(),
          data: notificationData,
        });
      }
    });
    
    // Clean up
    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [onNotificationPress]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleNotificationPress = (notification: Notification) => {
    markAsRead(notification.id);
    
    if (onNotificationPress) {
      onNotificationPress(notification);
    }
    
    onClose();
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.notificationBox}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#4b5563" />
            </TouchableOpacity>
          </View>
          
          {notifications.length > 0 ? (
            <>
              <TouchableOpacity 
                style={styles.clearAllButton}
                onPress={clearAllNotifications}
              >
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
              
              <FlatList
                data={notifications}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.notificationList}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[
                      styles.notificationItem,
                      !item.read && styles.unreadNotification
                    ]}
                    onPress={() => handleNotificationPress(item)}
                  >
                    <View style={styles.notificationIcon}>
                      <Ionicons 
                        name="notifications-outline" 
                        size={24} 
                        color={item.read ? "#9ca3af" : "#25a244"} 
                      />
                    </View>
                    <View style={styles.notificationContent}>
                      <Text style={styles.notificationTitle}>{item.title}</Text>
                      <Text style={styles.notificationBody}>{item.body}</Text>
                      <Text style={styles.notificationTime}>
                        {formatTimestamp(item.timestamp)}
                      </Text>
                    </View>
                    {!item.read && <View style={styles.unreadIndicator} />}
                  </TouchableOpacity>
                )}
              />
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  notificationBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  clearAllButton: {
    alignSelf: 'flex-end',
    padding: 8,
    marginRight: 16,
    marginTop: 8,
  },
  clearAllText: {
    color: '#3b82f6',
    fontWeight: '500',
  },
  notificationList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#fff',
  },
  unreadNotification: {
    backgroundColor: '#f0fdf4',
  },
  notificationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#25a244',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9ca3af',
  },
});

export default NotificationCenter; 