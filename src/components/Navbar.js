'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, LogOut, Bell } from 'lucide-react';
import styles from '@/styles/Navbar.module.css';
import Image from 'next/image';

export default function Navbar({ onMenuToggle }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));

    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ''}`}>
      <div className={styles.content}>
        <button className={styles.menuBtn} onClick={onMenuToggle} aria-label="Toggle menu">
          <Menu size={22} strokeWidth={2} />
        </button>

        <div className={styles.logoWrapper}>
          <Image src="/Images/logo_dea2.png" alt="Logo" width={110} height={36} priority className={styles.logo} />
        </div>

        <div className={styles.rightSection}>
          {user && (
            <>
              <div className={styles.userPill}>
                <div className={styles.avatarSmall}>
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span className={styles.userName}>{user.name?.split(' ')[0]}</span>
              </div>
              <button onClick={handleLogout} className={styles.logoutBtn} title="Logout">
                <LogOut size={16} strokeWidth={2} />
                <span className={styles.logoutText}>Keluar</span>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
