type LoadingBlockProps = {
  lines?: number;
};

export function LoadingBlock({ lines = 3 }: LoadingBlockProps) {
  return (
    <div className="app-surface animate-pulse rounded-[26px] p-5">
      <div
        className="h-4 w-24 rounded-full"
        style={{ background: "color-mix(in srgb, var(--accent-soft) 86%, transparent)" }}
      />
      <div className="mt-4 space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="h-3 rounded-full"
            style={{
              background: "color-mix(in srgb, var(--surface-2) 94%, transparent)",
              width: `${92 - index * 12}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
