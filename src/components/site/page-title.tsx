/** Centered title block for simple pages (About, Privacy, Subscribe). */
export function PageTitle({ kicker, title, subtitle }: { kicker?: string; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {kicker && <div className="kicker">{kicker}</div>}
      <h1 className="m-0 font-display text-[40px] leading-[1.05] font-normal sm:text-[56px]">{title}</h1>
      {subtitle && <p className="m-0 max-w-[640px] text-[20px] leading-[1.4] text-subtle italic sm:text-[24px]">{subtitle}</p>}
      <div className="mt-1.5 h-px w-12 bg-ink" aria-hidden="true" />
    </div>
  );
}
