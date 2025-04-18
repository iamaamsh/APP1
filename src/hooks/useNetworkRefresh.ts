import { useEffect, useRef, useState } from 'react';
import { useNetworkStatus } from '../utils/network-status';

/**
 * A hook that triggers refresh operations when network connectivity returns
 * after being offline.
 * 
 * @param refreshCallback Function to call when network connectivity returns
 * @returns An object with the current network state and a resetRefresh function
 */
export const useNetworkRefresh = (refreshCallback: () => Promise<void>) => {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const [refreshing, setRefreshing] = useState(false);
  const wasOffline = useRef(false);

  // Monitor network connectivity changes
  useEffect(() => {
    const shouldRefresh = wasOffline.current && isConnected === true;
    
    if (isConnected === false) {
      wasOffline.current = true;
    } else if (shouldRefresh) {
      handleRefresh();
      wasOffline.current = false;
    }
  }, [isConnected]);

  const handleRefresh = async () => {
    if (!isConnected) return;
    
    try {
      setRefreshing(true);
      await refreshCallback();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const resetRefresh = () => {
    wasOffline.current = false;
  };

  return {
    isOnline: isConnected === true,
    isOffline: isConnected === false,
    isInternetReachable,
    refreshing,
    handleRefresh,
    resetRefresh
  };
}; 