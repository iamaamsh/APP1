import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

type NetworkContextType = {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
};

const NetworkContext = createContext<NetworkContextType>({
  isConnected: null,
  isInternetReachable: null,
});

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkContextType>({
    isConnected: null,
    isInternetReachable: null,
  });

  // Show alert when connection is lost
  useEffect(() => {
    if (networkStatus.isConnected === false) {
      Alert.alert(
        'No Connection',
        'You are currently offline. Some features may be unavailable.',
        [{ text: 'OK' }]
      );
    }
  }, [networkStatus.isConnected]);

  useEffect(() => {
    // Subscribe to network changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkStatus({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
      });
    });

    // Initial network check
    NetInfo.fetch().then(state => {
      setNetworkStatus({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
      });
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <NetworkContext.Provider value={networkStatus}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetworkStatus = () => {
  return useContext(NetworkContext);
}; 