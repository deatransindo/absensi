'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import toast, { Toaster } from 'react-hot-toast';
import styles from '@/styles/AdminReports.module.css';

function ReportsPage() {
  const router = useRouter();
  const [absensi, setAbsensi] = useState([]);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    userId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(user);
    if (userData.role !== 'ADMIN') {
      router.push('/marketing');
      return;
    }

    fetchUsers();
    fetchReports();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Sesi berakhir, silakan login ulang');
        router.push('/login');
        return;
      }

      const response = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed');
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Sesi berakhir, silakan login ulang');
        router.push('/login');
        return;
      }

      const params = new URLSearchParams({
        month: filters.month.toString(),
        year: filters.year.toString(),
      });

      if (filters.userId) {
        params.append('userId', filters.userId);
      }

      const response = await fetch(`/api/admin/reports?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed');

      const data = await response.json();
      setAbsensi(data.absensi);
      setStats(data.stats);
    } catch (error) {
      toast.error('Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    let csv = 'Tanggal,Nama,Email,Check In,Check Out,Durasi (menit),Status\n';

    absensi.forEach((item) => {
      const tanggal = format(new Date(item.tanggal), 'yyyy-MM-dd');
      const checkIn = item.checkInTime
        ? format(new Date(item.checkInTime), 'HH:mm')
        : '-';
      const checkOut = item.checkOutTime
        ? format(new Date(item.checkOutTime), 'HH:mm')
        : '-';

      csv += `${tanggal},${item.userId?.name || 'N/A'},${
        item.userId?.email || 'N/A'
      },${checkIn},${checkOut},${item.workDuration || '-'},${item.status}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan_absensi_${filters.year}_${filters.month}.csv`;
    a.click();
    toast.success('Data berhasil diexport');
  };

  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  return (
    <div className={styles.pageContainer}>
      <Toaster position="top-center" />
      <Navbar />

      <div className={styles.contentContainer}>
        <h1 className={styles.headerTitle}>Absensi Reports</h1>

        {/* Filters */}
        <div className={styles.filterSection}>
          <div className={styles.filterGrid}>
            <div className={styles.filterGroup}>
              <label className={styles.label}>Karyawan</label>
              <select
                value={filters.userId}
                onChange={(e) =>
                  setFilters({ ...filters, userId: e.target.value })
                }
                className={styles.select}
              >
                <option value="">Semua Karyawan</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.label}>Bulan</label>
              <select
                value={filters.month}
                onChange={(e) =>
                  setFilters({ ...filters, month: parseInt(e.target.value) })
                }
                className={styles.select}
              >
                {monthNames.map((month, index) => (
                  <option key={index} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.label}>Tahun</label>
              <select
                value={filters.year}
                onChange={(e) =>
                  setFilters({ ...filters, year: parseInt(e.target.value) })
                }
                className={styles.select}
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.label}>&nbsp;</label>
              <button onClick={fetchReports} className={styles.filterBtn}>
                Show
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Total Hari</p>
              <p className={styles.statValue}>{stats.totalDays}</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Hadir</p>
              <p className={styles.statValue} style={{ color: '#16a34a' }}>
                {stats.hadir}
              </p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Terlambat</p>
              <p className={styles.statValue} style={{ color: '#eab308' }}>
                {stats.lateCheckins}
              </p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Rata-rata Kerja</p>
              <p className={styles.statValue} style={{ color: '#9333ea' }}>
                {Math.floor(stats.avgWorkDuration / 60)}j{' '}
                {Math.floor(stats.avgWorkDuration % 60)}m
              </p>
            </div>
          </div>
        )}

        {/* Export Button */}
        <div className={styles.exportSection}>
          <button
            onClick={exportToCSV}
            className={styles.exportBtn}
            disabled={absensi.length === 0}
          >
            Export ke CSV
          </button>
        </div>

        {/* Data Table */}
        <div className={styles.tableContainer}>
          {loading ? (
            <div className={styles.loading}>Loading...</div>
          ) : absensi.length === 0 ? (
            <p className={styles.emptyState}>
              Tidak ada data untuk periode ini
            </p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Nama</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Durasi</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {absensi.map((item) => (
                    <tr key={item._id}>
                      <td>
                        {format(new Date(item.tanggal), 'dd MMM yyyy', {
                          locale: id,
                        })}
                      </td>
                      <td className={styles.nameCell}>
                        {item.userId?.name || 'N/A'}
                      </td>
                      <td>
                        {item.checkInTime
                          ? format(new Date(item.checkInTime), 'HH:mm')
                          : '-'}
                      </td>
                      <td>
                        {item.checkOutTime
                          ? format(new Date(item.checkOutTime), 'HH:mm')
                          : '-'}
                      </td>
                      <td>
                        {item.workDuration
                          ? `${Math.floor(item.workDuration / 60)}j ${
                              item.workDuration % 60
                            }m`
                          : '-'}
                      </td>
                      <td>
                        <span
                          className={
                            item.status === 'HADIR'
                              ? styles.badgeGreen
                              : item.status === 'IZIN'
                              ? styles.badgeBlue
                              : item.status === 'SAKIT'
                              ? styles.badgeYellow
                              : styles.badgeRed
                          }
                        >
                          {item.status}
                        </span>
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
  );
}

// ⚠️ PENTING: Tambahkan baris ini di paling akhir!
export default ReportsPage;
