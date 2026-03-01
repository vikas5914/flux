import Link from 'next/link';
import { Play } from 'lucide-react';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-[#1f1f1f]">
      <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Play aria-hidden="true" className="w-5 h-5 text-[#f6821f] fill-[#f6821f]" />
          <span className="text-sm font-semibold tracking-tight">Stream</span>
        </Link>
        
        <nav className="flex items-center gap-6">
          <Link 
            href="/" 
            className="text-sm text-[#a1a1aa] hover:text-white transition-colors"
          >
            Home
          </Link>
          <Link 
            href="/" 
            className="text-sm text-[#a1a1aa] hover:text-white transition-colors"
          >
            Movies
          </Link>
          <Link 
            href="/" 
            className="text-sm text-[#a1a1aa] hover:text-white transition-colors"
          >
            Series
          </Link>
        </nav>
      </div>
    </header>
  );
}
