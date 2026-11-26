import { citeParts } from "@/lib/content/cite";

/** A quote's source line, with book titles in italics. */
export function CiteText({ value }: { value: string | null | undefined }) {
  return <>{citeParts(value).map((p, i) => (p.italic ? <em key={i}>{p.text}</em> : <span key={i}>{p.text}</span>))}</>;
}
