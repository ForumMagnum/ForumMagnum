import {
  Extension,
  onChangePayload,
  onDisconnectPayload,
  afterLoadDocumentPayload,
  beforeUnloadDocumentPayload,
} from '@hocuspocus/server';
import * as Y from 'yjs';

/**
 * How long to wait after the last edit before saving a revision.
 * If the user pauses typing for this long, a revision is created.
 */
const REVISION_IDLE_DEBOUNCE_MS = 60_000; // 60 seconds

/**
 * Maximum time between revision saves during continuous editing.
 * Even if the user never pauses, a revision is created at this interval.
 */
const REVISION_MAX_INTERVAL_MS = 5 * 60_000; // 5 minutes

interface RevisionSyncConfig {
  /** The base URL of the ForumMagnum app (e.g. https://www.lesswrong.com) */
  webhookUrl: string;
  /** Shared secret for authenticating with the ForumMagnum webhook */
  webhookSecret: string;
}

interface CommentYMap {
  get(key: 'type'): 'comment' | 'thread';
  get(key: 'id'): string;
  get(key: 'author'): string;
  get(key: 'authorId'): string;
  get(key: 'content'): string;
  get(key: 'deleted'): boolean;
  get(key: 'timeStamp'): number;
  get(key: 'commentKind'): string | undefined;
  get(key: 'comments'): Y.Array<CommentYMap> | undefined;
  get(key: string): unknown;
}

/**
 * Per-document state for the revision debounce timers.
 *
 * When `onChange` fires, we don't immediately send a webhook.
 * Instead we reset an idle timer and maintain a max-interval
 * timer, so revisions are only created:
 *   - After 60 seconds of inactivity, OR
 *   - At most every 5 minutes during continuous editing.
 *
 * On disconnect the pending timer is flushed immediately so the final
 * document state is never lost.
 */
interface PendingRevision {
  /** Timer that fires after REVISION_IDLE_DEBOUNCE_MS of inactivity. */
  idleTimer: NodeJS.Timeout;
  /**
   * Timer that fires after REVISION_MAX_INTERVAL_MS since the first
   * unsaved edit. Ensures revisions are created even during continuous typing.
   * Only set once per "dirty" window; cleared after a revision is saved.
   */
  maxTimer: NodeJS.Timeout;
  /** Reference to the live Y.Doc so we can encode state at flush time. */
  document: Y.Doc;
}

/**
 * Hocuspocus extension that syncs document changes back to ForumMagnum
 * for revision storage and comment notifications.
 *
 * Equivalent to the CKEditor webhook system, but running inside the
 * Hocuspocus server rather than being called by an external service.
 */
export class RevisionSyncExtension implements Extension {
  private config: RevisionSyncConfig;
  /**
   * Tracks known comment IDs per document so we can detect new comments.
   * Keyed by document name.
   */
  private knownCommentIds = new Map<string, Set<string>>();
  /**
   * Stores cleanup functions for comment observers, keyed by document name.
   */
  private commentObservers = new Map<string, () => void>();
  /**
   * Pending revision saves, keyed by document name.
   * Manages the idle + max-interval debounce for each active document.
   */
  private pendingRevisions = new Map<string, PendingRevision>();

  constructor(config: RevisionSyncConfig) {
    this.config = config;
  }

  /**
   * Called on every individual Yjs update (i.e. per keystroke).
   *
   * Resets the idle timer so it always measures from the most recent edit,
   * and starts the max-interval timer on the first edit of a dirty window.
   * The actual webhook call only happens when a timer fires or on disconnect.
   */
  async onChange({ documentName, document }: onChangePayload): Promise<void> {
    const existing = this.pendingRevisions.get(documentName);

    // Always clear and reset the idle timer
    if (existing) {
      clearTimeout(existing.idleTimer);
    }

    const idleTimer = setTimeout(() => {
      void this.flushRevision(documentName);
    }, REVISION_IDLE_DEBOUNCE_MS);

    // Only create the max-interval timer if there isn't one already running.
    // This ensures the max timer measures from the first unsaved edit, not
    // from the most recent one.
    const maxTimer = existing?.maxTimer ?? setTimeout(() => {
      void this.flushRevision(documentName);
    }, REVISION_MAX_INTERVAL_MS);

    this.pendingRevisions.set(documentName, {
      idleTimer,
      maxTimer,
      document,
    });
  }

