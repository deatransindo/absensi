'use client';

import { useState } from 'react';
import styles from '@/styles/LocationCapture.module.css';

export default function LocationCapture({ onLocationCapture }) {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);

  const getLocation = () => {
    setLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocation({ lat, lng });

          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
            );
            const data = await response.json();
            const address = data.display_name || 'Alamat tidak ditemukan';
            onLocationCapture(lat, lng, address);
          } catch (error) {
            onLocationCapture(lat, lng, `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          }
          setLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Tidak dapat mengakses lokasi');
          setLoading(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert('Geolocation tidak didukung oleh browser Anda');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <button
        onClick={getLocation}
        disabled={loading}
        className={location ? styles.btnSuccess : styles.btnPrimary}
      >
        {loading ? 'Getting Location...' : location ? '✓ Location Detect' : 'Get Location'}
      </button>
      {location && (
        <p className={styles.locationText}>
          Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
        </p>
      )}
    </div>
  );
}