/**
 * Applies syntax highlighting to code blocks in the Lexical editor using the
 * CSS Custom Highlights API. Delegates to the shared codeHighlighting module
 * for tokenization, range creation, and highlight management.
 */

import { type JSX } from 'react';
import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { CodeNode, $isCodeNode } from '@/lib/vendor/lexical/CodeNode';
import { $getNodeByKey, $isElementNode, type LexicalEditor, type NodeKey } from 'lexical';
import { IframeWidgetNode } from '../../embeds/IframeWidgetEmbed/IframeWidgetNode';
import { useStyles } from '@/components/hooks/useStyles';
import {
  getHighlights,
  highlightCodeElement,
  updateHighlightContext,
  removeHighlightContext,
  codeHighlightStyles,
} from '@/lib/codeHighlighting';

let nextEditorContextId = 0;

function applyHighlights(
  editor: LexicalEditor,
  codeNodeKeys: Set<NodeKey>,
  dirtyKeys: Set<NodeKey>,
  rangesPerBlock: Map<NodeKey, Map<string, Range[]>>,
  contextId: string,
): void {
  if (!getHighlights()) return;

  // Only re-tokenize dirty blocks; keep cached ranges for clean ones.
  editor.getEditorState().read(() => {
    for (const key of dirtyKeys) {
      if (!codeNodeKeys.has(key)) {
        rangesPerBlock.delete(key);
        continue;
      }
      const node = $getNodeByKey(key);
      if (!node || !$isCodeNode(node) || !$isElementNode(node) || !node.isAttached()) {
        rangesPerBlock.delete(key);
        continue;
      }
      const element = editor.getElementByKey(key);
      if (!element) {
        rangesPerBlock.delete(key);
        continue;
      }
      const blockRanges = new Map<string, Range[]>();
      const language = node.getLanguage();
      highlightCodeElement(element, language ?? undefined, blockRanges);
      rangesPerBlock.set(key, blockRanges);
    }
  });

  // Merge per-block ranges into per-group ranges for the context.
  const merged = new Map<string, Range[]>();
  for (const blockRanges of rangesPerBlock.values()) {
    for (const [group, ranges] of blockRanges) {
      let existing = merged.get(group);
      if (!existing) {
        existing = [];
        merged.set(group, existing);
      }
      existing.push(...ranges);
    }
  }
  updateHighlightContext(contextId, merged);
}

export default function CodeHighlightCSSPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const timerRef = useRef<number | null>(null);
  useStyles(codeHighlightStyles);

  useEffect(() => {
    if (!getHighlights()) return;

    const contextId = `editor-${nextEditorContextId++}`;
    const codeNodeKeys = new Set<NodeKey>();
    const pendingDirtyKeys = new Set<NodeKey>();
    const rangesPerBlock = new Map<NodeKey, Map<string, Range[]>>();

    // Debounce tokenization so it runs during natural typing pauses
    // (~150ms) rather than on every keystroke.
    const HIGHLIGHT_DEBOUNCE_MS = 150;
    const scheduleHighlight = () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        const dirtyKeys = new Set(pendingDirtyKeys);
        pendingDirtyKeys.clear();
        applyHighlights(editor, codeNodeKeys, dirtyKeys, rangesPerBlock, contextId);
      }, HIGHLIGHT_DEBOUNCE_MS);
    };

    const trackMutations = (mutations: Map<string, 'created' | 'updated' | 'destroyed'>) => {
      for (const [key, type] of mutations) {
        if (type === 'destroyed') {
          codeNodeKeys.delete(key);
          pendingDirtyKeys.add(key);
        } else {
          codeNodeKeys.add(key);
          pendingDirtyKeys.add(key);
        }
      }
      scheduleHighlight();
    };
    const removeCodeMutationListener = editor.registerMutationListener(
      CodeNode, trackMutations, { skipInitialization: false },
    );
    const removeWidgetMutationListener = editor.registerMutationListener(
      IframeWidgetNode, trackMutations, { skipInitialization: false },
    );

    const removeUpdateListener = editor.registerUpdateListener(
      ({ dirtyElements }) => {
        let hasDirtyCode = false;
        for (const key of codeNodeKeys) {
          if (dirtyElements.has(key)) {
            pendingDirtyKeys.add(key);
            hasDirtyCode = true;
          }
        }
        if (hasDirtyCode) {
          scheduleHighlight();
        }
      },
    );

    scheduleHighlight();

    return () => {
      removeCodeMutationListener();
      removeWidgetMutationListener();
      removeUpdateListener();
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      removeHighlightContext(contextId);
    };
  }, [editor]);

  return null;
}
