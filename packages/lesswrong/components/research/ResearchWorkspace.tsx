"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import qs from 'qs';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import { useDebouncedFalse } from '../hooks/useDebouncedFalse';
import { useEventListener } from '../hooks/useEventListener';
import { useCurrentUser } from '../common/withUser';
import { userIsAdmin } from '@/lib/vulcan-users/permissions';
import { useLocation, useNavigate } from '../../lib/routeUtil';
import { EditorUserModeContext, InlineCommentsPanelContext } from '../common/sharedContexts';
import { getDefaultEditorUserMode, type EditorUserModeType } from '../editor/lexicalPlugins/suggestions/EditorUserMode';
import ErrorAccessDenied from '../common/ErrorAccessDenied';
import ForumIcon from '../common/ForumIcon';
import LWTooltip from '../common/LWTooltip';
import { getHeaderHeight } from '../layout/Header';
import ProjectSidebar from './ProjectSidebar';
import DocumentPane from './DocumentPane';
import ChatPane from './ChatPane';
import EditorModeMenuButton from './EditorModeMenuButton';
import ProjectCommentsList from './ProjectCommentsList';

interface ResearchWorkspaceProps {
  projectId: string;
}

type RightPaneMode = 'comments' | 'chat' | 'closed';

const FirstDocumentQuery = gql(`
  query ResearchWorkspaceFirstDocument($projectId: String!) {
    researchDocuments(selector: { byProject: { projectId: $projectId } }, limit: 1) {
      results { _id }
    }
  }
`);

const styles = defineStyles('ResearchWorkspace', (theme: ThemeType) => ({
  outer: {
    display: 'flex',
    flexDirection: 'column',
    height: `calc(100vh - ${getHeaderHeight()}px)`,
    minHeight: 0,
    background: theme.palette.background.default,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  root: {
    display: 'grid',
    gridTemplateColumns: '260px 1fr 360px',
    gridTemplateRows: '1fr',
    flex: 1,
    minHeight: 0,
  },
  rootChatHidden: {
    gridTemplateColumns: '260px 1fr 36px',
  },
  rootSidebarHidden: {
    gridTemplateColumns: '36px 1fr 360px',
  },
  rootSidebarAndChatHidden: {
    gridTemplateColumns: '36px 1fr 36px',
  },
  sidebar: {
    borderRight: theme.palette.greyBorder('1px', 0.1),
    overflow: 'hidden',
    minHeight: 0,
  },
  sidebarCollapsed: {
    borderRight: theme.palette.greyBorder('1px', 0.1),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 8,
    gap: 8,
    background: theme.palette.background.pageActiveAreaBackground ?? theme.palette.background.default,
  },
  iconButton: {
    width: 28,
    height: 28,
    border: 'none',
    borderRadius: 4,
    background: 'transparent',
    color: theme.palette.text.dim,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    '&:hover': {
      background: theme.palette.greyAlpha(0.06),
      color: theme.palette.text.primary,
    },
  },
  icon: {
    '--icon-size': '16px',
  },
  document: {
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    minHeight: 0,
  },
  documentBody: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  rightPane: {
    borderLeft: theme.palette.greyBorder('1px', 0.1),
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  rightPaneTabs: {
    display: 'flex',
    alignItems: 'center',
  },
  rightPaneTab: {
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    color: theme.palette.text.dim,
    borderBottom: '2px solid transparent',
    background: 'transparent',
    border: 'none',
    fontFamily: 'inherit',
    '&:hover': {
      color: theme.palette.text.primary,
    },
  },
  rightPaneTabActive: {
    color: theme.palette.text.primary,
    borderBottomColor: theme.palette.primary.main,
  },
  rightPaneSpacer: {
    flex: 1,
  },
  rightPaneClose: {
    width: 32,
    cursor: 'pointer',
    color: theme.palette.text.dim,
    border: 'none',
    background: 'transparent',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:hover': {
      color: theme.palette.text.primary,
    },
  },
  rightPaneBody: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  rightPaneCollapsed: {
    borderLeft: theme.palette.greyBorder('1px', 0.1),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 8,
    gap: 8,
  },
  collapsedTab: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 11,
    color: theme.palette.text.dim,
    writingMode: 'vertical-rl',
    transform: 'rotate(180deg)',
    padding: '8px 4px',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    '&:hover': {
      color: theme.palette.text.primary,
    },
  },
  commentsTabBody: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  disconnectedIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    color: theme.palette.warning.main,
  },
  disconnectedIcon: {
    '--icon-size': '14px',
  },
}));

