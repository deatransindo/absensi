'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { setLoginTime } from '@/hooks/useAutoLogout';
import styles from '@/styles/Login.module.css';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Prevent back button to login when already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      const userData = JSON.parse(user);
      // User is already logged in, redirect to their dashboard
      if (userData.role === 'ADMIN') {
        router.replace('/admin');
      } else {
        router.replace('/user');
      }
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Set login time for auto logout
      setLoginTime();

      toast.success('Login berhasil!');

      setTimeout(() => {
        if (data.user.role === 'ADMIN') {
          router.replace('/admin');
        } else {
          router.replace('/user');
        }
      }, 500);
    } catch (error) {
      toast.error(error.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Toaster position="top-center" />
      
      {/* Animated Background */}
      <div className={styles.bgAnimation}>
        <div className={styles.circle1}></div>
        <div className={styles.circle2}></div>
        <div className={styles.circle3}></div>
      </div>

      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logoContainer}>
          <div className={styles.logoWrapper}>
            <Image
              src="/Images/logo_dea.png"
              alt="Logo"
              width={120}
              height={120}
              priority
              style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
            />
          </div>
        </div>

        {/* Title */}
        <h1 className={styles.title}>Login</h1>

        {/* Form */}
        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <span className={styles.labelIcon}>📧</span>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="Email atau Username"
              required
              autoComplete="email"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="Password"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.submitBtn}
          >
            {loading ? (
              <span className={styles.spinner}></span>
            ) : (
              'Login'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className={styles.footer}>
          <p className={styles.footerText}>
            Belum punya akun?{' '}
            <a href="/register" className={styles.link}>
              Daftar di sini
            </a>
          </p>
        </div>

        {/* Decorative Elements */}
        <div className={styles.decorTop}></div>
        <div className={styles.decorBottom}></div>
      </div>

      {/* App Info */}
      <div className={styles.appInfo}>
        <p>@deatranssolusindo v1.0</p>
      </div>
    </div>
  );
}