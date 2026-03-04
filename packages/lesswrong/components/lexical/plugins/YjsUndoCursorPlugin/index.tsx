/**
 * Fixes cursor position restoration during undo/redo in collaborative (Yjs) editing mode.
 *
 * In collaborative mode, undo/redo is handled by Yjs's UndoManager, which correctly
 * reverses document changes but doesn't track Lexical selection state. After an undo,
 * the CollaborationPlugin's $syncCursorFromYjs reads the cursor from the Yjs awareness
 * state (which has the CURRENT cursor position, not the pre-edit position), so the cursor
 * stays wherever the user last clicked instead of returning to where the undone edit was made.
 *
 * This plugin maintains a parallel selection history stack that mirrors the UndoManager's
 * grouping (500ms capture timeout), and restores the correct cursor position after
 * undo/redo operations.
 */

import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getNodeByKey,
  $isRangeSelection,
  $setSelection,
  COMMAND_PRIORITY_LOW,
  COLLABORATION_TAG,
  HISTORIC_TAG,
  REDO_COMMAND,
  UNDO_COMMAND,
} from 'lexical';
import type { RangeSelection } from 'lexical';
import { mergeRegister } from '@lexical/utils';

// Must match the Yjs UndoManager's default captureTimeout
const CAPTURE_TIMEOUT_MS = 500;

/**
 * Check whether a saved RangeSelection's anchor and focus nodes still exist in
 * the current editor state. Must be called inside an editor.update() or
 * editor.read() callback (i.e. within $-function context).
 */
function $selectionNodesExist(selection: RangeSelection): boolean {
  return (
    $getNodeByKey(selection.anchor.key) !== null &&
    $getNodeByKey(selection.focus.key) !== null
  );
}

interface SelectionEntry {
  before: RangeSelection;
}

export default function YjsUndoCursorPlugin(): null {
  const [editor] = useLexicalComposerContext();
  const undoStackRef = useRef<SelectionEntry[]>([]);
  const redoStackRef = useRef<SelectionEntry[]>([]);
  const lastEditTimeRef = useRef(0);
  // 'undo' | 'redo' | null — set by command handlers, consumed by update listener
  const pendingHistoricActionRef = useRef<'undo' | 'redo' | null>(null);

  useEffect(() => {
    return mergeRegister(
      // Track local edits and save pre-edit selections
      editor.registerUpdateListener(({
        prevEditorState,
        tags,
        dirtyElements,
        dirtyLeaves,
      }) => {
        // Handle cursor restoration after undo/redo
        if (tags.has(HISTORIC_TAG)) {
          const action = pendingHistoricActionRef.current;
          pendingHistoricActionRef.current = null;

          if (action === 'undo') {
            const entry = undoStackRef.current.pop();
            if (entry) {
              // Save current selection for redo — if the user redoes and then
              // undoes again, we need to restore the cursor to this position.
              const currentSelection = prevEditorState._selection;
              if ($isRangeSelection(currentSelection)) {
                redoStackRef.current.push({ before: currentSelection.clone() });
              }
              // Restore cursor to where it was before the undone edit
              const targetSelection = entry.before;
              editor.update(() => {
                // Validate that the target nodes still exist — undo/redo may
                // have removed or recreated nodes with different keys (especially
                // with Yjs, which assigns new keys on redo).
                if ($selectionNodesExist(targetSelection)) {
                  $setSelection(targetSelection.clone());
                }
              }, { tag: HISTORIC_TAG });
            }
          } else if (action === 'redo') {
            const entry = redoStackRef.current.pop();
            if (entry) {
              // Push to undoStack so that undo-after-redo works correctly.
              // We save the current (pre-redo) selection as the "before" position.
              const currentSelection = prevEditorState._selection;
              if ($isRangeSelection(currentSelection)) {
                undoStackRef.current.push({ before: currentSelection.clone() });
              }
              // Restore cursor to where it was before the redo, so that an
              // undo + immediate redo leaves the cursor position net-unchanged
              // (matching non-collaborative editor behavior).
              const targetSelection = entry.before;
              editor.update(() => {
                if ($selectionNodesExist(targetSelection)) {
                  $setSelection(targetSelection.clone());
                }
              }, { tag: HISTORIC_TAG });
            }
          }
          return;
        }

        // Skip collaborative updates from other users
        if (tags.has(COLLABORATION_TAG)) {
          return;
        }

        // Skip selection-only changes (no content modifications)
        if (dirtyElements.size === 0 && dirtyLeaves.size === 0) {
          return;
        }

        const now = Date.now();
        const prevSelection = prevEditorState._selection;

        // Only save selection at the start of a new undo group (matching the
        // UndoManager's 500ms capture timeout)
        if (now - lastEditTimeRef.current > CAPTURE_TIMEOUT_MS) {
          if ($isRangeSelection(prevSelection)) {
            undoStackRef.current.push({ before: prevSelection.clone() });
          }
          // New edit clears redo stack (standard undo behavior)
          redoStackRef.current.length = 0;
        }
        lastEditTimeRef.current = now;
      }),

      // Intercept UNDO_COMMAND to set the action flag before the default handler runs.
      // COMMAND_PRIORITY_LOW (1) runs before COMMAND_PRIORITY_EDITOR (0) where the
      // Yjs UndoManager handler is registered.
      editor.registerCommand(
        UNDO_COMMAND,
        () => {
          pendingHistoricActionRef.current = 'undo';
          return false; // Don't consume — let the default handler perform the actual undo
        },
        COMMAND_PRIORITY_LOW,
      ),

      // Same for REDO_COMMAND
      editor.registerCommand(
        REDO_COMMAND,
        () => {
          pendingHistoricActionRef.current = 'redo';
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor]);

  return null;
}
