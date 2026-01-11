"use client";

import {
  defineExtension,
  $getSelection,
  $isRangeSelection,
  $createTextNode,
  $addUpdateTag,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_EDITOR,
  CONTROLLED_TEXT_INSERTION_COMMAND,
  DELETE_CHARACTER_COMMAND,
  DELETE_WORD_COMMAND,
  HISTORY_MERGE_TAG,
  LexicalEditor,
  RangeSelection,
} from 'lexical';
import { mergeRegister } from '@lexical/utils';

import { SuggestionInsertionNode, $createSuggestionInsertionNode } from './nodes/SuggestionInsertionNode';
import { SuggestionDeletionNode, $createSuggestionDeletionNode } from './nodes/SuggestionDeletionNode';
import {
  SET_SUGGESTING_MODE_COMMAND,
  ACCEPT_SUGGESTION_COMMAND,
  REJECT_SUGGESTION_COMMAND,
} from './commands';
import {
  generateSuggestionId,
  $findSuggestionNodes,
  $unwrapSuggestionNode,
  $findParentSuggestionInsertion,
  $findParentSuggestionDeletion,
  $getSuggestionTextContent,
} from './utils';
import {
  INSERT_INLINE_THREAD_COMMAND,
  UPDATE_INLINE_THREAD_COMMAND,
  HIDE_THREAD_COMMAND,
} from '../../plugins/CommentPlugin';

export interface SuggestEditsConfig {
  initialMode: 'editing' | 'suggesting';
  canEdit: boolean;
  canSuggest: boolean;
  authorId: string;
  authorName: string;
}

// Module-level state for the current mode
// This is managed outside of React for simplicity with the extension pattern
let _isEnabled = false;
let _currentMode: 'editing' | 'suggesting' = 'editing';
let _config: SuggestEditsConfig = {
  initialMode: 'editing',
  canEdit: true,
  canSuggest: true,
  authorId: 'anonymous',
  authorName: 'Anonymous',
};

// Listeners for mode changes (for React components to subscribe)
const _modeChangeListeners = new Set<(mode: 'editing' | 'suggesting') => void>();
const _enabledChangeListeners = new Set<(enabled: boolean) => void>();

export function isSuggestEditsEnabled(): boolean {
  return _isEnabled;
}

export function setEnabled(enabled: boolean): void {
  _isEnabled = enabled;
  _enabledChangeListeners.forEach(listener => listener(enabled));
}

export function subscribeEnabledChange(listener: (enabled: boolean) => void): () => void {
  _enabledChangeListeners.add(listener);
  return () => _enabledChangeListeners.delete(listener);
}

export function getSuggestingMode(): 'editing' | 'suggesting' {
  return _currentMode;
}

export function setSuggestingMode(mode: 'editing' | 'suggesting'): void {
  _currentMode = mode;
  _modeChangeListeners.forEach(listener => listener(mode));
}

export function subscribeModeChange(listener: (mode: 'editing' | 'suggesting') => void): () => void {
  _modeChangeListeners.add(listener);
  return () => _modeChangeListeners.delete(listener);
}

export function setSuggestEditsConfig(config: Partial<SuggestEditsConfig>): void {
  _config = { ..._config, ...config };
  if (config.initialMode !== undefined) {
    _currentMode = config.initialMode;
  }
}

export function getSuggestEditsConfig(): SuggestEditsConfig {
  return _config;
}

/**
 * Wrap the current selection in a suggestion deletion node
 */
function $wrapSelectionInDeletion(
  selection: RangeSelection,
  suggestionId: string,
  authorId: string,
  authorName: string,
  timestamp: number
): void {
  // Extract selected nodes with offset-level precision (splits text nodes at the boundaries).
  // Important: `selection.extract()` does *not* remove nodes from the document; it returns
  // references to the nodes that are currently selected after any necessary splits.
  const selectedNodes = selection.extract();
  if (selectedNodes.length === 0) return;

  const deletionNode = $createSuggestionDeletionNode(
    suggestionId,
    authorId,
    authorName,
    timestamp
  );

  // Insert wrapper *before* the first selected node, then move all selected nodes
  // into the wrapper. This preserves formatting/structure and avoids calling
  // RangeSelection.insertNodes() while the selection is non-collapsed (which would
  // try to remove the selected content a second time).
  const firstNode = selectedNodes[0];
  firstNode.insertBefore(deletionNode);
  for (const node of selectedNodes) {
    deletionNode.append(node);
  }

  // Collapse selection immediately after the deletion wrapper to prepare for insertion.
  deletionNode.selectNext(0, 0);
}

