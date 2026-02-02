'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import toast, { Toaster } from 'react-hot-toast';
import styles from '@/styles/History.module.css';

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/absensi/history', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch');
      }

      const data = await response.json();
      setHistory(data.absensi);
    } catch (error) {
      toast.error('Gagal memuat riwayat');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <div className={styles.pageContainer}>
        <Toaster position="top-center" />
        <div className={styles.contentContainer}>
        <div className={styles.header}>
          <h2 className={styles.headerTitle}>Riwayat Absensi</h2>
          <p className={styles.headerSubtitle}>30 hari terakhir</p>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : history.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Belum ada riwayat absensi</p>
          </div>
        ) : (
          <div className={styles.historyList}>
            {history.map((absensi) => (
              <div key={absensi._id} className={styles.historyCard}>
                <div className={styles.cardHeader}>
                  <div>
                    <p className={styles.cardDate}>
                      {format(new Date(absensi.tanggal), 'EEEE, dd MMMM yyyy', {
                        locale: id,
                      })}
                    </p>
                    <p className={styles.cardStatus}>Status: {absensi.status}</p>
                  </div>
                  {absensi.checkOutTime && (
                    <span className={styles.completeBadge}>Lengkap</span>
                  )}
                </div>

                <div className={styles.cardGrid}>
                  <div>
                    <p className={styles.cardLabel}>Check-in</p>
                    <p className={styles.cardValue}>
                      {absensi.checkInTime
                        ? format(new Date(absensi.checkInTime), 'HH:mm')
                        : '-'}
                    </p>
                    {absensi.checkInAddress && (
                      <p className={styles.cardAddress}>{absensi.checkInAddress}</p>
                    )}
                  </div>
                  <div>
                    <p className={styles.cardLabel}>Check-out</p>
                    <p className={styles.cardValue}>
                      {absensi.checkOutTime
                        ? format(new Date(absensi.checkOutTime), 'HH:mm')
                        : '-'}
                    </p>
                    {absensi.workDuration && (
                      <p className={styles.cardDuration}>
                        Durasi: {Math.floor(absensi.workDuration / 60)}j{' '}
                        {absensi.workDuration % 60}m
                      </p>
                    )}
                  </div>
                </div>

                {absensi.dailyReport && (
                  <div className={styles.reportSection}>
                    <p className={styles.reportLabel}>Laporan Harian:</p>
                    <p className={styles.reportText}>{absensi.dailyReport}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </PageLayout>
  );
}