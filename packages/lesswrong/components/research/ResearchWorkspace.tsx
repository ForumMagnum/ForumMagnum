"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import { useCurrentUser } from '../common/withUser';
import ErrorAccessDenied from '../common/ErrorAccessDenied';
import ProjectSidebar from './ProjectSidebar';
import DocumentPane from './DocumentPane';
import ChatPane from './ChatPane';
import ActivityPane from './ActivityPane';

interface ResearchWorkspaceProps {
  projectId: string;
}

type RightPaneMode = 'chat' | 'activity' | 'closed';

interface FirstDocumentQueryResult {
  researchDocuments: { results: Array<{ _id: string }> } | null;
}
interface FirstDocumentQueryVars {
  projectId: string;
}
const FirstDocumentQuery = gql(`
  query ResearchWorkspaceFirstDocument($projectId: String!) {
    researchDocuments(selector: { byProject: { projectId: $projectId } }, limit: 1) {
      results { _id }
    }
  }
`) as TypedDocumentNode<FirstDocumentQueryResult, FirstDocumentQueryVars>;

const styles = defineStyles('ResearchWorkspace', (theme: ThemeType) => ({
  root: {
    display: 'grid',
    gridTemplateColumns: '260px 1fr 360px',
    gridTemplateRows: '1fr',
    height: 'calc(100vh - 64px)',
    background: theme.palette.background.default,
    minHeight: 0,
  },
  rootChatHidden: {
    gridTemplateColumns: '260px 1fr 36px',
  },
  sidebar: {
    borderRight: theme.palette.greyBorder('1px', 0.1),
    overflow: 'hidden',
    minHeight: 0,
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
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: 13,
    color: theme.palette.text.dim,
    border: 'none',
    background: 'transparent',
    fontFamily: 'inherit',
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

  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [activeChatConversationId, setActiveChatConversationId] = useState<string | null>(null);
  const [rightPaneMode, setRightPaneMode] = useState<RightPaneMode>('chat');

  const { data: firstDocData } = useQuery(FirstDocumentQuery, {
    variables: { projectId },
    fetchPolicy: 'cache-and-network',
  });

  // Auto-select the first document in the project once it loads, but only if
  // the user hasn't already picked something themselves.
  useEffect(() => {
    if (activeDocumentId) return;
    const first = firstDocData?.researchDocuments?.results?.[0]?._id;
    if (first) setActiveDocumentId(first);
  }, [firstDocData, activeDocumentId]);

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

  return (
    <div className={rightPaneOpen ? classes.root : `${classes.root} ${classes.rootChatHidden}`}>
      <div className={classes.sidebar}>
        <ProjectSidebar
          projectId={projectId}
          activeDocumentId={activeDocumentId}
          activeChatConversationId={activeChatConversationId}
          onSelectDocument={setActiveDocumentId}
          onSelectConversation={openChat}
          onStartNewChat={startNewChat}
        />
      </div>
      <div className={classes.document}>
        <div className={classes.documentBody}>
          <DocumentPane
            projectId={projectId}
            documentId={activeDocumentId}
            onOpenChat={openChat}
          />
        </div>
      </div>
      {rightPaneOpen ? (
        <div className={classes.rightPane}>
          <div className={classes.rightPaneTabs}>
            <button
              className={
                rightPaneMode === 'chat'
                  ? `${classes.rightPaneTab} ${classes.rightPaneTabActive}`
                  : classes.rightPaneTab
              }
              onClick={() => setRightPaneMode('chat')}
            >
              Chat
            </button>
            <button
              className={
                rightPaneMode === 'activity'
                  ? `${classes.rightPaneTab} ${classes.rightPaneTabActive}`
                  : classes.rightPaneTab
              }
              onClick={() => setRightPaneMode('activity')}
            >
              Activity
            </button>
            <div className={classes.rightPaneSpacer} />
            <button className={classes.rightPaneClose} onClick={closeRightPane} aria-label="Collapse panel">×</button>
          </div>
          <div className={classes.rightPaneBody}>
            {rightPaneMode === 'chat' ? (
              <ChatPane
                projectId={projectId}
                conversationId={activeChatConversationId}
                onConversationCreated={setActiveChatConversationId}
              />
            ) : (
              <ActivityPane projectId={projectId} />
            )}
          </div>
        </div>
      ) : (
        <div className={classes.rightPaneCollapsed}>
          <button className={classes.collapsedTab} onClick={() => setRightPaneMode('chat')}>Chat</button>
          <button className={classes.collapsedTab} onClick={() => setRightPaneMode('activity')}>Activity</button>
        </div>
      )}
    </div>
  );
};

export default ResearchWorkspace;
