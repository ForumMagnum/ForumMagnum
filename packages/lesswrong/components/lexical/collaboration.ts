/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {Provider} from '@lexical/yjs';
import {HocuspocusProvider} from '@hocuspocus/provider';
import {Doc, XmlFragment, XmlText, encodeStateAsUpdate, encodeStateVector} from 'yjs';
import { getFmE2eDebug } from "@/lib/e2e/fmE2eDebug";

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
  const e2e = getFmE2eDebug();
  e2e?.push("collab.config.set", {
    hasConfig: !!config,
    documentName: config?.documentName,
    wsUrl: config?.wsUrl,
    userId: config?.user?.id,
  });
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
  const e2e = getFmE2eDebug();

  if (doc === undefined) {
    doc = new Doc();
    yjsDocMap.set(id, doc);
  } else {
    doc.load();
  }

  e2e?.push("collab.providerFactory.called", { id });
  return createWebsocketProviderWithDoc(id, doc);
}

export function createWebsocketProviderWithDoc(id: string, doc: Doc): Provider {
  const config = _collaborationConfig;
  const e2e = getFmE2eDebug();
  
  if (!config) {
    throw new Error('[Collaboration] No collaboration config set. Call setCollaborationConfig() before using collaboration features.');
  }
  
  // For nested editors (captions, etc.), use a unique document name to avoid conflicts.
  // The main editor typically uses 'main' as the id.
  const documentName = id === 'main' ? config.documentName : `${config.documentName}/${id}`;
  
  // eslint-disable-next-line no-console
  console.log('[Collaboration] Creating HocuspocusProvider for:', documentName);
  e2e?.push("collab.provider.create", { id, documentName, wsUrl: config.wsUrl });

  // E2E-only: instrument Yjs doc updates/transactions so we can correlate UndoManager behavior
  // with Lexical "historic" updates.
  if (e2e && !(doc as AnyBecauseHard).__fmE2eInstrumented) {
    (doc as AnyBecauseHard).__fmE2eInstrumented = true;
    const safeCtorName = (obj: unknown) => {
      if (!obj || typeof obj !== "object") return typeof obj;
      return (obj as AnyBecauseHard).constructor?.name ?? "object";
    };
    const toBase64 = (bytes: Uint8Array): string | null => {
      try {
        // Browser path
        if (typeof btoa === "function") {
          let binary = "";
          const chunkSize = 0x8000;
          for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.subarray(i, i + chunkSize);
            binary += String.fromCharCode(...chunk);
          }
          return btoa(binary);
        }
        // Node/SSR path
        const B = (globalThis as AnyBecauseHard).Buffer as typeof Buffer | undefined;
        if (B) return B.from(bytes).toString("base64");
      } catch {
        // ignore
      }
      return null;
    };
    doc.on("update", (update: Uint8Array, origin: unknown) => {
      const originType = safeCtorName(origin);
      e2e.push("yjs.doc.update", {
        id,
        documentName,
        len: update?.byteLength ?? null,
        originType,
        // For debugging historic corruption: capture the full update bytes for UndoManager updates on main doc.
        // This lets us reproduce the issue in a standalone unit test with only lexical+yjs imports.
        updateBase64: id === "main" && originType === "UndoManager" ? toBase64(update) : null,
      });
    });
    doc.on("afterTransaction", (txn: AnyBecauseHard) => {
      const originType = safeCtorName(txn?.origin);
      const local = !!txn?.local;
      e2e.push("yjs.doc.afterTransaction", {
        id,
        documentName,
        local,
        originType,
      });

      // E2E-only: capture a full state update for the main doc when it looks like the plain "hello"
      // post-reject state. This gives us the missing precondition (tombstones included) needed to
      // reproduce the corruption from an UndoManager update in a standalone unit test.
      if (id === 'main' && local && originType.toLowerCase() === 'object') {
        try {
          const rootText = String(doc.get('root', XmlText).toString());
          const stateUpdate = encodeStateAsUpdate(doc);
          e2e.push('yjs.doc.stateUpdate.objectTxn', {
            id,
            documentName,
            originType,
            local,
            rootTextPreview: rootText.slice(0, 200),
            stateUpdateLen: stateUpdate.byteLength,
            stateUpdateBase64: toBase64(stateUpdate),
          });
        } catch {
          // ignore
        }
      }

      // Snapshot doc state for main doc around interesting origins (UndoManager / provider sync).
      // This is the key discriminator for whether corruption exists inside Yjs vs in Lexical binding.
      const now = Date.now();
      if (id === 'main' && originType === 'UndoManager') {
        (doc as AnyBecauseHard).__fmLastUndoAt = now;
      }
      const lastUndoAt = (doc as AnyBecauseHard).__fmLastUndoAt as number | undefined;
      const isPostUndoObjectTxn = originType === 'Object' && local && !!lastUndoAt && (now - lastUndoAt) < 250;

      const shouldSnapshot =
        id === 'main' && (originType === 'UndoManager' || originType === 'HocuspocusProvider' || isPostUndoObjectTxn);
      if (shouldSnapshot) {
        let rootPreview: string | null = null;
        let rootLen: number | null = null;
        let rootKey: string | null = null;
        let rootToStringError: string | null = null;
        let rootJsonPreview: string | null = null;
        let rootJsonLen: number | null = null;
        let jsonPreview: string | null = null;
        let jsonLen: number | null = null;
        let shareSummary: Array<{ key: string; type: string }> | null = null;
        let primarySharedTextKey: string | null = null;
        let primarySharedTextType: string | null = null;
        let primarySharedTextLen: number | null = null;
        let primarySharedTextPreview: string | null = null;
        let rootDeltaSummary: Array<{
          insertType: string;
          textLen?: number;
          textPreview?: string;
          objectKeys?: string[];
          collabNodeType?: string;
          collabNodeKeys?: string[];
          collabNodeChildrenLen?: number;
          collabNodeXmlTextLen?: number;
          collabNodeXmlTextPreview?: string;
          collabNodeXmlTextDeltaSummary?: Array<{
            insertType: string;
            textLen?: number;
            textPreview?: string;
            objectKeys?: string[];
          }>;
        }> | null = null;
        try {
          // Lexical's yjs binding uses an XmlFragment in the doc. The name is typically "root",
          // but in case it changes, probe a few likely keys.
          const keys = ['root', 'lexical', 'content', 'default'];
          let best: { key: string; s: string } | null = null;
          for (const k of keys) {
            try {
              const frag = doc.getXmlFragment(k);
              const s = String(frag.toString());
              if (!best || s.length > best.s.length) {
                best = { key: k, s };
              }
            } catch {
              // ignore per-key
            }
          }
          if (best) {
            rootKey = best.key;
            rootLen = best.s.length;
            rootPreview = best.s.slice(0, 400);
          }
        } catch {
          // ignore
        }
        try {
          const rootFrag = doc.getXmlFragment('root');
          try {
            // Sometimes Yjs Xml toString can throw in weird states; capture the error text if so.
            const s = String(rootFrag.toString());
            // Prefer this if it works.
            rootKey = rootKey ?? 'root';
            rootLen = rootLen ?? s.length;
            rootPreview = rootPreview ?? s.slice(0, 400);
          } catch (e) {
            rootToStringError = String((e as AnyBecauseHard)?.message ?? e);
          }
          const rootJson = rootFrag.toJSON();
          const s = JSON.stringify(rootJson);
          rootJsonLen = s.length;
          rootJsonPreview = s.slice(0, 400);
        } catch {
          // ignore
        }
        try {
          const json = doc.toJSON();
          const s = JSON.stringify(json);
          jsonLen = s.length;
          jsonPreview = s.slice(0, 400);
        } catch {
          // ignore
        }
        try {
          const share = (doc as AnyBecauseHard).share as Map<string, unknown> | undefined;
          if (share) {
            const summary: Array<{ key: string; type: string }> = [];
            const textCandidates: Array<{ key: string; type: string; s: string }> = [];
            for (const [key, value] of share.entries()) {
              const type = (value as AnyBecauseHard)?.constructor?.name ?? typeof value;
              if (summary.length < 20) {
                summary.push({ key, type });
              }
              // Try to find a shared type whose toString contains the most content.
              if (typeof (value as AnyBecauseHard)?.toString === 'function') {
                try {
                  const s = String((value as AnyBecauseHard).toString());
                  if (s.length > 0) {
                    textCandidates.push({ key, type, s });
                  }
                } catch {
                  // ignore
                }
              }
            }
            shareSummary = summary;
            if (textCandidates.length) {
              textCandidates.sort((a, b) => b.s.length - a.s.length);
              const best = textCandidates[0];
              primarySharedTextKey = best.key;
              primarySharedTextType = best.type;
              primarySharedTextLen = best.s.length;
              primarySharedTextPreview = best.s.slice(0, 400);
            }

            // If the "root" shared type is a YXmlText (as expected), capture its delta.
            try {
              const rootShared = share.get('root') as AnyBecauseHard;
              const delta = rootShared?.toDelta?.();
              if (Array.isArray(delta)) {
                const summarized: Array<{
                  insertType: string;
                  textLen?: number;
                  textPreview?: string;
                  objectKeys?: string[];
                  collabNodeType?: string;
                  collabNodeKeys?: string[];
                  collabNodeChildrenLen?: number;
                  collabNodeXmlTextLen?: number;
                  collabNodeXmlTextPreview?: string;
                  collabNodeXmlTextDeltaSummary?: Array<{
                    insertType: string;
                    textLen?: number;
                    textPreview?: string;
                    objectKeys?: string[];
                  }>;
                }> = [];
                for (const op of delta) {
                  if (summarized.length >= 25) break;
                  const ins = (op as AnyBecauseHard)?.insert;
                  if (typeof ins === 'string') {
                    summarized.push({
                      insertType: 'string',
                      textLen: ins.length,
                      textPreview: ins.slice(0, 120),
                    });
                  } else if (ins && typeof ins === 'object') {
                    const collabNode = (ins as AnyBecauseHard)?._collabNode as AnyBecauseHard | undefined;
                    let collabNodeXmlTextPreview: string | undefined;
                    let collabNodeXmlTextLen: number | undefined;
                    let collabNodeChildrenLen: number | undefined;
                    let collabNodeXmlTextDeltaSummary:
                      | Array<{ insertType: string; textLen?: number; textPreview?: string; objectKeys?: string[] }>
                      | undefined;
                    try {
                      const children = collabNode?._children as unknown[] | undefined;
                      if (Array.isArray(children)) {
                        collabNodeChildrenLen = children.length;
                      }
                      const xmlText = collabNode?._xmlText as AnyBecauseHard;
                      if (xmlText && typeof xmlText.toString === 'function') {
                        const s = String(xmlText.toString());
                        collabNodeXmlTextLen = s.length;
                        collabNodeXmlTextPreview = s.slice(0, 200);
                      }
                      const xmlDelta = xmlText?.toDelta?.();
                      if (Array.isArray(xmlDelta)) {
                        const summarizedDelta: Array<{
                          insertType: string;
                          textLen?: number;
                          textPreview?: string;
                          objectKeys?: string[];
                        }> = [];
                        for (const d of xmlDelta) {
                          if (summarizedDelta.length >= 30) break;
                          const dIns = (d as AnyBecauseHard)?.insert;
                          if (typeof dIns === 'string') {
                            summarizedDelta.push({
                              insertType: 'string',
                              textLen: dIns.length,
                              textPreview: dIns.slice(0, 120),
                            });
                          } else if (dIns && typeof dIns === 'object') {
                            summarizedDelta.push({
                              insertType: 'object',
                              objectKeys: Object.keys(dIns).slice(0, 12),
                            });
                          } else {
                            summarizedDelta.push({ insertType: typeof dIns });
                          }
                        }
                        collabNodeXmlTextDeltaSummary = summarizedDelta;
                      }
                    } catch {
                      // ignore
                    }
                    summarized.push({
                      insertType: 'object',
                      objectKeys: Object.keys(ins).slice(0, 12),
                      collabNodeType:
                        collabNode && typeof collabNode === 'object'
                          ? (collabNode.type ?? collabNode.__type ?? collabNode.nodeType ?? collabNode._type ?? null)
                          : null,
                      collabNodeKeys:
                        collabNode && typeof collabNode === 'object' ? Object.keys(collabNode).slice(0, 20) : undefined,
                      collabNodeChildrenLen,
                      collabNodeXmlTextLen,
                      collabNodeXmlTextPreview,
                      collabNodeXmlTextDeltaSummary,
                    });
                  } else {
                    summarized.push({ insertType: typeof ins });
                  }
                }
                rootDeltaSummary = summarized;
              }
            } catch {
              // ignore
            }
          }
        } catch {
          // ignore
        }
        const stateVector = encodeStateVector(doc);
        const stateUpdate = encodeStateAsUpdate(doc);
        e2e.push('yjs.doc.snapshot', {
          id,
          documentName,
          local,
          originType,
          reason: isPostUndoObjectTxn ? 'postUndoObjectTxn' : originType,
          stateVectorLen: stateVector.byteLength,
          stateUpdateLen: stateUpdate.byteLength,
          // For reproducing binding corruption in a standalone unit test, capture the full state update bytes
          // around UndoManager actions on the main doc. (This includes tombstones that UndoManager reactivates.)
          stateUpdateBase64: id === 'main' && (originType === 'UndoManager' || isPostUndoObjectTxn) ? toBase64(stateUpdate) : null,
          rootKey,
          rootLen,
          rootPreview,
          rootToStringError,
          rootJsonLen,
          rootJsonPreview,
          jsonLen,
          jsonPreview,
          shareSummary,
          primarySharedTextKey,
          primarySharedTextType,
          primarySharedTextLen,
          primarySharedTextPreview,
          rootDeltaSummary,
        });
      }
    });
  }
  
  const provider = new HocuspocusProvider({
    url: config.wsUrl,
    name: documentName,
    document: doc,
    token: config.token,
    // Don't connect automatically - Lexical's CollaborationPlugin will call connect()
    connect: false,
    
    onConnect: () => {
      // eslint-disable-next-line no-console
      console.log(`[Collaboration] Connected to ${documentName}`);
      e2e?.push("collab.provider.connect", { documentName });
    },
    
    onDisconnect: ({ event: { code, reason } }) => {
      // eslint-disable-next-line no-console
      console.log('[Collaboration] Disconnected from Hocuspocus', documentName, code, reason);
      e2e?.push("collab.provider.disconnect", { documentName, code, reason });
    },
    
    onSynced: () => {
      e2e?.push("collab.provider.synced", { documentName });
      config.onSynced?.();
    },
    
    onAuthenticationFailed: ({ reason }) => {
      // eslint-disable-next-line no-console
      console.error('[Collaboration] Authentication failed:', reason);
      e2e?.push("collab.provider.authFailed", { documentName, reason });
      config.onError?.(new Error(`Authentication failed: ${reason}`));
    },
    
    onClose: ({ event }) => {
      // eslint-disable-next-line no-console
      console.log('[Collaboration] Connection closed:', event.reason);
      e2e?.push("collab.provider.close", { documentName, reason: event.reason });
    },
  });
  
  // HocuspocusProvider uses 'document' property, but Lexical's code expects 'doc'
  (provider as AnyBecauseHard).doc = provider.document;
  
  // HocuspocusProvider is compatible with Lexical's Provider at runtime,
  // but has slightly different awareness typing (Awareness | null vs Awareness)
  return provider as unknown as Provider;
}
