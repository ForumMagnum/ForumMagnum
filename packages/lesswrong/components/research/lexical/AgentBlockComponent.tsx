'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { useMutation } from '@apollo/client/react';
import { type NodeKey } from 'lexical';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useStopLexicalEventPropagation } from '@/components/editor/lexicalPlugins/useStopLexicalEventPropagation';
import { useConversationStream, type ConversationEvent } from '@/components/research/hooks/useConversationStream';
import { useMarkConversationRead } from '@/components/research/hooks/useMarkConversationRead';
import { useResearchEditorEnvironment, usePendingConversation } from './ResearchEditorContext';
import { useResearchWorkspaceApiOptional } from '../researchWorkspaceContext';
import {
  getConversationEventChunks,
  isVisibleConversationEvent,
  renderChunkMarkdownToHtml,
} from '../conversationEventFormat';
import { ConversationTranscript } from '../ConversationTranscript';
import { ConversationActions } from '../ConversationActions';
import ChatComposer from '../ChatComposer';
import ContentStyles from '@/components/common/ContentStyles';
import { ContentItemBody } from '@/components/contents/ContentItemBody';
import ForumIcon from '@/components/common/ForumIcon';
import { PanelRightIcon } from '../PanelRightIcon';
import { htmlToTextDefault } from '@/lib/htmlToText';
import { sanitize } from '@/lib/utils/sanitize';
import { randomId } from '@/lib/random';
import { useMessages } from '@/components/common/withMessages';
import { isSandboxWarmingError } from '../sandboxWarming';
import { researchAccentTint, researchChatProse, researchChatSans, researchChatSurface, researchMono, researchEasing, researchWarmAlpha, researchRadius, researchSquircle } from '../researchStyleUtils';

/** Cap on the focused block's height; the transcript scrolls inside it. */
const FOCUSED_MAX_HEIGHT = '72vh';
/** Clamp on the blurred presentation before it fades out. */
const BLURRED_MAX_CONTENT_HEIGHT = 200;

const ResearchConversationBlockQuery = gql(`
  query ResearchConversationBlockInfo($conversationId: String!) {
    researchConversation(selector: { _id: $conversationId }) {
      result {
        _id
        title
        presentationHtml
      }
    }
  }
`);

const ContinueResearchConversationFromBlockMutation = gql(`
  mutation ContinueResearchConversationFromBlock($conversationId: String!, $promptHtml: String!, $activeDocumentId: String!) {
    continueResearchConversation(conversationId: $conversationId, promptHtml: $promptHtml, activeDocumentId: $activeDocumentId) {
      conversationId
    }
  }
`);

const CancelResearchConversationFromBlockMutation = gql(`
  mutation CancelResearchConversationFromBlock($conversationId: String!) {
    cancelResearchConversation(conversationId: $conversationId) {
      conversationId
    }
  }
`);

/**
 * The inline conversation surface. Two states:
 *
 * - BLURRED ("presentation orientation"): a one-line monospace header over
 *   the conversation's presentation — agent-authored `presentationHtml` when
 *   set, else the last assistant message as prose, clamped with a fade. Reads
 *   as part of the document; a faint left rule is the only chrome.
 * - FOCUSED: click in (or jump from the sidebar/palette) and the block
 *   expands in place to a scrollable Claude Code-style transcript with a
 *   pinned composer, capped at ~70vh. Click out (or Esc) collapses it back.
 */
