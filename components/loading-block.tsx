type LoadingBlockProps = {
  lines?: number;
};

export function LoadingBlock({ lines = 3 }: LoadingBlockProps) {
  return (
    <div className="animate-pulse rounded-3xl border border-border bg-white p-4">
      <div className="h-4 w-24 rounded-full bg-[#eadfce]" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="h-3 rounded-full bg-[#f0e7db]"
            style={{ width: `${92 - index * 12}%` }}
          />
        ))}
      </div>
    </div>
  );
}
