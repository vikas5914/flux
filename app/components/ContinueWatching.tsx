"use client";

import { TitleCard } from "./TitleCard";
import { useWatchHistory } from "../hooks/useWatchHistory";

export function ContinueWatching() {
  const { getContinueWatching } = useWatchHistory();
  const items = getContinueWatching();

  if (items.length === 0) return null;

  return (
    <section className="mt-16">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px w-6 bg-[#f6821f]" />
        <h2 className="font-mono text-xs uppercase tracking-widest text-[#f6821f]">
          Continue Watching
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {items.map((item) => (
          <TitleCard
            key={item.content.id}
            content={item.content}
            progress={item.progress}
            showProgress
          />
        ))}
      </div>
    </section>
  );
}
