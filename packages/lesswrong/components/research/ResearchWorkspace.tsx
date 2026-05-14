"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import qs from 'qs';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import { useCurrentUser } from '../common/withUser';
import { useLocation, useNavigate } from '../../lib/routeUtil';
import ErrorAccessDenied from '../common/ErrorAccessDenied';
import ForumIcon from '../common/ForumIcon';
import ProjectSidebar from './ProjectSidebar';
import DocumentPane from './DocumentPane';
import ChatPane from './ChatPane';
import SupervisorHealthBanner from './SupervisorHealthBanner';
import { SupervisorHealthProvider } from './hooks/SupervisorHealthContext';

interface ResearchWorkspaceProps {
  projectId: string;
}

type RightPaneMode = 'chat' | 'closed';

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
    height: 'calc(100vh - 64px)',
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
    borderBottom: theme.palette.greyBorder('1px', 0.1),
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
}));

/**
 * Research workspace shell. Three-column layout: ProjectSidebar | DocumentPane | (Chat/Activity right pane).
 *
 * The right pane is toggleable between Chat, Activity, and a slim collapsed-rail. When closed it shows
 * a vertical strip with Chat/Activity buttons so users can re-open without losing the column.
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
  const [rightPaneMode, setRightPaneMode] = useState<RightPaneMode>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  if (!currentUser) {
    return <ErrorAccessDenied />;
  }

  const rightPaneOpen = rightPaneMode !== 'closed';
  const rootClassName = classNames(classes.root, {
    [classes.rootChatHidden]: rightPaneOpen === false && sidebarOpen,
    [classes.rootSidebarHidden]: rightPaneOpen && sidebarOpen === false,
    [classes.rootSidebarAndChatHidden]: rightPaneOpen === false && sidebarOpen === false,
  });

  return (
    <SupervisorHealthProvider>
      <div className={classes.outer}>
        <SupervisorHealthBanner />
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
              className={`${classes.rightPaneTab} ${classes.rightPaneTabActive}`}
              onClick={() => setRightPaneMode('chat')}
            >
              Chat
            </button>
            <div className={classes.rightPaneSpacer} />
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
            <ChatPane
              projectId={projectId}
              conversationId={activeChatConversationId}
              onConversationCreated={setActiveChatConversationId}
              onSelectDocument={setActiveDocumentId}
              onOpenConversationInChat={openChat}
            />
          </div>
        </div>
      ) : (
        <div className={classes.rightPaneCollapsed}>
          <button className={classes.collapsedTab} onClick={() => setRightPaneMode('chat')}>Chat</button>
        </div>
      )}
        </div>
      </div>
    </SupervisorHealthProvider>
  );
};

export default ResearchWorkspace;
