import { Inter } from 'next/font/google';
// import '@/styles/globals.css'; // Comment ini dulu

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Absensi Marketing',
  description: 'Aplikasi Absensi untuk Marketing Lapangan',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={inter.className}>{children}</body>
    </html>
  );
}