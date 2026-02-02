'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import styles from '@/styles/Sidebar.module.css';

export default function Sidebar({ isOpen, onClose }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const isAdmin = user?.role === 'ADMIN';

  const adminMenuItems = [
    {
      href: '/admin',
      icon: '/Icons/dashboard.svg',
      fallbackIcon: '📊',
      label: 'Dashboard',
    },
    {
      href: '/admin/reports',
      icon: '/Icons/reports.svg',
      fallbackIcon: '📋',
      label: 'Laporan',
    },
    {
      href: '/admin/users',
      icon: '/Icons/user_management.svg',
      fallbackIcon: '👥',
      label: 'Kelola User',
    },
    {
      href: '/admin/notifications',
      icon: '/Icons/notification.svg',
      fallbackIcon: '🔔',
      label: 'Notifikasi',
    },
  ];

  const userMenuItems = [
    {
      href: '/user',
      icon: '/Icons/dashboard.svg',
      fallbackIcon: '🏠',
      label: 'Dashboard',
    },
    {
      href: '/user/history',
      icon: '/Icons/history.svg',
      fallbackIcon: '📅',
      label: 'Riwayat Absensi',
    },
    {
      href: '/user/visits',
      icon: '/Icons/visit.svg',
      fallbackIcon: '📍',
      label: 'Kunjungan',
    },
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  const isActive = (href) => {
    if (href === '/admin' || href === '/user') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        {/* Header */}
        <div className={styles.sidebarHeader}>
          <div className={styles.logoContainer}>
            <Image
              src="/Images/logo_dea2.png"
              alt="Logo"
              width={120}
              height={40}
              priority
              className={styles.logo}
            />
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <span className={styles.closeIcon}>×</span>
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className={styles.userDetails}>
              <p className={styles.userName}>{user.name}</p>
              <span className={styles.userRole}>
                {isAdmin ? 'Administrator' : 'User'}
              </span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className={styles.nav}>
          <ul className={styles.menuList}>
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`${styles.menuItem} ${
                    isActive(item.href) ? styles.menuItemActive : ''
                  }`}
                  onClick={onClose}
                >
                  <span className={styles.menuIcon}>
                    <Image
                      src={item.icon}
                      alt={item.label}
                      width={24}
                      height={24}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <span style={{ display: 'none' }}>{item.fallbackIcon}</span>
                  </span>
                  <span className={styles.menuLabel}>{item.label}</span>
                  {isActive(item.href) && (
                    <span className={styles.activeIndicator} />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className={styles.sidebarFooter}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <span className={styles.logoutIcon}>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
