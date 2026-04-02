/**
 * Applies syntax highlighting to code blocks in the Lexical editor using the
 * CSS Custom Highlights API. Delegates to the shared codeHighlighting module
 * for tokenization, range creation, and highlight management.
 */

import { type JSX } from 'react';
import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isCodeNode, CodeNode } from '@lexical/code';
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

function applyHighlights(editor: LexicalEditor, codeNodeKeys: Set<NodeKey>, contextId: string): void {
  if (!getHighlights()) return;
  if (codeNodeKeys.size === 0) {
    updateHighlightContext(contextId, new Map());
    return;
  }

  const rangesByGroup = new Map<string, Range[]>();

  editor.getEditorState().read(() => {
    for (const key of codeNodeKeys) {
      const node = $getNodeByKey(key);
      if (!node || !$isCodeNode(node) || !$isElementNode(node) || !node.isAttached()) {
        continue;
      }
      const element = editor.getElementByKey(key);
      if (!element) continue;
      const language = node.getLanguage();
      highlightCodeElement(element, language ?? undefined, rangesByGroup);
    }
  });

  updateHighlightContext(contextId, rangesByGroup);
}

export default function CodeHighlightCSSPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const rafRef = useRef<number | null>(null);
  useStyles(codeHighlightStyles);

  useEffect(() => {
    if (!getHighlights()) return;

    const contextId = `editor-${nextEditorContextId++}`;
    const codeNodeKeys = new Set<NodeKey>();

    const scheduleHighlight = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        applyHighlights(editor, codeNodeKeys, contextId);
      });
    };

    const trackMutations = (mutations: Map<string, 'created' | 'updated' | 'destroyed'>) => {
      for (const [key, type] of mutations) {
        if (type === 'destroyed') {
          codeNodeKeys.delete(key);
        } else {
          codeNodeKeys.add(key);
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
        for (const key of codeNodeKeys) {
          if (dirtyElements.has(key)) {
            scheduleHighlight();
            return;
          }
        }
      },
    );

    scheduleHighlight();

    return () => {
      removeCodeMutationListener();
      removeWidgetMutationListener();
      removeUpdateListener();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      removeHighlightContext(contextId);
    };
  }, [editor]);

  return null;
}