const styles = defineStyles('AgentBlockComponent', (theme: ThemeType) => ({
  root: {
    position: 'relative',
    margin: '14px 0',
    // Rounded cream box (2026-07): conversations read as their own soft
    // surface on the canvas. The 2px left edge stays as the state signal
    // (dim at rest, sage when focused / agent-initiated).
    background: researchChatSurface(theme),
    border: `1px solid ${researchWarmAlpha(0.07)}`,
    borderLeft: `2px solid ${researchWarmAlpha(0.14)}`,
    borderRadius: researchRadius.lg,
    ...researchSquircle,
    padding: '8px 14px 10px',
    // The block renders inside the document's contenteditable, which sets
    // `white-space: pre-wrap` (Lexical's default). Without this reset every
    // newline in the rendered markdown HTML becomes a visible blank line.
    whiteSpace: 'normal',
    // No height animation on expand/collapse: a growing container with a
    // bottom-pinned transcript reads as the content scrolling, which the
    // user consistently found disorienting. Focus/blur swap in one frame.
    transition: `border-color 160ms ${researchEasing}`,
    // Breathing room above the block when the workspace jumps to it.
    scrollMarginTop: 18,
    // Mask the block's chrome inside unrevealed spoilers, mirroring the
    // hide-until-hover semantics of everything else in the spoiler.
    '.spoilers:not(:hover) &': {
      borderColor: theme.palette.panelBackground.spoilerBlock,
      color: theme.palette.panelBackground.spoilerBlock,
      '& *': {
        color: `${theme.palette.panelBackground.spoilerBlock} !important`,
        backgroundColor: 'transparent !important',
        borderColor: `${theme.palette.panelBackground.spoilerBlock} !important`,
      },
      '& svg': {
        opacity: 0,
      },
    },
  },
  rootBlurred: {
    cursor: 'pointer',
    '&:hover': {
      borderLeftColor: researchWarmAlpha(0.28),
    },
  },
  rootFocused: {
    borderLeftColor: researchAccentTint(0.65),
    display: 'flex',
    flexDirection: 'column',
    maxHeight: FOCUSED_MAX_HEIGHT,
    minHeight: 140,
  },
  rootProvenance: {
    borderLeftColor: researchAccentTint(0.35),
  },
  header: {
    flex: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    minHeight: 26,
    fontFamily: researchMono,
    fontSize: 11,
    color: theme.palette.text.dim,
    userSelect: 'none',
  },
  // Focused: the transcript scrolls beneath the header, so give it a real
  // bottom edge — scrolled lines tuck under a hairline instead of colliding
  // with the title.
  headerFocused: {
    paddingBottom: 7,
    borderBottom: `1px solid ${researchWarmAlpha(0.07)}`,
    marginBottom: 2,
  },
  headerTitle: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  headerMeta: {
    flex: 'none',
    color: researchWarmAlpha(0.4),
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
    animation: '$inflightPulse 1.4s ease-in-out infinite',
  },
  '@keyframes inflightPulse': {
    '0%, 100%': { opacity: 0.25, transform: 'scale(0.85)' },
    '50%': { opacity: 1, transform: 'scale(1)' },
  },
  errorGlyph: {
    flex: 'none',
    color: theme.palette.error?.main ?? theme.palette.text.primary,
  },
  headerButton: {
    flex: 'none',
    border: 'none',
    borderRadius: researchRadius.xs,
    background: 'transparent',
    color: theme.palette.text.dim,
    cursor: 'pointer',
    fontFamily: researchMono,
    fontSize: 10.5,
    lineHeight: 1.4,
    padding: '2px 6px',
    whiteSpace: 'nowrap',
    '&:hover': {
      color: theme.palette.text.primary,
      background: researchWarmAlpha(0.06),
    },
  },
  collapseButton: {
    width: 20,
    height: 20,
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapseIcon: {
    '--icon-size': '13px',
  },
  // PanelRightIcon is a raw SVG sized in em, so drive it with font-size.
  panelIcon: {
    fontSize: 13,
    display: 'block',
  },
  // --- Blurred body -------------------------------------------------------
  blurredBody: {
    position: 'relative',
    maxHeight: BLURRED_MAX_CONTENT_HEIGHT,
    overflow: 'hidden',
    marginTop: 2,
  },
  blurredBodyOverflowing: {
    maskImage: `linear-gradient(to bottom, ${theme.palette.text.alwaysBlack} calc(100% - 32px), transparent 100%)`,
  },
  presentationProse: {
    ...researchChatProse(theme),
    fontSize: 14.5,
    lineHeight: 1.6,
    fontFamily: researchChatSans,
    color: theme.palette.text.primary,
  },
  emptyPlaceholder: {
    fontSize: 13,
    fontStyle: 'italic',
    color: theme.palette.text.dim,
  },
  activityLine: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 7,
    marginTop: 4,
    fontFamily: researchMono,
    fontSize: 11.5,
    color: theme.palette.text.dim,
    minWidth: 0,
  },
  activityText: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  activityGlyph: {
    flex: 'none',
    color: theme.palette.primary.main,
  },
  // --- Focused body ---------------------------------------------------------
  composerWrap: {
    flex: 'none',
    paddingRight: 6,
  },
}));

interface AgentBlockComponentProps {
  nodeKey: NodeKey;
  conversationId: string;
  producedByConversationId: string | null;
}

