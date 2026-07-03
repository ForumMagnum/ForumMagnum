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

// Width of the fullscreen file sidebar.
const FULLSCREEN_FILE_SIDEBAR_WIDTH = 340;
// Reading-column cap for chat content in fullscreen; the scroll area stays
// full-width, only the messages/composer are capped and centered.
const FULLSCREEN_CONTENT_MAX_WIDTH = 780;

const styles = defineStyles('ConversationChatView', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
    minWidth: 0,
    // One flat cream surface for the whole panel (header + body); the panel's
    // left border separates it from the canvas — no inner card.
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
  // PanelRightIcon is a raw SVG sized in em (not a ForumIcon), so drive it
  // with font-size rather than the --icon-size var.
  panelIcon: {
    fontSize: 15,
    display: 'block',
  },
  // The transcript + composer column. It fills the panel (or the fullscreen
  // overlay) edge-to-edge — the panel is already its own bordered container,
  // so an inset rounded card here just nests a box in a box. Flat cream fill,
  // no border/radius of its own.
  body: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    background: researchChatSurface(theme),
    padding: '10px 14px 12px',
  },
  // Fullscreen splits into a full-width chat column and an optional right file
  // sidebar (open by default, toggled from the header).
  fullscreenMain: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'row',
  },
  fullscreenChatCol: {
    // Positioning context for the file viewer overlay.
    position: 'relative',
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    background: researchChatSurface(theme),
    // No horizontal padding: the transcript scroll area runs the full width
    // (scrollbar at the edge). The content inside is capped + centered.
    paddingTop: 12,
  },
  // Composer capped to the same reading column as the transcript content and
  // centered, so it lines up under the messages.
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
  /**
   * The document the user currently has open — forwarded to
   * `continueResearchConversation` so the agent knows the user's working
   * context. Sending is disabled while this is unknown.
   */
  activeDocumentId: string | null;
  variant: 'panel' | 'fullscreen';
  /** Close the chat surface entirely. */
  onClose: () => void;
  /** Panel → fullscreen, or fullscreen → panel. */
  onToggleFullscreen: () => void;
  /** Close the chat surface and jump to the conversation's inline block. */
  onOpenInDocument: () => void;
}

/**
 * The classic chat surface for a research conversation: header, scrollable
 * transcript (with scroll-up history paging), and a pinned composer. Hosted
 * in two shells by ResearchWorkspace — a resizable right side panel, and a
 * full-viewport overlay with a centered reading column.
 */
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
  // The file browser: a right sidebar in fullscreen, or a body swap in the
  // narrow side panel. Closed by default in both; opened from the header.
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

  // The chat surface being open counts as reading it — stamp on open and
  // again when a turn completes while the user is watching.
  const markConversationRead = useMarkConversationRead();
  useEffect(() => {
    markConversationRead(conversationId);
  }, [conversationId, markConversationRead]);

  // Background title generation may land during a turn — refresh on completion.
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

  // Esc in fullscreen drops back to the side panel (the panel itself leaves
  // Esc alone — it's a persistent surface, not a modal).
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

  // A sandbox file open in the viewer for THIS conversation (fullscreen renders
  // it over the chat column, since the center-pane viewer is occluded here).
  const fileView = workspace?.sandboxFileView ?? null;
  const fileViewForThisConversation =
    fileView && fileView.conversationId === conversationId ? fileView : null;

  const chatContent = (
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
      />
      <div className={classes.composerWrap}>
        <ChatComposer
          projectId={projectId}
          disabled={sending || !activeDocumentId}
          onSubmit={handleSend}
        />
      </div>
    </>
  );

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
      {variant === 'fullscreen' ? (
        // Full-width chat column + optional right file sidebar. An opened file
        // is viewed over the chat column here (the workspace's center-pane
        // viewer is behind this fullscreen overlay — see ResearchWorkspace).
        <div className={classes.fullscreenMain}>
          <div className={classes.fullscreenChatCol}>
            <ConversationTranscript
              conversationId={conversationId}
              events={visibleEvents}
              turnInFlight={turnInFlight}
              status={status}
              error={error}
              hasMoreOlder={hasMoreOlder}
              loadingOlder={loadingOlder}
              loadOlder={loadOlder}
              maxContentWidth={FULLSCREEN_CONTENT_MAX_WIDTH}
            />
            <div className={classes.fullscreenComposerWrap}>
              <ChatComposer
                projectId={projectId}
                disabled={sending || !activeDocumentId}
                onSubmit={handleSend}
              />
            </div>
            {fileViewForThisConversation ? (
              <SandboxFileViewer
                conversationId={conversationId}
                path={fileViewForThisConversation.path}
                onClose={() => workspace?.closeSandboxFile()}
              />
            ) : null}
          </div>
          {filesOpen ? (
            <div className={classes.fileSidebar}>
              <SandboxFileBrowser conversationId={conversationId} />
            </div>
          ) : null}
        </div>
      ) : (
        // Narrow side panel: files swap in place of the transcript.
        <div className={classes.body}>
          {filesOpen ? <SandboxFileBrowser conversationId={conversationId} /> : chatContent}
        </div>
      )}
      {/* Resource-utilization strip pinned to the very bottom of the panel;
          renders nothing while the sandbox is down. */}
      <SandboxStatsFooter conversationId={conversationId} />
    </div>
  );
};
