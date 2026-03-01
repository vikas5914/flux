import Link from 'next/link';
import { Play } from 'lucide-react';
import type { Content } from '../data/content';

interface TitleCardProps {
  content: Content;
  progress?: number;
  episodeId?: string;
  showProgress?: boolean;
}

export function TitleCard({ content, progress, showProgress = false }: TitleCardProps) {
  return (
    <Link
      href={`/title/${content.id}`}
      className="group block"
    >
      <div className="relative aspect-2/3 overflow-hidden rounded">
        <img
          src={content.poster}
          alt={content.title}
          width={200}
          height={300}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play aria-hidden="true" className="w-5 h-5 text-black fill-black ml-0.5" />
          </div>
        </div>
        {showProgress && progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1f1f1f]">
            <div
              className="h-full bg-[#f6821f]"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
      <div className="mt-2">
        <p className="text-sm font-medium text-white truncate group-hover:text-[#f6821f] transition-colors">
          {content.title}
        </p>
        <p className="text-xs text-[#71717a] mt-0.5">
          {content.year}
        </p>
      </div>
    </Link>
  );
}
