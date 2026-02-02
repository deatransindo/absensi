// Service Worker untuk menangani push notifications

self.addEventListener('push', function (event) {
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const title = data.title || 'Notifikasi Absensi';
  const options = {
    body: data.body || 'Anda memiliki notifikasi baru',
    icon: data.icon || '/favicon.svg',
    badge: data.badge || '/favicon.svg',
    vibrate: [200, 100, 200],
    tag: data.tag || 'absensi-notification',
    requireInteraction: true,
    data: data.data || {},
    actions: [
      {
        action: 'open',
        title: 'Buka',
      },
      {
        action: 'close',
        title: 'Tutup',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Buka halaman yang sesuai
  const urlToOpen = event.notification.data.url || '/user';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (clientList) {
        // Cek apakah ada window yang sudah terbuka
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // Jika tidak ada, buka window baru
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener('notificationclose', function (event) {
  console.log('Notification was closed', event);
});
