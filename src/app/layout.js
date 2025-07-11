// ===== FILE: src/app/layout.js =====
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Shopify Sales Dashboard',
  description: 'Visualize gross sales, net revenue, refunds and more for every studio',
  keywords: 'shopify, sales, dashboard, analytics, studio, revenue',
  authors: [{ name: 'Your Company' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#3B82F6',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-gray-50 antialiased">
        {children}
      </body>
    </html>
  );
}