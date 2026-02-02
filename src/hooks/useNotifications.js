'use client';

import { useState, useEffect } from 'react';

export function useNotifications() {
  const [permission, setPermission] = useState('default');
  const [subscription, setSubscription] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Cek apakah browser mendukung notifications dan service worker
    const supported =
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window;

    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported in this browser');
    }

    try {
      setIsLoading(true);
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const subscribe = async () => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported in this browser');
    }

    if (permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    try {
      setIsLoading(true);

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Get VAPID public key from server
      const response = await fetch('/api/notifications/send');
      const { publicKey } = await response.json();

      // Subscribe to push notifications
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Save subscription to server
      const token = localStorage.getItem('token');
      const saveResponse = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subscription: pushSubscription.toJSON(),
        }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save subscription');
      }

      setSubscription(pushSubscription);
      return pushSubscription;
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!subscription) {
      return;
    }

    try {
      setIsLoading(true);

      // Unsubscribe from push manager
      await subscription.unsubscribe();

      // Remove subscription from server
      const token = localStorage.getItem('token');
      await fetch('/api/notifications/subscribe', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      });

      setSubscription(null);
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const checkSubscription = async () => {
    if (!isSupported) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();
      setSubscription(pushSubscription);
      return pushSubscription;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return null;
    }
  };

  return {
    permission,
    subscription,
    isSupported,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
    checkSubscription,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
