'use client';

import { useCallback, useState } from 'react';
import { getBrowserLocalStorage } from '@/components/editor/localStorageHandlers';
import {
  DEFAULT_RESEARCH_EFFORT,
  DEFAULT_RESEARCH_MODEL,
  isResearchEffortLevel,
  isResearchModelAlias,
  type ResearchEffortLevel,
  type ResearchModelAlias,
} from '@/lib/research/agentModels';

export interface ModelEffortSelection {
  model: ResearchModelAlias;
  effort: ResearchEffortLevel;
}

// Persisted per-conversation (per device) so each conversation keeps its own
// last-used model/effort. New conversations (and the /query fire, whose id is
// freshly minted) seed from a single global "last used" default, so the picker
// opens on whatever the user last chose rather than resetting to the baseline.
const KEY_PREFIX = 'research:modelEffort:';
const GLOBAL_DEFAULT_KEY = `${KEY_PREFIX}__default__`;

function keyFor(conversationId: string | null | undefined): string {
  return conversationId ? `${KEY_PREFIX}${conversationId}` : GLOBAL_DEFAULT_KEY;
}

function readSelection(key: string): ModelEffortSelection | null {
  const raw = getBrowserLocalStorage()?.getItem(key);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const model = (parsed as Record<string, unknown>).model;
    const effort = (parsed as Record<string, unknown>).effort;
    if (isResearchModelAlias(model) && isResearchEffortLevel(effort)) return { model, effort };
  } catch {
    // Corrupt/legacy value — fall through to the caller's default.
  }
  return null;
}

/**
 * Resolve the initial selection for `conversationId`: its own saved value, else
 * the global last-used default, else the built-in baseline. Read lazily (once,
 * in the useState initializer) — this is a client-only device preference, so no
 * cross-tab reactivity is needed.
 */
export function resolveInitialSelection(conversationId: string | null | undefined): ModelEffortSelection {
  return (
    (conversationId && readSelection(keyFor(conversationId))) ||
    readSelection(GLOBAL_DEFAULT_KEY) ||
    { model: DEFAULT_RESEARCH_MODEL, effort: DEFAULT_RESEARCH_EFFORT }
  );
}

/**
 * Per-conversation model/effort selection for a composer. Returns the current
 * selection plus setters that persist to localStorage (both the conversation's
 * own key and the shared default, so the next new conversation inherits it).
 */
export function useModelEffortSelection(conversationId: string | null | undefined) {
  const [selection, setSelection] = useState<ModelEffortSelection>(
    () => resolveInitialSelection(conversationId),
  );

  const persist = useCallback(
    (next: ModelEffortSelection) => {
      const serialized = JSON.stringify(next);
      const storage = getBrowserLocalStorage();
      storage?.setItem(keyFor(conversationId), serialized);
      storage?.setItem(GLOBAL_DEFAULT_KEY, serialized);
    },
    [conversationId],
  );

  const setModel = useCallback(
    (model: ResearchModelAlias) => {
      setSelection((prev) => {
        const next = { ...prev, model };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const setEffort = useCallback(
    (effort: ResearchEffortLevel) => {
      setSelection((prev) => {
        const next = { ...prev, effort };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  return { selection, setModel, setEffort };
}
