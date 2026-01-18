import type { Metadata, Viewport } from 'next';
import { Inter, Source_Serif_4, JetBrains_Mono } from 'next/font/google';
import '../styles/globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const serif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Credit Report Analyzer | FCRA Violation Detection',
  description: 'Free tool to detect illegal debt re-aging and FCRA/FDCPA violations in your credit report. Generate dispute letters automatically.',
  keywords: ['credit report', 'FCRA', 'FDCPA', 'debt re-aging', 'dispute letter', 'credit repair'],
  authors: [{ name: 'Credit Report Analyzer' }],
  manifest: 'manifest.json',
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
  themeColor: '#111111',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  return (
    <html lang="en">
      <head>
        <link rel="icon" href={`${basePath}/favicon.svg`} sizes="any" type="image/svg+xml" />
        <link rel="apple-touch-icon" href={`${basePath}/icons/icon.svg`} />
        <link rel="manifest" href={`${basePath}/manifest.json`} />
      </head>
      <body className={`${inter.variable} ${serif.variable} ${mono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
