import { Inter } from 'next/font/google';
import QueryProvider from '@/providers/QueryProvider';

const inter = Inter({ subsets: ['latin'] });

// ⚠️ METADATA - Tanpa viewport
export const metadata = {
  title: 'Absensi User',
  description: 'Aplikasi Absensi untuk User Lapangan',

  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },

  manifest: '/manifest.json',
};

// ⚠️ VIEWPORT - Export terpisah (Next.js 14+ requirement)
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}