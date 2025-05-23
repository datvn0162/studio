import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans'; // Corrected import from geist
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/Header';

const geistSans = GeistSans({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AgriClassify - AI Powered Produce Classification',
  description: 'Upload images of agricultural products for AI-driven classification and analysis.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} font-sans antialiased flex flex-col min-h-screen`}>
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <Toaster />
        <footer className="py-6 text-center text-muted-foreground text-sm">
          © {new Date().getFullYear()} AgriClassify. AI for a greener future.
        </footer>
      </body>
    </html>
  );
}
