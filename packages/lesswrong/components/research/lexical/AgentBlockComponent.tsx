'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey, type NodeKey } from 'lexical';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useConversationStream, type ConversationEvent } from '@/components/research/hooks/useConversationStream';
import { $isAgentBlockNode } from './AgentBlockNode';
import { useResearchEditorEnvironment, useResearchNavigationContext } from './ResearchEditorContext';
import {
  getConversationEventChunks,
  isVisibleConversationEvent,
} from '../conversationEventFormat';
import ForumIcon from '@/components/common/ForumIcon';

/**
 * Vertical room for ~1–2 paragraphs of body copy at the editor's 14px/1.55
 * baseline. Scroll kicks in past this; shorter content shrinks the chip
 * naturally because the inner column is the height contributor.
 */
const EXPANDED_MAX_CONTENT_HEIGHT = 200;
// Visible bottom indicator: a thin gradient hint. The hover target around it
// is taller (`COLLAPSE_HOVER_HEIGHT`) so users don't have to be pixel-precise
// to reveal the collapse arrow.
const COLLAPSE_GRADIENT_HEIGHT = 14;
const COLLAPSE_HOVER_HEIGHT = 36;

const styles = defineStyles('AgentBlockComponent', (theme: ThemeType) => ({
  root: {
    position: 'relative',
    border: theme.palette.greyBorder('1px', 0.09),
    borderRadius: 6,
    background: theme.palette.greyAlpha(0.025),
    padding: '8px 64px 8px 14px',
    margin: '10px 0',
    fontSize: '0.95em',
    // Pin line-height in pixels so different chunk kinds (which override
    // font-size and font-family on the inline preview span — e.g. tool_use
    // is monospace + 0.85em) don't change the row's vertical metrics. A
    // unitless line-height multiplier inherits per-element by computed
    // font-size, which causes the AgentBlock to twitch ±2-3px every time a
    // new event of a different kind streams in.
    lineHeight: '20px',
    display: 'flex',
    // Baseline-align so the small uppercase speaker label and the larger
    // preview text share a typographic baseline. With `center` they'd both
    // be vertically centered as line-boxes — and since the smaller font's
    // glyphs sit higher within their own line-box than the larger font's,
    // the speaker label visually floats above the preview. The status dot
    // / checkmark / OpenInNew button each opt out via `alignSelf: center`
    // so they stay vertically centered (their synthetic baseline would
    // otherwise be the bottom of the element).
    alignItems: 'baseline',
    gap: 10,
    minHeight: 36,
    // When the AgentBlock sits inside an unrevealed spoiler, mask its colored
    // chrome so the spoiler's hide-until-hover semantics apply uniformly. The
    // chip's own speaker label / preview / pulse dot / border / icon all set
    // explicit colors that would otherwise punch through the spoiler's
    // cascading `color: spoilerBlock`. As soon as the user hovers any
    // descendant — including this block — the parent `.spoilers` matches
    // `:hover` and the override turns off, revealing the AgentBlock as
    // normal.
    '.spoilers:not(:hover) &': {
      backgroundColor: 'transparent',
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
  // Expanded layout: vertical stack of events instead of a single row, with
  // a sticky bottom collapse affordance overlaid on the scroll container.
  // Vertical padding is owned by `scrollContainer` so top and bottom stay
  // symmetric (the bottom needs gradient clearance; we mirror it on top).
  rootExpanded: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 0,
    padding: '0 64px 0 14px',
  },
  rootProvenance: {
    borderColor: theme.palette.greyAlpha(0.16),
    background: theme.palette.greyAlpha(0.04),
    boxShadow: `inset 3px 0 0 ${theme.palette.primary.main}`,
    paddingLeft: 17,
  },
  pulseDot: {
    flex: 'none',
    alignSelf: 'center',
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
  speaker: {
    flex: 'none',
    fontSize: '0.7em',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: theme.palette.greyAlpha(0.5),
    userSelect: 'none',
  },
  speakerUser: {
    color: theme.palette.greyAlpha(0.7),
  },
  speakerAssistant: {
    color: theme.palette.primary.main,
  },
  speakerError: {
    color: theme.palette.error?.main ?? theme.palette.text.primary,
  },
  preview: {
    flex: 1,
    minWidth: 0,
    color: theme.palette.text.primary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  previewThinking: {
    color: theme.palette.greyAlpha(0.55),
    fontStyle: 'italic',
  },
  previewTool: {
    fontFamily: 'monospace',
    fontSize: '0.85em',
    color: theme.palette.greyAlpha(0.7),
  },
  previewError: {
    color: theme.palette.error?.main ?? theme.palette.text.primary,
  },
  empty: {
    color: theme.palette.greyAlpha(0.5),
    fontStyle: 'italic',
    fontSize: '0.9em',
  },
  // Pulse-dot replacement once a `result` event has been received and the
  // agent isn't currently mid-turn. Same hue as the pulse so the chip's
  // status indicator stays visually in the same column.
  doneIcon: {
    flex: 'none',
    alignSelf: 'center',
    '--icon-size': '12px',
    color: theme.palette.primary.main,
  },
  iconButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
    borderRadius: 4,
    color: theme.palette.greyAlpha(0.5),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:hover': {
      color: theme.palette.text.primary,
      background: theme.palette.greyAlpha(0.06),
    },
  },
  expandIcon: {
    '--icon-size': '14px',
    // ChevronRight rotated to point downward — "expand" means "open below".
    transform: 'rotate(90deg)',
  },
  icon: {
    '--icon-size': '16px',
  },
  statusError: {
    fontSize: '0.75em',
    color: theme.palette.error?.main ?? theme.palette.text.primary,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    flex: 'none',
  },

  // --- Expanded body ----------------------------------------------------
  scrollContainer: {
    maxHeight: EXPANDED_MAX_CONTENT_HEIGHT,
    overflowY: 'auto',
    // Bottom padding leaves room for the gradient indicator so it fades
    // over empty space at the end of the scroll, not over the last line.
    // Top padding mirrors it so the chip's interior stays vertically symmetric.
    padding: `${COLLAPSE_GRADIENT_HEIGHT + 4}px 0`,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    minWidth: 0,
  },
  eventRow: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    columnGap: 12,
    alignItems: 'baseline',
  },
  eventChunks: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 0,
  },
  chunkText: {
    color: theme.palette.text.primary,
    overflowWrap: 'anywhere',
    whiteSpace: 'pre-wrap',
  },
  chunkThinking: {
    color: theme.palette.greyAlpha(0.55),
    fontStyle: 'italic',
    fontSize: '0.92em',
    borderLeft: `2px solid ${theme.palette.greyAlpha(0.15)}`,
    paddingLeft: 10,
    whiteSpace: 'pre-wrap',
  },
  chunkToolUse: {
    background: theme.palette.greyAlpha(0.04),
    border: theme.palette.greyBorder('1px', 0.08),
    borderRadius: 4,
    padding: '6px 10px',
    fontFamily: 'monospace',
    fontSize: '0.85em',
    whiteSpace: 'pre-wrap',
  },
  chunkToolResult: {
    background: theme.palette.greyAlpha(0.04),
    border: theme.palette.greyBorder('1px', 0.08),
    borderRadius: 4,
    padding: '6px 10px',
    fontFamily: 'monospace',
    fontSize: '0.85em',
    color: theme.palette.greyAlpha(0.65),
    whiteSpace: 'pre-wrap',
  },

  // --- Bottom-border toggle affordance ---------------------------------
  // Same slot for both directions — collapse when expanded, expand when
  // not. The strip is the visual + layout container; the gradient is the
  // "there's something here" indicator; the button is the actual click
  // target. All gated on root hover, so a chip at rest reads as clean.
  // The strip itself is `pointer-events: none` so the user can still
  // click/hover the chip body underneath; only the button captures clicks.
  collapseStrip: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: COLLAPSE_HOVER_HEIGHT,
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  collapseGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: COLLAPSE_GRADIENT_HEIGHT,
    background: `linear-gradient(to bottom, ${theme.palette.greyAlpha(0)} 0%, ${theme.palette.greyAlpha(0.06)} 60%, ${theme.palette.greyAlpha(0.14)} 100%)`,
    pointerEvents: 'none',
    borderRadius: '0 0 6px 6px',
    opacity: 0,
    transition: 'opacity 120ms ease',
    '$root:hover &': {
      opacity: 1,
    },
  },
  collapseButton: {
    position: 'relative',
    width: 26,
    height: 16,
    marginBottom: -8,
    padding: 0,
    border: theme.palette.greyBorder('1px', 0.15),
    borderRadius: 8,
    background: theme.palette.background.default,
    color: theme.palette.text.dim,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto',
    opacity: 0,
    transition: 'opacity 120ms ease',
    '$root:hover &': {
      opacity: 1,
    },
    '&:hover': {
      color: theme.palette.text.primary,
      background: theme.palette.background.pageActiveAreaBackground ?? theme.palette.background.default,
    },
  },
  collapseIcon: {
    '--icon-size': '14px',
    // ChevronRight rotated to point upward — collapse means "fold up".
    transform: 'rotate(-90deg)',
  },
}));

