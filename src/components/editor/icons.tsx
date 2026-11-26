/** Small line icons for the editor toolbar (stroke = currentColor). */
const P: Record<string, React.ReactNode> = {
  undo: <><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></>,
  redo: <><path d="m15 14 5-5-5-5" /><path d="M20 9H10a6 6 0 0 0 0 12h3" /></>,
  bold: <><path d="M7 4h6a4 4 0 0 1 0 8H7z" /><path d="M7 12h7a4 4 0 0 1 0 8H7z" /></>,
  italic: <><path d="M14 4h-4M14 20h-4M15 4 9 20" /></>,
  underline: <><path d="M7 4v7a5 5 0 0 0 10 0V4" /><path d="M5 20h14" /></>,
  strike: <><path d="M5 12h14" /><path d="M16 7a4 3 0 0 0-4-2c-2.5 0-4 1.3-4 3 0 1.2.8 2.2 2.4 2.8M8 17a4 3 0 0 0 4 2c2.5 0 4-1.3 4-3 0-.7-.2-1.3-.7-1.8" /></>,
  code: <><path d="m8 7-5 5 5 5M16 7l5 5-5 5" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="1" /><circle cx="9" cy="10" r="1.6" /><path d="m21 16-5-5-9 9" /></>,
  quote: <><path d="M5 18c2.5-1 4-3 4-6V7H4v5h4M14 18c2.5-1 4-3 4-6V7h-5v5h4" /></>,
  bullets: <><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /></>,
  numbers: <><path d="M10 6h10M10 12h10M10 18h10" /><path d="M4 4.5 5.5 4v4M4 14h2.5L4 17h2.5" /></>,
  divider: <><path d="M4 12h16" /><path d="M4 6h16M4 18h16" opacity=".3" /></>,
  more: <><circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" /></>,
};

export function Icon({ name }: { name: keyof typeof P | string }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[name]}
    </svg>
  );
}
