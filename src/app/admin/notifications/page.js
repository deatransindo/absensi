'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import toast, { Toaster } from 'react-hot-toast';
import styles from '@/styles/Admin.module.css';

export default function NotificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  // Auto logout after 30 minutes
  useAutoLogout();

  const sendNotifications = async (type) => {
    if (loading) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send notifications');
      }

      setResults(data.results);
      toast.success(
        `Notifikasi ${type === 'checkin' ? 'check-in' : 'check-out'} berhasil dikirim!`
      );
    } catch (error) {
      console.error('Error sending notifications:', error);
      toast.error(error.message || 'Gagal mengirim notifikasi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <Toaster position="top-center" />
      <Navbar />

      <div className={styles.contentContainer}>
        <div className={styles.header}>
          <h2 className={styles.headerTitle}>Kelola Notifikasi</h2>
          <p className={styles.headerSubtitle}>
            Kirim pengingat check-in dan check-out ke user
          </p>
        </div>

        <div className={styles.notificationSection}>
          <div className={styles.notificationCard}>
            <div className={styles.notificationIcon}>⏰</div>
            <h3 className={styles.notificationCardTitle}>
              Pengingat Check-in
            </h3>
            <p className={styles.notificationCardDesc}>
              Kirim notifikasi ke user yang belum check-in hari ini
            </p>
            <button
              onClick={() => sendNotifications('checkin')}
              disabled={loading}
              className={styles.notificationBtn}
            >
              {loading ? 'Mengirim...' : 'Kirim Notifikasi Check-in'}
            </button>
          </div>

          <div className={styles.notificationCard}>
            <div className={styles.notificationIcon}>🔔</div>
            <h3 className={styles.notificationCardTitle}>
              Pengingat Check-out
            </h3>
            <p className={styles.notificationCardDesc}>
              Kirim notifikasi ke user yang sudah check-in tapi belum check-out
            </p>
            <button
              onClick={() => sendNotifications('checkout')}
              disabled={loading}
              className={styles.notificationBtn}
            >
              {loading ? 'Mengirim...' : 'Kirim Notifikasi Check-out'}
            </button>
          </div>
        </div>

        {results && (
          <div className={styles.resultsContainer}>
            <h3 className={styles.resultsTitle}>Hasil Pengiriman</h3>
            <div className={styles.resultsStats}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{results.total}</div>
                <div className={styles.statLabel}>Total User</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{results.sent}</div>
                <div className={styles.statLabel}>Berhasil Dikirim</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{results.failed}</div>
                <div className={styles.statLabel}>Gagal</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{results.noSubscription}</div>
                <div className={styles.statLabel}>Belum Subscribe</div>
              </div>
            </div>

            {results.details && results.details.length > 0 && (
              <div className={styles.detailsTable}>
                <h4 className={styles.detailsTitle}>Detail Pengiriman</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Nama User</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.details.map((detail, index) => (
                      <tr key={index}>
                        <td>{detail.name}</td>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${
                              styles[detail.status]
                            }`}
                          >
                            {detail.status === 'sent'
                              ? '✓ Terkirim'
                              : detail.status === 'failed'
                              ? '✗ Gagal'
                              : '○ Belum Subscribe'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className={styles.infoBox}>
          <h4 className={styles.infoTitle}>ℹ️ Informasi</h4>
          <ul className={styles.infoList}>
            <li>
              Notifikasi hanya dikirim ke user yang sudah mengaktifkan
              notifikasi di aplikasi mereka
            </li>
            <li>
              User akan menerima notifikasi langsung di layar HP/browser mereka
            </li>
            <li>
              Notifikasi check-in dikirim ke user yang belum check-in hari ini
            </li>
            <li>
              Notifikasi check-out dikirim ke user yang sudah check-in tapi
              belum check-out
            </li>
            <li>
              Anda dapat menjalankan notifikasi ini secara manual atau
              menggunakan scheduled job (cron)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
