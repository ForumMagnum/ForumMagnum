'use client';

import type React from 'react';
import type { WithMessagesFunctions } from '@/components/layout/FlashMessages';
import type { HistoryItem, InboxAction } from './inboxReducer';

/**
 * An action is filed into history *before* its mutation runs, so without this a
 * rejected mutation is indistinguishable from a successful one: the user vanishes
 * from the queue and nothing is ever written. Every path that runs a queued action
 * (undo-window expiry, "Mark all done", and retries) goes through here, so that
 * failures mark the history entry and get announced instead of being swallowed.
 */
async function attemptQueuedAction(
  item: HistoryItem,
  dispatch: React.Dispatch<InboxAction>,
): Promise<string | null> {
  const { user, timestamp, executeAction } = item;
  try {
    await executeAction();
    dispatch({ type: 'CLEAR_ACTION_ERROR', userId: user._id, timestamp });
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    dispatch({ type: 'MARK_ACTION_FAILED', userId: user._id, timestamp, error: errorMessage });
    return errorMessage;
  }
}

/** Runs a single queued action, flashing an error if it fails. Returns whether it succeeded. */
export async function runQueuedModerationAction(
  item: HistoryItem,
  dispatch: React.Dispatch<InboxAction>,
  flash: WithMessagesFunctions['flash'],
): Promise<boolean> {
  const errorMessage = await attemptQueuedAction(item, dispatch);
  if (errorMessage) {
    flash({
      messageString: `NOT SAVED — "${item.actionLabel}" failed for ${item.user.displayName}: ${errorMessage}`,
      type: 'error',
    });
  }
  return !errorMessage;
}

/**
 * Runs a batch of queued actions ("Mark all done"), flashing a single summary
 * rather than one message per failure. Failed entries stay in the Failed section
 * for retry.
 */
export async function runQueuedModerationActions(
  items: HistoryItem[],
  dispatch: React.Dispatch<InboxAction>,
  flash: WithMessagesFunctions['flash'],
): Promise<void> {
  const results = await Promise.all(items.map(item => attemptQueuedAction(item, dispatch)));
  const failedNames = items
    .filter((_item, index) => results[index] !== null)
    .map(item => item.user.displayName);

  if (failedNames.length === 0) return;

  flash({
    messageString: `NOT SAVED — ${failedNames.length} of ${items.length} actions failed (${failedNames.join(', ')}). See Failed actions to retry.`,
    type: 'error',
  });
}
