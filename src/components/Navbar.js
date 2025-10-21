'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from '@/styles/Navbar.module.css';

export default function Navbar() {
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
          <h1 className={styles.title}>Absensi Marketing</h1>
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