/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { createContext, useCallback, useContext } from 'react';
import {Provider} from '@lexical/yjs';
import {HocuspocusProvider} from '@hocuspocus/provider';
import {Doc, encodeStateAsUpdate, XmlText} from 'yjs';
import {IndexeddbPersistence} from 'y-indexeddb';
import { type CollaborativeEditingAccessLevel, accessLevelCan } from '@/lib/collections/posts/collabEditingPermissions';
import { captureException } from '@/lib/sentryWrapper';

/**
 * Removes "orphan" XmlText embeds from the main doc's root — live children of
 * root that have no `__type` attribute and whose own `_map` is empty. These
 * are an artifact of yjs/yjs#534: undoing a tracked cascade-delete of an
 * XmlText whose attribute items had already been tombstoned via an untracked
 * origin. `redoItem` rebuilds the XmlText via `content.copy()`, which for
 * YXmlText returns a fresh empty instance, and the missing attr items never
 * get redone — producing a root embed that Lexical's
 * `$getOrInitCollabNodeFromSharedType` then rejects at load time with
 * "Expected shared type to include type attribute".
 *
 * The orphan carries no recoverable data (no attrs, no children), so removing
 * it is non-destructive; doing so via `root.delete` at the right offset emits
 * a normal Yjs update that propagates to peers and the Hocuspocus server,
 * self-healing the document. Returns the ids of items removed so the caller
 * can log.
 */
function repairOrphanXmlTextsInRoot(doc: Doc): string[] {
  const root = doc.get('root', XmlText);
  const removed: string[] = [];
  doc.transact(() => {
    const delta = root.toDelta();
    // Walk the delta to find orphan embeds and record their offsets. Embeds
    // contribute length 1 to the parent XmlText; string inserts contribute
    // their character length.
    let offset = 0;
    const orphanOffsets: number[] = [];
    for (const entry of delta as Array<{ insert: unknown }>) {
      const ins = entry.insert;
      if (typeof ins === 'string') {
        offset += ins.length;
        continue;
      }
      if (ins instanceof XmlText) {
        const hasType = ins.getAttribute('__type') !== undefined;
        const mapSize = (ins as unknown as { _map: Map<string, unknown> })._map.size;
        // Only remove items matching the exact yjs#534 shape: no __type and
        // no entries in _map (i.e. the fresh `new YXmlText()` from _copy).
        // Anything else might carry recoverable state and deserves inspection.
        if (!hasType && mapSize === 0) {
          orphanOffsets.push(offset);
          const item = (ins as unknown as { _item?: { id: { client: number; clock: number } } })._item;
          if (item) removed.push(`${item.id.client}@${item.id.clock}`);
        }
      }
      offset += 1;
    }
    // Delete from the right so earlier offsets stay valid.
    for (let i = orphanOffsets.length - 1; i >= 0; i--) {
      root.delete(orphanOffsets[i], 1);
    }
  }, 'orphan-repair');
  return removed;
}

export interface CollaborationConfig {
  postId: string;
  fieldName?: string;
  /** Async function that fetches a fresh JWT for Hocuspocus authentication.
   * Called on every WebSocket connection attempt (including reconnections),
   * ensuring the token is always valid at connection time. */
  getToken: () => Promise<string>;
  user: {
    id: string;
    name: string;
  };
  /** Called when sync with the server completes. `docId` is 'main' or a sub-doc id like 'comments'. */
  onSynced?: (doc: Doc, isFirstSync: boolean, docId: string) => void;
  onError?: (error: Error) => void;
  /** Called when WebSocket connection status changes (connected/disconnected/connecting). */
  onConnectionStatusChange?: (connected: boolean) => void;
}

export interface CollaboratorIdentity {
  /** Unique user ID (userId for logged-in users, clientId for anonymous) */
  id: string;
  /** Display name */
  name: string;
  /** Access level for the collaborative document */
  accessLevel: CollaborativeEditingAccessLevel;
}

const CollaboratorIdentityContext = createContext<CollaboratorIdentity | null>(null);

export const CollaboratorIdentityProvider = CollaboratorIdentityContext.Provider;

/**
 * Hook to get the current collaborator's identity.
 * Returns the user ID, name, and access level from the collaboration context.
 * Throws if used outside of a CollaboratorIdentityProvider.
 */
export function useCollaboratorIdentity(): CollaboratorIdentity {
  const identity = useContext(CollaboratorIdentityContext);
  if (!identity) {
    throw new Error('useCollaboratorIdentity must be used within a CollaboratorIdentityProvider');
  }
  return identity;
}

/**
 * Hook to get the current collaborator's ID.
 */
export function useCurrentCollaboratorId(): string {
  return useCollaboratorIdentity().id;
}

/**
 * Hook that returns a function to check if the current user can reject a suggestion.
 * The returned function accepts the suggestion's author ID and returns true if:
 * - The user has "edit" permissions, OR
 * - The user is the author of the suggestion
 */
