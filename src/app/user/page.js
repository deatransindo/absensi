'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import AbsenButton from '@/components/AbsenButton';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import { useNotifications } from '@/hooks/useNotifications';
import toast, { Toaster } from 'react-hot-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Image from 'next/image';
import styles from '@/styles/Marketing.module.css';

export default function UserDashboard() {
  const router = useRouter();
  const [todayAbsensi, setTodayAbsensi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  // Auto logout after 30 minutes
  useAutoLogout();

  // Notification hook
  const {
    permission,
    isSupported,
    isLoading: notificationLoading,
    requestPermission,
    subscribe,
    checkSubscription,
  } = useNotifications();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchTodayAbsensi();
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    if (!isSupported) return;

    const existingSubscription = await checkSubscription();

    // Tampilkan prompt jika browser support dan belum ada subscription
    if (!existingSubscription && permission === 'default') {
      // Tunggu 2 detik sebelum menampilkan prompt agar tidak mengganggu
      setTimeout(() => {
        setShowNotificationPrompt(true);
      }, 2000);
    }
  };

  const handleEnableNotifications = async () => {
    try {
      const result = await requestPermission();

      if (result === 'granted') {
        await subscribe();
        toast.success('Notifikasi berhasil diaktifkan!');
        setShowNotificationPrompt(false);
      } else if (result === 'denied') {
        toast.error('Izin notifikasi ditolak');
        setShowNotificationPrompt(false);
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast.error('Gagal mengaktifkan notifikasi');
    }
  };

  const handleDismissNotification = () => {
    setShowNotificationPrompt(false);
    // Simpan di localStorage agar tidak muncul lagi untuk sementara
    localStorage.setItem('notificationPromptDismissed', Date.now().toString());
  };

  const fetchTodayAbsensi = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/absensi/today', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch');
      }

      const data = await response.json();
      setTodayAbsensi(data.absensi);
    } catch (error) {
      console.error('Error fetching today absensi:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasCheckedIn = todayAbsensi?.checkInTime;
  const hasCheckedOut = todayAbsensi?.checkOutTime;

  return (
    <PageLayout>
      <div className={styles.pageContainer}>
        <Toaster position="top-center" />

        <div className={styles.contentContainer}>
          <div className={styles.header}>
            <h2 className={styles.headerTitle}>Dashboard User</h2>
            <p className={styles.headerDate}>
              {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })}
            </p>
          </div>

          {/* Notification Prompt */}
          {showNotificationPrompt && (
            <div className={styles.notificationPrompt}>
              <div className={styles.notificationContent}>
                <p className={styles.notificationTitle}>
                  Aktifkan Notifikasi
                </p>
                <p className={styles.notificationText}>
                  Dapatkan pengingat untuk check-in dan check-out langsung di
                  layar HP Anda
                </p>
                <div className={styles.notificationButtons}>
                  <button
                    onClick={handleEnableNotifications}
                    className={styles.notificationEnableBtn}
                    disabled={notificationLoading}
                  >
                    {notificationLoading ? 'Mengaktifkan...' : 'Aktifkan'}
                  </button>
                  <button
                    onClick={handleDismissNotification}
                    className={styles.notificationDismissBtn}
                  >
                    Nanti Saja
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className={styles.loading}>Loading...</div>
          ) : (
            <>
              {!hasCheckedIn && (
                <AbsenButton type="checkin" onSuccess={fetchTodayAbsensi} />
              )}

              {hasCheckedIn && !hasCheckedOut && (
                <div className={styles.absensiContainer}>
                  <div className={styles.successAlert}>
                    <p className={styles.successText}>
                      Anda sudah check-in hari ini
                    </p>
                    <p className={styles.successTime}>
                      Check-in:{' '}
                      {format(new Date(todayAbsensi.checkInTime), 'HH:mm')}
                    </p>
                  </div>

                  <AbsenButton type="checkout" onSuccess={fetchTodayAbsensi} />
                </div>
              )}

              {hasCheckedOut && (
                <div className={styles.completedAlert}>
                  <p className={styles.completedTitle}>
                    Absensi hari ini sudah lengkap
                  </p>
                  <div className={styles.completedInfo}>
                    <p>
                      Check-in:{' '}
                      {format(new Date(todayAbsensi.checkInTime), 'HH:mm')}
                    </p>
                    <p>
                      Check-out:{' '}
                      {format(new Date(todayAbsensi.checkOutTime), 'HH:mm')}
                    </p>
                    <p>
                      Durasi kerja: {Math.floor(todayAbsensi.workDuration / 60)}{' '}
                      jam {todayAbsensi.workDuration % 60} menit
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          <div className={styles.menuGrid}>
            <a href="/user/history" className={styles.menuCard}>
              <Image
                src="/Icons/history.svg"
                alt="history"
                width={100}
                height={100}
                priority
              />
              <p className={styles.menuTitle}>Riwayat Absensi</p>
            </a>
            <a href="/user/visits" className={styles.menuCard}>
              <Image
                src="/Icons/visit.svg"
                alt="visit"
                width={100}
                height={100}
                priority
              />
              <p className={styles.menuTitle}>Kunjungan</p>
            </a>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
