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
  $getSelection,
  $isRangeSelection,
  $setSelection,
  COMMAND_PRIORITY_LOW,
  COLLABORATION_TAG,
  HISTORIC_TAG,
  HISTORY_PUSH_TAG,
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
    /**
     * Clear the current range selection before the Yjs UndoManager reverses a
     * change. The reversal removes (and re-keys) nodes, and @lexical/yjs's sync
     * update clones the pre-undo selection into the resulting editor state. If
     * that selection points at a node the reversal removes, the clone dangles
     * and Lexical throws from updateEditor:
     *   "selection has been lost because the previously selected nodes have
     *    been removed..."
     *
     * This bites, for example, after deleting from the very start of a
     * paragraph in suggestion mode: the resulting collapsed selection is an
     * element point on the paragraph (ProtonNode `selectPrevious()` falls back
     * to `parent.select(0, 0)` when the delete suggestion is the first child),
     * and an undo/redo/undo sequence ends up cloning it onto a removed node.
     *
     * Clearing the selection first means the sync update has nothing to dangle;
     * the correct cursor is then restored from our selection-history stack in
     * the update listener below. This runs at COMMAND_PRIORITY_LOW, before the
     * UndoManager handler at COMMAND_PRIORITY_EDITOR, so it takes effect first.
     *
     * If the undo/redo turns out to be a no-op (nothing left in history), no
     * HISTORIC update runs to restore the cursor, so we put the cleared
     * selection back on the next microtask to avoid the cursor vanishing.
     */
    const $clearSelectionForHistory = (action: 'undo' | 'redo') => {
      const current = $getSelection();
      if (!$isRangeSelection(current)) {
        return;
      }
      const saved = current.clone();
      $setSelection(null);
      queueMicrotask(() => {
        // A HISTORIC undo/redo update consumes the action flag (see the update
        // listener). If it's still set, the operation was a no-op and the
        // cursor was never restored — so put the cleared selection back.
        if (pendingHistoricActionRef.current !== action) {
          return;
        }
        pendingHistoricActionRef.current = null;
        editor.update(() => {
          if ($selectionNodesExist(saved)) {
            $setSelection(saved.clone());
          }
        });
      });
    };

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
        // UndoManager's 500ms capture timeout). An update tagged
        // HISTORY_PUSH_TAG is its own undo group on both sides (the collab
        // sync calls stopCapturing() around it), so mirror that here.
        const isHistoryPush = tags.has(HISTORY_PUSH_TAG);
        if (isHistoryPush || now - lastEditTimeRef.current > CAPTURE_TIMEOUT_MS) {
          if ($isRangeSelection(prevSelection)) {
            undoStackRef.current.push({ before: prevSelection.clone() });
          }
          // New edit clears redo stack (standard undo behavior)
          redoStackRef.current.length = 0;
        }
        lastEditTimeRef.current = isHistoryPush ? 0 : now;
      }),

      // Intercept UNDO_COMMAND to set the action flag before the default handler runs.
      // COMMAND_PRIORITY_LOW (1) runs before COMMAND_PRIORITY_EDITOR (0) where the
      // Yjs UndoManager handler is registered.
      editor.registerCommand(
        UNDO_COMMAND,
        () => {
          pendingHistoricActionRef.current = 'undo';
          $clearSelectionForHistory('undo');
          return false; // Don't consume — let the default handler perform the actual undo
        },
        COMMAND_PRIORITY_LOW,
      ),

      // Same for REDO_COMMAND
      editor.registerCommand(
        REDO_COMMAND,
        () => {
          pendingHistoricActionRef.current = 'redo';
          $clearSelectionForHistory('redo');
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor]);

  return null;
}
