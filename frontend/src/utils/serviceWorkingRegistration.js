// frontend/src/utils/serviceWorkerRegistration.js
export function register() {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((registration) => {
            console.log('ServiceWorker registration successful');
            
            // Register sync
            registration.sync.register('sync-orders').catch(err => {
              console.error('Background sync registration failed:', err);
            });
          })
          .catch((error) => {
            console.error('ServiceWorker registration failed:', error);
          });
      });
    }
  }
  
  export function unregister() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          registration.unregister();
        })
        .catch((error) => {
          console.error(error.message);
        });
    }
  }