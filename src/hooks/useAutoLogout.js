import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const LOGIN_TIME_KEY = 'loginTime';

export function useAutoLogout() {
  const router = useRouter();

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem(LOGIN_TIME_KEY);
    toast.error('Sesi Anda telah berakhir. Silakan login kembali.');
    router.push('/login');
  }, [router]);

  const checkLoginTimeout = useCallback(() => {
    const loginTime = localStorage.getItem(LOGIN_TIME_KEY);

    if (!loginTime) {
      // If no login time exists, set it now
      localStorage.setItem(LOGIN_TIME_KEY, Date.now().toString());
      return;
    }

    const currentTime = Date.now();
    const elapsedTime = currentTime - parseInt(loginTime, 10);

    if (elapsedTime >= TIMEOUT_DURATION) {
      logout();
    }
  }, [logout]);

  useEffect(() => {
    // Check immediately on mount
    checkLoginTimeout();

    // Set up interval to check every minute
    const intervalId = setInterval(checkLoginTimeout, 60 * 1000); // Check every 1 minute

    return () => clearInterval(intervalId);
  }, [checkLoginTimeout]);

  return { logout, checkLoginTimeout };
}

// Helper function to set login time when user logs in
export function setLoginTime() {
  localStorage.setItem(LOGIN_TIME_KEY, Date.now().toString());
}

// Helper function to clear login time
export function clearLoginTime() {
  localStorage.removeItem(LOGIN_TIME_KEY);
}
