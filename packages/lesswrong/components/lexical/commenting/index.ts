/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {LexicalEditor} from 'lexical';

import {Provider, TOGGLE_CONNECT_COMMAND} from '@lexical/yjs';
import {COMMAND_PRIORITY_LOW} from 'lexical';
import {useEffect, useState} from 'react';
import {
  Array as YArray,
  Map as YMap,
  Transaction,
  YArrayEvent,
  YMapEvent,
  YEvent,
} from 'yjs';
import { useCollaborationContext } from '@lexical/react/LexicalCollaborationContext';
import type { HocuspocusProvider } from '@hocuspocus/provider';
import { TupleSet } from '@/lib/utils/typeGuardUtils';

export type Comment = {
  author: string;
  content: string;
  deleted: boolean;
  id: string;
  commentKind?: 'suggestionSummary';
  timeStamp: number;
  type: 'comment';
};

export type ThreadStatus = 'open' | 'accepted' | 'rejected' | 'archived';

export type ThreadType = 'comment' | 'suggestion';

export type Thread = {
  comments: Array<Comment>;
  id: string;
  markID?: string;
  quote: string;
  status?: ThreadStatus;
  /** Stores the thread's status before it was reopened via undo, so redo can restore it */
  statusBeforeReopen?: ThreadStatus;
  threadType?: ThreadType;
  type: 'thread';
};

export type Comments = Array<Thread | Comment>;

function createUID(): string {
  return Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '')
    .substring(0, 5);
}

export function createComment(
  content: string,
  author: string,
  id?: string,
  timeStamp?: number,
  deleted?: boolean,
  commentKind?: Comment['commentKind'],
): Comment {
  return {
    author,
    content,
    deleted: deleted === undefined ? false : deleted,
    id: id === undefined ? createUID() : id,
    commentKind,
    timeStamp:
      timeStamp === undefined
        ? performance.timeOrigin + performance.now()
        : timeStamp,
    type: 'comment',
  };
}

export function createThread(
  quote: string,
  comments: Array<Comment>,
  id?: string,
  options?: { markID?: string; status?: ThreadStatus; statusBeforeReopen?: ThreadStatus; threadType?: ThreadType },
): Thread {
  return {
    comments,
    id: id === undefined ? createUID() : id,
    markID: options?.markID,
    quote,
    status: options?.status,
    statusBeforeReopen: options?.statusBeforeReopen,
    threadType: options?.threadType,
    type: 'thread',
  };
}

function cloneThread(thread: Thread): Thread {
  return {
    comments: Array.from(thread.comments),
    id: thread.id,
    markID: thread.markID,
    quote: thread.quote,
    status: thread.status,
    statusBeforeReopen: thread.statusBeforeReopen,
    threadType: thread.threadType,
    type: 'thread',
  };
}

function markDeleted(comment: Comment): Comment {
  return {
    author: comment.author,
    content: '[Deleted Comment]',
    deleted: true,
    id: comment.id,
    commentKind: comment.commentKind,
    timeStamp: comment.timeStamp,
    type: 'comment',
  };
}

function triggerOnChange(commentStore: CommentStore): void {
  const listeners = commentStore._changeListeners;
  for (const listener of listeners) {
    listener();
  }
}

export class CommentStore {
  _editor: LexicalEditor;
  _comments: Comments;
  _changeListeners: Set<() => void>;
  _collabProvider: null | Provider;
  _isSynced: boolean;

  constructor(editor: LexicalEditor) {
    this._comments = [];
    this._editor = editor;
    this._collabProvider = null;
    this._changeListeners = new Set();
    this._isSynced = true;
  }

  isCollaborative(): boolean {
    return this._collabProvider !== null;
  }

  isSynced(): boolean {
    return this._isSynced;
  }

  getComments(): Comments {
    return this._comments;
  }