export function useCanRejectSuggestion(): (suggestionAuthorId: string) => boolean {
  const { id, accessLevel } = useCollaboratorIdentity();
  const canAcceptOrReject = accessLevelCan(accessLevel, "edit");
  
  return useCallback(
    (suggestionAuthorId: string | undefined) => {
      if (canAcceptOrReject) return true;
      const isOwnSuggestion = suggestionAuthorId != null && suggestionAuthorId === id;
      return isOwnSuggestion;
    },
    [canAcceptOrReject, id]
  );
}

// Module-level config storage - set this before rendering the Editor.
// This singleton pattern is necessary because Lexical's CollaborationPlugin
// expects a provider factory function with a fixed signature that can't accept
// additional parameters. The config is set before rendering and accessed by
// the factory function.
let _collaborationConfig: CollaborationConfig | null = null;

export function setCollaborationConfig(config: CollaborationConfig | null): void {
  _collaborationConfig = config;
}

function getCollaborationBaseDocumentName(postId: string, fieldName = 'contents'): string {
  return fieldName === 'contents'
    ? `post-${postId}`
    : `post-${postId}/${fieldName}`;
}

// Track provider and IndexedDB persistence instances so we can clean them up
const providerInstances = new Map<string, HocuspocusProvider>();
const persistenceInstances = new Map<string, IndexeddbPersistence>();

// Version suffix for IndexedDB keys - increment when making breaking changes
// to invalidate stale data from previous versions
const INDEXEDDB_VERSION = 'v1';
const INDEXEDDB_READY_TIMEOUT_MS = 3000;

/**
 * Get the versioned IndexedDB key for a document.
 */
function getIndexedDbKey(documentName: string): string {
  return `${documentName}-${INDEXEDDB_VERSION}`;
}

/**
 * Clean up IndexedDB persistence for a document.
 * Call this when the editor unmounts to prevent memory leaks.
 * Note: This stops syncing but does not clear the stored data.
 */
function cleanupPersistence(documentName: string): void {
  const indexedDbKey = getIndexedDbKey(documentName);
  const persistence = persistenceInstances.get(indexedDbKey);
  if (persistence) {
    void persistence.destroy();
    persistenceInstances.delete(indexedDbKey);
  }
}

/**
 * Sets up IndexedDB persistence for a document.
 * Returns a promise that resolves when persistence is synced (or failed/timed out).
 */
function setupPersistence(
  documentName: string,
  doc: Doc,
  config: CollaborationConfig
): Promise<void> {
  cleanupPersistence(documentName);

  return new Promise<void>((resolve) => {
    const indexedDbKey = getIndexedDbKey(documentName);
    const persistence = new IndexeddbPersistence(indexedDbKey, doc);
    persistenceInstances.set(indexedDbKey, persistence);

    let isComplete = false;
    const complete = () => {
      if (isComplete) return;
      isComplete = true;
      resolve();
    };

    const timeoutId = setTimeout(() => {
      // eslint-disable-next-line no-console
      console.warn('[Collaboration] IndexedDB persistence timed out; continuing without it.');
      config.onError?.(new Error('IndexedDB persistence timed out. Continuing without offline support.'));
      complete();
    }, INDEXEDDB_READY_TIMEOUT_MS);

    persistence.on('synced', () => {
      clearTimeout(timeoutId);
      complete();
    });

    persistence.on('error', (error: Error) => {
      // eslint-disable-next-line no-console
      console.error('[Collaboration] IndexedDB persistence error:', error);
      config.onError?.(new Error('IndexedDB persistence failed. Continuing without offline support.'));
      // Try to clear bad data, then proceed
      void persistence.clearData().finally(() => {
        clearTimeout(timeoutId);
        complete();
      });
    });
  });
}

// parent dom -> child doc
export function createWebsocketProvider(
  id: string,
  yjsDocMap: Map<string, Doc>,
): Provider & HocuspocusProvider {
  let doc = yjsDocMap.get(id);

  if (doc === undefined) {
    doc = new Doc();
    yjsDocMap.set(id, doc);
  } else {
    doc.load();
  }

  return createWebsocketProviderWithDoc(id, doc);
}

