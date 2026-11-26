"use client";

import type { Editor } from "@tiptap/core";

/** Placeholder; the Harper spelling and grammar check is added in the next step. */
export function GrammarPanel({ onClose }: { editor: Editor; dictionary: string[]; onClose: () => void }) {
  return (
    <section className="s-panel">
      <div className="s-panel-title">Spelling &amp; grammar</div>
      <p className="text-[15px] text-slate">Coming in the next step.</p>
      <button type="button" className="s-btn" onClick={onClose}>Close</button>
    </section>
  );
}
