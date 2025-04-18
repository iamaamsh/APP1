import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '../utils/network-status';

const { width } = Dimensions.get('window');

const NetworkAlertBanner: React.FC = () => {
  const { isConnected } = useNetworkStatus();
  const [visible, setVisible] = useState(false);
  const translateY = useState(new Animated.Value(-60))[0];

  useEffect(() => {
    if (isConnected === false) {
      setVisible(true);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (isConnected === true && visible) {
      Animated.timing(translateY, {
        toValue: -60,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
      });
    }
  }, [isConnected, visible, translateY]);

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { transform: [{ translateY }] }
      ]}
    >
      <Ionicons name="cloud-offline-outline" size={20} color="#fff" />
      <Text style={styles.text}>No internet connection</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    width,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default NetworkAlertBanner; 