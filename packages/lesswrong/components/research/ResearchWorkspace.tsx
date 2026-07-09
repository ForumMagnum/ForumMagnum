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
import { ChatTilingSurface } from './ChatTilingSurface';
import { SandboxFileViewer } from './SandboxFileViewer';
import { useMarkConversationRead } from './hooks/useMarkConversationRead';
import { ProjectSidebarQuery } from './projectSidebarQuery';
import {
  EMPTY_CHAT_LAYOUT,
  openTile,
  closeTile,
  isChatLayoutEmpty,
  parseChatLayout,
  serializeChatLayout,
  type ChatTilingLayout,
} from './chatTilingLayout';
import {
  ResearchWorkspaceProvider,
  type ResearchEditorIntent,
  type ConversationFocusRequest,
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
// The chat surface can now hold several tiled columns, so allow it to be dragged
// much wider than the single-panel era. (The document pane is flex:1 with
// minWidth:0, so it yields as the chat area grows.)
const CHAT_PANEL_MAX_WIDTH = 1800;
const CHAT_PANEL_DEFAULT_WIDTH = 420;
// A chat tile stays readable down to about this width; the number of columns the
// surface will open before it starts stacking two chats per column is the area
// width divided by this.
const CHAT_MIN_COLUMN_WIDTH = 340;

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

// The chat tiling layout persists per-device (localStorage), keyed by project so
// each project restores its own open chats / columns / sizes on refresh.
const CHAT_LAYOUT_STORAGE_PREFIX = 'researchChatLayout:';

function readStoredChatLayout(projectId: string): ChatTilingLayout | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(`${CHAT_LAYOUT_STORAGE_PREFIX}${projectId}`);
  return raw ? parseChatLayout(raw) : null;
}