interface AgentBlockComponentProps {
  nodeKey: NodeKey;
  conversationId: string;
  producedByConversationId: string | null;
}

export function AgentBlockComponent({ nodeKey, conversationId, producedByConversationId }: AgentBlockComponentProps) {
  const classes = useStyles(styles);
  const [editor] = useLexicalComposerContext();
  // Required to enforce the structural invariant that AgentBlocks only mount
  // inside the document editor, where both providers are present.
  useResearchEditorEnvironment();
  const nav = useResearchNavigationContext();

  const fromAgent = !!producedByConversationId;

  const removeBlock = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isAgentBlockNode(node)) node.remove();
    });
  }, [editor, nodeKey]);

  if (!conversationId) {
    return (
      <div
        className={classNames(classes.root, fromAgent && classes.rootProvenance)}
        data-testid="research-agent-block-pending"
      >
        <span className={classes.pulseDot} aria-label="Sending query" />
        <span className={classes.preview}>Sending query…</span>
      </div>
    );
  }

  return (
    <ActiveAgentBlock
      conversationId={conversationId}
      fromAgent={fromAgent}
      onOpenInChat={nav.openConversationInChat}
      onRemove={removeBlock}
    />
  );
}

interface ActiveAgentBlockProps {
  conversationId: string;
  fromAgent: boolean;
  onOpenInChat: (conversationId: string) => void;
  onRemove: () => void;
}

