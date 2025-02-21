// frontend/src/components/ui/OfflineStatus.js
'use client';

import { useEffect, useState } from 'react';
import useStore from '@/store/store';

export default function OfflineStatus() {
  const isOnline = useStore(state => state.isOnline);
  const isSyncing = useStore(state => state.isSyncing);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!isOnline || isSyncing) {
      setShowBanner(true);
    } else {
      const timer = setTimeout(() => setShowBanner(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, isSyncing]);

  if (!showBanner) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
        isOnline ? 'bg-yellow-100' : 'bg-red-100'
      }`}
    >
      <div className="flex items-center space-x-2">
        <div
          className={`w-3 h-3 rounded-full ${
            isOnline ? 'bg-yellow-500' : 'bg-red-500'
          }`}
        />
        <span className={isOnline ? 'text-yellow-800' : 'text-red-800'}>
          {!isOnline 
            ? 'You are offline. Changes will sync when you reconnect.' 
            : isSyncing 
              ? 'Syncing changes...' 
              : 'All changes synced'}
        </span>
      </div>
    </div>
  );
}