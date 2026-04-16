type EmptyStateProps = {
  eyebrow: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  disabled?: boolean;
};

export function EmptyState({
  eyebrow,
  title,
  description,
  actionLabel,
  onAction,
  disabled,
}: EmptyStateProps) {
  return (
    <div className="app-surface rounded-[28px] px-7 py-8 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">
        {eyebrow}
      </p>
      <h3 className="font-display mt-4 text-[1.9rem] text-[var(--text)]">{title}</h3>
      <p className="mx-auto mt-3 max-w-[28rem] text-sm leading-7 text-[var(--text-muted)]">
        {description}
      </p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          disabled={disabled}
          className="app-button app-button-accent mt-6 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
