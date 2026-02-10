import {
  Extension,
  afterStoreDocumentPayload,
  afterLoadDocumentPayload,
} from '@hocuspocus/server';
import * as Y from 'yjs';

/**
 * How long to wait after the last DB save before sending a revision webhook.
 * If no further saves happen for this long, a webhook is sent.
 */
const REVISION_IDLE_DEBOUNCE_MS = 60_000; // 60 seconds

/**
 * Maximum time between revision webhooks during continuous editing.
 * Even if saves keep happening, a webhook is sent at this interval.
 */
const REVISION_MAX_INTERVAL_MS = 5 * 60_000; // 5 minutes

interface RevisionSyncConfig {
  /** The URL of the ForumMagnum hocuspocusWebhook page */
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
 * We debounce off `afterStoreDocument` (which fires after the PostgresExtension
 * has written the Yjs state to the DB), so when the webhook fires, ForumMagnum
 * is guaranteed to read fresh state from the YjsDocuments table.
 *
 * Timers ensure revisions are only created:
 *   - After 60 seconds of inactivity (no further DB saves), OR
 *   - At most every 5 minutes during continuous editing.
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
}

/**
 * Hocuspocus extension that syncs document changes back to ForumMagnum
 * for revision storage and comment notifications.
 *
 * Uses `afterStoreDocument` as its trigger, which guarantees the Yjs state
 * has been persisted to the database before we tell ForumMagnum to read it.
 *
 * Sends GET requests to the ForumMagnum webhook page with event data
 * in HTTP headers (not query params, to avoid logging sensitive data).
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
   * Called after the PostgresExtension (and any other onStoreDocument hooks)
   * have finished writing the document to the database.
   *
   * Resets the idle timer so it always measures from the most recent DB save,
   * and starts the max-interval timer on the first save of a dirty window.
   * The actual webhook call only happens when a timer fires.
   */
  async afterStoreDocument({ documentName }: afterStoreDocumentPayload): Promise<void> {
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
   * Called before a document is unloaded from memory (all users disconnected).
   * Flushes any pending revision and cleans up the comment observer.
   */
  async beforeUnloadDocument({ documentName }: afterStoreDocumentPayload): Promise<void> {
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
   * Sends a `document.updated` webhook to ForumMagnum, then clears the
   * pending revision timers for that document.
   */
  private async flushRevision(documentName: string): Promise<void> {
    const pending = this.pendingRevisions.get(documentName);
    if (!pending) {
      return;
    }

    // Clear both timers before the async work so a concurrent flush
    // (e.g. idle timer + beforeUnloadDocument racing) doesn't double-send.
    this.cancelPendingRevision(documentName);

    await this.sendWebhookEvent('document.updated', documentName);
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

            await this.sendWebhookEvent('comment.added', documentName, {
              'X-Hocuspocus-Comment-Author-Id': authorId,
              'X-Hocuspocus-Comment-Content': content,
              'X-Hocuspocus-Comment-Thread-Id': parentThread ? parentThread.get('id') : id,
              'X-Hocuspocus-Comment-Commenters': commentersInThread.join(','),
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
                await this.sendWebhookEvent('comment.added', documentName, {
                  'X-Hocuspocus-Comment-Author-Id': authorId,
                  'X-Hocuspocus-Comment-Content': content,
                  'X-Hocuspocus-Comment-Thread-Id': id,
                  'X-Hocuspocus-Comment-Commenters': authorId,
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

  /**
   * Sends a GET request to the ForumMagnum webhook page with event data
   * encoded in HTTP headers (not query params, to avoid logging sensitive data).
   * The ForumMagnum page reads the Yjs state from the database rather than
   * receiving it in the request body, so no large payloads are needed.
   */
  private async sendWebhookEvent(
    event: string,
    documentName: string,
    extraHeaders?: Record<string, string>,
  ): Promise<void> {
    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.webhookSecret}`,
          'X-Hocuspocus-Event': event,
          'X-Hocuspocus-Document': documentName,
          ...extraHeaders,
        },
      });

      if (!response.ok) {
        // eslint-disable-next-line no-console
        console.error(
          `[RevisionSync] Webhook request failed: ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[RevisionSync] Error sending webhook event:', error);
    }
  }
}
