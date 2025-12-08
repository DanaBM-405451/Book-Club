'use client';
import Link from 'next/link';
import { BookOpen, ArrowLeft } from 'lucide-react';

export default function PublicNavbar() {
  return (
    <nav className="w-full bg-white border-b border-neutral-200 py-4 px-6 flex items-center justify-between sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2">
        <div className="bg-primary-500 p-1.5 rounded-lg">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <span className="font-heading text-xl font-bold text-neutral-800">Book Club</span>
      </Link>
      
      <Link 
        href="/register" 
        className="flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Volver al registro
      </Link>
    </nav>
  );
}