  updateThread(
    threadId: string,
    data: {
      quote?: string;
      firstCommentContent?: string;
      markID?: string;
      status?: ThreadStatus;
      /** Set to a status to store it, or null to clear it */
      statusBeforeReopen?: ThreadStatus | null;
      threadType?: ThreadType;
    },
  ): void {
    const nextComments = Array.from(this._comments);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sharedCommentsArray: YArray<any> | null = this._getCollabComments();

    for (let i = 0; i < nextComments.length; i++) {
      const c = nextComments[i];
      if (c.type !== 'thread' || c.id !== threadId) continue;

      const newThread = cloneThread(c);
      nextComments.splice(i, 1, newThread);

      if (data.quote !== undefined) {
        newThread.quote = data.quote;
        if (this.isCollaborative() && sharedCommentsArray !== null) {
          this._withRemoteTransaction(() => {
            sharedCommentsArray.get(i).set('quote', data.quote);
          });
        }
      }

      if (data.markID !== undefined) {
        newThread.markID = data.markID;
        if (this.isCollaborative() && sharedCommentsArray !== null) {
          this._withRemoteTransaction(() => {
            sharedCommentsArray.get(i).set('markID', data.markID);
          });
        }
      }

      if (data.status !== undefined) {
        newThread.status = data.status;
        if (this.isCollaborative() && sharedCommentsArray !== null) {
          this._withRemoteTransaction(() => {
            sharedCommentsArray.get(i).set('status', data.status);
          });
        }
      }

      if (data.statusBeforeReopen !== undefined) {
        if (data.statusBeforeReopen === null) {
          newThread.statusBeforeReopen = undefined;
          if (this.isCollaborative() && sharedCommentsArray !== null) {
            this._withRemoteTransaction(() => {
              sharedCommentsArray.get(i).delete('statusBeforeReopen');
            });
          }
        } else {
          newThread.statusBeforeReopen = data.statusBeforeReopen;
          if (this.isCollaborative() && sharedCommentsArray !== null) {
            this._withRemoteTransaction(() => {
              sharedCommentsArray.get(i).set('statusBeforeReopen', data.statusBeforeReopen);
            });
          }
        }
      }

      if (data.threadType !== undefined) {
        newThread.threadType = data.threadType;
        if (this.isCollaborative() && sharedCommentsArray !== null) {
          this._withRemoteTransaction(() => {
            sharedCommentsArray.get(i).set('threadType', data.threadType);
          });
        }
      }

      if (data.firstCommentContent !== undefined) {
        const first = newThread.comments[0];
        if (first && first.type === 'comment') {
          first.content = data.firstCommentContent;
          if (this.isCollaborative() && sharedCommentsArray !== null) {
            this._withRemoteTransaction(() => {
              const sharedThreadComments = sharedCommentsArray.get(i).get('comments');
              if (sharedThreadComments?.length > 0) {
                sharedThreadComments.get(0).set('content', data.firstCommentContent);
              }
            });
          }
        }
      }

      this._comments = nextComments;
      triggerOnChange(this);
      return;
    }
  }

  addComment(
    commentOrThread: Comment | Thread,
    thread?: Thread,
    offset?: number,
  ): void {
    const nextComments = Array.from(this._comments);
    // The YJS types explicitly use `any` as well.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sharedCommentsArray: YArray<any> | null = this._getCollabComments();

    if (thread !== undefined && commentOrThread.type === 'comment') {
      for (let i = 0; i < nextComments.length; i++) {
        const comment = nextComments[i];
        if (comment.type === 'thread' && comment.id === thread.id) {
          const newThread = cloneThread(comment);
          nextComments.splice(i, 1, newThread);
          const insertOffset =
            offset !== undefined ? offset : newThread.comments.length;
          if (this.isCollaborative() && sharedCommentsArray !== null) {
            const parentSharedArray = sharedCommentsArray
              .get(i)
              .get('comments');
            this._withRemoteTransaction(() => {
              let exists = checkIfCommentAlreadyExists(parentSharedArray, commentOrThread);
              if (!exists) {
                const sharedMap = this._createCollabSharedMap(commentOrThread);
                parentSharedArray.insert(insertOffset, [sharedMap]);
              }
            });
          }
          newThread.comments.splice(insertOffset, 0, commentOrThread);
          break;
        }
      }
    } else {
      const insertOffset = offset !== undefined ? offset : nextComments.length;
      if (this.isCollaborative() && sharedCommentsArray !== null) {
        this._withRemoteTransaction(() => {
          const exists = checkIfCommentAlreadyExists(sharedCommentsArray, commentOrThread);
          if (!exists) {
            const sharedMap = this._createCollabSharedMap(commentOrThread);
            sharedCommentsArray.insert(insertOffset, [sharedMap]);
          }
        });
      }
      nextComments.splice(insertOffset, 0, commentOrThread);
    }
    this._comments = nextComments;
    triggerOnChange(this);
  }

