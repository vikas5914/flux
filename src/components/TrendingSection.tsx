import { useTrendingQuery } from "../hooks/useTrendingQuery";
import { SectionHeading } from "./SectionHeading";
import { ContentGrid } from "./ContentGrid";
import { Spinner } from "./Spinner";

export function TrendingSection() {
  const { data: trending = [], isLoading } = useTrendingQuery();

  if (isLoading) return <Spinner />;

  return (
    <section className="mt-16">
      <SectionHeading title="Trending Now" />
      <ContentGrid items={trending} />
    </section>
  );
}
