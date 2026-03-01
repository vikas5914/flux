'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';
import type { Content } from '../data/content';

interface SearchBarProps {
  onSearchFocus?: (focused: boolean) => void;
}

export function SearchBar({ onSearchFocus }: SearchBarProps) {
  const { query, setQuery, results, isLoading } = useSearch();
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    onSearchFocus?.(isFocused && (query.length > 0));
  }, [isFocused, query, onSearchFocus]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      router.push(`/title/${results[selectedIndex].id}`);
      setQuery('');
      setIsFocused(false);
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (content: Content) => {
    router.push(`/title/${content.id}`);
    setQuery('');
    setIsFocused(false);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        {isLoading ? (
          <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#f6821f] animate-spin" />
        ) : (
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717a]" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder="Search movies, series, actors..."
          className="w-full bg-[#111111] border border-[#2a2a2a] rounded text-white pl-12 pr-10 py-3.5 text-base placeholder:text-[#71717a] focus:outline-none focus:border-[#3a3a3a] transition-colors"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {isFocused && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0f0f0f] border border-[#1f1f1f] rounded max-h-[400px] overflow-y-auto z-50">
          {results.map((content, index) => (
            <button
              key={content.id}
              onClick={() => handleSelect(content)}
              className={`w-full flex items-center gap-4 p-3 text-left transition-colors ${
                index === selectedIndex ? 'bg-[#151515]' : 'hover:bg-[#151515]'
              }`}
            >
              <img
                src={content.poster}
                alt={content.title}
                className="w-12 h-16 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {content.title}
                </p>
                <p className="text-xs text-[#a1a1aa] mt-0.5">
                  {content.year} • {content.type === 'movie' ? 'Movie' : 'Series'} • {content.rating}
                </p>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-[#f6821f] bg-[#151515] border border-[#2a2a2a] px-1.5 py-0.5 rounded">
                {content.type}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