  deleteCommentOrThread(
    commentOrThread: Comment | Thread,
    thread?: Thread,
  ): {markedComment: Comment; index: number} | null {
    const nextComments = Array.from(this._comments);
    // The YJS types explicitly use `any` as well.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sharedCommentsArray: YArray<any> | null = this._getCollabComments();
    let commentIndex: number | null = null;

    if (thread !== undefined) {
      for (let i = 0; i < nextComments.length; i++) {
        const nextComment = nextComments[i];
        if (nextComment.type === 'thread' && nextComment.id === thread.id) {
          const newThread = cloneThread(nextComment);
          nextComments.splice(i, 1, newThread);
          const threadComments = newThread.comments;
          commentIndex = threadComments.indexOf(commentOrThread as Comment);
          if (this.isCollaborative() && sharedCommentsArray !== null) {
            const parentSharedArray = sharedCommentsArray
              .get(i)
              .get('comments');
            this._withRemoteTransaction(() => {
              parentSharedArray.delete(commentIndex);
            });
          }
          threadComments.splice(commentIndex, 1);
          break;
        }
      }
    } else {
      commentIndex = nextComments.indexOf(commentOrThread);
      if (this.isCollaborative() && sharedCommentsArray !== null) {
        this._withRemoteTransaction(() => {
          sharedCommentsArray.delete(commentIndex as number);
        });
      }
      nextComments.splice(commentIndex, 1);
    }
    this._comments = nextComments;
    triggerOnChange(this);

    if (commentOrThread.type === 'comment') {
      return {
        index: commentIndex as number,
        markedComment: markDeleted(commentOrThread),
      };
    }

    return null;
  }

  registerOnChange(onChange: () => void): () => void {
    const changeListeners = this._changeListeners;
    changeListeners.add(onChange);
    return () => {
      changeListeners.delete(onChange);
    };
  }

  getThreadByMarkID(markID: string): Thread | undefined {
    return this._comments.find((comment): comment is Thread => comment.type === 'thread' && comment.markID === markID);
  }

  getThreadsByType(threadType: ThreadType): Thread[] {
    const threads = this._comments.filter((comment): comment is Thread => comment.type === 'thread' && comment.threadType === threadType);
    return threads;
  }

  updateThreadStatus(threadId: string, status: ThreadStatus): void {
    this.updateThread(threadId, { status });
  }

  _withRemoteTransaction(fn: () => void): void {
    const provider = this._collabProvider;
    if (provider !== null) {
      // @ts-expect-error doc does exist
      const doc = provider.doc;
      doc.transact(fn, this);
    }
  }

