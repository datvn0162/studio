import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'AgriClassify - Phân loại nông sản bằng AI',
  description: 'Tải lên hình ảnh nông sản để được phân loại và phân tích bởi AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={GeistSans.variable}>
      <body className="antialiased flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <Toaster />
        <footer className="py-6 text-center text-muted-foreground text-sm">
          © {new Date().getFullYear()} AgriClassify. AI cho một tương lai xanh hơn.
        </footer>
      </body>
    </html>
  );
}
