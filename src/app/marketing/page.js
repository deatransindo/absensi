'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import AbsenButton from '@/components/AbsenButton';
import toast, { Toaster } from 'react-hot-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import styles from '@/styles/Marketing.module.css';
import { Link } from 'lucide-react';
import Image from 'next/image';

export default function MarketingDashboard() {
  const router = useRouter();
  const [todayAbsensi, setTodayAbsensi] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchTodayAbsensi();
  }, []);

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
    <div className={styles.pageContainer}>
      <Toaster position="top-center" />
      <Navbar />

      <div className={styles.contentContainer}>
        <div className={styles.header}>
          <h2 className={styles.headerTitle}>Dashboard Karyawan</h2>
          <p className={styles.headerDate}>
            {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })}
          </p>
        </div>

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
                    ✓ Anda sudah check-in hari ini
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
                  ✓ Absensi hari ini sudah lengkap
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
          <a href="/marketing/history" className={styles.menuCard}>
            <Image
              src="/Icons/history.svg"
              alt="reports"
              width={100}
              height={100}
              priority
            />
            <p className={styles.menuTitle}>History</p>
          </a>
          <a href="/marketing/visits" className={styles.menuCard}>
          <Image
              src="/Icons/visit.svg"
              alt="reports"
              width={100}
              height={100}
              priority
            />
            <p className={styles.menuTitle}>Visit</p>
          </a>
        </div>
      </div>
    </div>
  );
}
