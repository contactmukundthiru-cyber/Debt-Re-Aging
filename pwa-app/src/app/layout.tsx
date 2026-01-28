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

import { BRANDING } from '../config/branding';

// ... other imports ...

export const metadata: Metadata = {
  title: BRANDING.metaTitle,
  description: BRANDING.metaDescription,
  keywords: ['credit report', 'FCRA', 'FDCPA', 'debt re-aging', 'dispute letter', 'credit repair', 'forensic analysis'],
  authors: [{ name: BRANDING.organizationName }],
  manifest: 'manifest.json',
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
        <link rel="icon" href={`${basePath}/favicon.svg`} sizes="any" type="image/svg+xml" />
        <link rel="apple-touch-icon" href={`${basePath}/icons/icon.svg`} />
        <link rel="manifest" href={`${basePath}/manifest.json`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var dark = localStorage.getItem('cra_dark_mode');
                  var supportDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (dark === 'true' || (dark === null && supportDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${serif.variable} ${mono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
