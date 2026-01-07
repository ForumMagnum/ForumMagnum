/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {Provider} from '@lexical/yjs';
import {HocuspocusProvider} from '@hocuspocus/provider';
import {Doc} from 'yjs';

export interface CollaborationConfig {
  postId: string;
  token: string;
  wsUrl: string;
  documentName: string;
  user: {
    id: string;
    name: string;
  };
  onSynced?: () => void;
  onError?: (error: Error) => void;
}

// Module-level config storage - set this before rendering the Editor
let _collaborationConfig: CollaborationConfig | null = null;

export function setCollaborationConfig(config: CollaborationConfig | null): void {
  _collaborationConfig = config;
}

export function getCollaborationConfig(): CollaborationConfig | null {
  return _collaborationConfig;
}

// parent dom -> child doc
export function createWebsocketProvider(
  id: string,
  yjsDocMap: Map<string, Doc>,
): Provider {
  let doc = yjsDocMap.get(id);

  if (doc === undefined) {
    doc = new Doc();
    yjsDocMap.set(id, doc);
  } else {
    doc.load();
  }

  return createWebsocketProviderWithDoc(id, doc);
}

export function createWebsocketProviderWithDoc(id: string, doc: Doc): Provider {
  const config = _collaborationConfig;
  
  if (!config) {
    throw new Error('[Collaboration] No collaboration config set. Call setCollaborationConfig() before using collaboration features.');
  }
  
  // eslint-disable-next-line no-console
  console.log('[Collaboration] Creating HocuspocusProvider for:', config.documentName);
  
  const provider = new HocuspocusProvider({
    url: config.wsUrl,
    name: config.documentName,
    document: doc,
    token: config.token,
    // Don't connect automatically - Lexical's CollaborationPlugin will call connect()
    connect: false,
    
    onConnect: () => {
      // eslint-disable-next-line no-console
      console.log('[Collaboration] Connected to Hocuspocus');
    },
    
    onDisconnect: ({ event: { code, reason } }) => {
      // eslint-disable-next-line no-console
      console.log('[Collaboration] Disconnected from Hocuspocus', code, reason);
    },
    
    onSynced: () => {
      config.onSynced?.();
    },
    
    onAuthenticationFailed: ({ reason }) => {
      // eslint-disable-next-line no-console
      console.error('[Collaboration] Authentication failed:', reason);
      config.onError?.(new Error(`Authentication failed: ${reason}`));
    },
    
    onClose: ({ event }) => {
      // eslint-disable-next-line no-console
      console.log('[Collaboration] Connection closed:', event.reason);
    },
  });
  
  // HocuspocusProvider uses 'document' property, but Lexical's code expects 'doc'
  (provider as AnyBecauseHard).doc = provider.document;
  
  // HocuspocusProvider is compatible with Lexical's Provider at runtime,
  // but has slightly different awareness typing (Awareness | null vs Awareness)
  return provider as unknown as Provider;
}
