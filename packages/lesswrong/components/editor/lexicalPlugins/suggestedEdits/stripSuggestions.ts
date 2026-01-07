import type { LexicalEditor } from 'lexical';

import { $getRoot, $isElementNode } from 'lexical';

import {
  $isSuggestionDeletionBlockNode,
} from './nodes/SuggestionDeletionBlockNode';
import { $isSuggestionInsertionBlockNode } from './nodes/SuggestionInsertionBlockNode';
import { $isSuggestionDeletionInlineNode } from './nodes/SuggestionDeletionInlineNode';
import { $isSuggestionInsertionInlineNode } from './nodes/SuggestionInsertionInlineNode';
import { $isSuggestionReplacementInlineNode } from './nodes/SuggestionReplacementInlineNode';

function unwrapElementNode(node: import('lexical').ElementNode): void {
  let child = node.getFirstChild();
  while (child) {
    const next = child.getNextSibling();
    node.insertBefore(child);
    child = next;
  }
  node.remove();
}

function stripSuggestionsInPlace(node: import('lexical').LexicalNode): void {
  if ($isSuggestionReplacementInlineNode(node)) {
    // Strip children first (will remove insertion wrappers and unwrap deletion wrappers),
    // then unwrap the replacement wrapper itself.
    const children = node.getChildren();
    for (const child of children) {
      stripSuggestionsInPlace(child);
    }
    unwrapElementNode(node);
    return;
  }
  if ($isSuggestionInsertionInlineNode(node) || $isSuggestionInsertionBlockNode(node)) {
    node.remove();
    return;
  }
  if ($isSuggestionDeletionInlineNode(node) || $isSuggestionDeletionBlockNode(node)) {
    unwrapElementNode(node);
    return;
  }
  if ($isElementNode(node)) {
    const children = node.getChildren();
    for (const child of children) {
      stripSuggestionsInPlace(child);
    }
  }
}

/**
 * Mutates the current editor state by stripping suggestions.
 * Intended primarily for server-side derivations (e.g. generating reader-visible HTML).
 */
export function stripSuggestions(editor: LexicalEditor): void {
  editor.update(() => {
    const root = $getRoot();
    stripSuggestionsInPlace(root);
  });
}


