type AppLogoProps = {
  size?: number;
  className?: string;
};

export function AppLogo({ size = 28, className = "" }: AppLogoProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      fill="none"
    >
      <rect x="8" y="8" width="48" height="48" rx="14" fill="var(--panel)" />
      <path
        d="M32 15L47 49H40.5L36.75 40.25H27.1L23.4 49H17L32 15Z"
        fill="var(--text)"
      />
      <path
        d="M29.4 34.35H34.45L31.95 28.25L29.4 34.35Z"
        fill="var(--panel)"
      />
      <rect x="39" y="20" width="8" height="8" rx="2.5" fill="var(--accent)" />
    </svg>
  );
}
