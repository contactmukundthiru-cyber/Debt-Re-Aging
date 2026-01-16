import type { Metadata, Viewport } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Credit Report Analyzer | FCRA Violation Detection',
  description: 'Free tool to detect illegal debt re-aging and FCRA/FDCPA violations in your credit report. Generate dispute letters automatically.',
  keywords: ['credit report', 'FCRA', 'FDCPA', 'debt re-aging', 'dispute letter', 'credit repair'],
  authors: [{ name: 'Credit Report Analyzer' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Credit Analyzer',
  },
  openGraph: {
    title: 'Credit Report Analyzer',
    description: 'Free FCRA violation detection tool',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1e40af',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
