"use client";

import { SearchBar } from "./SearchBar";

interface HeroSectionProps {
  query: string;
  onQueryChange: (query: string) => void;
  isSearchLoading: boolean;
}

export function HeroSection({ query, onQueryChange, isSearchLoading }: HeroSectionProps) {
  return (
    <section className="min-h-[40vh] flex flex-col items-center justify-center px-6 py-24">
      <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-white text-center mb-4 text-balance">
        Watch something
      </h1>
      <p className="text-lg text-[#a1a1aa] text-center mb-12 max-w-md">
        Search for movies and series to start watching instantly.
      </p>

      <SearchBar query={query} onQueryChange={onQueryChange} isLoading={isSearchLoading} />
    </section>
  );
}
