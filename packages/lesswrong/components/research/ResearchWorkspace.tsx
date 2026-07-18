"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import qs from 'qs';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { useMutation } from '@apollo/client/react';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import { useCurrentUser } from '../common/withUser';
import { userIsAdmin } from '@/lib/vulcan-users/permissions';
import { useLocation, useNavigate } from '../../lib/routeUtil';
import ErrorAccessDenied from '../common/ErrorAccessDenied';
import ForumIcon from '../common/ForumIcon';
import ProjectSidebar from './ProjectSidebar';
import DocumentPane from './DocumentPane';
import { ConversationChatView } from './ConversationChatView';
import { SandboxFileViewer } from './SandboxFileViewer';
import { useMarkConversationRead } from './hooks/useMarkConversationRead';
import { ProjectSidebarQuery } from './projectSidebarQuery';
import {
  ResearchWorkspaceProvider,
  type ResearchEditorIntent,
  type ConversationFocusRequest,
  type ResearchChatSurfaceState,
  type SandboxFileView,
  type ResearchWorkspaceApi,
} from './researchWorkspaceContext';
import {
  researchResizeHandle,
  researchResizeHandleActive,
  researchWarmAlpha,
  researchCanvas,
  researchUiSans,
  researchRadius,
} from './researchStyleUtils';

interface ResearchWorkspaceProps {
  projectId: string;
}

const SIDEBAR_WIDTH_STORAGE_KEY = 'researchSidebarWidth';
const SIDEBAR_MIN_WIDTH = 180;
const SIDEBAR_MAX_WIDTH = 440;
const SIDEBAR_DEFAULT_WIDTH = 250;
const SIDEBAR_COLLAPSED_WIDTH = 37;

const CHAT_PANEL_WIDTH_STORAGE_KEY = 'researchChatPanelWidth';
const CHAT_PANEL_MIN_WIDTH = 320;
const CHAT_PANEL_MAX_WIDTH = 720;
const CHAT_PANEL_DEFAULT_WIDTH = 420;

const FirstDocumentQuery = gql(`
  query ResearchWorkspaceFirstDocument($projectId: String!) {
    researchDocuments(selector: { byProject: { projectId: $projectId } }, limit: 1) {
      results { _id }
    }
  }
`);

const EnsureScratchDocumentMutation = gql(`
  mutation EnsureResearchScratchDocument($projectId: String!) {
    ensureResearchScratchDocument(projectId: $projectId) {
      documentId
    }
  }
`);

const styles = defineStyles('ResearchWorkspace', (theme: ThemeType) => ({
  outer: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
    background: researchCanvas(theme),
    fontFamily: researchUiSans,
  },
  root: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
    minHeight: 0,
  },
  sidebar: {
    position: 'relative',
    flex: 'none',
    minHeight: 0,
    overflow: 'hidden',
    borderRight: `1px solid ${researchWarmAlpha(0.08)}`,
  },
  sidebarCollapsed: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 8,
    gap: 8,
  },
  resizeHandle: {
    ...researchResizeHandle(theme),
    right: -5,
  },
  resizeHandleActive: researchResizeHandleActive(theme),
  iconButton: {
    width: 26,
    height: 26,
    border: 'none',
    borderRadius: researchRadius.xs,
    background: 'transparent',
    color: theme.palette.text.dim,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    '&:hover': {
      background: researchWarmAlpha(0.06),
      color: theme.palette.text.primary,
    },
  },
  icon: {
    '--icon-size': '15px',
  },
  document: {
    position: 'relative',
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    minHeight: 0,
    background: researchCanvas(theme),
  },
  chatPanel: {
    position: 'relative',
    flex: 'none',
    minHeight: 0,
    overflow: 'hidden',
    borderLeft: `1px solid ${researchWarmAlpha(0.08)}`,
  },
  chatPanelResizeHandle: {
    ...researchResizeHandle(theme),
    left: -5,
  },
  fullscreenChat: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    background: researchCanvas(theme),
    display: 'flex',
    flexDirection: 'column',
  },
}));

