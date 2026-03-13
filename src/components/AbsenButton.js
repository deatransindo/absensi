'use client';

import { useState } from 'react';
import CameraCapture from './CameraCapture';
import LocationCapture from './LocationCapture';
import toast from 'react-hot-toast';
import { Camera, Trash2, LogIn, LogOut, ClipboardList, CheckCircle2, Loader2 } from 'lucide-react';
import styles from '@/styles/AbsenButton.module.css';

export default function AbsenButton({ type, onSuccess }) {
  const [showCamera, setShowCamera] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState(null);
  const [dailyReport, setDailyReport] = useState('');
  const [loading, setLoading] = useState(false);

  const isCheckin = type === 'checkin';

  const handleSubmit = async () => {
    if (!photo || !location) {
      toast.error('Harap ambil foto dan lokasi terlebih dahulu');
      return;
    }
    if (!isCheckin && !dailyReport.trim()) {
      toast.error('Harap isi laporan harian');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = isCheckin ? '/api/absensi/checkin' : '/api/absensi/checkout';
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
          dailyReport: !isCheckin ? dailyReport : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Terjadi kesalahan');
      toast.success(data.message);
      onSuccess();
      setPhoto(null);
      setLocation(null);
      setDailyReport('');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = photo && location && (isCheckin || dailyReport.trim());
  const totalSteps = isCheckin ? 3 : 4;
  const step = !location ? 1 : !photo ? 2 : !isCheckin && !dailyReport.trim() ? 3 : totalSteps;

  return (
    <div className={`${styles.container} ${isCheckin ? styles.checkinCard : styles.checkoutCard}`}>
      <div className={styles.cardHeader}>
        <div className={`${styles.headerIcon} ${isCheckin ? styles.headerIconIn : styles.headerIconOut}`}>
          {isCheckin ? <LogIn size={20} strokeWidth={2.5} /> : <LogOut size={20} strokeWidth={2.5} />}
        </div>
        <div>
          <h2 className={styles.title}>{isCheckin ? 'Check In' : 'Check Out'}</h2>
          <p className={styles.subtitle}>Langkah {step} dari {totalSteps}</p>
        </div>
      </div>

      <div className={styles.steps}>
        {[
          { n: 1, label: 'Lokasi' },
          { n: 2, label: 'Selfie' },
          ...(!isCheckin ? [{ n: 3, label: 'Laporan' }] : []),
        ].map(({ n, label }) => (
          <div key={n} className={`${styles.step} ${step > n ? styles.stepDone : step === n ? styles.stepActive : ''}`}>
            <div className={styles.stepDot}>
              {step > n ? <CheckCircle2 size={13} /> : <span>{n}</span>}
            </div>
            <span className={styles.stepLabel}>{label}</span>
          </div>
        ))}
      </div>

      <LocationCapture
        onLocationCapture={(lat, lng, address) => setLocation({ lat, lng, address })}
      />

      <div className={styles.photoSection}>
        {photo ? (
          <div className={styles.photoPreview}>
            <img src={photo} alt="Selfie" />
            <div className={styles.photoOverlay}>
              <button onClick={() => setPhoto(null)} className={styles.deleteBtn}>
                <Trash2 size={14} /> Ulangi
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowCamera(true)} className={styles.cameraBtn}>
            <Camera size={28} strokeWidth={1.5} className={styles.cameraIcon} />
            <span className={styles.cameraBtnTitle}>Ambil Selfie</span>
            <span className={styles.cameraBtnSub}>Tap untuk membuka kamera</span>
          </button>
        )}
      </div>

      {!isCheckin && (
        <div className={styles.reportSection}>
          <label className={styles.label}>
            <ClipboardList size={13} strokeWidth={2} />
            Laporan Harian
          </label>
          <textarea
            value={dailyReport}
            onChange={(e) => setDailyReport(e.target.value)}
            className={styles.textarea}
            placeholder="Tuliskan kegiatan dan hasil kerja hari ini..."
            rows={4}
          />
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !canSubmit}
        className={`${styles.submitBtn} ${isCheckin ? styles.submitBtnIn : styles.submitBtnOut}`}
      >
        {loading ? (
          <><Loader2 size={18} className={styles.spinIcon} /> Memproses...</>
        ) : isCheckin ? (
          <><LogIn size={18} /> Check In Sekarang</>
        ) : (
          <><LogOut size={18} /> Check Out Sekarang</>
        )}
      </button>

      {showCamera && (
        <CameraCapture
          onCapture={(photoData) => { setPhoto(photoData); setShowCamera(false); }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}
