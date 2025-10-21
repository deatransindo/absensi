'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import LocationCapture from '@/components/LocationCapture';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import toast, { Toaster } from 'react-hot-toast';
import styles from '@/styles/Visits.module.css';

export default function VisitsPage() {
  const router = useRouter();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    visitType: 'Prospek',
    visitResult: 'Berhasil',
    notes: '',
    visitLat: 0,
    visitLng: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/visits', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed');

      const data = await response.json();
      setVisits(data.visits);
    } catch (error) {
      toast.error('Gagal memuat data kunjungan');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.visitLat || !formData.visitLng) {
      toast.error('Harap dapatkan lokasi terlebih dahulu');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      toast.success('Kunjungan berhasil dicatat');
      setShowModal(false);
      setFormData({
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        visitType: 'Prospek',
        visitResult: 'Berhasil',
        notes: '',
        visitLat: 0,
        visitLng: 0,
      });
      fetchVisits();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getResultClass = (result) => {
    switch (result) {
      case 'Berhasil':
        return styles.badgeSuccess;
      case 'Pending':
        return styles.badgeWarning;
      case 'Reschedule':
        return styles.badgeInfo;
      case 'Tolak':
        return styles.badgeDanger;
      default:
        return styles.badgeDefault;
    }
  };

  return (
    <div className={styles.pageContainer}>
      <Toaster position="top-center" />
      <Navbar />

      <div className={styles.contentContainer}>
        <div className={styles.headerSection}>
          <div>
            <h1 className={styles.headerTitle}>Kunjungan Customer</h1>
            <p className={styles.headerSubtitle}>Catat setiap kunjungan Anda</p>
          </div>
          <button onClick={() => setShowModal(true)} className={styles.addBtn}>
            + Tambah Kunjungan
          </button>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : visits.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Belum ada kunjungan tercatat</p>
          </div>
        ) : (
          <div className={styles.visitsList}>
            {visits.map((visit) => (
              <div key={visit._id} className={styles.visitCard}>
                <div className={styles.visitHeader}>
                  <div>
                    <h3 className={styles.customerName}>{visit.customerName}</h3>
                    <p className={styles.customerPhone}>{visit.customerPhone}</p>
                  </div>
                  <span className={getResultClass(visit.visitResult)}>
                    {visit.visitResult}
                  </span>
                </div>

                <div className={styles.visitDetails}>
                  <div>
                    <p className={styles.detailLabel}>Tipe</p>
                    <p className={styles.detailValue}>{visit.visitType}</p>
                  </div>
                  <div>
                    <p className={styles.detailLabel}>Waktu</p>
                    <p className={styles.detailValue}>
                      {format(new Date(visit.visitTime), 'dd MMM yyyy, HH:mm', {
                        locale: id,
                      })}
                    </p>
                  </div>
                </div>

                <div className={styles.addressSection}>
                  <p className={styles.detailLabel}>Alamat</p>
                  <p className={styles.addressText}>{visit.customerAddress}</p>
                </div>

                {visit.notes && (
                  <div className={styles.notesSection}>
                    <p className={styles.detailLabel}>Catatan:</p>
                    <p className={styles.notesText}>{visit.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Catat Kunjungan</h2>

            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nama Customer</label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData({ ...formData, customerName: e.target.value })
                  }
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Nomor HP</label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, customerPhone: e.target.value })
                  }
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Alamat</label>
                <textarea
                  value={formData.customerAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, customerAddress: e.target.value })
                  }
                  className={styles.textarea}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <LocationCapture
                  onLocationCapture={(lat, lng, address) =>
                    setFormData({ ...formData, visitLat: lat, visitLng: lng })
                  }
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Tipe Kunjungan</label>
                  <select
                    value={formData.visitType}
                    onChange={(e) =>
                      setFormData({ ...formData, visitType: e.target.value })
                    }
                    className={styles.select}
                  >
                    <option>Prospek</option>
                    <option>Follow Up</option>
                    <option>Closing</option>
                    <option>Maintenance</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Hasil</label>
                  <select
                    value={formData.visitResult}
                    onChange={(e) =>
                      setFormData({ ...formData, visitResult: e.target.value })
                    }
                    className={styles.select}
                  >
                    <option>Berhasil</option>
                    <option>Reschedule</option>
                    <option>Tolak</option>
                    <option>Pending</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Catatan</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className={styles.textareaLarge}
                  placeholder="Detail hasil kunjungan..."
                />
              </div>

              <div className={styles.buttonGroup}>
                <button type="submit" className={styles.submitBtn}>
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({
                      customerName: '',
                      customerPhone: '',
                      customerAddress: '',
                      visitType: 'Prospek',
                      visitResult: 'Berhasil',
                      notes: '',
                      visitLat: 0,
                      visitLng: 0,
                    });
                  }}
                  className={styles.cancelBtn}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}