"use client";

import React, { type JSX, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import {
  $createParagraphNode,
  $createRangeSelection,
  $createTextNode,
  $addUpdateTag,
  $getRoot,
  $getNodeByKey,
  $getSelection,
  $isElementNode,
  $isNodeSelection,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  COMMAND_PRIORITY_HIGH,
  CONTROLLED_TEXT_INSERTION_COMMAND,
  createCommand,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  INPUT_COMMAND,
  PASTE_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  SELECTION_INSERT_CLIPBOARD_NODES_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  COLLABORATION_TAG,
  ParagraphNode,
  type LexicalCommand,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical';

import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';

import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import Button from '@/lib/vendor/@material-ui/core/src/Button/Button';

import {
  INSERT_INLINE_THREAD_COMMAND,
  UPDATE_INLINE_THREAD_COMMAND,
  HIDE_THREAD_COMMAND,
  RESOLVE_SUGGESTION_BY_ID_COMMAND,
} from '@/components/lexical/plugins/CommentPlugin';

import { createSuggestionId } from './types';
import type { SuggestionMeta } from './types';
import {
  $createSuggestionDeletionBlockNode,
  $isSuggestionDeletionBlockNode,
} from './nodes/SuggestionDeletionBlockNode';
import {
  $createSuggestionInsertionBlockNode,
  $isSuggestionInsertionBlockNode,
} from './nodes/SuggestionInsertionBlockNode';
import {
  $createSuggestionDeletionInlineNode,
  $isSuggestionDeletionInlineNode,
} from './nodes/SuggestionDeletionInlineNode';
import {
  $createSuggestionInsertionInlineNode,
  $isSuggestionInsertionInlineNode,
} from './nodes/SuggestionInsertionInlineNode';
import {
  $createSuggestionReplacementInlineNode,
  $isSuggestionReplacementInlineNode,
} from './nodes/SuggestionReplacementInlineNode';

function truncateForQuote(s: string, maxLen: number): string {
  const trimmed = s.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1)}…`;
}

function findFirstAndLastTextDescendant(node: LexicalNode): { first: import('lexical').TextNode; last: import('lexical').TextNode } | null {
  const stack: LexicalNode[] = [node];
  let first: import('lexical').TextNode | null = null;
  let last: import('lexical').TextNode | null = null;

  while (stack.length) {
    const current = stack.pop();
    if (!current) break;
    if ($isTextNode(current)) {
      if (!first) first = current;
      last = current;
      continue;
    }
    if ($isElementNode(current)) {
      const children = current.getChildren();
      for (let i = children.length - 1; i >= 0; i--) {
        stack.push(children[i]);
      }
    }
  }

  return first && last ? { first, last } : null;
}

function buildDefaultSuggestionCommentBody(wrapper: LexicalNode): string {
  if ($isSuggestionReplacementInlineNode(wrapper)) {
    const children = wrapper.getChildren();
    const deletionChild = children.find(
      (c) => $isSuggestionDeletionInlineNode(c) || $isSuggestionDeletionBlockNode(c),
    );
    const insertionChild = children.find(
      (c) => $isSuggestionInsertionInlineNode(c) || $isSuggestionInsertionBlockNode(c),
    );
    const before = deletionChild ? truncateForQuote(deletionChild.getTextContent(), 80) : '';
    const after = insertionChild ? truncateForQuote(insertionChild.getTextContent(), 80) : '';
    if (before && after) return `Suggested replacement: “${before}” → “${after}”`;
    if (after) return `Suggested replacement: → “${after}”`;
    if (before) return `Suggested replacement: “${before}” → (deleted)`;
    return 'Suggested replacement.';
  }
  if ($isSuggestionInsertionInlineNode(wrapper) || $isSuggestionInsertionBlockNode(wrapper)) {
    const inserted = truncateForQuote(wrapper.getTextContent(), 120);
    return inserted ? `Suggested insertion: “${inserted}”` : 'Suggested insertion.';
  }
  if ($isSuggestionDeletionInlineNode(wrapper) || $isSuggestionDeletionBlockNode(wrapper)) {
    const deleted = truncateForQuote(wrapper.getTextContent(), 120);
    return deleted ? `Suggested deletion: “${deleted}”` : 'Suggested deletion.';
  }
  return 'Suggested edit.';
}

function autoCreateSuggestionCommentThread(editor: LexicalEditor, wrapper: LexicalNode): void {
  const meta = getSuggestionMetaIfWrapper(wrapper);
  if (!meta) return;

  const range = findFirstAndLastTextDescendant(wrapper);
  if (!range) return;

  const selection = $createRangeSelection();
  selection.anchor.set(range.first.getKey(), 0, 'text');
  selection.focus.set(range.last.getKey(), range.last.getTextContentSize(), 'text');
  $setSelection(selection);

  editor.dispatchCommand(INSERT_INLINE_THREAD_COMMAND, {
    threadId: meta.suggestionId,
    initialContent: buildDefaultSuggestionCommentBody(wrapper),
    quote: truncateForQuote(wrapper.getTextContent(), 120),
  });
}

function updateSuggestionThread(editor: LexicalEditor, wrapper: LexicalNode): void {
  const meta = getSuggestionMetaIfWrapper(wrapper);
  if (!meta) return;
  editor.dispatchCommand(UPDATE_INLINE_THREAD_COMMAND, {
    threadId: meta.suggestionId,
    quote: truncateForQuote(wrapper.getTextContent(), 120),
    firstCommentContent: buildDefaultSuggestionCommentBody(wrapper),
  });
}

function resolveSuggestionByIdInPlace(action: 'accept' | 'reject', suggestionId: string): boolean {
  const wrappers = getSuggestionWrapperNodesBySuggestionId(suggestionId);
  if (wrappers.length === 0) return false;

  const findFirstDescendant = (
    root: LexicalNode,
    predicate: (n: LexicalNode) => boolean,
  ): LexicalNode | null => {
    if (!$isElementNode(root)) return null;
    const stack: LexicalNode[] = [...root.getChildren()].reverse();
    while (stack.length) {
      const node = stack.pop();
      if (!node) break;
      if (predicate(node)) return node;
      if ($isElementNode(node)) {
        const children = node.getChildren();
        for (let i = children.length - 1; i >= 0; i--) {
          stack.push(children[i]);
        }
      }
    }
    return null;
  };

  for (const node of wrappers) {
    if (!node.isAttached()) continue;

    if ($isSuggestionReplacementInlineNode(node)) {
      // Comment marks can wrap the inner insertion/deletion wrappers, so we must search descendants,
      // not just direct children.
      const deletionChild = findFirstDescendant(
        node,
        (c) => $isSuggestionDeletionInlineNode(c) || $isSuggestionDeletionBlockNode(c),
      );
      const insertionChild = findFirstDescendant(
        node,
        (c) => $isSuggestionInsertionInlineNode(c) || $isSuggestionInsertionBlockNode(c),
      );

      if (action === 'accept') {
        if (deletionChild) {
          deletionChild.remove();
        }
        if (insertionChild) {
          if ($isElementNode(insertionChild)) {
            unwrapElementNode(insertionChild);
          }
        }
      } else {
        if (insertionChild) {
          insertionChild.remove();
        }
        if (deletionChild) {
          if ($isElementNode(deletionChild)) {
            unwrapElementNode(deletionChild);
          }
        }
      }

      unwrapElementNode(node);
    } else if ($isSuggestionInsertionInlineNode(node) || $isSuggestionInsertionBlockNode(node)) {
      if (action === 'accept') {
        unwrapElementNode(node);
      } else {
        node.remove();
      }
    } else if ($isSuggestionDeletionInlineNode(node) || $isSuggestionDeletionBlockNode(node)) {
      if (action === 'accept') {
        node.remove();
      } else {
        unwrapElementNode(node);
      }
    }
  }

  return true;
}

const styles = defineStyles('SuggestedEditsPlugin', (theme: ThemeType) => ({
  toggleContainer: {
    position: 'fixed',
    top: 12,
    right: 12,
    zIndex: theme.zIndexes.modal + 1,
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
}), { allowNonThemeColors: true });

export const TOGGLE_SUGGESTING_MODE_COMMAND: LexicalCommand<void> = createCommand(
  'TOGGLE_SUGGESTING_MODE_COMMAND',
);

type SuggestingMode = 'editing' | 'suggesting';

export interface SuggestedEditsPluginProps {
  canSuggest?: boolean;
  canEdit?: boolean;
  currentUserId?: string;
  currentUserName?: string;
}

type SerializedLexicalNodeLike = {
  type: string;
  version: number;
  children?: SerializedLexicalNodeLike[];
  [key: string]: unknown;
};

function parseSerializedNodeImpl(serializedNode: SerializedLexicalNodeLike, editor: LexicalEditor): LexicalNode {
  const registeredNodes: Map<string, { klass: AnyBecauseHard }> = (editor as AnyBecauseHard)._nodes;
  const registeredNode = registeredNodes.get(serializedNode.type);
  if (!registeredNode) {
    throw new Error(`SuggestedEdits: node type "${serializedNode.type}" not registered`);
  }
  const nodeClass = registeredNode.klass;
  const node: LexicalNode = nodeClass.importJSON(serializedNode);
  if ('children' in serializedNode && Array.isArray(serializedNode.children) && (node as AnyBecauseHard).append) {
    for (const child of serializedNode.children) {
      (node as AnyBecauseHard).append(parseSerializedNodeImpl(child, editor));
    }
  }
  return node;
}

function cloneNodeViaJSON(node: LexicalNode, editor: LexicalEditor): LexicalNode {
  const serialized: SerializedLexicalNodeLike = node.exportJSON() as AnyBecauseHard;
  const deepClone = JSON.parse(JSON.stringify(serialized)) as SerializedLexicalNodeLike;
  return parseSerializedNodeImpl(deepClone, editor);
}

function deepCloneSerializedNode(node: LexicalNode): SerializedLexicalNodeLike {
  const serialized: SerializedLexicalNodeLike = node.exportJSON() as AnyBecauseHard;
  return JSON.parse(JSON.stringify(serialized)) as SerializedLexicalNodeLike;
}

function unwrapElementNode(node: import('lexical').ElementNode): void {
  let child = node.getFirstChild();
  while (child) {
    const next = child.getNextSibling();
    node.insertBefore(child);
    child = next;
  }
  node.remove();
}

function findSuggestionWrapper(node: LexicalNode | null): LexicalNode | null {
  let current: LexicalNode | null = node;
  let candidate: LexicalNode | null = null;
  while (current) {
    if ($isSuggestionReplacementInlineNode(current)) {
      return current;
    }
    if (
      $isSuggestionInsertionInlineNode(current) ||
      $isSuggestionDeletionInlineNode(current) ||
      $isSuggestionInsertionBlockNode(current) ||
      $isSuggestionDeletionBlockNode(current)
    ) {
      candidate = current;
    }
    current = current.getParent();
  }
  return candidate;
}

function isSuggestionWrapperNode(node: LexicalNode): boolean {
  return (
    $isSuggestionReplacementInlineNode(node) ||
    $isSuggestionInsertionInlineNode(node) ||
    $isSuggestionDeletionInlineNode(node) ||
    $isSuggestionInsertionBlockNode(node) ||
    $isSuggestionDeletionBlockNode(node)
  );
}

function isInsideSuggestionWrapper(node: LexicalNode): boolean {
  return findSuggestionWrapper(node) !== null;
}

function makeMeta(params: {
  suggestionType: 'insertion' | 'deletion' | 'replacement';
  currentUserId: string;
  currentUserName: string;
  groupId?: string;
  suggestionId?: string;
}): SuggestionMeta {
  return {
    suggestionId: params.suggestionId ?? createSuggestionId(),
    suggestionType: params.suggestionType,
    authorUserId: params.currentUserId,
    authorName: params.currentUserName,
    createdAtMs: Date.now(),
    groupId: params.groupId,
  };
}

function getSuggestionMetaIfWrapper(node: LexicalNode): SuggestionMeta | null {
  if ($isSuggestionReplacementInlineNode(node)) return node.getSuggestionMeta();
  if ($isSuggestionInsertionInlineNode(node)) return node.getSuggestionMeta();
  if ($isSuggestionDeletionInlineNode(node)) return node.getSuggestionMeta();
  if ($isSuggestionInsertionBlockNode(node)) return node.getSuggestionMeta();
  if ($isSuggestionDeletionBlockNode(node)) return node.getSuggestionMeta();
  return null;
}

function getSuggestionWrapperNodesBySuggestionId(suggestionId: string): LexicalNode[] {
  const root = $getRoot();
  const results: LexicalNode[] = [];
  const stack: LexicalNode[] = [root];

  while (stack.length) {
    const node = stack.pop();
    if (!node) break;

    const meta = getSuggestionMetaIfWrapper(node);
    if (meta?.suggestionId === suggestionId) {
      results.push(node);
      continue;
    }

    if ($isElementNode(node)) {
      const children = node.getChildren();
      for (let i = children.length - 1; i >= 0; i--) {
        stack.push(children[i]);
      }
    }
  }

  return results;
}

function isTriviallyTextualNodeType(type: string): boolean {
  return (
    type === 'root' ||
    type === 'paragraph' ||
    type === 'text' ||
    type === 'linebreak' ||
    type === 'tab' ||
    // CommentPlugin creates/updates MarkNodes; those should not be tracked as suggested edits.
    type === 'mark'
  );
}

function isOwnInsertionWrapper(
  wrapper: LexicalNode | null,
  currentUserId: string,
): wrapper is import('./nodes/SuggestionInsertionInlineNode').SuggestionInsertionInlineNode | import('./nodes/SuggestionInsertionBlockNode').SuggestionInsertionBlockNode {
  if ($isSuggestionInsertionInlineNode(wrapper) || $isSuggestionInsertionBlockNode(wrapper)) {
    const meta = wrapper.getSuggestionMeta();
    return meta.authorUserId === currentUserId;
  }
  return false;
}

function isMergeableDeletionWrapper(
  node: LexicalNode | null,
  currentUserId: string,
  isBlockWrapper: boolean,
): node is import('./nodes/SuggestionDeletionInlineNode').SuggestionDeletionInlineNode | import('./nodes/SuggestionDeletionBlockNode').SuggestionDeletionBlockNode {
  if (!node) return false;
  if (isBlockWrapper) {
    if (!$isSuggestionDeletionBlockNode(node)) return false;
  } else {
    if (!$isSuggestionDeletionInlineNode(node)) return false;
  }
  const meta = (node as AnyBecauseHard).getSuggestionMeta?.();
  return meta?.authorUserId === currentUserId;
}

function prependChild(wrapper: import('lexical').ElementNode, child: LexicalNode): void {
  const first = wrapper.getFirstChild();
  if (first) {
    first.insertBefore(child);
  } else {
    wrapper.append(child);
  }
}

export function SuggestedEditsPlugin({
  canSuggest = true,
  canEdit = true,
  currentUserId = 'local',
  currentUserName = 'User',
}: SuggestedEditsPluginProps): JSX.Element | null {
  const classes = useStyles(styles);
  const [editor] = useLexicalComposerContext();

  const [mode, setMode] = useState<SuggestingMode>(() => {
    if (!canSuggest) return 'editing';
    if (!canEdit) return 'suggesting';
    return 'editing';
  });

  useEffect(() => {
    if (!canSuggest) {
      setMode('editing');
    } else if (!canEdit) {
      setMode('suggesting');
    }
  }, [canSuggest, canEdit]);

  const canAcceptAny = canEdit;
  const canRejectAny = canEdit;
  const canRejectOwnOnly = canSuggest && !canEdit;

  const [activeSuggestionKey, setActiveSuggestionKey] = useState<string | null>(null);

  const isSuggesting = mode === 'suggesting' && canSuggest;
  const bypassRef = useMemo(() => ({ active: false }), []);

  const resolveSuggestion = (action: 'accept' | 'reject') => {
    if (!activeSuggestionKey) return;
    let threadIdToHide: string | null = null;
    editor.update(() => {
      const suggestionNode = $getNodeByKey(activeSuggestionKey);
      if (!suggestionNode) return;

      const meta = getSuggestionMetaIfWrapper(suggestionNode);
      if (!meta) return;
      threadIdToHide = meta.suggestionId;

      resolveSuggestionByIdInPlace(action, meta.suggestionId);
    }, { tag: 'suggestedEdits' });
    if (threadIdToHide) {
      editor.dispatchCommand(HIDE_THREAD_COMMAND, { threadId: threadIdToHide });
    }
  };

  const suggestDeleteSelectionOrCharacter = useCallback(
    (direction: 'backward' | 'forward', event?: InputEvent | KeyboardEvent) => {
      const selection = $getSelection();

      if ($isNodeSelection(selection)) {
        const nodes = selection.getNodes();
        if (nodes.length === 0) return;

        const wrapper = $createSuggestionDeletionBlockNode(
          makeMeta({
            suggestionType: 'deletion',
            currentUserId,
            currentUserName,
          }),
        );
        nodes[0].insertBefore(wrapper);
        for (const n of nodes) {
          wrapper.append(n);
        }
        wrapper.selectEnd();
        event?.preventDefault();
        return;
      }

      if (!$isRangeSelection(selection)) return;

      // Google-Docs-like behavior: if you're editing inside *your own* insertion suggestion,
      // deletion should simply shrink/remove that insertion, not create nested deletion suggestions.
      const selectionWrapper = findSuggestionWrapper(selection.anchor.getNode());
      if (isOwnInsertionWrapper(selectionWrapper, currentUserId)) {
        if (selection.isCollapsed()) {
          selection.deleteCharacter(direction === 'backward');
        } else {
          selection.removeText();
        }
        updateSuggestionThread(editor, selectionWrapper);
        event?.preventDefault();
        return;
      }

      if (selection.isCollapsed()) {
        selection.modify('extend', direction === 'backward', 'character');
        if (selection.isCollapsed()) return;
      }

      // IMPORTANT: RangeSelection.extract() does NOT remove nodes; it splits text and returns node references.
      // To avoid orphaning selected nodes / losing selection, we wrap nodes in-place (via replace+append).
      const extracted = selection.extract();
      if (extracted.length === 0) return;

      const groupId = createSuggestionId();
      let lastWrapper: LexicalNode | null = null;
      let lastMergeTarget: LexicalNode | null = null;

      for (const node of extracted) {
        if (!node.isAttached()) continue;
        const parent = node.getParent();
        const parentIsRoot = parent?.getType() === 'root';
        const nodeIsInline = (node as AnyBecauseHard).isInline?.() === true;
        const useBlockWrapper = parentIsRoot && !nodeIsInline;

        // Coalescing: if the extracted node is adjacent to an existing deletion wrapper from the same author,
        // merge into it rather than creating a new suggestion.
        // (This approximates Google Docs behavior for contiguous deletes.)
        const prevSibling = node.getPreviousSibling();
        const nextSibling = node.getNextSibling();
        const mergeTarget =
          (isMergeableDeletionWrapper(prevSibling, currentUserId, useBlockWrapper) ? prevSibling : null) ??
          (isMergeableDeletionWrapper(nextSibling, currentUserId, useBlockWrapper) ? nextSibling : null) ??
          null;

        if (mergeTarget && $isElementNode(mergeTarget)) {
          // Preserve order: if we're merging into a wrapper that is *after* the node, we need to prepend.
          const shouldPrepend = mergeTarget === nextSibling;
          if (shouldPrepend) {
            prependChild(mergeTarget, node);
          } else {
            mergeTarget.append(node);
          }
          lastWrapper = mergeTarget;
          lastMergeTarget = mergeTarget;
          continue;
        }

        const wrapper = useBlockWrapper
          ? $createSuggestionDeletionBlockNode(
              makeMeta({
                suggestionType: 'deletion',
                currentUserId,
                currentUserName,
                groupId,
              }),
            )
          : $createSuggestionDeletionInlineNode(
              makeMeta({
                suggestionType: 'deletion',
                currentUserId,
                currentUserName,
                groupId,
              }),
            );

        node.replace(wrapper as AnyBecauseHard);
        wrapper.append(node);
        lastWrapper = wrapper;
      }

      // If we merged into an existing wrapper, just update its quote/comment body (no new thread).
      if (lastMergeTarget) {
        updateSuggestionThread(editor, lastMergeTarget);
      } else if (lastWrapper) {
        autoCreateSuggestionCommentThread(editor, lastWrapper);
      }
      lastWrapper?.selectEnd();
      event?.preventDefault();
    },
    [currentUserId, currentUserName, editor],
  );

  const applyCommandAsReplacementSuggestion = useCallback(
    <TPayload,>(command: LexicalCommand<TPayload>, payload: TPayload): boolean => {
      if (!isSuggesting) return false;
      if (bypassRef.active) return false;
      editor.update(
        () => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return;
          if (selection.isCollapsed()) return;

          const suggestionId = createSuggestionId();
          const extracted = selection.extract();
          if (extracted.length === 0) return;

          const firstNode = extracted.find((n) => n.isAttached());
          if (!firstNode) return;

          const replacement = $createSuggestionReplacementInlineNode(
            makeMeta({
              suggestionType: 'replacement',
              currentUserId,
              currentUserName,
              suggestionId,
            }),
          );
          firstNode.insertBefore(replacement);

          const deletion = $createSuggestionDeletionInlineNode(
            makeMeta({
              suggestionType: 'deletion',
              currentUserId,
              currentUserName,
              suggestionId,
            }),
          );
          const insertion = $createSuggestionInsertionInlineNode(
            makeMeta({
              suggestionType: 'insertion',
              currentUserId,
              currentUserName,
              suggestionId,
            }),
          );
          replacement.append(deletion);
          replacement.append(insertion);

          for (const node of extracted) {
            if (!node.isAttached()) continue;
            deletion.append(node);
          }

          for (const n of extracted) {
            insertion.append(cloneNodeViaJSON(n, editor));
          }
          autoCreateSuggestionCommentThread(editor, replacement);
          insertion.selectEnd();
        },
        { tag: 'suggestedEdits' },
      );

      bypassRef.active = true;
      try {
        return editor.dispatchCommand(command, payload);
      } finally {
        bypassRef.active = false;
      }
    },
    [bypassRef, editor, isSuggesting, currentUserId, currentUserName],
  );

  useEffect(() => {
    return mergeRegister(
      // Register a no-op mutation listener to ensure UpdateListenerPayload.mutatedNodes is populated.
      editor.registerMutationListener(ParagraphNode, () => {}, { skipInitialization: true }),
      editor.registerCommand(
        TOGGLE_SUGGESTING_MODE_COMMAND,
        () => {
          if (!canSuggest) return true;
          if (!canEdit) return true;
          setMode((m) => (m === 'editing' ? 'suggesting' : 'editing'));
          return true;
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        RESOLVE_SUGGESTION_BY_ID_COMMAND,
        (payload) => {
          const wrappers = editor.getEditorState().read(() => getSuggestionWrapperNodesBySuggestionId(payload.suggestionId));
          if (wrappers.length === 0) return false;

          const meta = editor.getEditorState().read(() => getSuggestionMetaIfWrapper(wrappers[0]) ?? null);
          if (!meta) return false;

          const canAccept = canEdit;
          const canReject = canEdit || (canSuggest && meta.authorUserId === currentUserId);
          if (payload.action === 'accept' && !canAccept) return false;
          if (payload.action === 'reject' && !canReject) return false;

          editor.update(() => {
            resolveSuggestionByIdInPlace(payload.action, payload.suggestionId);
          }, { tag: 'suggestedEdits' });
          return true;
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        CONTROLLED_TEXT_INSERTION_COMMAND,
        (payload) => {
          if (!isSuggesting) return false;
          if (bypassRef.active) return false;
          $addUpdateTag('suggestedEdits');
          const text = typeof payload === 'string' ? payload : payload.data ?? '';
          if (!text) return false;
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return false;

          const groupId = undefined;

          if (selection.isCollapsed()) {
            const wrapper = findSuggestionWrapper(selection.anchor.getNode());
            if ($isSuggestionInsertionInlineNode(wrapper)) {
              const meta = wrapper.getSuggestionMeta();
              if (meta.authorUserId === currentUserId) {
                selection.insertText(text);
                updateSuggestionThread(editor, wrapper);
                return true;
              }
            }
            if ($isSuggestionInsertionBlockNode(wrapper)) {
              const meta = wrapper.getSuggestionMeta();
              if (meta.authorUserId === currentUserId) {
                selection.insertText(text);
                updateSuggestionThread(editor, wrapper);
                return true;
              }
            }
            if ($isSuggestionReplacementInlineNode(wrapper)) {
              const meta = wrapper.getSuggestionMeta();
              if (meta.authorUserId === currentUserId) {
                selection.insertText(text);
                updateSuggestionThread(editor, wrapper);
                return true;
              }
            }
            const insertion = $createSuggestionInsertionInlineNode(
              makeMeta({
                suggestionType: 'insertion',
                currentUserId,
                currentUserName,
                groupId,
              }),
            );
            const textNode = $createTextNode(text);
            insertion.append(textNode);
            selection.insertNodes([insertion]);
            autoCreateSuggestionCommentThread(editor, insertion);
            textNode.selectEnd();
            return true;
          }

          // Replacement: wrap the extracted nodes in-place (don't call selection.insertNodes on a non-collapsed selection).
          const extracted = selection.extract();
          if (extracted.length === 0) return false;

          const sid = createSuggestionId();
          const firstNode = extracted.find((n) => n.isAttached());
          if (!firstNode) return false;

          const replacement = $createSuggestionReplacementInlineNode(
            makeMeta({
              suggestionType: 'replacement',
              currentUserId,
              currentUserName,
              suggestionId: sid,
            }),
          );
          firstNode.insertBefore(replacement);

          const deletion = $createSuggestionDeletionInlineNode(
            makeMeta({
              suggestionType: 'deletion',
              currentUserId,
              currentUserName,
              suggestionId: sid,
            }),
          );
          const insertion = $createSuggestionInsertionInlineNode(
            makeMeta({
              suggestionType: 'insertion',
              currentUserId,
              currentUserName,
              suggestionId: sid,
            }),
          );
          replacement.append(deletion);
          replacement.append(insertion);

          for (const node of extracted) {
            if (!node.isAttached()) continue;
            deletion.append(node);
          }

          const textNode = $createTextNode(text);
          insertion.append(textNode);
          autoCreateSuggestionCommentThread(editor, replacement);
          textNode.selectEnd();
          return true;
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        PASTE_COMMAND,
        (event) => {
          if (!isSuggesting) return false;
          if (bypassRef.active) return false;
          const isClipboardEvent =
            typeof ClipboardEvent !== 'undefined' && event instanceof ClipboardEvent;
          const text = isClipboardEvent ? event.clipboardData?.getData('text/plain') ?? '' : '';
          if (!text) return false;
          editor.dispatchCommand(CONTROLLED_TEXT_INSERTION_COMMAND, text);
          event.preventDefault();
          return true;
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        INPUT_COMMAND,
        (event) => {
          if (!isSuggesting) return false;
          if (bypassRef.active) return false;
          if (!(event instanceof InputEvent)) return false;

          switch (event.inputType) {
            case 'insertText': {
              const text = event.data ?? '';
              if (!text) return false;
              editor.dispatchCommand(CONTROLLED_TEXT_INSERTION_COMMAND, text);
              event.preventDefault();
              return true;
            }
            case 'insertFromPaste': {
              // Prefer PASTE_COMMAND path for clipboardData access; if we're here, fall back to letting Lexical handle it.
              return false;
            }
            case 'deleteContentBackward': {
              suggestDeleteSelectionOrCharacter('backward', event);
              return true;
            }
            case 'deleteContentForward': {
              suggestDeleteSelectionOrCharacter('forward', event);
              return true;
            }
            default:
              // Let Lexical handle any input types we haven't modeled yet.
              return false;
          }
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        FORMAT_TEXT_COMMAND,
        (format) => applyCommandAsReplacementSuggestion(FORMAT_TEXT_COMMAND, format),
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        FORMAT_ELEMENT_COMMAND,
        (format) => applyCommandAsReplacementSuggestion(FORMAT_ELEMENT_COMMAND, format),
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        INDENT_CONTENT_COMMAND,
        () => applyCommandAsReplacementSuggestion(INDENT_CONTENT_COMMAND, undefined),
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        OUTDENT_CONTENT_COMMAND,
        () => applyCommandAsReplacementSuggestion(OUTDENT_CONTENT_COMMAND, undefined),
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        TOGGLE_LINK_COMMAND,
        (payload) => applyCommandAsReplacementSuggestion(TOGGLE_LINK_COMMAND, payload),
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        INSERT_ORDERED_LIST_COMMAND,
        () => applyCommandAsReplacementSuggestion(INSERT_ORDERED_LIST_COMMAND, undefined),
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        INSERT_UNORDERED_LIST_COMMAND,
        () => applyCommandAsReplacementSuggestion(INSERT_UNORDERED_LIST_COMMAND, undefined),
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        INSERT_CHECK_LIST_COMMAND,
        () => applyCommandAsReplacementSuggestion(INSERT_CHECK_LIST_COMMAND, undefined),
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        SELECTION_INSERT_CLIPBOARD_NODES_COMMAND,
        (payload) => applyCommandAsReplacementSuggestion(SELECTION_INSERT_CLIPBOARD_NODES_COMMAND, payload),
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        (event: KeyboardEvent) => {
          if (!isSuggesting) return false;
          if (bypassRef.active) return false;
          suggestDeleteSelectionOrCharacter('backward', event);
          return true;
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        (event: KeyboardEvent) => {
          if (!isSuggesting) return false;
          if (bypassRef.active) return false;
          suggestDeleteSelectionOrCharacter('forward', event);
          return true;
        },
        COMMAND_PRIORITY_HIGH,
      ),
    );
  }, [
    editor,
    canSuggest,
    canEdit,
    currentUserId,
    currentUserName,
    isSuggesting,
    bypassRef,
    applyCommandAsReplacementSuggestion,
    suggestDeleteSelectionOrCharacter,
  ]);

  // Auto-convert arbitrary non-textual structural changes into suggestions.
  // This is the “catch-all” that makes custom nodes and custom operations suggestible,
  // even when a plugin edits nodes via `editor.update()` without dispatching commands.
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState, prevEditorState, mutatedNodes, tags }) => {
      if (!isSuggesting) return;
      if (bypassRef.active) return;
      if (tags.has('suggestedEdits')) return;
      // Never "re-suggestify" remote collaborative updates; those should retain their true author.
      if (tags.has(COLLABORATION_TAG) || tags.has('collaboration')) return;
      if (!mutatedNodes) return;

      const createdKeys = new Set<string>();
      const updatedKeys = new Set<string>();

      for (const mutationMap of mutatedNodes.values()) {
        for (const [key, mutation] of mutationMap.entries()) {
          if (mutation === 'created') createdKeys.add(key);
          else if (mutation === 'updated') updatedKeys.add(key);
        }
      }

      const shouldSkipKeyBecauseAncestorUpdated = (key: string): boolean => {
        // If a parent is also updated, let the parent replacement capture the change.
        return editorState.read(() => {
          const node = $getNodeByKey(key);
          if (!node) return true;
          let parent = node.getParent();
          while (parent) {
            if (updatedKeys.has(parent.getKey())) return true;
            parent = parent.getParent();
          }
          return false;
        });
      };

      const keysToProcess = Array.from(new Set([...createdKeys, ...updatedKeys]));
      if (keysToProcess.length === 0) return;

      editor.update(
        () => {
          for (const key of keysToProcess) {
            const node = $getNodeByKey(key);
            if (!node) continue;
            if (isSuggestionWrapperNode(node)) continue;
            if (isInsideSuggestionWrapper(node)) continue;
            const type = node.getType();

            // Let our explicit text insertion/deletion handlers own textual deltas.
            // Structural/custom nodes will fall through here.
            if (isTriviallyTextualNodeType(type)) continue;

            if (updatedKeys.has(key) && shouldSkipKeyBecauseAncestorUpdated(key)) {
              continue;
            }

            const isInline = (node as AnyBecauseHard).isInline?.() === true;
            const groupId = createSuggestionId();

            if (createdKeys.has(key) && !updatedKeys.has(key)) {
              const insertion = isInline
                ? $createSuggestionInsertionInlineNode(
                    makeMeta({
                      suggestionType: 'insertion',
                      currentUserId,
                      currentUserName,
                      groupId,
                    }),
                  )
                : $createSuggestionInsertionBlockNode(
                    makeMeta({
                      suggestionType: 'insertion',
                      currentUserId,
                      currentUserName,
                      groupId,
                    }),
                  );
              node.replace(insertion as AnyBecauseHard);
              insertion.append(node);
              autoCreateSuggestionCommentThread(editor, insertion);
              continue;
            }

            if (updatedKeys.has(key)) {
              let prevSerialized: SerializedLexicalNodeLike | null = null;
              prevEditorState.read(() => {
                const prevNode = $getNodeByKey(key);
                if (!prevNode) return;
                // If the previous state already had this node inside a suggestion wrapper, don't re-wrap.
                if (isSuggestionWrapperNode(prevNode) || isInsideSuggestionWrapper(prevNode)) return;
                prevSerialized = deepCloneSerializedNode(prevNode);
              });
              if (!prevSerialized) continue;

              const prevClone = parseSerializedNodeImpl(prevSerialized, editor);

              const deletion = isInline
                ? $createSuggestionDeletionInlineNode(
                    makeMeta({
                      suggestionType: 'deletion',
                      currentUserId,
                      currentUserName,
                      groupId,
                    }),
                  )
                : $createSuggestionDeletionBlockNode(
                    makeMeta({
                      suggestionType: 'deletion',
                      currentUserId,
                      currentUserName,
                      groupId,
                    }),
                  );
              deletion.append(prevClone);

              const insertion = isInline
                ? $createSuggestionInsertionInlineNode(
                    makeMeta({
                      suggestionType: 'insertion',
                      currentUserId,
                      currentUserName,
                      groupId,
                    }),
                  )
                : $createSuggestionInsertionBlockNode(
                    makeMeta({
                      suggestionType: 'insertion',
                      currentUserId,
                      currentUserName,
                      groupId,
                    }),
                  );

              node.replace(deletion as AnyBecauseHard);
              deletion.insertAfter(insertion as AnyBecauseHard);
              insertion.append(node);
              autoCreateSuggestionCommentThread(editor, insertion);
              updateSuggestionThread(editor, insertion);
            }
          }
        },
        { tag: 'suggestedEdits' },
      );
    });
  }, [editor, isSuggesting, bypassRef, currentUserId, currentUserName]);

  // Keep suggestion threads in sync with the document: if a suggestion wrapper disappears from the doc,
  // hide/archive the corresponding thread to prevent "orphan" suggestion threads.
  useEffect(() => {
    const collectSuggestionIds = (state: import('lexical').EditorState): Set<string> => {
      return state.read(() => {
        const root = $getRoot();
        const ids = new Set<string>();
        const stack: LexicalNode[] = [root];
        while (stack.length) {
          const node = stack.pop();
          if (!node) break;
          const meta = getSuggestionMetaIfWrapper(node);
          if (meta?.suggestionId) ids.add(meta.suggestionId);
          if ($isElementNode(node)) {
            const children = node.getChildren();
            for (let i = children.length - 1; i >= 0; i--) stack.push(children[i]);
          }
        }
        return ids;
      });
    };

    return editor.registerUpdateListener(({ editorState, prevEditorState, tags }) => {
      // Avoid fighting with our own accept/reject handlers; this is best-effort and idempotent anyway.
      if (tags.has('suggestedEdits')) return;
      const prevIds = collectSuggestionIds(prevEditorState);
      const nextIds = collectSuggestionIds(editorState);
      for (const id of prevIds) {
        if (!nextIds.has(id)) {
          editor.dispatchCommand(HIDE_THREAD_COMMAND, { threadId: id });
        }
      }
    });
  }, [editor]);

  // Note: accept/reject is now integrated into the CommentPlugin thread UI.

  const toggleButton = canSuggest ? (
    <Button
      variant="contained"
      onClick={() => editor.dispatchCommand(TOGGLE_SUGGESTING_MODE_COMMAND, undefined)}
      disabled={!canEdit}
    >
      {isSuggesting ? 'Suggesting' : 'Editing'}
    </Button>
  ) : null;

  const popover = null;

  // In environments without DOM (SSR), do nothing.
  if (typeof document === 'undefined') return null;

  return (
    <>
      {createPortal(<div className={classes.toggleContainer}>{toggleButton}</div>, document.body)}
      {popover}
    </>
  );
}

export default SuggestedEditsPlugin;


