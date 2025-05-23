import { Leaf } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
          <Leaf className="h-8 w-8" />
          <h1 className="text-2xl font-bold">AgriClassify</h1>
        </Link>
        {/* Future navigation links can go here */}
      </div>
    </header>
  );
}