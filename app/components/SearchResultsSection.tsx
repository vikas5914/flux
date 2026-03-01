'use client';

import type { Content } from '../data/content';
import { SectionHeading } from './SectionHeading';
import { ContentGrid } from './ContentGrid';
import { Spinner } from './Spinner';
import { EmptyState } from './EmptyState';

interface SearchResultsSectionProps {
  query: string;
  results: Content[];
  isLoading: boolean;
}

export function SearchResultsSection({ query, results, isLoading }: SearchResultsSectionProps) {
  return (
    <section>
      <SectionHeading title="Search Results">
        {!isLoading && results.length > 0 && (
          <span className="text-xs text-[#71717a]">
            {results.length} found
          </span>
        )}
      </SectionHeading>

      {isLoading ? (
        <Spinner />
      ) : results.length > 0 ? (
        <ContentGrid items={results} />
      ) : (
        <EmptyState
          message={`No results found for \u201c${query}\u201d`}
          hint="Try a different search term"
        />
      )}
    </section>
  );
}
