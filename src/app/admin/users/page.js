'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import toast, { Toaster } from 'react-hot-toast';
import styles from '@/styles/AdminUsers.module.css';

export default function UsersManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

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

    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      toast.error('Gagal memuat data user');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
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

      toast.success('User berhasil ditambahkan');
      setShowModal(false);
      setFormData({ name: '', email: '', phone: '', password: '' });
      fetchUsers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) throw new Error('Failed to update');

      toast.success('Status user berhasil diubah');
      fetchUsers();
    } catch (error) {
      toast.error('Gagal mengubah status user');
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Yakin ingin menghapus user ini?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete');

      toast.success('User berhasil dihapus');
      fetchUsers();
    } catch (error) {
      toast.error('Gagal menghapus user');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <Toaster position="top-center" />
      <Navbar />

      <div className={styles.contentContainer}>
        <div className={styles.headerSection}>
          <h1 className={styles.headerTitle}>User Management</h1>
          <button onClick={() => setShowModal(true)} className={styles.addBtn}>
            Tambah Karyawan
          </button>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : (
          <div className={styles.tableContainer}>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Email</th>
                    <th>Telepon</th>
                    <th>Absensi</th>
                    <th>Kunjungan</th>
                    <th>Status</th>
                    <th>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td className={styles.nameCell}>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.phone || '-'}</td>
                      <td className={styles.centerCell}>
                        {user._count.absensi}
                      </td>
                      <td className={styles.centerCell}>
                        {user._count.visits}
                      </td>
                      <td className={styles.centerCell}>
                        <button
                          onClick={() =>
                            toggleUserStatus(user._id, user.isActive)
                          }
                          className={
                            user.isActive
                              ? styles.badgeActive
                              : styles.badgeInactive
                          }
                        >
                          {user.isActive ? 'Aktif' : 'Non-Aktif'}
                        </button>
                      </td>
                      <td className={styles.centerCell}>
                        <button
                          onClick={() => deleteUser(user._id)}
                          className={styles.deleteBtn}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {users.length === 0 && (
                <p className={styles.emptyState}>
                  Belum ada karyawan terdaftar
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Tambah Marketing Baru</h2>

            <form onSubmit={handleAddUser}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nama Lengkap</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Nomor HP</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className={styles.input}
                  required
                  minLength={6}
                />
              </div>

              <div className={styles.buttonGroup}>
                <button type="submit" className={styles.submitBtn}>
                  Tambah
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      password: '',
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