  /**
   * Called after a document is loaded from storage.
   * Attaches an observer to the 'comments' YArray to detect new comments.
   */
  async afterLoadDocument({ documentName, document }: afterLoadDocumentPayload): Promise<void> {
    this.setupCommentObserver(documentName, document);
  }

  /**
   * Called when a user disconnects from a document.
   *
   * If there's a pending revision save for this document, flush it
   * immediately so the final state isn't lost. Then send a separate
   * user.disconnected event attributed to this user.
   *
   * Equivalent of CKEditor's `document.user.disconnected` webhook event.
   */
  async onDisconnect({ documentName, document, context }: onDisconnectPayload): Promise<void> {
    // Flush any pending debounced revision save so we don't double-save
    this.cancelPendingRevision(documentName);

    const userId = context?.user?.id;
    if (!userId) {
      return;
    }

    const state = Y.encodeStateAsUpdate(document);
    const base64State = Buffer.from(state).toString('base64');

    await this.postToWebhook({
      event: 'user.disconnected',
      payload: {
        documentName,
        userId,
        yjsState: base64State,
      },
    });
  }

  /**
   * Called before a document is unloaded from memory.
   * Flushes any pending revision and cleans up the comment observer.
   */
  async beforeUnloadDocument({ documentName }: beforeUnloadDocumentPayload): Promise<void> {
    // If there's still a pending revision (e.g. all users disconnected at
    // once before the idle timer fired), flush it now.
    await this.flushRevision(documentName);
    this.cleanupCommentObserver(documentName);
  }

  async onDestroy(): Promise<void> {
    // Flush all pending revisions
    const flushPromises = [...this.pendingRevisions.keys()].map(
      (docName) => this.flushRevision(docName),
    );
    await Promise.all(flushPromises);

    // Clean up all observers
    for (const cleanup of this.commentObservers.values()) {
      cleanup();
    }
    this.commentObservers.clear();
    this.knownCommentIds.clear();
  }

  /**
   * Sends the current document state to ForumMagnum as a `document.updated`
   * event, then clears the pending revision timers for that document.
   */
  private async flushRevision(documentName: string): Promise<void> {
    const pending = this.pendingRevisions.get(documentName);
    if (!pending) {
      return;
    }

    // Clear both timers before the async work so a concurrent flush
    // (e.g. idle timer + disconnect racing) doesn't double-send.
    this.cancelPendingRevision(documentName);

    const state = Y.encodeStateAsUpdate(pending.document);
    const base64State = Buffer.from(state).toString('base64');

    await this.postToWebhook({
      event: 'document.updated',
      payload: {
        documentName,
        yjsState: base64State,
      },
    });
  }

  /**
   * Cancels both debounce timers for a document without sending a webhook.
   */
  private cancelPendingRevision(documentName: string): void {
    const pending = this.pendingRevisions.get(documentName);
    if (pending) {
      clearTimeout(pending.idleTimer);
      clearTimeout(pending.maxTimer);
      this.pendingRevisions.delete(documentName);
    }
  }

  /**
   * Sets up an observer on the 'comments' YArray in the document to detect
   * when new comments are added. This mirrors the client-side
   * `onSharedCommentChanges` handler in CommentStore.registerCollaboration.
   */
  private setupCommentObserver(documentName: string, document: Y.Doc): void {
    // Clean up any existing observer for this document
    this.cleanupCommentObserver(documentName);

    const commentsArray = document.get('comments', Y.Array<CommentYMap>);

    // Build initial set of known comment IDs
    const knownIds = new Set<string>();
    this.collectCommentIds(commentsArray, knownIds);
    this.knownCommentIds.set(documentName, knownIds);

    const observer = (events: Array<Y.YEvent<Y.AbstractType<unknown>>>) => {
      void this.handleCommentChanges(documentName, commentsArray, events);
    };

    commentsArray.observeDeep(observer);

    this.commentObservers.set(documentName, () => {
      commentsArray.unobserveDeep(observer);
    });
  }