function ActiveAgentBlock({ conversationId, fromAgent, onOpenInChat, onRemove: _onRemove }: ActiveAgentBlockProps) {
  const classes = useStyles(styles);
  const { events, status, error } = useConversationStream(conversationId);

  // Single pass over events: count user/result turns, collect visible ones,
  // and capture the latest. `turnInFlight` is true whenever there are more
  // user prompts than result markers (Claude Code emits exactly one `result`
  // per turn, regardless of intermediate tool/thinking events).
  const { resultCount, turnInFlight, visibleEvents, latestVisible } = useMemo(() => {
    let userCount = 0;
    let rc = 0;
    const visible: ConversationEvent[] = [];
    for (const e of events) {
      if (e.kind === 'user') userCount++;
      else if (e.kind === 'result') rc++;
      if (isVisibleConversationEvent(e)) visible.push(e);
    }
    return {
      resultCount: rc,
      turnInFlight: userCount > rc,
      visibleEvents: visible,
      latestVisible: visible.length > 0 ? visible[visible.length - 1] : null,
    };
  }, [events]);

  // Auto-expand on the falling edge of `turnInFlight` only, so loading a
  // document with previously-completed blocks (no rising edge) leaves them
  // collapsed; a turn the user actually watches complete expands.
  const [expanded, setExpanded] = useState(false);
  const wasInFlightRef = useRef(false);
  useEffect(() => {
    if (wasInFlightRef.current && !turnInFlight) {
      setExpanded(true);
    }
    wasInFlightRef.current = turnInFlight;
  }, [turnInFlight]);

  const handleOpenInChat = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      // Stop propagation so the click doesn't also bubble to Lexical's
      // selection handler and move the cursor into the (decorator) block.
      e.stopPropagation();
      e.preventDefault();
      onOpenInChat?.(conversationId);
    },
    [conversationId, onOpenInChat],
  );

  const handleCollapse = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      e.preventDefault();
      setExpanded(false);
    },
    [],
  );

  const handleExpand = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      e.preventDefault();
      setExpanded(true);
    },
    [],
  );

  return (
    <div
      className={classNames(
        classes.root,
        fromAgent && classes.rootProvenance,
        expanded && classes.rootExpanded,
      )}
      data-testid="research-agent-block"
    >
      {expanded ? (
        <ExpandedBody
          visibleEvents={visibleEvents}
          turnInFlight={turnInFlight}
          status={status}
          error={error}
        />
      ) : (
        <>
          {turnInFlight ? (
            <span className={classes.pulseDot} aria-label="Agent is responding" />
          ) : resultCount > 0 ? (
            <ForumIcon icon="Check" className={classes.doneIcon} aria-label="Agent done" />
          ) : null}
          <LatestEventPreview event={latestVisible} status={status} />
          {status === 'error' && error ? (
            <span className={classes.statusError} title={error}>error</span>
          ) : null}
        </>
      )}
      <button
        type="button"
        className={classes.iconButton}
        onClick={handleOpenInChat}
        onMouseDown={(e) => e.preventDefault()}
        title="Open conversation in chat"
        aria-label="Open conversation in chat"
      >
        <ForumIcon icon="OpenInNew" className={classes.icon} />
      </button>
      {expanded || resultCount > 0 ? (
        <div className={classes.collapseStrip}>
          <div className={classes.collapseGradient} />
          <button
            type="button"
            className={classes.collapseButton}
            onClick={expanded ? handleCollapse : handleExpand}
            onMouseDown={(e) => e.preventDefault()}
            title={expanded ? 'Collapse' : 'Expand'}
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            <ForumIcon
              icon="ChevronRight"
              className={expanded ? classes.collapseIcon : classes.expandIcon}
            />
          </button>
        </div>
      ) : null}
    </div>
  );
}

