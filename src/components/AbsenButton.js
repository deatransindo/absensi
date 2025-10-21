'use client';

import { useState } from 'react';
import CameraCapture from './CameraCapture';
import LocationCapture from './LocationCapture';
import toast from 'react-hot-toast';
import styles from '@/styles/AbsenButton.module.css';

export default function AbsenButton({ type, onSuccess }) {
  const [showCamera, setShowCamera] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState(null);
  const [dailyReport, setDailyReport] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!photo || !location) {
      toast.error('Harap ambil foto dan lokasi terlebih dahulu');
      return;
    }

    if (type === 'checkout' && !dailyReport.trim()) {
      toast.error('Harap isi laporan harian');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = type === 'checkin' ? '/api/absensi/checkin' : '/api/absensi/checkout';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lat: location.lat,
          lng: location.lng,
          address: location.address,
          photo,
          dailyReport: type === 'checkout' ? dailyReport : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan');
      }

      toast.success(data.message);
      onSuccess();

      // Reset state
      setPhoto(null);
      setLocation(null);
      setDailyReport('');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        {type === 'checkin' ? 'Check In' : 'Check Out'}
      </h2>

      <LocationCapture
        onLocationCapture={(lat, lng, address) => setLocation({ lat, lng, address })}
      />

      {location && (
        <div className={styles.locationInfo}>
          <p>{location.address}</p>
        </div>
      )}

      <div className={styles.photoSection}>
        {photo ? (
          <div className={styles.photoPreview}>
            <img src={photo} alt="Captured" />
            <button onClick={() => setPhoto(null)} className={styles.deleteBtn}>
              Hapus
            </button>
          </div>
        ) : (
          <button onClick={() => setShowCamera(true)} className={styles.cameraBtn}>
            📷 Ambil Foto Selfie
          </button>
        )}
      </div>

      {type === 'checkout' && (
        <div className={styles.reportSection}>
          <label className={styles.label}>Laporan Harian</label>
          <textarea
            value={dailyReport}
            onChange={(e) => setDailyReport(e.target.value)}
            className={styles.textarea}
            placeholder="Tuliskan kegiatan dan hasil kerja hari ini..."
          />
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !photo || !location}
        className={styles.submitBtn}
      >
        {loading ? 'Memproses...' : type === 'checkin' ? 'Check In Sekarang' : 'Check Out Sekarang'}
      </button>

      {showCamera && (
        <CameraCapture
          onCapture={(photoData) => {
            setPhoto(photoData);
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}