interface SectionHeadingProps {
  title: string;
  children?: React.ReactNode;
}

export function SectionHeading({ title, children }: SectionHeadingProps) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="h-px w-6 bg-[#f6821f]" />
      <h2 className="font-mono text-xs uppercase tracking-widest text-[#f6821f]">{title}</h2>
      {children}
    </div>
  );
}
