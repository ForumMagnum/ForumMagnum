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
import {Doc} from 'yjs';
import {IndexeddbPersistence} from 'y-indexeddb';
import { type CollaborativeEditingAccessLevel, accessLevelCan } from '@/lib/collections/posts/collabEditingPermissions';

export interface CollaborationConfig {
  postId: string;
  /** Async function that fetches a fresh JWT for Hocuspocus authentication.
   * Called on every WebSocket connection attempt (including reconnections),
   * ensuring the token is always valid at connection time. */
  getToken: () => Promise<string>;
  user: {
    id: string;
    name: string;
  };
  /** Called when the initial sync with the server completes. Receives the Y.Doc for bootstrap detection. */
  onSynced?: (doc: Doc, isFirstSync: boolean) => void;
  onError?: (error: Error) => void;
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

// Track IndexedDB persistence instances so we can clean them up
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

  // Document names follow the pattern "post-{postId}" for the main editor,
  // or "post-{postId}/{subDocId}" for nested editors (captions, etc.).
  const baseDocumentName = `post-${config.postId}`;
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
      config.onSynced?.(doc, isFirstSync);
    },

    onAuthenticationFailed: ({ reason }) => {
      // eslint-disable-next-line no-console
      console.error('[Collaboration] Authentication failed:', reason);
      config.onError?.(new Error(`Authentication failed: ${reason}`));
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

  // HocuspocusProvider uses 'document' property, but Lexical's code expects 'doc'
  (provider as AnyBecauseHard).doc = provider.document;

  // HocuspocusProvider is compatible with Lexical's Provider at runtime,
  // but has slightly different awareness typing (Awareness | null vs Awareness)
  return provider as Provider & HocuspocusProvider;
}
