import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { BottomNav } from '@/components/BottomNav';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Hackey | AI × PM Event Tracker & Digest",
  description: "WhatsApp-First AI & PM Event Tracker, Hackathon Deadlines, and Actionable Daily Digest for Students & Builders.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable} dark`}>
      <body className="bg-background text-text min-h-screen flex antialiased">
        <Sidebar />
        <main className="flex-1 lg:pl-60 pb-20 lg:pb-8 min-h-screen">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
        <BottomNav />
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: '#1a1d2e',
              border: '1px solid #2a2f4a',
              color: '#e2e8f0',
            },
          }}
        />
      </body>
    </html>
  );
}
