import { useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  isLoading?: boolean;
}

export function SearchBar({ query, onQueryChange, isLoading }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        {isLoading ? (
          <Loader2
            aria-hidden="true"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#f6821f] animate-spin"
          />
        ) : (
          <Search
            aria-hidden="true"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717a]"
          />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search movies, series or anime"
          className="w-full bg-[#111111] border border-[#2a2a2a] rounded text-white pl-12 pr-10 py-3.5 text-base placeholder:text-[#71717a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f6821f]/50 focus-visible:border-[#3a3a3a] transition-colors touch-action-manipulation"
        />
        {query && (
          <button
            onClick={() => {
              onQueryChange("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-[#f6821f]/50 rounded"
          >
            <X aria-hidden="true" className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
