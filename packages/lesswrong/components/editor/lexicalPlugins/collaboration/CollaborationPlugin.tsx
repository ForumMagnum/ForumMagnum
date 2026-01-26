"use client";

import React, { useEffect, useCallback, useRef } from 'react';
import { CollaborationPlugin as LexicalCollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';
import { Provider } from '@lexical/yjs';

// Generate a random color for the user's cursor
function getRandomColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export interface CollaborationConfig {
  postId: string;
  token: string;
  wsUrl: string;
  documentName: string;
  user: {
    id: string;
    name: string;
  };
}

interface CollaborationPluginProps {
  config: CollaborationConfig;
  onSynced?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Plugin that enables real-time collaboration using Yjs and Hocuspocus.
 * 
 * This wraps Lexical's CollaborationPlugin with Hocuspocus-specific setup.
 */
export function CollaborationPlugin({ 
  config,
  onSynced, 
  onError 
}: CollaborationPluginProps): React.ReactElement | null {

  // Stable random color for this session
  const cursorColorRef = useRef(getRandomColor());
  
  // Use refs for callbacks to avoid recreating the provider
  const onSyncedRef = useRef(onSynced);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onSyncedRef.current = onSynced;
    onErrorRef.current = onError;
  }, [onSynced, onError]);

  // Store config in ref to use in providerFactory without causing recreations
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Store provider reference for cleanup
  const providerRef = useRef<HocuspocusProvider | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (providerRef.current) {
        providerRef.current.disconnect();
        providerRef.current.destroy();
        providerRef.current = null;
      }
    };
  }, []);

  // Provider factory - called by LexicalCollaborationPlugin
  // This creates the provider with the Y.Doc that Lexical manages
  const providerFactory = useCallback(
    (id: string, yjsDocMap: Map<string, Y.Doc>) => {
      const cfg = configRef.current;
      
      // Get or create the Y.Doc for this document
      let doc = yjsDocMap.get(id);
      if (!doc) {
        doc = new Y.Doc();
        yjsDocMap.set(id, doc);
      }
      
      // eslint-disable-next-line no-console
      console.log('[Collaboration] Creating HocuspocusProvider for:', cfg.documentName);
      
      const provider = new HocuspocusProvider({
        url: cfg.wsUrl,
        name: cfg.documentName,
        document: doc,
        token: cfg.token,
        // Don't connect automatically - Lexical's CollaborationPlugin will call connect()
        // after the binding is set up
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
          onSyncedRef.current?.();
        },
        
        onAuthenticationFailed: ({ reason }) => {
          // eslint-disable-next-line no-console
          console.error('[Collaboration] Authentication failed:', reason);
          onErrorRef.current?.(new Error(`Authentication failed: ${reason}`));
        },
        
        onClose: ({ event }) => {
          // eslint-disable-next-line no-console
          console.log('[Collaboration] Connection closed:', event.reason);
        },
      });
      
      providerRef.current = provider;
      // HocusPocus's provider has a slightly different awareness type - it's both nullable (unfortunate) and also less specific around some user state fields.
      return provider as unknown as Provider;
    },
    []
  );

  const cursorsContainerRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div 
        ref={cursorsContainerRef}
        style={{ position: 'relative' }}
      />
      
      <LexicalCollaborationPlugin
        id={config.documentName}
        providerFactory={providerFactory}
        shouldBootstrap={false}
        username={config.user.name}
        cursorColor={cursorColorRef.current}
        cursorsContainerRef={cursorsContainerRef}
      />
    </>
  );
}

export default CollaborationPlugin;