export function createWebsocketProviderWithDoc(id: string, doc: Doc): Provider & HocuspocusProvider {
  const config = _collaborationConfig;

  if (!config) {
    throw new Error('[Collaboration] No collaboration config set. Call setCollaborationConfig() before using collaboration features.');
  }

  const wsUrl = process.env.NEXT_PUBLIC_HOCUSPOCUS_URL;
  if (!wsUrl) {
    throw new Error('[Collaboration] HOCUSPOCUS_URL is not configured. Set the HOCUSPOCUS_URL environment variable at build time.');
  }

  // Document names follow the pattern "post-{postId}" for the main contents
  // editor, "post-{postId}/{fieldName}" for other editable post fields, or
  // append a further "/{subDocId}" suffix for nested collaboration docs.
  const baseDocumentName = getCollaborationBaseDocumentName(
    config.postId,
    config.fieldName,
  );
  const documentName = id === 'main' ? baseDocumentName : `${baseDocumentName}/${id}`;

  // Initialize persistence if needed.
  // For 'main', we wait for IndexedDB to sync (or fail) before connecting.
  // For others, we proceed immediately.
  const readyPromise = id === 'main'
    ? setupPersistence(documentName, doc, config)
    : Promise.resolve();

  // Track whether this is the first sync (for bootstrap detection)
  let hasReceivedFirstSync = false;

  const provider = new HocuspocusProvider({
    url: wsUrl,
    name: documentName,
    document: doc,
    token: config.getToken,
    // Don't connect automatically - we'll connect after IndexedDB syncs
    connect: false,

    onSynced: () => {
      const isFirstSync = !hasReceivedFirstSync;
      hasReceivedFirstSync = true;
      // Repair yjs#534 orphan XmlTexts before handing the doc off to Lexical.
      // No-op on healthy docs; fixes broken docs in place and syncs the
      // repair back to the server / peers.
      if (id === 'main') {
        try {
          const removed = repairOrphanXmlTextsInRoot(doc);
          if (removed.length > 0) {
            const errorMessage = `[Collaboration] Repaired ${removed.length} orphan XmlText(s) in post ${config.postId}: ${removed.join(', ')}`;
            // eslint-disable-next-line no-console
            console.warn(errorMessage);
            captureException(new Error(errorMessage));
          }
        } catch (e) {
          // Guard against unexpected throws from Yjs so a failed repair can't
          // prevent config.onSynced below from running (that callback drives
          // Lexical's bootstrap + first-sync tracking).
          // eslint-disable-next-line no-console
          console.error('[Collaboration] repairOrphanXmlTextsInRoot threw:', e);
          captureException(e instanceof Error ? e : new Error(String(e)));
        }
      }
      config.onSynced?.(doc, isFirstSync, id);
    },

    onAuthenticationFailed: ({ reason }) => {
      // eslint-disable-next-line no-console
      console.error('[Collaboration] Authentication failed:', reason);
      config.onError?.(new Error(`Authentication failed: ${reason}`));
    },

    onStatus: ({ status }) => {
      config.onConnectionStatusChange?.(status === 'connected');
    },
  });

  // Create a wrapper that delays connect() until IndexedDB is ready.
  // This ensures local offline changes are loaded before we sync with the server,
  // so the bootstrap check sees any locally-persisted content.
  const originalConnect = provider.connect.bind(provider);
  
  provider.connect = async () => {
    await readyPromise;
    await originalConnect();
  };

  // Track the provider so we can disconnect it during restores
  providerInstances.set(documentName, provider);

  // HocuspocusProvider uses 'document' property, but Lexical's code expects 'doc'
  (provider as AnyBecauseHard).doc = provider.document;

  // HocuspocusProvider is compatible with Lexical's Provider at runtime,
  // but has slightly different awareness typing (Awareness | null vs Awareness)
  return provider as Provider & HocuspocusProvider;
}

/**
 * Disconnect all Hocuspocus providers and clear IndexedDB persistence
 * for the given post. Call this before a restore operation to prevent
 * the client's old Yjs state from being synced back to the server
 * when it auto-reconnects.
 */
export async function disconnectCollaborationForPost(postId: string): Promise<void> {
  const baseDocumentName = `post-${postId}`;

  // Disconnect all providers whose document name starts with this post's prefix
  // (covers the main editor and any sub-documents like comments)
  for (const [documentName, provider] of providerInstances) {
    if (documentName === baseDocumentName || documentName.startsWith(`${baseDocumentName}/`)) {
      provider.configuration.preserveConnection = false;
      provider.destroy();
      providerInstances.delete(documentName);
    }
  }

  // Clear IndexedDB persistence to prevent stale state from being loaded on page reload
  for (const [indexedDbKey, persistence] of persistenceInstances) {
    if (indexedDbKey.startsWith(baseDocumentName)) {
      await persistence.clearData();
      await persistence.destroy();
      persistenceInstances.delete(indexedDbKey);
    }
  }
}

/**
 * Get the current Yjs state for a post's main document as a base64 string.
 * Returns null if no active provider exists (e.g., non-collaborative editor).
 *
 * Used by the client-side save flow to include the Yjs snapshot in
 * originalContents so that revisions created by updatePost (manual save,
 * publish, etc.) also have a restorable Yjs state.
 */
export function getYjsStateBase64ForPost(postId: string, fieldName = 'contents'): string | null {
  const provider = providerInstances.get(getCollaborationBaseDocumentName(postId, fieldName));
  if (!provider) return null;

  const doc = provider.document;
  const state = encodeStateAsUpdate(doc);
  // Browser-safe base64 encoding (btoa operates on binary strings)
  let binaryStr = '';
  for (let i = 0; i < state.length; i++) {
    binaryStr += String.fromCharCode(state[i]);
  }
  return btoa(binaryStr);
}
