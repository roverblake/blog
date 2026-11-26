"use client";

import { Extension, type Editor, type Range } from "@tiptap/core";
import Suggestion, { type SuggestionProps, type SuggestionKeyDownProps } from "@tiptap/suggestion";

export type SlashItem = { title: string; hint: string; run: (editor: Editor, range: Range) => void };

export type SlashBridge = {
  onStart: (p: SuggestionProps<SlashItem>) => void;
  onUpdate: (p: SuggestionProps<SlashItem>) => void;
  onKeyDown: (p: SuggestionKeyDownProps) => boolean;
  onExit: () => void;
};

/** "/" menu: type a slash to insert headings, quotes, images, the paywall line… */
export function createSlash(items: SlashItem[], bridge: { current: SlashBridge | null }) {
  return Extension.create({
    name: "slashCommand",
    addProseMirrorPlugins() {
      return [
        Suggestion<SlashItem>({
          editor: this.editor,
          char: "/",
          allowSpaces: false,
          startOfLine: false,
          items: ({ query }) => items.filter((i) => i.title.toLowerCase().includes(query.toLowerCase())).slice(0, 12),
          command: ({ editor, range, props }) => props.run(editor, range),
          render: () => ({
            onStart: (p) => bridge.current?.onStart(p),
            onUpdate: (p) => bridge.current?.onUpdate(p),
            onKeyDown: (p) => bridge.current?.onKeyDown(p) ?? false,
            onExit: () => bridge.current?.onExit(),
          }),
        }),
      ];
    },
  });
}
