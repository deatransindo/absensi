'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from '@/styles/Navbar.module.css';
import Image from 'next/image';

export default function Navbar({ onMenuToggle }) {
  const router = useRouter();
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

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.content}>
          {/* Hamburger Menu Button */}
          <button
            className={styles.menuBtn}
            onClick={onMenuToggle}
            aria-label="Toggle menu"
          >
            <span className={styles.hamburger}>
              <span className={styles.hamburgerLine}></span>
              <span className={styles.hamburgerLine}></span>
              <span className={styles.hamburgerLine}></span>
            </span>
          </button>

          {/* Logo - Hidden on desktop when sidebar is visible */}
          <div className={styles.logoWrapper}>
            <Image
              src="/Images/logo_dea2.png"
              alt="Logo"
              width={120}
              height={40}
              priority
              className={styles.logo}
            />
          </div>

          <div className={styles.rightSection}>
            {user && (
              <>
                <span className={styles.userName}>{user.name}</span>
                <button onClick={handleLogout} className={styles.logoutBtn}>
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