  /**
   * Recursively collects all comment IDs from the comments YArray.
   * Threads contain nested comments arrays.
   */
  private collectCommentIds(commentsArray: Y.Array<CommentYMap>, ids: Set<string>): void {
    for (let i = 0; i < commentsArray.length; i++) {
      const item = commentsArray.get(i);
      const id = item.get('id');
      if (id) {
        ids.add(id);
      }
      const type = item.get('type');
      if (type === 'thread') {
        const threadComments = item.get('comments');
        if (threadComments) {
          this.collectCommentIds(threadComments, ids);
        }
      }
    }
  }

  /**
   * Handles changes to the comments array by detecting new comments
   * and sending notifications to ForumMagnum.
   */
  private async handleCommentChanges(
    documentName: string,
    commentsArray: Y.Array<CommentYMap>,
    events: Array<Y.YEvent<Y.AbstractType<unknown>>>,
  ): Promise<void> {
    const knownIds = this.knownCommentIds.get(documentName);
    if (!knownIds) {
      return;
    }

    for (const event of events) {
      if (!(event instanceof Y.YArrayEvent)) {
        continue;
      }

      for (const delta of event.delta) {
        if (!Array.isArray(delta.insert)) {
          continue;
        }

        for (const inserted of delta.insert) {
          if (!(inserted instanceof Y.Map)) {
            continue;
          }

          const map = inserted as CommentYMap;
          const type = map.get('type');
          const id = map.get('id');

          if (!id || knownIds.has(id)) {
            continue;
          }

          knownIds.add(id);

          if (type === 'comment') {
            // A new comment was added to a thread
            const authorId = map.get('authorId');
            const content = map.get('content');

            if (!authorId || !content) {
              continue;
            }

            // Find the parent thread to get the thread ID and other commenters
            const parentThread = this.findParentThread(commentsArray, id);
            const commentersInThread = parentThread
              ? this.getCommentersInThread(parentThread)
              : [];

            await this.postToWebhook({
              event: 'comment.added',
              payload: {
                documentName,
                authorId,
                content,
                threadId: parentThread ? parentThread.get('id') : id,
                commentersInThread,
              },
            });
          } else if (type === 'thread') {
            // A new thread was created — register all its initial comment IDs
            const threadComments = map.get('comments');
            if (threadComments) {
              this.collectCommentIds(threadComments, knownIds);
            }

            // Notify for the first comment in the thread (if any and not a
            // suggestion summary, which is auto-generated)
            if (threadComments && threadComments.length > 0) {
              const firstComment = threadComments.get(0);
              const commentKind = firstComment.get('commentKind');
              if (commentKind === 'suggestionSummary') {
                continue;
              }

              const authorId = firstComment.get('authorId');
              const content = firstComment.get('content');
              if (authorId && content) {
                await this.postToWebhook({
                  event: 'comment.added',
                  payload: {
                    documentName,
                    authorId,
                    content,
                    threadId: id,
                    commentersInThread: [authorId],
                  },
                });
              }
            }
          }
        }
      }
    }
  }

  /**
   * Finds the thread that contains a given comment ID.
   */
  private findParentThread(commentsArray: Y.Array<CommentYMap>, commentId: string): CommentYMap | null {
    for (let i = 0; i < commentsArray.length; i++) {
      const item = commentsArray.get(i);
      if (item.get('type') !== 'thread') {
        continue;
      }
      const threadComments = item.get('comments');
      if (!threadComments) {
        continue;
      }
      for (let j = 0; j < threadComments.length; j++) {
        if (threadComments.get(j).get('id') === commentId) {
          return item;
        }
      }
    }
    return null;
  }

  /**
   * Gets all unique author IDs from a thread's comments.
   */
  private getCommentersInThread(thread: CommentYMap): string[] {
    const threadCommenters = thread.get('comments')?.map((comment) => comment.get('authorId')) ?? [];
    return [...new Set(threadCommenters)];
  }

  private cleanupCommentObserver(documentName: string): void {
    const cleanup = this.commentObservers.get(documentName);
    if (cleanup) {
      cleanup();
      this.commentObservers.delete(documentName);
    }
    this.knownCommentIds.delete(documentName);
  }

  private async postToWebhook(body: { event: string; payload: Record<string, unknown> }): Promise<void> {
    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.webhookSecret}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        // eslint-disable-next-line no-console
        console.error(
          `[RevisionSync] Webhook request failed: ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[RevisionSync] Error posting to webhook:', error);
    }
  }
}
