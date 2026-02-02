'use client';

import { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import styles from '@/styles/PageLayout.module.css';

export default function PageLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className={styles.layout}>
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <div className={styles.mainArea}>
        <Navbar onMenuToggle={toggleSidebar} />
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    </div>
  );
}