/**
 * Research workspace shell. Three-column layout: ProjectSidebar | DocumentPane | right pane.
 *
 * The right pane hosts Comments and Chat tabs, plus the (deliberately low-key)
 * editor-mode control; collapsed, it shows a slim rail with the same
 * affordances. The editor's comment/suggestion threads render docked into the
 * Comments tab via the `panelPortalEl` mechanism in InlineCommentsPanelContext.
 *
 * The first document in the project is auto-selected on mount so a brand-new project
 * with one default document opens straight into editing.
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
  const [activeChatConversationId, setActiveChatConversationId] = useState<string | null>(null);
  const [rightPaneMode, setRightPaneMode] = useState<RightPaneMode>('closed');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // In-editor comment/suggestion state, lifted here so the right pane can
  // host the comments panel and the mode control. Research documents are
  // only reachable by users with edit access (project owner or admin), so
  // all three editor modes (Editing/Suggesting/Viewing) are available.
  const [userMode, setUserMode] = useState<EditorUserModeType>(() => getDefaultEditorUserMode(true, true));
  const [commentCount, setCommentCount] = useState(0);
  const [commentsPanelEl, setCommentsPanelEl] = useState<HTMLElement | null>(null);

  // Debounce transitions to "disconnected" so the initial WebSocket
  // handshake and brief reconnection blips don't flash the offline state.
  const [isBrowserOnline, setIsBrowserOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isWsConnected, setIsWsConnected] = useDebouncedFalse(true, 2000);
  const isConnected = isBrowserOnline && isWsConnected;

  useEventListener('online', () => setIsBrowserOnline(true));
  useEventListener('offline', () => setIsBrowserOnline(false));

  const editorUserModeContext = useMemo(() => ({
    userMode,
    setUserMode,
    canEdit: true,
    canComment: true,
    isConnected,
    setIsWsConnected,
  }), [userMode, isConnected, setIsWsConnected]);

  // The editor's "show comments panel" state maps onto the right pane's tab:
  // opening the panel opens the Comments tab; closing it collapses the pane
  // (but leaves the Chat tab alone if that's what's open).
  const setShowComments = useCallback((value: React.SetStateAction<boolean>) => {
    setRightPaneMode((prev) => {
      const current = prev === 'comments';
      const next = typeof value === 'function' ? value(current) : value;
      if (next) return 'comments';
      return current ? 'closed' : prev;
    });
  }, []);

  // Only report the panel as shown once the portal target exists, so the
  // editor's CommentPlugin never falls back to its floating variant during
  // the render where the tab body is still mounting.
  const showComments = rightPaneMode === 'comments' && !!commentsPanelEl;

  const inlineCommentsContext = useMemo(() => ({
    showComments,
    setShowComments,
    commentCount,
    setCommentCount,
    panelPortalEl: commentsPanelEl,
  }), [showComments, setShowComments, commentCount, commentsPanelEl]);

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

  const openChat = useCallback((conversationId: string) => {
    setActiveChatConversationId(conversationId);
    setRightPaneMode('chat');
  }, []);

  const startNewChat = useCallback(() => {
    setActiveChatConversationId(null);
    setRightPaneMode('chat');
  }, []);

  const closeRightPane = useCallback(() => {
    setRightPaneMode('closed');
  }, []);

  if (!userIsAdmin(currentUser)) {
    return <ErrorAccessDenied />;
  }

  const rightPaneOpen = rightPaneMode !== 'closed';
  const rootClassName = classNames(classes.root, {
    [classes.rootChatHidden]: rightPaneOpen === false && sidebarOpen,
    [classes.rootSidebarHidden]: rightPaneOpen && sidebarOpen === false,
    [classes.rootSidebarAndChatHidden]: rightPaneOpen === false && sidebarOpen === false,
  });

  const commentsTabLabel = commentCount > 0 ? `Comments · ${commentCount}` : 'Comments';
  // Only meaningful while an editor is mounted; without one the last-reported
  // connection state would be stale.
  const offlineIndicator = !!activeDocumentId && !isConnected && (
    <LWTooltip title="Offline — changes are saved locally" placement="left">
      <span className={classes.disconnectedIndicator}>
        <ForumIcon icon="CloudOff" className={classes.disconnectedIcon} />
      </span>
    </LWTooltip>
  );

  return (
    <EditorUserModeContext.Provider value={editorUserModeContext}>
    <InlineCommentsPanelContext.Provider value={inlineCommentsContext}>
    <div className={classes.outer}>
      <div className={rootClassName}>
          {sidebarOpen ? (
        <div className={classes.sidebar}>
          <ProjectSidebar
            projectId={projectId}
            activeDocumentId={activeDocumentId}
            activeChatConversationId={activeChatConversationId}
            onSelectDocument={setActiveDocumentId}
            onSelectConversation={openChat}
            onStartNewChat={startNewChat}
            onCollapse={() => setSidebarOpen(false)}
          />
        </div>
      ) : (
        <div className={classes.sidebarCollapsed}>
          <button
            type="button"
            className={classes.iconButton}
            onClick={() => setSidebarOpen(true)}
            title="Open sidebar"
            aria-label="Open sidebar"
          >
            <ForumIcon icon="ChevronRight" className={classes.icon} />
          </button>
        </div>
      )}
      <div className={classes.document}>
        <div className={classes.documentBody}>
          <DocumentPane
            projectId={projectId}
            documentId={activeDocumentId}
            onOpenConversationInChat={openChat}
            onSelectDocument={setActiveDocumentId}
          />
        </div>
      </div>
      {rightPaneOpen ? (
        <div className={classes.rightPane}>
          <div className={classes.rightPaneTabs}>
            <button
              className={classNames(classes.rightPaneTab, rightPaneMode === 'comments' && classes.rightPaneTabActive)}
              onClick={() => setRightPaneMode('comments')}
            >
              {commentsTabLabel}
            </button>
            <button
              className={classNames(classes.rightPaneTab, rightPaneMode === 'chat' && classes.rightPaneTabActive)}
              onClick={() => setRightPaneMode('chat')}
            >
              Chat
            </button>
            <div className={classes.rightPaneSpacer} />
            {offlineIndicator}
            <EditorModeMenuButton userMode={userMode} setUserMode={setUserMode} />
            <button
              className={classes.rightPaneClose}
              onClick={closeRightPane}
              title="Collapse panel"
              aria-label="Collapse panel"
            >
              <ForumIcon icon="Close" className={classes.icon} />
            </button>
          </div>
          <div className={classes.rightPaneBody}>
            {rightPaneMode === 'comments' && (
              <>
                {activeDocumentId && <div className={classes.commentsTabBody} ref={setCommentsPanelEl} />}
                <ProjectCommentsList
                  projectId={projectId}
                  activeDocumentId={activeDocumentId}
                  onSelectDocument={setActiveDocumentId}
                />
              </>
            )}
            {rightPaneMode === 'chat' && (
              <ChatPane
                projectId={projectId}
                conversationId={activeChatConversationId}
                activeDocumentId={activeDocumentId}
                onConversationCreated={setActiveChatConversationId}
                onSelectDocument={setActiveDocumentId}
                onOpenConversationInChat={openChat}
              />
            )}
          </div>
        </div>
      ) : (
        <div className={classes.rightPaneCollapsed}>
          {offlineIndicator}
          <EditorModeMenuButton userMode={userMode} setUserMode={setUserMode} />
          <button className={classes.collapsedTab} onClick={() => setRightPaneMode('comments')}>
            {commentsTabLabel}
          </button>
          <button className={classes.collapsedTab} onClick={() => setRightPaneMode('chat')}>Chat</button>
        </div>
      )}
        </div>
      </div>
    </InlineCommentsPanelContext.Provider>
    </EditorUserModeContext.Provider>
  );
};

export default ResearchWorkspace;
