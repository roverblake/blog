/** A small fleur-de-lis emblem (inline SVG, so it looks the same everywhere). */
export function FleurDeLis({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="2 1 36 34" aria-hidden="true" focusable="false" className={className} fill="currentColor">
      <path d="M20 2 C23.5 7 25 11 24 16 C23.3 19 22 21 21.2 23 L18.8 23 C18 21 16.7 19 16 16 C15 11 16.5 7 20 2 Z" />
      <path d="M17.6 23 C15 19 11 16.5 7.5 17.5 C4.5 18.4 3.5 21.5 5 23.8 C6.3 25.8 9 25.8 10 24 C10.6 22.8 9.8 21.6 8.6 21.8 C10.5 20.2 14 21 16.4 24.5 Z" />
      <path d="M22.4 23 C25 19 29 16.5 32.5 17.5 C35.5 18.4 36.5 21.5 35 23.8 C33.7 25.8 31 25.8 30 24 C29.4 22.8 30.2 21.6 31.4 21.8 C29.5 20.2 26 21 23.6 24.5 Z" />
      <rect x="13.5" y="24.3" width="13" height="2.4" rx="0.6" />
      <path d="M18.8 26.7 L21.2 26.7 C21.4 30 22.5 32.5 25 34 C22.6 34.4 21 33 20 31 C19 33 17.4 34.4 15 34 C17.5 32.5 18.6 30 18.8 26.7 Z" />
    </svg>
  );
}

/** A centered thin rule with a fleur-de-lis at each end (Nov 25 amendment). */
export function FleuronRule({ className = "" }: { className?: string }) {
  return (
    <div role="separator" className={`mx-auto flex w-full max-w-[560px] items-center gap-3 text-ink ${className}`}>
      <FleurDeLis className="h-[18px] w-[18px] shrink-0" />
      <span className="h-px flex-1 bg-ink" />
      <FleurDeLis className="h-[18px] w-[18px] shrink-0" />
    </div>
  );
}

/** A centered rule that tapers to nothing at both ends (Nov 25 amendment, option G). */
export function TaperedRule({ className = "" }: { className?: string }) {
  return (
    <div
      role="separator"
      className={`mx-auto h-[1.5px] w-full max-w-[560px] bg-[linear-gradient(90deg,transparent,var(--color-ink)_30%,var(--color-ink)_70%,transparent)] ${className}`}
    />
  );
}
