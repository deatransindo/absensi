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
import {
  History, MapPin, Bell, CheckCircle2,
  LogIn, LogOut, Clock, Timer, X
} from 'lucide-react';
import styles from '@/styles/Marketing.module.css';

export default function UserDashboard() {
  const router = useRouter();
  const [todayAbsensi, setTodayAbsensi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  useAutoLogout();

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
    if (!token) { router.push('/login'); return; }
    fetchTodayAbsensi();
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    if (!isSupported) return;
    const existingSubscription = await checkSubscription();
    if (!existingSubscription && permission === 'default') {
      setTimeout(() => setShowNotificationPrompt(true), 2000);
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
      toast.error('Gagal mengaktifkan notifikasi');
    }
  };

  const fetchTodayAbsensi = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/absensi/today', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch');
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

          {/* Header */}
          <div className={styles.header}>
            <h2 className={styles.headerTitle}>Dashboard</h2>
            <p className={styles.headerDate}>
              {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })}
            </p>
          </div>

          {/* Notification Prompt */}
          {showNotificationPrompt && (
            <div className={styles.notificationPrompt}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                  <Bell size={15} style={{ color: '#6366f1' }} />
                  <p className={styles.notificationTitle}>Aktifkan Notifikasi</p>
                </div>
                <button
                  onClick={() => {
                    setShowNotificationPrompt(false);
                    localStorage.setItem('notificationPromptDismissed', Date.now().toString());
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}
                >
                  <X size={14} />
                </button>
              </div>
              <p className={styles.notificationText}>
                Dapatkan pengingat check-in & check-out langsung di HP Anda
              </p>
              <div className={styles.notificationButtons}>
                <button onClick={handleEnableNotifications} className={styles.notificationEnableBtn} disabled={notificationLoading}>
                  {notificationLoading ? 'Mengaktifkan...' : 'Aktifkan'}
                </button>
                <button onClick={() => {
                  setShowNotificationPrompt(false);
                  localStorage.setItem('notificationPromptDismissed', Date.now().toString());
                }} className={styles.notificationDismissBtn}>
                  Nanti
                </button>
              </div>
            </div>
          )}

          {/* Main content */}
          {loading ? (
            <div className={styles.loading} />
          ) : (
            <>
              {!hasCheckedIn && (
                <AbsenButton type="checkin" onSuccess={fetchTodayAbsensi} />
              )}

              {hasCheckedIn && !hasCheckedOut && (
                <div className={styles.absensiContainer}>
                  <div className={styles.successAlert}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                      <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                      <p className={styles.successText}>Sudah Check-in hari ini</p>
                    </div>
                    <p className={styles.successTime}>
                      <Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      Check-in: {format(new Date(todayAbsensi.checkInTime), 'HH:mm')}
                    </p>
                  </div>
                  <AbsenButton type="checkout" onSuccess={fetchTodayAbsensi} />
                </div>
              )}

              {hasCheckedOut && (
                <div className={styles.completedAlert}>
                  <p className={styles.completedTitle}>Absensi Hari Ini Lengkap</p>
                  <div className={styles.completedInfo}>
                    <p>
                      <LogIn size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      Check-in: {format(new Date(todayAbsensi.checkInTime), 'HH:mm')}
                    </p>
                    <p>
                      <LogOut size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      Check-out: {format(new Date(todayAbsensi.checkOutTime), 'HH:mm')}
                    </p>
                    <p>
                      <Timer size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      Durasi: {Math.floor(todayAbsensi.workDuration / 60)}j {todayAbsensi.workDuration % 60}m
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Quick menu */}
          <div className={styles.menuGrid}>
            <a href="/user/history" className={styles.menuCard}>
              <History size={36} strokeWidth={1.5} style={{ color: '#6366f1' }} />
              <p className={styles.menuTitle}>Riwayat Absensi</p>
            </a>
            <a href="/user/visits" className={styles.menuCard}>
              <MapPin size={36} strokeWidth={1.5} style={{ color: '#10b981' }} />
              <p className={styles.menuTitle}>Kunjungan</p>
            </a>
          </div>

        </div>
      </div>
    </PageLayout>
  );
}
