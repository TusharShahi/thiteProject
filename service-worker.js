self.addEventListener('push', function(e) {
    var options = {
      body: 'This notification was generated from a push!',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2'
      },

    };
    e.waitUntil(
      self.registration.showNotification('Hello world!', options)
    );
  });

  self.addEventListener('install', event => {
    console.log('Service worker installing...');
    self.skipWaiting();
  });
  
  self.addEventListener('activate', event => {
    console.log('Service worker activating...');
  });

  self.addEventListener('notificationclick', event => {

    clients.openWindow('/enterPage');
  });

  self.addEventListener('notificationclose', event => {
    const notification = event.notification;
    const primaryKey = notification.data.primaryKey;

    console.log('Closed notification: ' + primaryKey);
  })