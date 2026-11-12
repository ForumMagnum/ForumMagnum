// Vendored from: https://github.com/excalidraw/excalidraw/commit/a52cd200927a975322934b42b966133232724bad
import { randomId } from "@excalidraw/common";

import { atom } from "../../editor-jotai";

import type { RateLimits, TChat } from "./types";

export const rateLimitsAtom = atom<RateLimits | null>(null);

export const showPreviewAtom = atom<boolean>(false);

export const errorAtom = atom<Error | null>(null);

export const chatHistoryAtom = atom<TChat.ChatHistory>({
  id: randomId(),
  messages: [],
  currentPrompt: "",
});
