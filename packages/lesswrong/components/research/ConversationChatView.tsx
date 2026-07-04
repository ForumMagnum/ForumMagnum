'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { useMutation } from '@apollo/client/react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useMessages } from '@/components/common/withMessages';
import { htmlToTextDefault } from '@/lib/htmlToText';
import { randomId } from '@/lib/random';
import ForumIcon from '@/components/common/ForumIcon';
import { useConversationStream } from './hooks/useConversationStream';
import { useMarkConversationRead } from './hooks/useMarkConversationRead';
import { isVisibleConversationEvent } from './conversationEventFormat';
import { ConversationTranscript } from './ConversationTranscript';
import { ConversationActions } from './ConversationActions';
import ChatComposer from './ChatComposer';
import { PanelRightIcon } from './PanelRightIcon';
import { SandboxStatsFooter } from './SandboxStatsFooter';
import { SandboxFileBrowser } from './SandboxFileBrowser';
import { SandboxFileViewer } from './SandboxFileViewer';
import { useResearchWorkspaceApiOptional } from './researchWorkspaceContext';
import { isSandboxWarmingError } from './sandboxWarming';
import { researchMono, researchWarmAlpha, researchChatSurface, researchRadius } from './researchStyleUtils';

const ConversationChatViewQuery = gql(`
  query ConversationChatViewInfo($conversationId: String!) {
    researchConversation(selector: { _id: $conversationId }) {
      result {
        _id
        title
      }
    }
  }
`);

const ContinueResearchConversationFromChatViewMutation = gql(`
  mutation ContinueResearchConversationFromChatView($conversationId: String!, $promptHtml: String!, $activeDocumentId: String!) {
    continueResearchConversation(conversationId: $conversationId, promptHtml: $promptHtml, activeDocumentId: $activeDocumentId) {
      conversationId
    }
  }
`);

const CancelResearchConversationFromChatViewMutation = gql(`
  mutation CancelResearchConversationFromChatView($conversationId: String!) {
    cancelResearchConversation(conversationId: $conversationId) {
      conversationId
    }
  }
`);

const FULLSCREEN_FILE_SIDEBAR_WIDTH = 340;
const FULLSCREEN_CONTENT_MAX_WIDTH = 780;

const styles = defineStyles('ConversationChatView', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
    minWidth: 0,
    background: researchChatSurface(theme),
  },
  header: {
    flex: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    minHeight: 20,
    padding: '8px 10px',
    borderBottom: `1px solid ${researchWarmAlpha(0.08)}`,
    fontFamily: researchMono,
    fontSize: 11,
    color: theme.palette.text.dim,
    userSelect: 'none',
  },
  headerTitle: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: theme.palette.text.primary,
  },
  headerSpacer: {
    flex: 1,
  },
  pulseDot: {
    flex: 'none',
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: theme.palette.primary.main,
    animation: '$chatViewPulse 1.4s ease-in-out infinite',
  },
  '@keyframes chatViewPulse': {
    '0%, 100%': { opacity: 0.25, transform: 'scale(0.85)' },
    '50%': { opacity: 1, transform: 'scale(1)' },
  },
  errorGlyph: {
    flex: 'none',
    color: theme.palette.error?.main ?? theme.palette.text.primary,
  },
  headerButton: {
    flexShrink: 0,
    whiteSpace: 'nowrap',
    background: 'transparent',
    border: 'none',
    borderRadius: researchRadius.xs,
    fontFamily: researchMono,
    fontSize: 10.5,
    lineHeight: 1.4,
    color: theme.palette.text.dim,
    padding: '2px 6px',
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.text.primary,
      background: researchWarmAlpha(0.06),
    },
  },
  iconButton: {
    width: 22,
    height: 22,
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    color: theme.palette.text.primary,
    background: researchWarmAlpha(0.1),
  },
  icon: {
    '--icon-size': '14px',
  },
  panelIcon: {
    fontSize: 15,
    display: 'block',
  },
  main: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'row',
  },
  panelChatCol: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    background: researchChatSurface(theme),
    padding: '10px 14px 12px',
  },
  fullscreenChatCol: {
    position: 'relative',
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    background: researchChatSurface(theme),
    paddingTop: 12,
  },
  fullscreenComposerWrap: {
    flex: 'none',
    width: '100%',
    maxWidth: FULLSCREEN_CONTENT_MAX_WIDTH,
    margin: '0 auto',
    padding: '2px 24px 16px',
    boxSizing: 'border-box',
  },
  fileSidebar: {
    flex: 'none',
    width: FULLSCREEN_FILE_SIDEBAR_WIDTH,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    borderLeft: `1px solid ${researchWarmAlpha(0.08)}`,
    padding: '10px 10px 12px',
  },
  composerWrap: {
    flex: 'none',
    paddingTop: 2,
  },
}));