/**
 * Register the suggest edits extension functionality
 */
function registerSuggestEdits(editor: LexicalEditor): () => void {
  const handleSuggestingTextInsertion = (payload: string | InputEvent): boolean => {
    const text = typeof payload === 'string' ? payload : payload.data ?? '';
    if (_currentMode !== 'suggesting') {
      return false; // Let normal handling proceed
    }

    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return false;
    }

    const anchorNode = selection.anchor.getNode();

    // Check if we're inside our own pending insertion - if so, allow direct editing
    const existingInsertion = $findParentSuggestionInsertion(anchorNode, _config.authorId);
    if (existingInsertion) {
      return false; // Let normal insertion happen within our own insertion
    }

    // Check if we're inside a deletion - don't allow inserting there
    if ($findParentSuggestionDeletion(anchorNode)) {
      return true; // Block the insertion
    }

    const suggestionId = generateSuggestionId();
    const timestamp = Date.now();

    $addUpdateTag(HISTORY_MERGE_TAG);

    const isReplacement = !selection.isCollapsed();

    // If there's a selection (not collapsed), wrap it in a deletion first
    if (isReplacement) {
      $wrapSelectionInDeletion(
        selection,
        suggestionId,
        _config.authorId,
        _config.authorName,
        timestamp
      );
    }

    // selection may have changed after wrapping the deletion; always re-read it
    // before inserting the insertion node.
    const updatedSelection = $getSelection();
    if (!$isRangeSelection(updatedSelection)) {
      // Nothing more we can do safely; we already created the deletion wrapper if needed.
      return true;
    }

    // Create insertion node with the new text
    const insertionNode = $createSuggestionInsertionNode(
      suggestionId,
      _config.authorId,
      _config.authorName,
      timestamp
    );
    const textNode = $createTextNode(text);
    insertionNode.append(textNode);

    // Insert the suggestion node
    updatedSelection.insertNodes([insertionNode]);

    // Move cursor to end of insertion
    textNode.selectEnd();

    // Create comment thread for this suggestion
    editor.dispatchCommand(INSERT_INLINE_THREAD_COMMAND, {
      threadId: suggestionId,
      initialContent: isReplacement
        ? `Suggested replacement`
        : `Suggested insertion: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
      quote: text.substring(0, 100),
    });

    return true;
  };

  return mergeRegister(
    // Handle mode switching command
    editor.registerCommand(
      SET_SUGGESTING_MODE_COMMAND,
      (isSuggesting: boolean) => {
        const newMode = isSuggesting ? 'suggesting' : 'editing';
        if (_config.canSuggest || !isSuggesting) {
          setSuggestingMode(newMode);
        }
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    ),

    // Intercept text insertion when in suggesting mode
    editor.registerCommand(
      CONTROLLED_TEXT_INSERTION_COMMAND,
      handleSuggestingTextInsertion,
      COMMAND_PRIORITY_HIGH
    ),

    // Intercept character deletion when in suggesting mode
    editor.registerCommand(
      DELETE_CHARACTER_COMMAND,
      (isBackward: boolean) => {
        if (_currentMode !== 'suggesting') {
          return false;
        }

        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }

        const anchorNode = selection.anchor.getNode();

        // Check if we're inside our own pending insertion - allow normal deletion
        const existingInsertion = $findParentSuggestionInsertion(anchorNode, _config.authorId);
        if (existingInsertion) {
          return false;
        }

        // Check if we're inside a deletion - block further deletion
        if ($findParentSuggestionDeletion(anchorNode)) {
          return true;
        }

        // For collapsed selection, expand to the character being deleted
        if (selection.isCollapsed()) {
          selection.modify('extend', isBackward, 'character');
        }

        // If still collapsed (at boundary), do nothing
        if (selection.isCollapsed()) {
          return true;
        }

        const suggestionId = generateSuggestionId();
        const timestamp = Date.now();
        const deletedText = selection.getTextContent();

        $addUpdateTag(HISTORY_MERGE_TAG);

        // Wrap the selection in a deletion node
        $wrapSelectionInDeletion(
          selection,
          suggestionId,
          _config.authorId,
          _config.authorName,
          timestamp
        );

        // Create comment thread for this suggestion
        editor.dispatchCommand(INSERT_INLINE_THREAD_COMMAND, {
          threadId: suggestionId,
          initialContent: `Suggested deletion: "${deletedText.substring(0, 50)}${deletedText.length > 50 ? '...' : ''}"`,
          quote: deletedText.substring(0, 100),
        });

        return true;
      },
      COMMAND_PRIORITY_HIGH
    ),

    // Intercept word deletion when in suggesting mode
    editor.registerCommand(
      DELETE_WORD_COMMAND,
      (isBackward: boolean) => {
        if (_currentMode !== 'suggesting') {
          return false;
        }

        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }

        const anchorNode = selection.anchor.getNode();

        // Check if we're inside our own pending insertion
        const existingInsertion = $findParentSuggestionInsertion(anchorNode, _config.authorId);
        if (existingInsertion) {
          return false;
        }

        if ($findParentSuggestionDeletion(anchorNode)) {
          return true;
        }

        // Expand selection to the word
        if (selection.isCollapsed()) {
          selection.modify('extend', isBackward, 'word');
        }

        if (selection.isCollapsed()) {
          return true;
        }

        const suggestionId = generateSuggestionId();
        const timestamp = Date.now();
        const deletedText = selection.getTextContent();

        $addUpdateTag(HISTORY_MERGE_TAG);

        $wrapSelectionInDeletion(
          selection,
          suggestionId,
          _config.authorId,
          _config.authorName,
          timestamp
        );

        editor.dispatchCommand(INSERT_INLINE_THREAD_COMMAND, {
          threadId: suggestionId,
          initialContent: `Suggested deletion: "${deletedText.substring(0, 50)}${deletedText.length > 50 ? '...' : ''}"`,
          quote: deletedText.substring(0, 100),
        });

        return true;
      },
      COMMAND_PRIORITY_HIGH
    ),

    // Handle accepting a suggestion
    editor.registerCommand(
      ACCEPT_SUGGESTION_COMMAND,
      ({ suggestionId }) => {
        const { insertionNodes, deletionNodes } = $findSuggestionNodes(suggestionId);

        if (insertionNodes.length === 0 && deletionNodes.length === 0) {
          return false;
        }

        $addUpdateTag(HISTORY_MERGE_TAG);

        // Accept insertion: unwrap nodes (content stays)
        for (const node of insertionNodes) {
          $unwrapSuggestionNode(node);
        }

        // Accept deletion: remove nodes entirely
        for (const node of deletionNodes) {
          node.remove();
        }

        // Hide the associated comment thread
        editor.dispatchCommand(HIDE_THREAD_COMMAND, { threadId: suggestionId });

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    ),

    // Handle rejecting a suggestion
    editor.registerCommand(
      REJECT_SUGGESTION_COMMAND,
      ({ suggestionId }) => {
        const { insertionNodes, deletionNodes } = $findSuggestionNodes(suggestionId);

        if (insertionNodes.length === 0 && deletionNodes.length === 0) {
          return false;
        }

        $addUpdateTag(HISTORY_MERGE_TAG);

        // Reject insertion: remove nodes entirely
        for (const node of insertionNodes) {
          node.remove();
        }

        // Reject deletion: unwrap nodes (content stays)
        for (const node of deletionNodes) {
          $unwrapSuggestionNode(node);
        }

        // Hide the associated comment thread
        editor.dispatchCommand(HIDE_THREAD_COMMAND, { threadId: suggestionId });

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    )
  );
}

/**
 * The Suggested Edits Extension for Lexical
 *
 * Enables "Track Changes" functionality where edits can be proposed
 * as suggestions that can be accepted or rejected.
 */
export const SuggestEditsExtension = defineExtension({
  name: '@forummagnum/suggest-edits',
  nodes: [SuggestionInsertionNode, SuggestionDeletionNode],
  register: registerSuggestEdits,
});

export default SuggestEditsExtension;
