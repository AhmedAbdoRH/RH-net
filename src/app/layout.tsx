import type { Metadata } from 'next';
import { Cairo, Inter } from 'next/font/google';
import './globals.css';
import '../styles/design-system.css';
import '../styles/micro-interactions.css';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseProvider } from '@/firebase/provider';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { LeaderboardFooter } from '@/components/leaderboard-footer';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-cairo',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});


export const metadata: Metadata = {
  title: 'لوحة تحكم النطاقات',
  description: 'إدارة النطاقات وتتبع تواريخ التجديد والتكاليف بسهولة.',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className={`dark ${cairo.variable} ${inter.variable}`}>
      <body className="font-sans antialiased min-h-screen flex flex-col bg-background relative" suppressHydrationWarning>
        <FirebaseProvider>
          <FirebaseClientProvider>
            <main className="flex-1">
              {children}
            </main>
            <LeaderboardFooter />
          </FirebaseClientProvider>
        </FirebaseProvider>
        <Toaster />
      </body>
    </html>
  );
}
