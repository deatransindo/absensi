'use client';

import { useState } from 'react';
import { MapPin, Navigation, CheckCircle, Loader } from 'lucide-react';
import styles from '@/styles/LocationCapture.module.css';

export default function LocationCapture({ onLocationCapture }) {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');

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
            const addr = data.display_name || 'Alamat tidak ditemukan';
            setAddress(addr);
            onLocationCapture(lat, lng, addr);
          } catch (error) {
            const coord = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            setAddress(coord);
            onLocationCapture(lat, lng, coord);
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

  if (location) {
    return (
      <div className={styles.container}>
        <div className={styles.btnSuccess}>
          <CheckCircle size={16} strokeWidth={2.5} />
          <span>Lokasi Terdeteksi</span>
        </div>
        <div className={styles.locationCard}>
          <MapPin size={14} className={styles.locationIcon} />
          <p className={styles.locationText}>{address}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button onClick={getLocation} disabled={loading} className={styles.btn}>
        {loading ? (
          <><Loader size={16} className={styles.spinIcon} /><span>Mendeteksi lokasi...</span></>
        ) : (
          <><Navigation size={16} strokeWidth={2} /><span>Dapatkan Lokasi</span></>
        )}
      </button>
    </div>
  );
}
