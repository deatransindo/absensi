'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import UsersTable from '@/components/UsersTable';
import { useUsers, useDeleteUser, useUpdateUser } from '@/hooks/useUsers';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import toast, { Toaster } from 'react-hot-toast';
import styles from '@/styles/AdminUsers.module.css';

export default function UsersManagementPage() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  // Auto logout after 30 minutes
  useAutoLogout();

  // TanStack Query hooks
  const { data: users = [], isLoading, error } = useUsers(token);
  const deleteUserMutation = useDeleteUser(token);
  const updateUserMutation = useUpdateUser(token);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(user);
    if (userData.role !== 'ADMIN') {
      router.push('/admin');
      return;
    }

    const storedToken = localStorage.getItem('token');
    setToken(storedToken);
  }, [router]);

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

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.nama || user.name,
      email: user.email,
      phone: user.phone || '',
      password: '',
    });
    setShowModal(true);
  };

  const handleDeleteUser = async (user) => {
    if (!confirm(`Yakin ingin menghapus user ${user.nama || user.name}?`)) return;

    try {
      await deleteUserMutation.mutateAsync(user._id);
      toast.success('User berhasil dihapus');
    } catch (error) {
      toast.error('Gagal menghapus user');
    }
  };

  return (
    <PageLayout>
      <div className={styles.pageContainer}>
        <Toaster position="top-center" />

        <div className={styles.contentContainer}>
        <div className={styles.headerSection}>
          <h1 className={styles.headerTitle}>User Management</h1>
          <button onClick={() => setShowModal(true)} className={styles.addBtn}>
            Tambah User
          </button>
        </div>

        {isLoading ? (
          <div className={styles.loading}>Loading...</div>
        ) : error ? (
          <div className={styles.error}>Gagal memuat data user</div>
        ) : users.length === 0 ? (
          <div className={styles.emptyState}>Belum ada user terdaftar</div>
        ) : (
          <UsersTable
            users={users}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
          />
        )}
      </div>

        {/* Add User Modal */}
        {showModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h2 className={styles.modalTitle}>Tambah User Baru</h2>

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
    </PageLayout>
  );
}
