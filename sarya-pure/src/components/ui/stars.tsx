export function Stars({ rating, size = 16, label = true }: { rating: number; size?: number; label?: boolean }) {
  const r = Math.max(0, Math.min(5, rating));
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`Rated ${r.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, r - (i - 1)));
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 20 20" aria-hidden>
            <defs>
              <linearGradient id={`s${i}-${Math.round(fill * 100)}`}>
                <stop offset={`${fill * 100}%`} stopColor="#b8923a" />
                <stop offset={`${fill * 100}%`} stopColor="#e4d3b8" />
              </linearGradient>
            </defs>
            <path
              fill={`url(#s${i}-${Math.round(fill * 100)})`}
              d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z"
            />
          </svg>
        );
      })}
      {label && <span className="sr-only">{r.toFixed(1)} stars</span>}
    </span>
  );
}
