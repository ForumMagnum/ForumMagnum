import type { LexicalEditor } from 'lexical';

import { Provider, TOGGLE_CONNECT_COMMAND } from '@lexical/yjs';
import { COMMAND_PRIORITY_LOW } from 'lexical';
import { useEffect, useState } from 'react';
import {
  Map as YMap,
  Transaction,
  YEvent,
} from 'yjs';

export type SuggestionState = 'open' | 'accepted' | 'rejected';
export type SuggestionType = 'insert' | 'delete' | 'replace' | 'format' | 'block';

export interface SuggestionRecord {
  id: string;
  threadId: string;
  authorId: string;
  authorName: string;
  state: SuggestionState;
  type: SuggestionType;
  createdAt: number;
  updatedAt: number;
}

function createUID(): string {
  return Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '')
    .substring(0, 8);
}

function toSuggestionRecord(map: YMap<unknown>): SuggestionRecord | null {
  const id = map.get('id');
  const threadId = map.get('threadId');
  const authorId = map.get('authorId');
  const authorName = map.get('authorName');
  const state = map.get('state');
  const type = map.get('type');
  const createdAt = map.get('createdAt');
  const updatedAt = map.get('updatedAt');

  if (
    typeof id !== 'string' ||
    typeof threadId !== 'string' ||
    typeof authorId !== 'string' ||
    typeof authorName !== 'string' ||
    (state !== 'open' && state !== 'accepted' && state !== 'rejected') ||
    (type !== 'insert' &&
      type !== 'delete' &&
      type !== 'replace' &&
      type !== 'format' &&
      type !== 'block') ||
    typeof createdAt !== 'number' ||
    typeof updatedAt !== 'number'
  ) {
    return null;
  }

  return {
    id,
    threadId,
    authorId,
    authorName,
    state,
    type,
    createdAt,
    updatedAt,
  };
}

function createSharedSuggestionMap(record: SuggestionRecord): YMap<unknown> {
  const map = new YMap();
  map.set('id', record.id);
  map.set('threadId', record.threadId);
  map.set('authorId', record.authorId);
  map.set('authorName', record.authorName);
  map.set('state', record.state);
  map.set('type', record.type);
  map.set('createdAt', record.createdAt);
  map.set('updatedAt', record.updatedAt);
  return map;
}

export class SuggestionStore {
  _editor: LexicalEditor;
  _suggestions: Map<string, SuggestionRecord>;
  _changeListeners: Set<() => void>;
  _collabProvider: null | Provider;

  constructor(editor: LexicalEditor) {
    this._editor = editor;
    this._suggestions = new Map();
    this._changeListeners = new Set();
    this._collabProvider = null;
  }

  isCollaborative(): boolean {
    return this._collabProvider !== null;
  }

  getSuggestions(): Map<string, SuggestionRecord> {
    return new Map(this._suggestions);
  }

  getSuggestion(id: string): SuggestionRecord | undefined {
    return this._suggestions.get(id);
  }

  createSuggestion(params: Omit<SuggestionRecord, 'id' | 'threadId' | 'createdAt' | 'updatedAt'> & { id?: string; threadId?: string }): SuggestionRecord {
    const id = params.id ?? createUID();
    const threadId = params.threadId ?? id;
    const now = Date.now();
    return {
      id,
      threadId,
      authorId: params.authorId,
      authorName: params.authorName,
      state: params.state,
      type: params.type,
      createdAt: now,
      updatedAt: now,
    };
  }

  addSuggestion(record: SuggestionRecord): void {
    const next = new Map(this._suggestions);
    next.set(record.id, record);
    this._suggestions = next;
    triggerOnChange(this);

    const sharedSuggestions = this._getCollabSuggestions();
    if (this.isCollaborative() && sharedSuggestions) {
      this._withRemoteTransaction(() => {
        sharedSuggestions.set(record.id, createSharedSuggestionMap(record));
      });
    }
  }

  updateSuggestion(id: string, update: Partial<Pick<SuggestionRecord, 'state' | 'updatedAt'>>): void {
    const existing = this._suggestions.get(id);
    if (!existing) return;
    const nextRecord: SuggestionRecord = {
      ...existing,
      ...update,
      updatedAt: update.updatedAt ?? Date.now(),
    };
    const next = new Map(this._suggestions);
    next.set(id, nextRecord);
    this._suggestions = next;
    triggerOnChange(this);

    const sharedSuggestions = this._getCollabSuggestions();
    if (this.isCollaborative() && sharedSuggestions) {
      this._withRemoteTransaction(() => {
        const shared = sharedSuggestions.get(id);
        if (shared instanceof YMap) {
          shared.set('state', nextRecord.state);
          shared.set('updatedAt', nextRecord.updatedAt);
        } else {
          sharedSuggestions.set(id, createSharedSuggestionMap(nextRecord));
        }
      });
    }
  }

  registerOnChange(onChange: () => void): () => void {
    this._changeListeners.add(onChange);
    return () => {
      this._changeListeners.delete(onChange);
    };
  }

  _withRemoteTransaction(fn: () => void): void {
    const provider = this._collabProvider;
    if (provider) {
      // @ts-expect-error doc does exist on provider
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

  _getCollabSuggestions(): YMap<unknown> | null {
    const provider = this._collabProvider;
    if (provider) {
      // @ts-expect-error doc does exist on provider
      const doc = provider.doc;
      return doc.get('suggestions', YMap) as YMap<unknown>;
    }
    return null;
  }

  registerCollaboration(provider: Provider): () => void {
    this._collabProvider = provider;
    const sharedSuggestions = this._getCollabSuggestions();

    const connect = () => {
      void provider.connect();
    };

    const disconnect = () => {
      try {
        provider.disconnect();
      } catch (_e) {
        // ignore
      }
    };

    const unsubscribe = this._editor.registerCommand(
      TOGGLE_CONNECT_COMMAND,
      (payload) => {
        if (payload) {
          // eslint-disable-next-line no-console
          console.log('Suggestions connected!');
          connect();
        } else {
          // eslint-disable-next-line no-console
          console.log('Suggestions disconnected!');
          disconnect();
        }
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );

    if (!sharedSuggestions) {
      return () => null;
    }

    const syncFromShared = () => {
      const next = new Map<string, SuggestionRecord>();
      sharedSuggestions.forEach((value, key) => {
        if (value instanceof YMap && typeof key === 'string') {
          const record = toSuggestionRecord(value);
          if (record) {
            next.set(key, record);
          }
        }
      });
      this._suggestions = next;
      triggerOnChange(this);
    };

    const onSharedSuggestionChanges = (
      // The YJS types explicitly use `any` as well.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      _events: Array<YEvent<any>>,
      transaction: Transaction,
    ) => {
      if (transaction.origin !== this) {
        this._withLocalTransaction(syncFromShared);
      }
    };

    sharedSuggestions.observeDeep(onSharedSuggestionChanges);
    connect();
    syncFromShared();

    return () => {
      sharedSuggestions.unobserveDeep(onSharedSuggestionChanges);
      unsubscribe();
      this._collabProvider = null;
    };
  }
}

function triggerOnChange(store: SuggestionStore): void {
  store._changeListeners.forEach((listener) => listener());
}

export function useSuggestionStore(store: SuggestionStore): Map<string, SuggestionRecord> {
  const [suggestions, setSuggestions] = useState<Map<string, SuggestionRecord>>(
    store.getSuggestions(),
  );

  useEffect(() => {
    return store.registerOnChange(() => {
      setSuggestions(store.getSuggestions());
    });
  }, [store]);

  return suggestions;
}
