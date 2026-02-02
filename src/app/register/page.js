'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import styles from '@/styles/Login.module.css';
import Image from 'next/image';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Password tidak cocok');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      toast.success('Registrasi berhasil! Silakan login.');
      setTimeout(() => router.push('/login'), 2000);
    } catch (error) {
      toast.error(error.message || 'Registrasi gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Toaster position="top-center" />

      <div className={styles.bgAnimation}>
        <div className={styles.circle1}></div>
        <div className={styles.circle2}></div>
        <div className={styles.circle3}></div>
      </div>

      <div className={styles.card}>
        {/* <div className={styles.logoContainer}>
          <div className={styles.logoWrapper}>
            <Image src="/Images/logo_dea.png" alt="Logo" width={180} height={50} priority />
          </div>
        </div> */}

        <h1 className={styles.title}>Register</h1>
        <form onSubmit={handleRegister} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <span className={styles.labelIcon}>👤</span>
              Nama Lengkap
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={styles.input}
              placeholder="Nama lengkap Anda"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              <span className={styles.labelIcon}>📧</span>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={styles.input}
              placeholder="nama@example.com"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              <span className={styles.labelIcon}>📱</span>
              Nomor HP
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={styles.input}
              placeholder="08123456789"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              <span className={styles.labelIcon}>🔒</span>
              Password
            </label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={styles.input}
                placeholder="Minimal 6 karakter"
                required
                minLength={6}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              <span className={styles.labelIcon}>🔒</span>
              Konfirmasi Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={styles.input}
              placeholder="Ketik ulang password"
              required
            />
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? <span className={styles.spinner}></span> : 'Daftar'}
          </button>
        </form>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Sudah punya akun?{' '}
            <a href="/login" className={styles.link}>
              Login di sini
            </a>
          </p>
        </div>

        <div className={styles.decorTop}></div>
        <div className={styles.decorBottom}></div>
      </div>

    </div>
  );
}
