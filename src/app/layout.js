import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

// ⚠️ METADATA - Tanpa viewport
export const metadata = {
  title: 'Absensi User',
  description: 'Aplikasi Absensi untuk User Lapangan',
  
  icons: {
    icon: [
      { url: '/favicon.ico' },
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
      <body className={inter.className}>{children}</body>
    </html>
  );
}