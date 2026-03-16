'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [editModal, setEditModal] = useState({ open: false, item: null, checkIn: '', checkOut: '', status: '' });
  const [saving, setSaving] = useState(false);

  const [filterMode, setFilterMode] = useState('monthYear'); // 'monthYear' or 'dateRange'
  const [filters, setFilters] = useState({
    userId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    startDate: '',
    endDate: '',
  });

  // Pagination calculations
  const totalPages = Math.ceil(absensi.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = absensi.slice(startIndex, endIndex);

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
    setCurrentPage(1); // Reset to first page when fetching new data
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Sesi berakhir, silakan login ulang');
        router.push('/login');
        return;
      }

      const params = new URLSearchParams();

      // Add user filter if selected
      if (filters.userId) {
        params.append('userId', filters.userId);
      }

      // Add date filters based on filter mode
      if (filterMode === 'dateRange') {
        if (filters.startDate) {
          params.append('startDate', filters.startDate);
        }
        if (filters.endDate) {
          params.append('endDate', filters.endDate);
        }
      } else {
        // Month/Year mode
        params.append('month', filters.month.toString());
        params.append('year', filters.year.toString());
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

  const openEdit = (item) => {
    const toTimeInput = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };
    setEditModal({
      open: true,
      item,
      checkIn: toTimeInput(item.checkInTime),
      checkOut: toTimeInput(item.checkOutTime),
      status: item.status,
    });
  };

  const closeEdit = () => setEditModal({ open: false, item: null, checkIn: '', checkOut: '', status: '' });

  const handleEditSave = async () => {
    if (!editModal.item) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const item = editModal.item;

      // Build full datetime from date + time input
      const buildDateTime = (dateStr, timeStr) => {
        if (!timeStr) return null;
        const base = new Date(dateStr || item.tanggal);
        const [h, m] = timeStr.split(':').map(Number);
        base.setHours(h, m, 0, 0);
        return base.toISOString();
      };

      const payload = {
        checkInTime: buildDateTime(item.checkInTime || item.tanggal, editModal.checkIn),
        checkOutTime: buildDateTime(item.checkOutTime || item.tanggal, editModal.checkOut),
        status: editModal.status,
      };

      const res = await fetch(`/api/admin/absensi/${item._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Update local state
      setAbsensi((prev) => prev.map((a) => (a._id === item._id ? data.absensi : a)));
      toast.success('Data berhasil diperbarui');
      closeEdit();
    } catch (err) {
      toast.error('Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
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

  const exportToExcel = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Sesi berakhir, silakan login ulang');
        router.push('/login');
        return;
      }

      toast.loading('Sedang membuat file Excel dengan foto selfie...');

      const params = new URLSearchParams();

      if (filters.userId) {
        params.append('userId', filters.userId);
      }

      if (filterMode === 'dateRange') {
        if (filters.startDate) {
          params.append('startDate', filters.startDate);
        }
        if (filters.endDate) {
          params.append('endDate', filters.endDate);
        }
      } else {
        params.append('month', filters.month.toString());
        params.append('year', filters.year.toString());
      }

      const response = await fetch(`/api/admin/reports/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to export');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Laporan_Absensi_${filters.year}_${filters.month}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success('Excel berhasil diexport dengan foto selfie!');
    } catch (error) {
      toast.dismiss();
      toast.error('Gagal export Excel: ' + error.message);
      console.error('Export error:', error);
    }
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'HADIR':
        return '#10b981';
      case 'IZIN':
        return '#3b82f6';
      case 'SAKIT':
        return '#f59e0b';
      case 'ALPHA':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'HADIR':
        return '#d1fae5';
      case 'IZIN':
        return '#dbeafe';
      case 'SAKIT':
        return '#fef3c7';
      case 'ALPHA':
        return '#fee2e2';
      default:
        return '#f3f4f6';
    }
  };

  const paginationPages = [];
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    paginationPages.push(i);
  }

  return (
    <PageLayout>
      <div className={styles.pageContainer}>
        <Toaster position="top-center" />

        <div className={styles.contentContainer}>
        {/* Header Section */}
        <div className={styles.headerSection}>
          <div className={styles.headerContent}>
            <h1 className={styles.headerTitle}>Laporan Absensi</h1>
            <p className={styles.headerSubtitle}>
              Kelola dan analisis data kehadiran karyawan dengan mudah
            </p>
          </div>
          <div className={styles.headerIllustration}>📊</div>
        </div>

        {/* Filters */}
        <div className={styles.filterSection}>
          {/* Filter Mode Toggle */}
          <div className={styles.filterModeToggle}>
            <button
              className={`${styles.toggleBtn} ${filterMode === 'monthYear' ? styles.toggleBtnActive : ''}`}
              onClick={() => setFilterMode('monthYear')}
            >
              <span className={styles.toggleIcon}>📅</span>
              Bulan & Tahun
            </button>
            <button
              className={`${styles.toggleBtn} ${filterMode === 'dateRange' ? styles.toggleBtnActive : ''}`}
              onClick={() => setFilterMode('dateRange')}
            >
              <span className={styles.toggleIcon}>📆</span>
              Rentang Tanggal
            </button>
          </div>

          <div className={styles.filterGrid}>
            <div className={styles.filterGroup}>
              <label className={styles.label}>👤 Karyawan</label>
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

            {filterMode === 'monthYear' ? (
              <>
                <div className={styles.filterGroup}>
                  <label className={styles.label}>📆 Bulan</label>
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
                  <label className={styles.label}>📅 Tahun</label>
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
              </>
            ) : (
              <>
                <div className={styles.filterGroup}>
                  <label className={styles.label}>🗓️ Tanggal Mulai</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                      setFilters({ ...filters, startDate: e.target.value })
                    }
                    className={styles.select}
                  />
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.label}>🗓️ Tanggal Selesai</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) =>
                      setFilters({ ...filters, endDate: e.target.value })
                    }
                    className={styles.select}
                  />
                </div>
              </>
            )}

            <div className={styles.filterGroup}>
              <label className={styles.label}>&nbsp;</label>
              <button onClick={fetchReports} className={styles.filterBtn}>
                🔍 Tampilkan
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className={styles.statsGrid}>
            <div className={`${styles.statCard} ${styles.statCardHadir}`}>
              <div className={styles.statIcon}>✓</div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>Hadir</p>
                <p className={styles.statValue}>{stats.hadir}</p>
                <p className={styles.statPercent}>
                  {Math.round((stats.hadir / stats.totalDays) * 100)}%
                </p>
              </div>
            </div>
            <div className={`${styles.statCard} ${styles.statCardTerlambat}`}>
              <div className={styles.statIcon}>⏱</div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>Terlambat</p>
                <p className={styles.statValue}>{stats.lateCheckins}</p>
                <p className={styles.statPercent}>
                  {Math.round((stats.lateCheckins / stats.totalDays) * 100)}%
                </p>
              </div>
            </div>
            <div className={`${styles.statCard} ${styles.statCardIzin}`}>
              <div className={styles.statIcon}>📋</div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>Izin</p>
                <p className={styles.statValue}>{stats.izin}</p>
                <p className={styles.statPercent}>
                  {Math.round((stats.izin / stats.totalDays) * 100)}%
                </p>
              </div>
            </div>
            <div className={`${styles.statCard} ${styles.statCardSakit}`}>
              <div className={styles.statIcon}>🤒</div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>Sakit</p>
                <p className={styles.statValue}>{stats.sakit}</p>
                <p className={styles.statPercent}>
                  {Math.round((stats.sakit / stats.totalDays) * 100)}%
                </p>
              </div>
            </div>
            <div className={`${styles.statCard} ${styles.statCardRata}`}>
              <div className={styles.statIcon}>⏳</div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>Durasi Kerja</p>
                <p className={styles.statValue}>
                  {Math.floor(stats.avgWorkDuration / 60)}h
                </p>
                <p className={styles.statPercent}>
                  {Math.floor(stats.avgWorkDuration % 60)}m
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Export Buttons */}
        <div className={styles.exportSection}>
          <button
            onClick={exportToExcel}
            className={styles.exportBtn}
            disabled={absensi.length === 0}
          >
            📊 Export ke Excel
          </button>
          <button
            onClick={exportToCSV}
            className={styles.exportBtnSecondary}
            disabled={absensi.length === 0}
          >
            📄 Export ke CSV
          </button>
        </div>

        {/* Data Table */}
        <div className={styles.tableSection}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p className={styles.loadingText}>Memuat data laporan...</p>
            </div>
          ) : absensi.length === 0 ? (
            <div className={styles.emptyContainer}>
              <div className={styles.emptyIcon}>📭</div>
              <p className={styles.emptyTitle}>Tidak Ada Data</p>
              <p className={styles.emptyText}>
                Tidak ada data untuk periode yang dipilih
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
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
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.map((item) => (
                      <tr key={item._id} className={styles.tableRow}>
                        <td data-label="Tanggal">
                          {format(new Date(item.tanggal), 'dd MMM yyyy', {
                            locale: id,
                          })}
                        </td>
                        <td data-label="Nama" className={styles.nameCell}>
                          {item.userId?.name || 'N/A'}
                        </td>
                        <td data-label="Check In">
                          {item.checkInTime
                            ? format(new Date(item.checkInTime), 'HH:mm')
                            : '—'}
                        </td>
                        <td data-label="Check Out">
                          {item.checkOutTime
                            ? format(new Date(item.checkOutTime), 'HH:mm')
                            : '—'}
                        </td>
                        <td data-label="Durasi">
                          {item.workDuration
                            ? `${Math.floor(item.workDuration / 60)}h ${
                                item.workDuration % 60
                              }m`
                            : '—'}
                        </td>
                        <td data-label="Status">
                          <span
                            className={styles.statusBadge}
                            style={{
                              backgroundColor: getStatusBgColor(item.status),
                              color: getStatusColor(item.status),
                            }}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td data-label="Aksi">
                          <button
                            className={styles.editBtn}
                            onClick={() => openEdit(item)}
                            title="Edit waktu absensi"
                          >
                            ✏️ Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Page Size Selector */}
              <div className={styles.pageSizeContainer}>
                <label htmlFor="pageSize" className={styles.pageSizeLabel}>
                  Data per halaman:
                </label>
                <select
                  id="pageSize"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1); // Reset to first page when changing page size
                  }}
                  className={styles.pageSizeSelect}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={styles.paginationContainer}>
                  <button
                    className={styles.paginationBtn}
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    title="Halaman pertama"
                  >
                    «
                  </button>
                  <button
                    className={styles.paginationBtn}
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    title="Halaman sebelumnya"
                  >
                    ‹
                  </button>

                  {startPage > 1 && (
                    <>
                      <button
                        className={styles.paginationBtn}
                        onClick={() => setCurrentPage(1)}
                      >
                        1
                      </button>
                      {startPage > 2 && (
                        <span className={styles.paginationEllipsis}>...</span>
                      )}
                    </>
                  )}

                  {paginationPages.map((page) => (
                    <button
                      key={page}
                      className={`${styles.paginationBtn} ${
                        page === currentPage ? styles.paginationBtnActive : ''
                      }`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}

                  {endPage < totalPages && (
                    <>
                      {endPage < totalPages - 1 && (
                        <span className={styles.paginationEllipsis}>...</span>
                      )}
                      <button
                        className={styles.paginationBtn}
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}

                  <button
                    className={styles.paginationBtn}
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    title="Halaman berikutnya"
                  >
                    ›
                  </button>
                  <button
                    className={styles.paginationBtn}
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    title="Halaman terakhir"
                  >
                    »
                  </button>

                  <div className={styles.paginationInfo}>
                    Halaman {currentPage} dari {totalPages} ({absensi.length}{' '}
                    data)
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        </div>
      </div>
      {/* Edit Modal */}
      {editModal.open && (
        <div className={styles.modalOverlay} onClick={closeEdit}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>✏️ Edit Absensi</h2>
              <button className={styles.modalClose} onClick={closeEdit}>✕</button>
            </div>

            <div className={styles.modalInfo}>
              <span>📅 {editModal.item && format(new Date(editModal.item.tanggal), 'dd MMMM yyyy', { locale: id })}</span>
              <span>👤 {editModal.item?.userId?.name || 'N/A'}</span>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>⏰ Waktu Check In</label>
                <input
                  type="time"
                  value={editModal.checkIn}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, checkIn: e.target.value }))}
                  className={styles.modalInput}
                />
              </div>

              <div className={styles.modalField}>
                <label className={styles.modalLabel}>⏰ Waktu Check Out</label>
                <input
                  type="time"
                  value={editModal.checkOut}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, checkOut: e.target.value }))}
                  className={styles.modalInput}
                />
              </div>

              <div className={styles.modalField}>
                <label className={styles.modalLabel}>📋 Status</label>
                <select
                  value={editModal.status}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, status: e.target.value }))}
                  className={styles.modalInput}
                >
                  <option value="HADIR">HADIR</option>
                  <option value="IZIN">IZIN</option>
                  <option value="SAKIT">SAKIT</option>
                  <option value="ALPHA">ALPHA</option>
                </select>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.modalCancelBtn} onClick={closeEdit} disabled={saving}>
                Batal
              </button>
              <button className={styles.modalSaveBtn} onClick={handleEditSave} disabled={saving}>
                {saving ? '⏳ Menyimpan...' : '💾 Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

// ⚠️ PENTING: Tambahkan baris ini di paling akhir!
export default ReportsPage;
