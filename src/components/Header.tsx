import { Link } from "react-router-dom";
import { Play } from "lucide-react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps = {}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-[#1f1f1f]">
      <div className="max-w-6xl mx-auto px-6 h-full grid grid-cols-[1fr_auto_1fr] items-center">
        <Link to="/" className="flex items-center gap-2 justify-self-start">
          <Play aria-hidden="true" className="w-5 h-5 text-[#f6821f] fill-[#f6821f]" />
          <span className="text-sm font-semibold tracking-tight">Flux</span>
        </Link>

        {title ? (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium text-white truncate">{title}</span>
            {subtitle && <span className="text-xs text-[#71717a] shrink-0">{subtitle}</span>}
          </div>
        ) : (
          <div />
        )}

        <nav className="flex items-center gap-6 justify-self-end">
          <Link to="/" className="text-sm text-[#a1a1aa] hover:text-white transition-colors">
            Home
          </Link>
        </nav>
      </div>
    </header>
  );
}