export function AgentBlockComponent({ nodeKey: _nodeKey, conversationId, producedByConversationId }: AgentBlockComponentProps) {
  const classes = useStyles(styles);
  // Enforces the structural invariant that AgentBlocks only mount inside the
  // document editor, where the research providers are present.
  useResearchEditorEnvironment();
  const pending = usePendingConversation(conversationId);
  const wasPendingRef = useRef(false);
  if (pending) wasPendingRef.current = true;

  const fromAgent = !!producedByConversationId;

  if (!conversationId || pending) {
    return (
      <div
        className={classNames(classes.root, fromAgent && classes.rootProvenance)}
        data-testid="research-agent-block-pending"
      >
        <div className={classes.header}>
          <span className={classes.pulseDot} aria-label="Sending query" />
          <span className={classes.headerTitle}>
            {pending ? htmlToTextDefault(pending.promptHtml) : 'Sending query…'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <ActiveAgentBlock
      conversationId={conversationId}
      fromAgent={fromAgent}
      justDispatched={wasPendingRef.current}
    />
  );
}

interface ActiveAgentBlockProps {
  conversationId: string;
  fromAgent: boolean;
  justDispatched: boolean;
}

function ActiveAgentBlock({ conversationId, fromAgent, justDispatched }: ActiveAgentBlockProps) {
  const classes = useStyles(styles);
  const env = useResearchEditorEnvironment();
  const workspace = useResearchWorkspaceApiOptional();
  const { flash } = useMessages();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [focused, setFocused] = useState(false);
  // Set while a programmatic focus (sidebar / palette jump) still needs the
  // document positioned on the block.
  const pendingFocusScrollRef = useRef(false);
  // Set when the user clicked the blurred block; the expansion gets a
  // minimal instant correction so the whole block (incl. composer) is in view.
  const manualFocusRef = useRef(false);
  const [sending, setSending] = useState(false);

  const {
    events, status, error, turnInFlight, hasMoreOlder, loadingOlder, loadOlder,
    markTurnExpected, injectOptimisticEvent, clearOptimistic, refresh,
  } = useConversationStream(conversationId);

  useEffect(() => {
    if (justDispatched) markTurnExpected();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep keystrokes / pointer events inside the block (transcript, composer)
  // away from the host document editor.
  useStopLexicalEventPropagation(rootRef);

  const { data: conversationData, refetch: refetchConversation } = useQuery(ResearchConversationBlockQuery, {
    variables: { conversationId },
    fetchPolicy: 'cache-and-network',
  });
  const conversation = conversationData?.researchConversation?.result;

  // Reading the conversation = reading it: focusing the block stamps it read,
  // and a turn completing while the user has it focused stamps again so the
  // sidebar's unread dot never lights up for something they just watched.
  const markConversationRead = useMarkConversationRead();
  useEffect(() => {
    if (focused) markConversationRead(conversationId);
  }, [focused, conversationId, markConversationRead]);

  // The agent may have updated its presentation (or the background title
  // generation may have landed) during the turn — refresh on completion.
  const wasInFlightRef = useRef(false);
  useEffect(() => {
    if (wasInFlightRef.current && !turnInFlight) {
      void refetchConversation();
      if (focused) markConversationRead(conversationId);
    }
    wasInFlightRef.current = turnInFlight;
  }, [turnInFlight, refetchConversation, focused, conversationId, markConversationRead]);

  const visibleEvents = useMemo(
    () => events.filter(isVisibleConversationEvent),
    [events],
  );
  const userTurnCount = useMemo(
    () => events.reduce((n, e) => (e.kind === 'user' ? n + 1 : n), 0),
    [events],
  );

  // Workspace-level "jump to this conversation" requests (sidebar, palette).
  const focusRequest = workspace?.conversationFocusRequest ?? null;
  useEffect(() => {
    if (focusRequest && focusRequest.conversationId === conversationId) {
      setFocused(true);
      pendingFocusScrollRef.current = true;
      workspace?.ackConversationFocus(focusRequest.nonce);
    }
  }, [focusRequest, conversationId, workspace]);

  // Position the document on the expanded block in the same frame the
  // focused layout commits (layout effect = before paint): the block appears
  // already open, in view, with the transcript pinned to the bottom by its
  // own mount effect. A smooth scroll here reads as disorienting drift.
  //
  // Content keeps settling after that first snap — collab sync streaming the
  // document in above the block, iframe widgets reporting their real height,
  // the transcript itself loading — each shift shoving the block around the
  // viewport. So the block stays the scroll anchor for as long as layout
  // keeps changing (ResizeObserver on the editor body and the block itself;
  // every snap is instant and a no-op when stable), until the user interacts
  // — from then on the scroll position is theirs.
  useLayoutEffect(() => {
    if (!focused) return;
    if (manualFocusRef.current) {
      manualFocusRef.current = false;
      // Manual click: the block expands in place in one frame; just make
      // sure it fits in the viewport, with the smallest possible jump.
      rootRef.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    }
    if (!pendingFocusScrollRef.current) return;
    pendingFocusScrollRef.current = false;
    const root = rootRef.current;
    if (!root) return;
    // 'instant', not the default 'auto': auto defers to any
    // `scroll-behavior: smooth` CSS in the environment (browser extensions
    // and user stylesheets inject this), which would animate every snap.
    const snap = () => rootRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    snap();
    const observer = new ResizeObserver(snap);
    observer.observe(root);
    // The document editor's body — NOT `[contenteditable]`, which would match
    // the block's own contenteditable="false" decorator wrapper first.
    const editorBody = root.closest('[contenteditable="true"]');
    if (editorBody) observer.observe(editorBody);
    const stopAnchoring = () => observer.disconnect();
    const interactionEvents = ['wheel', 'touchmove', 'pointerdown', 'keydown'] as const;
    for (const eventName of interactionEvents) {
      window.addEventListener(eventName, stopAnchoring, { capture: true, passive: true });
    }
    return () => {
      stopAnchoring();
      for (const eventName of interactionEvents) {
        window.removeEventListener(eventName, stopAnchoring, { capture: true });
      }
    };
  }, [focused]);

  const blurBlock = useCallback(() => {
    setFocused(false);
  }, []);

  // Click out → blur. Capture phase, because the block stops bubbling-phase
  // pointer events at its root (see useStopLexicalEventPropagation above).
  useEffect(() => {
    if (!focused) return;
    const onPointerDown = (e: PointerEvent) => {
      const root = rootRef.current;
      if (root && e.target instanceof Node && !root.contains(e.target)) {
        // Popovers spawned from the header (e.g. the restart-sandbox menu)
        // portal to document.body; clicking them must not collapse the block.
        if (e.target instanceof Element && e.target.closest('[data-research-popover]')) return;
        blurBlock();
      }
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [focused, blurBlock]);

  // Esc → blur. Native listener: keydown propagation is stopped at the block
  // root, so a React synthetic handler would never fire.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !focused) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') blurBlock();
    };
    root.addEventListener('keydown', onKeyDown);
    return () => root.removeEventListener('keydown', onKeyDown);
  }, [focused, blurBlock]);

  const [continueConversation] = useMutation(ContinueResearchConversationFromBlockMutation);
  const [cancelConversation] = useMutation(CancelResearchConversationFromBlockMutation);

  const handleSend = useCallback(async (promptHtml: string) => {
    if (sending) return;
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
        variables: { conversationId, promptHtml, activeDocumentId: env.documentId },
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
  }, [sending, conversationId, env.documentId, continueConversation, markTurnExpected, injectOptimisticEvent, clearOptimistic, refresh, flash]);

  const handleCancel = useCallback(async () => {
    await cancelConversation({ variables: { conversationId } });
  }, [cancelConversation, conversationId]);

  const handleFocusClick = useCallback(() => {
    if (!focused) {
      manualFocusRef.current = true;
      setFocused(true);
    }
  }, [focused]);

  const handleCollapseClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    blurBlock();
  }, [blurBlock]);

  const title = conversation?.title ?? 'Conversation';
  const headerGlyph = turnInFlight
    ? <span className={classes.pulseDot} aria-label="Agent is responding" />
    : status === 'error'
      ? <span className={classes.errorGlyph} title={error ?? 'error'}>✕</span>
      : null;

  return (
    <div
      ref={rootRef}
      className={classNames(classes.root, {
        [classes.rootBlurred]: !focused,
        [classes.rootFocused]: focused,
        [classes.rootProvenance]: fromAgent && !focused,
      })}
      onClick={handleFocusClick}
      data-testid="research-agent-block"
    >
      <div className={classNames(classes.header, focused && classes.headerFocused)}>
        {headerGlyph}
        <span className={classes.headerTitle}>{title}</span>
        <span className={classes.headerMeta}>
          · {userTurnCount} {userTurnCount === 1 ? 'turn' : 'turns'}
        </span>
        <span className={classes.headerSpacer} />
        {focused ? (
          <>
            {turnInFlight ? (
              <button type="button" className={classes.headerButton} onClick={handleCancel}>
                ■ stop
              </button>
            ) : null}
            <ConversationActions conversationId={conversationId} projectId={env.projectId} />
            {workspace ? (
              <>
                <button
                  type="button"
                  className={classNames(classes.headerButton, classes.collapseButton)}
                  onClick={(e) => {
                    e.stopPropagation();
                    workspace.openConversationChat(conversationId);
                  }}
                  title="Open in side panel"
                  aria-label="Open in side panel"
                >
                  <PanelRightIcon className={classes.panelIcon} />
                </button>
                <button
                  type="button"
                  className={classNames(classes.headerButton, classes.collapseButton)}
                  onClick={(e) => {
                    e.stopPropagation();
                    workspace.openConversationChat(conversationId, { fullscreen: true });
                  }}
                  title="Open full screen"
                  aria-label="Open full screen"
                >
                  <ForumIcon icon="Fullscreen" className={classes.collapseIcon} />
                </button>
              </>
            ) : null}
            <button
              type="button"
              className={classNames(classes.headerButton, classes.collapseButton)}
              onClick={handleCollapseClick}
              title="Collapse (Esc)"
              aria-label="Collapse"
            >
              <ForumIcon icon="Close" className={classes.collapseIcon} />
            </button>
          </>
        ) : null}
      </div>
      {focused ? (
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
              projectId={env.projectId}
              disabled={sending}
              onSubmit={handleSend}
            />
          </div>
        </>
      ) : (
        <BlurredPresentation
          events={visibleEvents}
          turnInFlight={turnInFlight}
          status={status}
          presentationHtml={conversation?.presentationHtml ?? null}
        />
      )}
    </div>
  );
}

interface BlurredPresentationProps {
  events: ConversationEvent[];
  turnInFlight: boolean;
  status: string;
  presentationHtml: string | null;
}

/**
 * The blurred block's body: agent-authored presentation HTML when set,
 * otherwise the last assistant message rendered as prose, clamped with a
 * bottom fade. While a turn runs, a live one-line activity readout of the
 * latest event sits underneath.
 */
function BlurredPresentation({ events, turnInFlight, status, presentationHtml }: BlurredPresentationProps) {
  const classes = useStyles(styles);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [overflowing, setOverflowing] = useState(false);

  const html = useMemo(() => {
    if (presentationHtml) return sanitize(presentationHtml);
    const lastAssistantText = getLastAssistantText(events);
    return lastAssistantText ? renderChunkMarkdownToHtml(lastAssistantText) : null;
  }, [presentationHtml, events]);

  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (el) setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [html]);

  const latestActivity = turnInFlight ? getLatestActivityLine(events) : null;

  return (
    <>
      {html ? (
        <div
          ref={bodyRef}
          className={classNames(classes.blurredBody, overflowing && classes.blurredBodyOverflowing)}
        >
          <ContentStyles contentType="llmChat" className={classes.presentationProse}>
            <ContentItemBody dangerouslySetInnerHTML={{ __html: html }} />
          </ContentStyles>
        </div>
      ) : !turnInFlight ? (
        <div className={classes.emptyPlaceholder}>
          {status === 'loading' ? 'Loading…' : 'No output yet.'}
        </div>
      ) : null}
      {latestActivity ? (
        <div className={classes.activityLine}>
          <span className={classes.activityGlyph}>✻</span>
          <span className={classes.activityText}>{latestActivity}</span>
        </div>
      ) : null}
    </>
  );
}

function getLastAssistantText(events: ConversationEvent[]): string | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    if (event.kind !== 'assistant') continue;
    const text = getConversationEventChunks(event)
      .filter((c) => c.kind === 'text')
      .map((c) => c.text)
      .join('\n\n')
      .trim();
    if (text) return text;
  }
  return null;
}

function getLatestActivityLine(events: ConversationEvent[]): string {
  for (let i = events.length - 1; i >= 0; i--) {
    const chunks = getConversationEventChunks(events[i]);
    const chunk = chunks.find((c) => c.text.trim().length > 0);
    if (chunk) {
      const compact = chunk.text.trim().replace(/\s+/g, ' ');
      return compact.length > 160 ? compact.slice(0, 160).trimEnd() + '…' : compact;
    }
  }
  return 'working…';
}
