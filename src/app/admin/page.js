'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import toast, { Toaster } from 'react-hot-toast';
import styles from '@/styles/Admin.module.css';

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auto logout after 30 minutes
  useAutoLogout();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(user);
    if (userData.role !== 'ADMIN') {
      router.push('/user');
      return;
    }

    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch');

      const result = await response.json();
      setData(result);
    } catch (error) {
      toast.error('Gagal memuat data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className={styles.pageContainer}>
          <div className={styles.loading}>Loading...</div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className={styles.pageContainer}>
        <Toaster position="top-center" />

        <div className={styles.contentContainer}>
          <div className={styles.header}>
            <h1 className={styles.headerTitle}>Dashboard Admin</h1>
            <p className={styles.headerDate}>
              {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })}
            </p>
          </div>

          {/* Statistics Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Total Karyawan</p>
              <p className={styles.statValue} style={{ color: '#2563eb' }}>
                {data?.stats.totalMarketing}
              </p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Check-in</p>
              <p className={styles.statValue} style={{ color: '#16a34a' }}>
                {data?.stats.checkedIn}
              </p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Check-out</p>
              <p className={styles.statValue} style={{ color: '#9333ea' }}>
                {data?.stats.checkedOut}
              </p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Belum Check-in</p>
              <p className={styles.statValue} style={{ color: '#dc2626' }}>
                {data?.stats.notCheckedIn}
              </p>
            </div>
          </div>

          {/* Today's Attendance */}
          <div className={styles.tableContainer}>
            <h2 className={styles.tableTitle}>Absensi Hari Ini</h2>

            {data?.todayAbsensi.length === 0 ? (
              <p className={styles.emptyState}>Belum ada yang absen hari ini</p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Nama</th>
                      <th>Check-in</th>
                      <th>Lokasi Check-in</th>
                      <th>Check-out</th>
                      <th>Durasi</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.todayAbsensi.map((absensi) => (
                      <tr key={absensi._id}>
                        <td>{absensi.userId?.name || 'N/A'}</td>
                        <td>
                          {absensi.checkInTime
                            ? format(new Date(absensi.checkInTime), 'HH:mm')
                            : '-'}
                        </td>
                        <td className={styles.addressCell}>
                          {absensi.checkInAddress || '-'}
                        </td>
                        <td>
                          {absensi.checkOutTime
                            ? format(new Date(absensi.checkOutTime), 'HH:mm')
                            : '-'}
                        </td>
                        <td>
                          {absensi.workDuration
                            ? `${Math.floor(absensi.workDuration / 60)}j ${
                                absensi.workDuration % 60
                              }m`
                            : '-'}
                        </td>
                        <td>
                          {!absensi.checkInTime && (
                            <span className={styles.badgeGray}>
                              Belum Check-in
                            </span>
                          )}
                          {absensi.checkInTime && !absensi.checkOutTime && (
                            <span className={styles.badgeYellow}>Working</span>
                          )}
                          {absensi.checkOutTime && (
                            <span className={styles.badgeGreen}>Selesai</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </PageLayout>
  );
}