  _withLocalTransaction(fn: () => void): void {
    const collabProvider = this._collabProvider;
    try {
      this._collabProvider = null;
      fn();
    } finally {
      this._collabProvider = collabProvider;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _getCollabComments(): null | YArray<any> {
    const provider = this._collabProvider;
    if (provider !== null) {
      // @ts-expect-error doc does exist
      const doc = provider.doc;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return doc.get('comments', YArray) as YArray<any>;
    }
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _createCollabSharedMap(commentOrThread: Comment | Thread): YMap<any> {
    const sharedMap = new YMap();
    const type = commentOrThread.type;
    const id = commentOrThread.id;
    sharedMap.set('type', type);
    sharedMap.set('id', id);
    if (type === 'comment') {
      sharedMap.set('author', commentOrThread.author);
      sharedMap.set('content', commentOrThread.content);
      sharedMap.set('deleted', commentOrThread.deleted);
      if (commentOrThread.commentKind) {
        sharedMap.set('commentKind', commentOrThread.commentKind);
      }
      sharedMap.set('timeStamp', commentOrThread.timeStamp);
    } else {
      sharedMap.set('quote', commentOrThread.quote);
      if (commentOrThread.markID) {
        sharedMap.set('markID', commentOrThread.markID);
      }
      if (commentOrThread.status) {
        sharedMap.set('status', commentOrThread.status);
      }
      if (commentOrThread.statusBeforeReopen) {
        sharedMap.set('statusBeforeReopen', commentOrThread.statusBeforeReopen);
      }
      if (commentOrThread.threadType) {
        sharedMap.set('threadType', commentOrThread.threadType);
      }
      const commentsArray = new YArray();
      commentOrThread.comments.forEach((comment, i) => {
        const sharedChildComment = this._createCollabSharedMap(comment);
        commentsArray.insert(i, [sharedChildComment]);
      });
      sharedMap.set('comments', commentsArray);
    }
    return sharedMap;
  }

  registerCollaboration(provider: Provider & HocuspocusProvider): () => void {
    this._collabProvider = provider;
    this._isSynced = provider.synced;
    triggerOnChange(this);

    const sharedCommentsArray = this._getCollabComments();

    const connect = () => {
      void provider.connect();
    };

    const disconnect = () => {
      try {
        provider.disconnect();
      } catch (_e) {
        // Do nothing
      }
    };

    const onSync = () => {
      this._isSynced = provider.synced;
      triggerOnChange(this);
    };

    provider.on('synced', onSync);

    const unsubscribe = this._editor.registerCommand(
      TOGGLE_CONNECT_COMMAND,
      (payload) => {
        if (connect !== undefined && disconnect !== undefined) {
          const shouldConnect = payload;

          if (shouldConnect) {
            // eslint-disable-next-line no-console
            console.log('Comments connected!');
            connect();
          } else {
            // eslint-disable-next-line no-console
            console.log('Comments disconnected!');
            disconnect();
          }
        }

        return false;
      },
      COMMAND_PRIORITY_LOW,
    );

    const onSharedCommentChanges = (
      // The YJS types explicitly use `any` as well.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      events: Array<YEvent<any>>,
      transaction: Transaction,
    ) => {
      if (transaction.origin !== this) {
        for (let i = 0; i < events.length; i++) {
          const event = events[i];

          if (event instanceof YArrayEvent) {
            const target = event.target;
            const deltas = event.delta;
            let offset = 0;

            for (let s = 0; s < deltas.length; s++) {
              const delta = deltas[s];
              const insert = delta.insert;
              const retain = delta.retain;
              const del = delta.delete;
              const parent = target.parent;
              const parentThread =
                target === sharedCommentsArray
                  ? undefined
                  : parent instanceof YMap &&
                    (this._comments.find((t) => t.id === parent.get('id')) as
                      | Thread
                      | undefined);

              if (Array.isArray(insert)) {
                insert
                  .slice()
                  .reverse()
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  .forEach((map: YMap<any>) => {
                    const id = map.get('id');
                    const type = map.get('type');

                    const commentOrThread =
                      type === 'thread'
                        ? createThread(
                            map.get('quote'),
                            map
                              .get('comments')
                              .toArray()
                              .map(
                                (
                                  innerComment: Map<
                                    string,
                                    string | number | boolean
                                  >,
                                ) =>
                                  createComment(
                                    innerComment.get('content') as string,
                                    innerComment.get('author') as string,
                                    innerComment.get('id') as string,
                                    innerComment.get('timeStamp') as number,
                                    innerComment.get('deleted') as boolean,
                                    innerComment.get('commentKind') as Comment['commentKind'],
                                  ),
                              ),
                            id,
                            {
                              markID: map.get('markID') as string | undefined,
                              status: map.get('status') as ThreadStatus | undefined,
                              statusBeforeReopen: map.get('statusBeforeReopen') as ThreadStatus | undefined,
                              threadType: map.get('threadType') as ThreadType | undefined,
                            },
                          )
                        : createComment(
                            map.get('content'),
                            map.get('author'),
                            id,
                            map.get('timeStamp'),
                            map.get('deleted'),
                            map.get('commentKind') as Comment['commentKind'],
                          );
                    this._withLocalTransaction(() => {
                      this.addComment(
                        commentOrThread,
                        parentThread as Thread,
                        offset,
                      );
                    });
                  });
              } else if (typeof retain === 'number') {
                offset += retain;
              } else if (typeof del === 'number') {
                for (let d = 0; d < del; d++) {
                  const commentOrThread =
                    parentThread === undefined || parentThread === false
                      ? this._comments[offset]
                      : parentThread.comments[offset];
                  this._withLocalTransaction(() => {
                    this.deleteCommentOrThread(
                      commentOrThread,
                      parentThread as Thread,
                    );
                  });
                  offset++;
                }
              }
            }
          } else if (event instanceof YMapEvent) {
            // Handle property updates on existing threads/comments
            const target = event.target;
            const targetId = target.get('id');
            const targetType = target.get('type');
            
            if (targetType === 'thread' && targetId) {
              this._updateThreadProperty(targetId, event, target);
            } else if (targetType === 'comment' && targetId) {
              // Handle comment property updates (e.g., content changes for suggestion summaries)
              // Find the thread that contains this comment
              this._updateCommentProperty(targetId, event, target);
            }
          }
        }
      }
    };

    if (sharedCommentsArray === null) {
      return () => null;
    }

    sharedCommentsArray.observeDeep(onSharedCommentChanges);

    connect();

    return () => {
      sharedCommentsArray.unobserveDeep(onSharedCommentChanges);
      unsubscribe();
      provider.off('synced', onSync);
      this._collabProvider = null;
    };
  }

  private updatedableThreadProperties = new TupleSet(['status', 'statusBeforeReopen', 'quote', 'markID', 'threadType'] as const);
  private updatedableCommentProperties = new TupleSet(['content', 'deleted'] as const);

  private _updateThreadProperty(threadId: string, event: YMapEvent<any>, target: YMap<any>) {
    const thread = this._comments.find(
      (c): c is Thread => c.type === 'thread' && c.id === threadId
    );

    if (!thread) {
      return;
    }

    const threadIndex = this._comments.indexOf(thread);
    const newThread = cloneThread(thread);
    let changed = false;

    for (const key of event.keysChanged) {
      const newValue = target.get(key);
      if (!this.updatedableThreadProperties.has(key)) {
        continue;
      }

      Object.assign(newThread, { [key]: newValue });
      changed = true;
    }

    if (!changed) {
      return;
    }

    const nextComments = Array.from(this._comments);
    nextComments[threadIndex] = newThread;
    this._comments = nextComments;
    triggerOnChange(this);
  }

  private _updateCommentProperty(commentId: string, event: YMapEvent<any>, target: YMap<any>) {
    const thread = this._comments.find(
      (c): c is Thread => c.type === 'thread' && c.comments.some(comment => comment.id === commentId)
    );

    if (!thread) {
      return;
    }

    const threadIndex = this._comments.indexOf(thread);
    const commentIndex = thread.comments.findIndex(c => c.id === commentId);

    if (commentIndex === -1) {
      return;
    }

    const newThread = cloneThread(thread);
    const comment = newThread.comments[commentIndex];
    let changed = false;

    for (const key of event.keysChanged) {
      const newValue = target.get(key);
      if (!this.updatedableCommentProperties.has(key)) {
        continue;
      }

      Object.assign(comment, { [key]: newValue });
      changed = true;
    }

    if (!changed) {
      return;
    }
    
    const nextComments = Array.from(this._comments);
    nextComments[threadIndex] = newThread;
    this._comments = nextComments;
    triggerOnChange(this);
  }
}

function checkIfCommentAlreadyExists(parentSharedArray: YArray<AnyBecauseHard>, commentOrThread: Comment | Thread) {
  let exists = false;
  for (let i = 0; i < parentSharedArray.length; i++) {
    const item = parentSharedArray.get(i);
    if (item.get('id') === commentOrThread.id) {
      exists = true;
      break;
    }
  }
  return exists;
}

export function useCommentStore(commentStore: CommentStore): Comments {
  const [comments, setComments] = useState<Comments>(
    commentStore.getComments(),
  );

  useEffect(() => {
    return commentStore.registerOnChange(() => {
      setComments(commentStore.getComments());
    });
  }, [commentStore]);

  return comments;
}

export function useCollabAuthorName(): string {
  const collabContext = useCollaborationContext();
  const {yjsDocMap, name} = collabContext;
  return yjsDocMap.has('comments') ? name : 'Unknown User';
}