interface ConversationChatViewProps {
  conversationId: string;
  projectId: string;
  activeDocumentId: string | null;
  variant: 'panel' | 'fullscreen';
  onClose: () => void;
  onToggleFullscreen: () => void;
  onOpenInDocument: () => void;
}

export const ConversationChatView = ({
  conversationId,
  projectId,
  activeDocumentId,
  variant,
  onClose,
  onToggleFullscreen,
  onOpenInDocument,
}: ConversationChatViewProps) => {
  const classes = useStyles(styles);
  const { flash } = useMessages();
  const workspace = useResearchWorkspaceApiOptional();
  const [sending, setSending] = useState(false);
  const [filesOpen, setFilesOpen] = useState(false);

  const {
    events, status, error, turnInFlight, hasMoreOlder, loadingOlder, loadOlder,
    markTurnExpected, injectOptimisticEvent, clearOptimistic, refresh,
  } = useConversationStream(conversationId);

  const { data: conversationData, refetch: refetchConversation } = useQuery(ConversationChatViewQuery, {
    variables: { conversationId },
    fetchPolicy: 'cache-and-network',
  });
  const title = conversationData?.researchConversation?.result?.title ?? 'Conversation';

  const markConversationRead = useMarkConversationRead();
  useEffect(() => {
    markConversationRead(conversationId);
  }, [conversationId, markConversationRead]);

  const wasInFlightRef = useRef(false);
  useEffect(() => {
    if (wasInFlightRef.current && !turnInFlight) {
      void refetchConversation();
      markConversationRead(conversationId);
    }
    wasInFlightRef.current = turnInFlight;
  }, [turnInFlight, refetchConversation, conversationId, markConversationRead]);

  const visibleEvents = useMemo(
    () => events.filter(isVisibleConversationEvent),
    [events],
  );

  const [continueConversation] = useMutation(ContinueResearchConversationFromChatViewMutation);
  const [cancelConversation] = useMutation(CancelResearchConversationFromChatViewMutation);

  const handleSend = useCallback(async (promptHtml: string) => {
    if (sending || !activeDocumentId) return;
    setSending(true);
    try {
      markTurnExpected();
      injectOptimisticEvent({
        _id: `optimistic:user:${randomId()}`,
        conversationId,
        seq: -1,
        kind: 'user',
        claudeMessageUuid: null,
        payload: { type: 'user', message: { role: 'user', content: htmlToTextDefault(promptHtml) } },
        createdAt: new Date().toISOString(),
      });
      await continueConversation({
        variables: { conversationId, promptHtml, activeDocumentId },
      });
      refresh();
    } catch (err) {
      clearOptimistic();
      if (isSandboxWarmingError(err)) {
        flash({ messageString: 'The sandbox is still starting up — try again in a moment.' });
      } else {
        // eslint-disable-next-line no-console
        console.error('[research] conversation send failed', err);
        flash({ messageString: 'Failed to send message — try again.', type: 'error' });
      }
      throw err;
    } finally {
      setSending(false);
    }
  }, [sending, conversationId, activeDocumentId, continueConversation, markTurnExpected, injectOptimisticEvent, clearOptimistic, refresh, flash]);

  const handleCancel = useCallback(async () => {
    await cancelConversation({ variables: { conversationId } });
  }, [cancelConversation, conversationId]);

  useEffect(() => {
    if (variant !== 'fullscreen') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onToggleFullscreen();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [variant, onToggleFullscreen]);

  const headerGlyph = turnInFlight
    ? <span className={classes.pulseDot} aria-label="Agent is responding" />
    : status === 'error'
      ? <span className={classes.errorGlyph} title={error ?? 'error'}>✕</span>
      : null;

  const fileView = workspace?.sandboxFileView ?? null;
  const fileViewForThisConversation =
    fileView && fileView.conversationId === conversationId ? fileView : null;

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        {headerGlyph}
        <span className={classes.headerTitle}>{title}</span>
        <span className={classes.headerSpacer} />
        {turnInFlight ? (
          <button type="button" className={classes.headerButton} onClick={handleCancel}>
            ■ stop
          </button>
        ) : null}
        <ConversationActions conversationId={conversationId} projectId={projectId} />
        <button
          type="button"
          className={classNames(classes.headerButton, classes.iconButton, filesOpen && classes.iconButtonActive)}
          onClick={() => setFilesOpen((v) => !v)}
          title={filesOpen ? 'Hide files' : 'Show files'}
          aria-label="Toggle file browser"
          aria-pressed={filesOpen}
        >
          <PanelRightIcon className={classes.panelIcon} />
        </button>
        <button
          type="button"
          className={classNames(classes.headerButton, classes.iconButton)}
          onClick={onOpenInDocument}
          title="Open at its place in the document"
          aria-label="Open in document"
        >
          <ForumIcon icon="Document" className={classes.icon} />
        </button>
        <button
          type="button"
          className={classNames(classes.headerButton, classes.iconButton)}
          onClick={onToggleFullscreen}
          title={variant === 'fullscreen' ? 'Exit full screen (Esc)' : 'Open full screen'}
          aria-label={variant === 'fullscreen' ? 'Exit full screen' : 'Open full screen'}
        >
          <ForumIcon icon={variant === 'fullscreen' ? 'FullscreenExit' : 'Fullscreen'} className={classes.icon} />
        </button>
        <button
          type="button"
          className={classNames(classes.headerButton, classes.iconButton)}
          onClick={onClose}
          title="Close"
          aria-label="Close"
        >
          <ForumIcon icon="Close" className={classes.icon} />
        </button>
      </div>
      <div className={classes.main}>
        <div className={variant === 'fullscreen' ? classes.fullscreenChatCol : classes.panelChatCol}>
          {variant !== 'fullscreen' && filesOpen ? (
            <SandboxFileBrowser conversationId={conversationId} />
          ) : (
            <>
              <ConversationTranscript
                conversationId={conversationId}
                events={visibleEvents}
                turnInFlight={turnInFlight}
                status={status}
                error={error}
                hasMoreOlder={hasMoreOlder}
                loadingOlder={loadingOlder}
                loadOlder={loadOlder}
                maxContentWidth={variant === 'fullscreen' ? FULLSCREEN_CONTENT_MAX_WIDTH : undefined}
              />
              <div className={variant === 'fullscreen' ? classes.fullscreenComposerWrap : classes.composerWrap}>
                <ChatComposer
                  projectId={projectId}
                  disabled={sending || !activeDocumentId}
                  onSubmit={handleSend}
                />
              </div>
            </>
          )}
          {variant === 'fullscreen' && fileViewForThisConversation ? (
            <SandboxFileViewer
              conversationId={conversationId}
              path={fileViewForThisConversation.path}
              onClose={() => workspace?.closeSandboxFile()}
            />
          ) : null}
        </div>
        {variant === 'fullscreen' && filesOpen ? (
          <div className={classes.fileSidebar}>
            <SandboxFileBrowser conversationId={conversationId} />
          </div>
        ) : null}
      </div>
      <SandboxStatsFooter conversationId={conversationId} />
    </div>
  );
};