interface ExpandedBodyProps {
  visibleEvents: ConversationEvent[];
  turnInFlight: boolean;
  status: ReturnType<typeof useConversationStream>['status'];
  error: string | null;
}

function ExpandedBody({ visibleEvents, turnInFlight, status, error }: ExpandedBodyProps) {
  const classes = useStyles(styles);

  // Auto-scroll to the latest event whenever the content grows so the user
  // sees what just arrived without scrolling manually. We pin to bottom only
  // while a turn is in flight; once it completes the user owns the scroll.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!turnInFlight) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visibleEvents.length, turnInFlight]);

  if (visibleEvents.length === 0) {
    return (
      <div className={classNames(classes.scrollContainer)} ref={scrollRef}>
        <span className={classNames(classes.preview, classes.empty)}>
          {status === 'loading' || status === 'connecting' ? 'Waiting for agent response…' : 'No output yet.'}
        </span>
      </div>
    );
  }

  return (
    <div className={classes.scrollContainer} ref={scrollRef}>
      {visibleEvents.map((event) => (
        <ExpandedEventRow key={`${event.seq}-${event._id}`} event={event} />
      ))}
      {status === 'error' && error ? (
        <span className={classes.statusError} title={error}>error</span>
      ) : null}
    </div>
  );
}

function ExpandedEventRow({ event }: { event: ConversationEvent }) {
  const classes = useStyles(styles);
  const chunks = getConversationEventChunks(event);
  if (chunks.length === 0) return null;
  const speakerLabel = event.kind === 'user' ? 'You' : event.kind === 'error' ? 'Error' : 'Agent';
  const speakerClass = classNames(classes.speaker, {
    [classes.speakerUser]: event.kind === 'user',
    [classes.speakerAssistant]: event.kind === 'assistant',
    [classes.speakerError]: event.kind === 'error',
  });
  const chunkClassByKind: Record<string, string> = {
    thinking: classes.chunkThinking,
    tool_use: classes.chunkToolUse,
    tool_result: classes.chunkToolResult,
  };
  return (
    <div className={classes.eventRow}>
      <div className={speakerClass}>{speakerLabel}</div>
      <div className={classes.eventChunks}>
        {chunks.map((chunk, i) => (
          <div key={i} className={chunkClassByKind[chunk.kind] ?? classes.chunkText}>{chunk.text}</div>
        ))}
      </div>
    </div>
  );
}

interface LatestEventPreviewProps {
  event: ConversationEvent | null;
  status: ReturnType<typeof useConversationStream>['status'];
}

function LatestEventPreview({ event, status }: LatestEventPreviewProps) {
  const classes = useStyles(styles);

  if (!event) {
    const placeholder =
      status === 'loading' || status === 'connecting'
        ? 'Waiting for agent response…'
        : 'No output yet.';
    return <span className={classNames(classes.preview, classes.empty)}>{placeholder}</span>;
  }

  const chunks = getConversationEventChunks(event);
  // First non-empty chunk's text drives the preview. Multi-chunk events
  // (e.g. thinking + text) are folded to whichever chunk leads — we render
  // its kind for styling so a still-thinking event reads as italic-grey
  // instead of normal text.
  const chunk = chunks.find((c) => c.text.length > 0);
  const text = chunk?.text ?? '';
  const speakerLabel =
    event.kind === 'user' ? 'You' : event.kind === 'error' ? 'Error' : 'Agent';
  const speakerClass = classNames(classes.speaker, {
    [classes.speakerUser]: event.kind === 'user',
    [classes.speakerAssistant]: event.kind === 'assistant',
    [classes.speakerError]: event.kind === 'error',
  });
  const previewClass = classNames(classes.preview, {
    [classes.previewThinking]: chunk?.kind === 'thinking',
    [classes.previewTool]: chunk?.kind === 'tool_use' || chunk?.kind === 'tool_result',
    [classes.previewError]: event.kind === 'error',
  });

  return (
    <>
      <span className={speakerClass}>{speakerLabel}</span>
      <span className={previewClass}>{text || '…'}</span>
    </>
  );
}