function readStoredWidth(storageKey: string, minWidth: number, maxWidth: number, defaultWidth: number): number {
  if (typeof window === 'undefined') return defaultWidth;
  const raw = window.localStorage.getItem(storageKey);
  const parsed = raw ? parseInt(raw, 10) : NaN;
  if (Number.isNaN(parsed)) return defaultWidth;
  return Math.min(maxWidth, Math.max(minWidth, parsed));
}

/**
 * Research workspace shell: a hidden-site-header, full-viewport, IDE-style
 * layout — resizable ProjectSidebar | DocumentPane. Conversations live inline
 * in documents as AgentBlocks; the shell coordinates "open conversation X" by
 * switching to its host document and raising a focus request that the block
 * answers (see researchWorkspaceContext.tsx). On request (an explicit button
 * click on a block or a sidebar row), a conversation can additionally open in
 * a resizable right chat panel, or in a fullscreen classic-LLM-chat overlay.
 */
const ResearchWorkspace = ({ projectId }: ResearchWorkspaceProps) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();
  // Held in refs so URL-write helpers below can be useCallback'd with no deps —
  // otherwise they'd churn whenever this component re-renders, cascading new
  // identities through `researchNavigationContext` and forcing every mention
  // chip in the editor to tear down and re-register its Lexical commands.
  const locationRef = useRef(location);
  locationRef.current = location;
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  // documentId lives in state, not in the URL during render: initializing it
  // in useEffect avoids mounting the Lexical editor during SSR / first
  // hydration, which trips a collaboration-config init race inside Editor.tsx.
  // URL changes go through navigate({skipRouter:true}) so doc switching is
  // one React state update rather than a full Next route re-render.
  const [activeDocumentId, setActiveDocumentIdState] = useState<string | null>(null);
  const [hasReadDocumentIdFromUrl, setHasReadDocumentIdFromUrl] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH);
  const [resizing, setResizing] = useState(false);
  const [chatSurface, setChatSurface] = useState<ResearchChatSurfaceState | null>(null);
  const [chatPanelWidth, setChatPanelWidth] = useState(CHAT_PANEL_DEFAULT_WIDTH);
  const [chatPanelResizing, setChatPanelResizing] = useState(false);
  const [sandboxFileView, setSandboxFileView] = useState<SandboxFileView | null>(null);

  const [editorIntent, setEditorIntent] = useState<ResearchEditorIntent | null>(null);
  const [conversationFocusRequest, setConversationFocusRequest] = useState<ConversationFocusRequest | null>(null);
  const intentNonceRef = useRef(0);

  useEffect(() => {
    setSidebarWidth(readStoredWidth(SIDEBAR_WIDTH_STORAGE_KEY, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH, SIDEBAR_DEFAULT_WIDTH));
    setChatPanelWidth(readStoredWidth(CHAT_PANEL_WIDTH_STORAGE_KEY, CHAT_PANEL_MIN_WIDTH, CHAT_PANEL_MAX_WIDTH, CHAT_PANEL_DEFAULT_WIDTH));
  }, []);

  useEffect(() => {
    const readDocIdFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      setActiveDocumentIdState(params.get('documentId'));
      setHasReadDocumentIdFromUrl(true);
    };
    readDocIdFromUrl();
    window.addEventListener('popstate', readDocIdFromUrl);
    return () => window.removeEventListener('popstate', readDocIdFromUrl);
  }, []);

  const { data: firstDocData } = useQuery(FirstDocumentQuery, {
    variables: { projectId },
    skip: !!activeDocumentId,
    fetchPolicy: 'cache-and-network',
  });

  const { data: sidebarData } = useQuery(ProjectSidebarQuery, {
    variables: { projectId },
    fetchPolicy: 'cache-first',
  });

  const [ensureScratchDocument] = useMutation(EnsureScratchDocumentMutation, {
    refetchQueries: [ProjectSidebarQuery],
  });

  useEffect(() => {
    const firstDocId = firstDocData?.researchDocuments?.results?.[0]?._id;
    // The first-document query can already be cached from SSR. Wait for the
    // URL read to commit so its documentId cannot be overwritten during the
    // same mount-effect flush.
    if (hasReadDocumentIdFromUrl && !activeDocumentId && firstDocId) {
      setActiveDocumentIdState(firstDocId);
      const currentLocation = locationRef.current;
      const newQuery = { ...currentLocation.query, documentId: firstDocId };
      navigateRef.current({ ...currentLocation.location, search: `?${qs.stringify(newQuery)}` }, { skipRouter: true, replace: true });
    }
  }, [activeDocumentId, firstDocData, hasReadDocumentIdFromUrl]);

  const setActiveDocumentId = useCallback((documentId: string) => {
    setActiveDocumentIdState(documentId);
    const currentLocation = locationRef.current;
    const newQuery = { ...currentLocation.query, documentId };
    navigateRef.current({ ...currentLocation.location, search: `?${qs.stringify(newQuery)}` }, { skipRouter: true });
  }, []);

  const conversationsRef = useRef(sidebarData?.researchConversations?.results);
  conversationsRef.current = sidebarData?.researchConversations?.results;

  const clearEditorIntent = useCallback((nonce: number) => {
    setEditorIntent((prev) => (prev && prev.nonce === nonce ? null : prev));
  }, []);

  const requestConversationFocus = useCallback((conversationId: string) => {
    intentNonceRef.current += 1;
    setConversationFocusRequest({ conversationId, nonce: intentNonceRef.current });
  }, []);

  const ackConversationFocus = useCallback((nonce: number) => {
    setConversationFocusRequest((prev) => (prev && prev.nonce === nonce ? null : prev));
  }, []);

  const markConversationRead = useMarkConversationRead();

  const openConversation = useCallback((conversationId: string) => {
    markConversationRead(conversationId);
    const conversation = conversationsRef.current?.find((c) => c._id === conversationId);
    const entrypointDocumentId =
      conversation?.entrypointKind === 'document' ? conversation?.entrypointDocumentId ?? null : null;
    if (!entrypointDocumentId) {
      setChatSurface({ conversationId, fullscreen: false });
      return;
    }
    setActiveDocumentId(entrypointDocumentId);
    intentNonceRef.current += 1;
    setEditorIntent({
      kind: 'focus-conversation',
      conversationId,
      nonce: intentNonceRef.current,
    });
  }, [setActiveDocumentId, markConversationRead]);

  const startNewConversation = useCallback(async () => {
    const result = await ensureScratchDocument({ variables: { projectId } });
    const scratchId = result.data?.ensureResearchScratchDocument?.documentId;
    if (!scratchId) return;
    setActiveDocumentId(scratchId);
    intentNonceRef.current += 1;
    setEditorIntent({ kind: 'insert-query', nonce: intentNonceRef.current });
  }, [ensureScratchDocument, projectId, setActiveDocumentId]);

  const openConversationChat = useCallback((conversationId: string, opts?: { fullscreen?: boolean }) => {
    markConversationRead(conversationId);
    setChatSurface({ conversationId, fullscreen: opts?.fullscreen ?? false });
  }, [markConversationRead]);

  const closeConversationChat = useCallback(() => {
    setChatSurface(null);
  }, []);

  const setChatFullscreen = useCallback((fullscreen: boolean) => {
    setChatSurface((prev) => (prev ? { ...prev, fullscreen } : prev));
  }, []);

  const openChatConversationInDocument = useCallback((conversationId: string) => {
    setChatSurface(null);
    void openConversation(conversationId);
  }, [openConversation]);

  const openSandboxFile = useCallback((conversationId: string, path: string) => {
    setSandboxFileView({ conversationId, path });
  }, []);

  const closeSandboxFile = useCallback(() => {
    setSandboxFileView(null);
  }, []);

  const workspaceApi = useMemo<ResearchWorkspaceApi>(() => ({
    editorIntent,
    clearEditorIntent,
    conversationFocusRequest,
    requestConversationFocus,
    ackConversationFocus,
    openConversationChat,
    closeConversationChat,
    sandboxFileView,
    openSandboxFile,
    closeSandboxFile,
  }), [editorIntent, clearEditorIntent, conversationFocusRequest, requestConversationFocus, ackConversationFocus, openConversationChat, closeConversationChat, sandboxFileView, openSandboxFile, closeSandboxFile]);

  const handleResizeStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setResizing(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    let latestWidth = startWidth;
    const onMove = (move: PointerEvent) => {
      latestWidth = Math.min(
        SIDEBAR_MAX_WIDTH,
        Math.max(SIDEBAR_MIN_WIDTH, startWidth + (move.clientX - startX)),
      );
      setSidebarWidth(latestWidth);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setResizing(false);
      window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(latestWidth));
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [sidebarWidth]);

  const handleChatPanelResizeStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setChatPanelResizing(true);
    const startX = e.clientX;
    const startWidth = chatPanelWidth;
    let latestWidth = startWidth;
    const onMove = (move: PointerEvent) => {
      latestWidth = Math.min(
        CHAT_PANEL_MAX_WIDTH,
        Math.max(CHAT_PANEL_MIN_WIDTH, startWidth - (move.clientX - startX)),
      );
      setChatPanelWidth(latestWidth);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setChatPanelResizing(false);
      window.localStorage.setItem(CHAT_PANEL_WIDTH_STORAGE_KEY, String(latestWidth));
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [chatPanelWidth]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((open) => !open);
  }, []);

  if (!userIsAdmin(currentUser)) {
    return <ErrorAccessDenied />;
  }

  return (
    <ResearchWorkspaceProvider value={workspaceApi}>
      <div className={classes.outer}>
        <div className={classes.root}>
          <div
            className={classNames(classes.sidebar, !sidebarOpen && classes.sidebarCollapsed)}
            style={{ width: sidebarOpen ? sidebarWidth : SIDEBAR_COLLAPSED_WIDTH }}
          >
            {sidebarOpen ? (
              <>
                <ProjectSidebar
                  projectId={projectId}
                  activeDocumentId={activeDocumentId}
                  onSelectDocument={setActiveDocumentId}
                  onSelectConversation={openConversation}
                  onOpenConversationChat={openConversationChat}
                  onStartNewConversation={startNewConversation}
                  onCollapse={toggleSidebar}
                />
                <div
                  className={classNames(classes.resizeHandle, resizing && classes.resizeHandleActive)}
                  onPointerDown={handleResizeStart}
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="Resize sidebar"
                />
              </>
            ) : (
              <button
                type="button"
                className={classes.iconButton}
                onClick={toggleSidebar}
                title="Open sidebar"
                aria-label="Open sidebar"
              >
                <ForumIcon icon="ChevronDoubleRight" className={classes.icon} />
              </button>
            )}
          </div>
          <div className={classes.document}>
            <DocumentPane
              projectId={projectId}
              documentId={activeDocumentId}
              openConversation={openConversation}
              onSelectDocument={setActiveDocumentId}
            />
            {sandboxFileView && !chatSurface?.fullscreen ? (
              <SandboxFileViewer
                conversationId={sandboxFileView.conversationId}
                path={sandboxFileView.path}
                onClose={closeSandboxFile}
              />
            ) : null}
          </div>
          {chatSurface ? (
            <div
              className={chatSurface.fullscreen ? classes.fullscreenChat : classes.chatPanel}
              style={chatSurface.fullscreen
                ? { left: sidebarOpen ? sidebarWidth : SIDEBAR_COLLAPSED_WIDTH }
                : { width: chatPanelWidth }}
            >
              {!chatSurface.fullscreen && (
                <div
                  key="resize-handle"
                  className={classNames(classes.chatPanelResizeHandle, chatPanelResizing && classes.resizeHandleActive)}
                  onPointerDown={handleChatPanelResizeStart}
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="Resize chat panel"
                />
              )}
              <ConversationChatView
                key="chat-view"
                conversationId={chatSurface.conversationId}
                projectId={projectId}
                activeDocumentId={activeDocumentId}
                variant={chatSurface.fullscreen ? 'fullscreen' : 'panel'}
                onClose={closeConversationChat}
                onToggleFullscreen={() => setChatFullscreen(!chatSurface.fullscreen)}
                onOpenInDocument={() => openChatConversationInDocument(chatSurface.conversationId)}
              />
            </div>
          ) : null}
        </div>
      </div>
    </ResearchWorkspaceProvider>
  );
};

export default ResearchWorkspace;
