import { Header } from "../components/Header";
import { HeroSection } from "../components/HeroSection";
import { ContinueWatching } from "../components/ContinueWatching";
import { TrendingSection } from "../components/TrendingSection";
import { SearchResultsSection } from "../components/SearchResultsSection";
import { useSearchQuery } from "../hooks/useSearchQuery";

export default function HomePage() {
  const { query, setQuery, results, isLoading } = useSearchQuery();
  const hasQuery = query.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />

      <main className="pt-14">
        <HeroSection query={query} onQueryChange={setQuery} isSearchLoading={isLoading} />

        <div className="max-w-6xl mx-auto px-6 pb-32">
          {hasQuery ? (
            <SearchResultsSection query={query} results={results} isLoading={isLoading} />
          ) : (
            <>
              <ContinueWatching />
              <TrendingSection />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