function writeStoredChatLayout(projectId: string, layout: ChatTilingLayout): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${CHAT_LAYOUT_STORAGE_PREFIX}${projectId}`, serializeChatLayout(layout));
  } catch {
    // Storage full or disabled (private mode) — persistence is best-effort.
  }
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH);
  const [resizing, setResizing] = useState(false);
  // The chat surface is a tiling layout of columns×tiles; `fullscreenConversationId`,
  // when set, promotes one of those open chats to a fullscreen overlay while the
  // tiling layout persists underneath.
  const [chatLayout, setChatLayout] = useState<ChatTilingLayout>(EMPTY_CHAT_LAYOUT);
  const [fullscreenConversationId, setFullscreenConversationId] = useState<string | null>(null);
  const [chatPanelWidth, setChatPanelWidth] = useState(CHAT_PANEL_DEFAULT_WIDTH);
  const [chatPanelResizing, setChatPanelResizing] = useState(false);
  const [sandboxFileView, setSandboxFileView] = useState<SandboxFileView | null>(null);
  // Latest chat-area width, read (not subscribed) when opening a chat to decide
  // how many columns currently fit.
  const chatPanelWidthRef = useRef(CHAT_PANEL_DEFAULT_WIDTH);
  chatPanelWidthRef.current = chatPanelWidth;

  const [editorIntent, setEditorIntent] = useState<ResearchEditorIntent | null>(null);
  const [conversationFocusRequest, setConversationFocusRequest] = useState<ConversationFocusRequest | null>(null);
  const intentNonceRef = useRef(0);

  useEffect(() => {
    setSidebarWidth(readStoredWidth(SIDEBAR_WIDTH_STORAGE_KEY, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH, SIDEBAR_DEFAULT_WIDTH));
    setChatPanelWidth(readStoredWidth(CHAT_PANEL_WIDTH_STORAGE_KEY, CHAT_PANEL_MIN_WIDTH, CHAT_PANEL_MAX_WIDTH, CHAT_PANEL_DEFAULT_WIDTH));
  }, []);

  // Restore the persisted tiling layout for this project on mount, then persist
  // it on every change. `chatLayoutSaveArmedRef` skips the first save pass so the
  // initial empty layout can't clobber stored data before the restore lands.
  const chatLayoutSaveArmedRef = useRef(false);
  useEffect(() => {
    const stored = readStoredChatLayout(projectId);
    // Always reset to this project's stored layout (or an empty one when none
    // exists). Without the `?? EMPTY_CHAT_LAYOUT` fallback, switching to a
    // project with no stored layout would leave the previous project's open
    // tiles in place — and the save effect would then persist them under the
    // new project's storage key.
    setChatLayout(stored ?? EMPTY_CHAT_LAYOUT);
  }, [projectId]);
  useEffect(() => {
    if (!chatLayoutSaveArmedRef.current) {
      chatLayoutSaveArmedRef.current = true;
      return;
    }
    writeStoredChatLayout(projectId, chatLayout);
  }, [chatLayout, projectId]);

  useEffect(() => {
    const readDocIdFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      setActiveDocumentIdState(params.get('documentId'));
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
    if (!activeDocumentId && firstDocId) {
      setActiveDocumentIdState(firstDocId);
      const currentLocation = locationRef.current;
      const newQuery = { ...currentLocation.query, documentId: firstDocId };
      navigateRef.current({ ...currentLocation.location, search: `?${qs.stringify(newQuery)}` }, { skipRouter: true, replace: true });
    }
  }, [activeDocumentId, firstDocData]);

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

  // How many columns currently fit the chat area, from its live width.
  const computeMaxColumns = useCallback(
    () => Math.max(1, Math.floor(chatPanelWidthRef.current / CHAT_MIN_COLUMN_WIDTH)),
    [],
  );

  // Open a conversation as a tile in the chat surface (splitting to make room per
  // the packing policy). Clears any fullscreen overlay so the new tile is visible.
  const openChatTile = useCallback((conversationId: string) => {
    setChatLayout((prev) => openTile(prev, conversationId, computeMaxColumns()));
    setFullscreenConversationId(null);
  }, [computeMaxColumns]);

  const openConversation = useCallback((conversationId: string) => {
    markConversationRead(conversationId);
    const conversation = conversationsRef.current?.find((c) => c._id === conversationId);
    const entrypointDocumentId =
      conversation?.entrypointKind === 'document' ? conversation?.entrypointDocumentId ?? null : null;
    if (!entrypointDocumentId) {
      openChatTile(conversationId);
      return;
    }
    setActiveDocumentId(entrypointDocumentId);
    intentNonceRef.current += 1;
    setEditorIntent({
      kind: 'focus-conversation',
      conversationId,
      nonce: intentNonceRef.current,
    });
  }, [setActiveDocumentId, markConversationRead, openChatTile]);

  const startNewConversation = useCallback(async () => {
    const result = await ensureScratchDocument({ variables: { projectId } });
    const scratchId = result.data?.ensureResearchScratchDocument?.documentId;
    if (!scratchId) return;
    setActiveDocumentId(scratchId);
    intentNonceRef.current += 1;
    setEditorIntent({ kind: 'insert-query', nonce: intentNonceRef.current });
  }, [ensureScratchDocument, projectId, setActiveDocumentId]);

  // Drop a full conversation block (transcript + composer) bound to
  // `conversationId` at the active editor's current cursor (double-clicking a
  // sidebar chat). Deliberately does not navigate — it lands wherever the user
  // is currently editing.
  const insertConversationBlockAtCursor = useCallback((conversationId: string) => {
    intentNonceRef.current += 1;
    setEditorIntent({ kind: 'insert-conversation-block', conversationId, nonce: intentNonceRef.current });
  }, []);

  const openConversationChat = useCallback((conversationId: string, opts?: { fullscreen?: boolean }) => {
    markConversationRead(conversationId);
    // Always open (or focus) the tile in the layout, so exiting fullscreen lands
    // back on it; then promote to fullscreen when requested.
    setChatLayout((prev) => openTile(prev, conversationId, computeMaxColumns()));
    setFullscreenConversationId(opts?.fullscreen ? conversationId : null);
  }, [markConversationRead, computeMaxColumns]);

  const closeConversationChat = useCallback((conversationId: string) => {
    setChatLayout((prev) => closeTile(prev, conversationId));
    setFullscreenConversationId((prev) => (prev === conversationId ? null : prev));
  }, []);

  const toggleChatFullscreen = useCallback((conversationId: string) => {
    setFullscreenConversationId((prev) => (prev === conversationId ? null : conversationId));
  }, []);

  const openChatConversationInDocument = useCallback((conversationId: string) => {
    setChatLayout((prev) => closeTile(prev, conversationId));
    setFullscreenConversationId((prev) => (prev === conversationId ? null : prev));
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
                  onInsertConversationBlock={insertConversationBlockAtCursor}
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
            {sandboxFileView && !fullscreenConversationId ? (
              <SandboxFileViewer
                conversationId={sandboxFileView.conversationId}
                path={sandboxFileView.path}
                onClose={closeSandboxFile}
              />
            ) : null}
          </div>
          {!isChatLayoutEmpty(chatLayout) ? (
            <div className={classes.chatPanel} style={{ width: chatPanelWidth }}>
              <div
                key="resize-handle"
                className={classNames(classes.chatPanelResizeHandle, chatPanelResizing && classes.resizeHandleActive)}
                onPointerDown={handleChatPanelResizeStart}
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize chat panel"
              />
              <ChatTilingSurface
                layout={chatLayout}
                projectId={projectId}
                activeDocumentId={activeDocumentId}
                onCloseTile={closeConversationChat}
                onToggleFullscreen={toggleChatFullscreen}
                onOpenTileInDocument={openChatConversationInDocument}
                onLayoutChange={setChatLayout}
              />
            </div>
          ) : null}
          {fullscreenConversationId ? (
            <div
              className={classes.fullscreenChat}
              style={{ left: sidebarOpen ? sidebarWidth : SIDEBAR_COLLAPSED_WIDTH }}
            >
              <ConversationChatView
                key="fullscreen-chat"
                conversationId={fullscreenConversationId}
                projectId={projectId}
                activeDocumentId={activeDocumentId}
                variant="fullscreen"
                onClose={() => closeConversationChat(fullscreenConversationId)}
                onToggleFullscreen={() => setFullscreenConversationId(null)}
                onOpenInDocument={() => openChatConversationInDocument(fullscreenConversationId)}
              />
            </div>
          ) : null}
        </div>
      </div>
    </ResearchWorkspaceProvider>
  );
};

export default ResearchWorkspace;
