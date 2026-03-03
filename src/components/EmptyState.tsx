interface EmptyStateProps {
  message: string;
  hint?: string;
}

export function EmptyState({ message, hint }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-[#a1a1aa] text-sm">{message}</p>
      {hint && <p className="text-[#71717a] text-xs mt-1">{hint}</p>}
    </div>
  );
}
