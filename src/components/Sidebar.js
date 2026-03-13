'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard, FileText, Users, Bell,
  History, MapPin, LogOut, X, ChevronRight,
  ShieldCheck, User
} from 'lucide-react';
import styles from '@/styles/Sidebar.module.css';

export default function Sidebar({ isOpen, onClose }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const isAdmin = user?.role === 'ADMIN';

  const adminMenuItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', color: '#6366f1' },
    { href: '/admin/reports', icon: FileText, label: 'Laporan', color: '#8b5cf6' },
    { href: '/admin/users', icon: Users, label: 'Kelola User', color: '#06b6d4' },
    { href: '/admin/notifications', icon: Bell, label: 'Notifikasi', color: '#f59e0b' },
  ];

  const userMenuItems = [
    { href: '/user', icon: LayoutDashboard, label: 'Dashboard', color: '#6366f1' },
    { href: '/user/history', icon: History, label: 'Riwayat Absensi', color: '#8b5cf6' },
    { href: '/user/visits', icon: MapPin, label: 'Kunjungan', color: '#10b981' },
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  const isActive = (href) => {
    if (href === '/admin' || href === '/user') return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
        onClick={onClose}
      />
      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        {/* Header */}
        <div className={styles.sidebarHeader}>
          <div className={styles.logoContainer}>
            <Image src="/Images/logo_dea2.png" alt="Logo" width={110} height={36} priority className={styles.logo} />
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2.5} />
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
                {isAdmin
                  ? <span className={styles.roleBadgeAdmin}><ShieldCheck size={10} /> Admin</span>
                  : <span className={styles.roleBadgeUser}><User size={10} /> User</span>
                }
              </span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className={styles.nav}>
          <p className={styles.navLabel}>MENU</p>
          <ul className={styles.menuList}>
            {menuItems.map((item, i) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.href} className={styles.menuLi} style={{ '--delay': `${i * 50}ms` }}>
                  <Link
                    href={item.href}
                    className={`${styles.menuItem} ${active ? styles.menuItemActive : ''}`}
                    onClick={onClose}
                  >
                    <span
                      className={styles.menuIconWrap}
                      style={{ '--icon-color': item.color }}
                    >
                      <Icon size={18} strokeWidth={2} />
                    </span>
                    <span className={styles.menuLabel}>{item.label}</span>
                    {active && <ChevronRight size={14} className={styles.activeArrow} />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className={styles.sidebarFooter}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={16} strokeWidth={2} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
}
