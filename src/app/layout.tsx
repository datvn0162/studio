import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/Header';

// Removed incorrect GeistSans initialization:
// const geistSans = GeistSans({
//   variable: '--font-geist-sans',
//   subsets: ['latin'],
// });

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
    <html lang="en" className={GeistSans.variable}>
      {/*
        The `font-sans` class is applied globally via globals.css.
        GeistSans.variable on <html> provides the CSS custom property --font-geist-sans.
        Tailwind's `font-sans` utility is configured in tailwind.config.ts to use this variable.
      */}
      <body className="antialiased flex flex-col min-h-screen">
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
