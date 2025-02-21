// frontend/src/components/providers/RootProvider.js
'use client';

import { useEffect } from 'react';
import useStore from '@/store/store';
import { register as registerServiceWorker } from '@/utils/serviceWorkerRegistration';

export default function RootProvider({ children }) {
  const { initializeStore, setOnlineStatus, startSync } = useStore();

  useEffect(() => {
    // Initialize store with offline data
    initializeStore();

    // Register service worker
    registerServiceWorker();

    // Setup online/offline handlers
    const handleOnline = () => {
      setOnlineStatus(true);
      startSync();
    };

    const handleOffline = () => {
      setOnlineStatus(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial online status
    setOnlineStatus(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return children;
}