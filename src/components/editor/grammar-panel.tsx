"use client";

import type { Editor } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import type { Lint, LocalLinter } from "harper.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { addDictionaryWord } from "@/app/studio/actions";

/**
 * "Check spelling & grammar" with Harper, a rule-based checker that runs
 * entirely in the browser (no AI, nothing sent anywhere). It runs only when
 * the panel is opened or "Check again" is pressed, and walks through the
 * issues one at a time: Fix / Ignore / Add to dictionary.
 */

type Issue = {
  key: string;
  from: number;
  to: number;
  problem: string;
  message: string;
  kind: string;
  suggestions: { text: string; remove: boolean }[];
};

let linterPromise: Promise<LocalLinter> | null = null;
async function getLinter(dictionary: string[]) {
  if (!linterPromise) {
    linterPromise = (async () => {
      const { LocalLinter } = await import("harper.js");
      const { binaryInlined } = await import("harper.js/binaryInlined");
      const linter = new LocalLinter({ binary: binaryInlined });
      await linter.setup();
      if (dictionary.length) await linter.importWords(dictionary);
      return linter;
    })();
  }
  return linterPromise;
}

/** Text of one paragraph or heading, plus the document position of each character. */
function blockText(block: PMNode, blockPos: number) {
  let text = "";
  const pos: number[] = [];
  block.forEach((child, offset) => {
    const start = blockPos + 1 + offset;
    if (child.isText) {
      // Harper counts characters (code points), so walk by code point.
      let i = 0;
      for (const ch of child.text ?? "") {
        text += ch;
        pos.push(start + i);
        i += ch.length;
      }
    } else {
      text += " "; // footnote markers, line breaks
      pos.push(start);
    }
  });
  return { text, pos };
}

async function findIssues(editor: Editor, linter: LocalLinter, ignored: Set<string>): Promise<Issue[]> {
  const issues: Issue[] = [];
  const blocks: { node: PMNode; pos: number }[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.isTextblock) {
      blocks.push({ node, pos });
      return false;
    }
    return true;
  });
  for (const { node, pos: blockPos } of blocks) {
    const { text, pos } = blockText(node, blockPos);
    if (!text.trim()) continue;
    const chars = Array.from(text);
    const lints: Lint[] = await linter.lint(text, { language: "plaintext" });
    for (const l of lints) {
      const span = l.span();
      if (span.start >= pos.length) continue;
      const from = pos[span.start];
      const to = span.end > span.start ? pos[span.end - 1] + (chars[span.end - 1]?.length ?? 1) : from;
      const problem = chars.slice(span.start, span.end).join("");
      const key = `${text}|${span.start}|${l.message()}`;
      if (ignored.has(key)) continue;
      issues.push({
        key,
        from,
        to,
        problem,
        message: l.message(),
        kind: l.lint_kind_pretty(),
        suggestions: l
          .suggestions()
          .slice(0, 4)
          .map((s) => ({ text: s.get_replacement_text(), remove: s.kind() === 1 })),
      });
    }
  }
  return issues;
}

export function GrammarPanel({ editor, dictionary, onClose }: { editor: Editor; dictionary: string[]; onClose: () => void }) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [index, setIndex] = useState(0);
  const ignored = useRef(new Set<string>());
  const linterRef = useRef<LocalLinter | null>(null);

  const check = useCallback(async () => {
    setStatus("loading");
    try {
      const linter = linterRef.current ?? (linterRef.current = await getLinter(dictionary));
      const found = await findIssues(editor, linter, ignored.current);
      setIssues(found);
      setIndex(0);
      setStatus("ready");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  }, [editor, dictionary]);

  useEffect(() => {
    check();
  }, [check]);

  const current = issues[index];

  // Select the problem words in the editor so they're easy to see.
  useEffect(() => {
    if (!current) return;
    editor.chain().setTextSelection({ from: current.from, to: current.to }).scrollIntoView().run();
  }, [current, editor]);

  const recheck = async () => {
    if (!linterRef.current) return;
    const found = await findIssues(editor, linterRef.current, ignored.current);
    setIssues(found);
    setIndex((i) => Math.min(i, Math.max(0, found.length - 1)));
  };

  const fix = async (s: { text: string; remove: boolean }) => {
    if (!current) return;
    editor
      .chain()
      .focus()
      .insertContentAt({ from: current.from, to: current.to }, s.remove ? "" : s.text)
      .run();
    await recheck();
  };

  const ignore = async () => {
    if (!current) return;
    ignored.current.add(current.key);
    await recheck();
  };

  const addWord = async () => {
    if (!current || !linterRef.current) return;
    const word = current.problem.trim();
    await addDictionaryWord(word);
    await linterRef.current.importWords([word]);
    await recheck();
  };

  return (
    <section className="s-panel flex flex-col gap-3" aria-labelledby="grammar-title" aria-live="polite">
      <div className="flex items-baseline justify-between">
        <h2 id="grammar-title" className="s-panel-title m-0">
          Spelling &amp; grammar
        </h2>
        <button type="button" className="text-[14px] text-slate italic" onClick={onClose}>
          Close
        </button>
      </div>

      {status === "loading" && <p className="m-0 text-[16px] text-slate">Checking…</p>}
      {status === "error" && <p className="m-0 text-[16px] text-[#8a2a22]">The checker couldn&apos;t start. Try reloading the page.</p>}

      {status === "ready" && !current && (
        <p className="m-0 text-[16px]">No issues found. Your browser&apos;s own spell check still underlines words as you type.</p>
      )}

      {status === "ready" && current && (
        <>
          <div className="text-[13px] text-slate">
            Issue {index + 1} of {issues.length} · {current.kind}
          </div>
          <div className="font-caslon text-[20px]">
            “<span className="bg-[#fbe3df]">{current.problem || "…"}</span>”
          </div>
          <p className="m-0 text-[16px] leading-snug">{current.message}</p>
          {current.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {current.suggestions.map((s, i) => (
                <button key={i} type="button" className="s-btn s-btn-primary normal-case tracking-normal" onClick={() => fix(s)}>
                  {s.remove ? "Remove it" : `Fix: ${s.text}`}
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="s-btn" onClick={ignore}>
              Ignore
            </button>
            {current.kind === "Spelling" && (
              <button type="button" className="s-btn" onClick={addWord}>
                Add to dictionary
              </button>
            )}
          </div>
          <div className="flex justify-between">
            <button type="button" className="text-[15px] text-slate disabled:opacity-40" disabled={index === 0} onClick={() => setIndex(index - 1)}>
              ← Previous
            </button>
            <button
              type="button"
              className="text-[15px] text-slate disabled:opacity-40"
              disabled={index >= issues.length - 1}
              onClick={() => setIndex(index + 1)}
            >
              Next →
            </button>
          </div>
        </>
      )}
      {status === "ready" && (
        <button type="button" className="s-btn" onClick={check}>
          Check again
        </button>
      )}
    </section>
  );
}
