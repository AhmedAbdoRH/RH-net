import type { Metadata } from 'next';
import './globals.css';
import '../styles/design-system.css';
import '../styles/micro-interactions.css';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseProvider } from '@/firebase/provider';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { LeaderboardFooter } from '@/components/leaderboard-footer';
import { PwaRegister } from '@/components/pwa-register';

export const metadata: Metadata = {
  title: 'RHM Digital',
  applicationName: 'RHM Digital',
  description: 'إدارة النطاقات وتتبع تواريخ التجديد والتكاليف بسهولة.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'RHM Digital',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon-square.png', type: 'image/png', sizes: 'any' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,100..900&family=Cairo:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased min-h-screen flex flex-col bg-background relative">
        <FirebaseProvider>
          <FirebaseClientProvider>
            <main className="flex-1">
              {children}
            </main>
            <LeaderboardFooter />
          </FirebaseClientProvider>
        </FirebaseProvider>
        <Toaster />
        <PwaRegister />
      </body>
    </html>
  );
}
