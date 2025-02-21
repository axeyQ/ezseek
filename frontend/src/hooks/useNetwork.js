// frontend/src/hooks/useNetwork.js
import { useState, useEffect } from 'react';
import useStore from '../store/realTimeStore';

export function useNetwork() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { setOnlineStatus, syncOfflineData } = useStore();

  useEffect(() => {
    function updateOnlineStatus() {
      const status = navigator.onLine;
      setIsOnline(status);
      setOnlineStatus(status);
      
      if (status) {
        // When we come back online, sync data
        syncOfflineData();
      }
    }

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [setOnlineStatus, syncOfflineData]);

  return isOnline;
}