import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Fraunces, IBM_Plex_Mono } from 'next/font/google';
import '../styles/globals.css';
import { Providers } from './providers';

const sans = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const serif = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

import { BRANDING } from '../config/branding';

// ... other imports ...

export const metadata: Metadata = {
  title: BRANDING.metaTitle,
  description: BRANDING.metaDescription,
  keywords: ['credit report', 'FCRA', 'FDCPA', 'debt re-aging', 'dispute letter', 'credit repair', 'forensic analysis'],
  authors: [{ name: BRANDING.organizationName }],
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.svg',
    apple: '/icons/icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: BRANDING.appName,
  },
  openGraph: {
    title: BRANDING.appName,
    description: BRANDING.metaDescription,
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var root = document.documentElement;
                  var stored = localStorage.getItem('cra_dark_mode');
                  var prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var useDark = stored === 'true' || (stored !== 'false' && stored === null && prefersDark);
                  if (useDark) root.classList.add('dark');
                  else root.classList.remove('dark');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${sans.variable} ${serif.variable} ${mono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
