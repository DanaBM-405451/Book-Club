// src/app/layout.jsx

import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Book Club - Tu biblioteca personal',
  description: 'Gestiona tu biblioteca personal con gamificación',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  );
}