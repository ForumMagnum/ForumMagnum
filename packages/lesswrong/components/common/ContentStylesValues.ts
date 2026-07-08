import { defineStyles } from '../hooks/defineStyles';
import { postBodyStyles, smallPostStyles, commentBodyStyles } from '../../themes/stylePiping'
import classNames from 'classnames';
import { researchAccentTint, researchWarmAlpha, researchRadius, researchChatSurface, researchChatSans, researchInputBackground } from '../research/researchStyleUtils';

/**
 * Research-document editor styling. Inherits the full postBodyStyles surface
 * (so spoilers, footnotes, embeds, tables, code blocks, etc. all look right),
 * then restyles the editor's own typography under `[contenteditable="true"]`:
 * a serif essay reading column (research docs read as essays-in-progress, not
 * tool output) for paragraphs / headings / lists / blockquotes, plus
 * placeholder positioning that lines up with where the user's first paragraph
 * would actually sit.
 *
 * Keep editor-specific rules scoped to the contenteditable so they don't leak
 * onto floating menus, toolbars, or popovers that share the wrapper. The
 * `:not(.research-query-input-content)`, `:not(.research-chat-composer *)`, and
 * `:not(.research-agent-block *)` guards exclude the query input, the nested
 * conversation-block composer, and agent transcript/presentation content,
 * which carry their own chat voice rather than the document's reading column.
 */
const researchDocumentBodyStyles = (theme: ThemeType) => ({
  ...postBodyStyles(theme),
  '& [contenteditable="true"]:not(.research-query-input-content):not(.research-chat-composer *)': {
    minHeight: 'calc(100vh - var(--header-height, 0px))',
    boxSizing: 'border-box',
    fontSize: 18,
    lineHeight: 1.65,
    fontFamily: theme.palette.fonts.serifStack,
    color: theme.palette.text.primary,
    maxWidth: 760 + (2 * 32),
    margin: '0 auto',
    padding: '44px 32px 160px',
  },
  '& [contenteditable="true"] p:not(.research-agent-block *)': {
    margin: '0 0 0.7em',
  },
  '& [contenteditable="true"] h1:not(.research-agent-block *)': {
    fontSize: 32,
    lineHeight: 1.2,
    margin: '0.9em 0 0.45em',
    fontWeight: 400,
    fontFamily: theme.palette.fonts.headerStack,
  },
  '& [contenteditable="true"] h2:not(.research-agent-block *)': {
    fontSize: 24,
    lineHeight: 1.25,
    margin: '1em 0 0.45em',
    fontWeight: 600,
    fontFamily: theme.palette.fonts.serifStack,
  },
  '& [contenteditable="true"] h3:not(.research-agent-block *)': {
    fontSize: 20,
    lineHeight: 1.3,
    margin: '1em 0 0.45em',
    fontWeight: 600,
    fontFamily: theme.palette.fonts.serifStack,
  },
  '& [contenteditable="true"] h4:not(.research-agent-block *)': {
    fontSize: 18,
    lineHeight: 1.35,
    margin: '1em 0 0.45em',
    fontWeight: 600,
    fontStyle: 'italic',
    fontFamily: theme.palette.fonts.serifStack,
  },
  '& [contenteditable="true"] li:not(.research-agent-block *)': {
    fontSize: 18,
    lineHeight: 1.65,
    fontFamily: theme.palette.fonts.serifStack,
    color: theme.palette.text.primary,
  },
  '& [contenteditable="true"] blockquote:not(.research-agent-block *)': {
    fontSize: 18,
    lineHeight: 1.65,
    fontFamily: theme.palette.fonts.serifStack,
    margin: '0.5em 0',
    padding: '0.25em 0.75em',
    borderLeft: `3px solid ${theme.palette.greyAlpha(0.15)}`,
    color: theme.palette.text.primary,
    fontStyle: 'normal',
  },
  '& mark.editor-mark': {
    background: researchAccentTint(0.14),
    borderBottom: `2px solid ${researchAccentTint(0.45)}`,
    padding: '1px 0',
    color: 'inherit',
  },
  '& mark.editor-mark.selected': {
    background: researchAccentTint(0.28),
    borderBottom: `2px solid ${researchAccentTint(0.7)}`,
  },
  // Placeholder is a sibling of the contenteditable, absolutely positioned
  // at the top-left of the editor shell, so it doesn't pick up the
  '& .LexicalContentEditable-placeholder:not(.research-chat-composer *)': {
    top: 44,
    left: 0,
    right: 0,
    maxWidth: 760,
    margin: '0 auto',
    fontSize: 18,
    lineHeight: 1.65,
    fontStyle: 'italic',
    fontFamily: theme.palette.fonts.serifStack,
  },
  // In-document conversation composer (ConversationComposerNode): a chat-voiced
  // box whose draft lives in the Yjs doc (live + persistent). Reads as a
  // composer, not essay prose — so it opts out of the serif reading column
  // (its editable content carries the `research-query-input-content` class,
  // already exempted above) and sits as a rounded input box with a send hint.
  '& .research-conversation-composer': {
    position: 'relative',
    margin: '12px 0',
    padding: '9px 44px 9px 13px',
    border: `1px solid ${researchWarmAlpha(0.16)}`,
    borderRadius: researchRadius.md,
    background: researchChatSurface(theme),
    fontFamily: researchChatSans,
    fontSize: 15,
    lineHeight: 1.5,
    color: theme.palette.text.primary,
  },
  // Persistent "⌘↵ to send" affordance in the corner.
  '& .research-conversation-composer::after': {
    content: '"⌘↵"',
    position: 'absolute',
    right: 10,
    bottom: 7,
    fontSize: 11,
    color: theme.palette.text.dim,
    pointerEvents: 'none',
  },
  // v2 conversation block (ResearchConversationNode): the wrapper is the single
  // card; the transcript (chromeless via `rootEmbedded`) and the reply composer
  // live inside it as one unit — no floating second box.
  '& .research-conversation': {
    margin: '14px 0',
    border: `1px solid ${researchWarmAlpha(0.14)}`,
    borderRadius: researchRadius.lg,
    background: researchChatSurface(theme),
    overflow: 'hidden',
  },
  // Inside the card the composer is chromeless and separated from the transcript
  // above it by a hairline seam.
  '& .research-conversation .research-conversation-composer': {
    margin: 0,
    border: 'none',
    borderTop: `1px solid ${researchWarmAlpha(0.1)}`,
    borderRadius: 0,
    background: 'transparent',
  },
  // Expanded: the composer reads as a real, inviting input — inset from the card
  // edges, brighter than the surface, bordered and taller — so it's an obvious
  // place to type rather than a chromeless strip.
  '& .research-conversation[data-expanded="true"] .research-conversation-composer': {
    margin: 10,
    minHeight: '2.6em',
    padding: '11px 44px 11px 13px',
    border: `1px solid ${researchWarmAlpha(0.2)}`,
    borderRadius: researchRadius.md,
    background: researchInputBackground(theme),
  },
  // Collapsed block: show a dimmed, non-interactive preview of an unsent draft
  // (data-draft is set by the transcript component; see AgentBlockComponent) —
  // and hide the composer entirely when there's no draft. Expanded, the
  // composer is fully editable (rules above). Matches the old in-block composer,
  // which only fully rendered when the block was focused.
  '& .research-conversation:not([data-expanded="true"])[data-draft="true"] .research-conversation-composer': {
    fontSize: 12.5,
    lineHeight: 1.45,
    opacity: 0.55,
    padding: '6px 13px',
    maxHeight: '3.6em',
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  '& .research-conversation:not([data-expanded="true"]):not([data-draft="true"]) .research-conversation-composer': {
    display: 'none',
  },
  // The ⌘↵ hint only makes sense in the expanded, editable composer.
  '& .research-conversation:not([data-expanded="true"]) .research-conversation-composer::after': {
    display: 'none',
  },
});

export const styles = defineStyles("ContentStyles", (theme: ThemeType) => ({
  base: {
    ...postBodyStyles(theme)
  },
  postBody: {
  },
  postHighlight: {
    ...smallPostStyles(theme),
    '& h1, & h2, & h3': {
      fontSize: "1.6rem",
      // Cancel out a negative margin which would cause clipping
      marginBlockStart: "0 !important",
    },
  },
  commentBody: {
    ...commentBodyStyles(theme),
  },
  commentBodyExceptPointerEvents: {
    ...commentBodyStyles(theme, true)
  },
  debateResponseBody: {
    ...commentBodyStyles(theme),
    fontSize: '1.35rem',
    '& .dialogue-message-header + p': {
      marginTop: 0,
    },
    '& blockquote, & li': {
      fontSize: '1.35rem'
    }
  },
  answerBody: {
    ...smallPostStyles(theme)
  },
  tagBody: {
    ...commentBodyStyles(theme),
    marginBottom: 18,
    '&& h1': {
      fontSize: '2rem',
      marginTop: '3rem',
      fontWeight:600,
      ...theme.typography.commentStyle
    },
    '&& h2': {
      fontSize: '1.7rem',
      marginTop: '1.5rem',
      fontWeight:500,
      ...theme.typography.commentStyle
    },
    '&& h3': {
      fontSize: '1.3rem',
      marginTop: '1.5rem',
      fontWeight:500,
      ...theme.typography.commentStyle
    },
    '&& h1:first-child, h2:first-child, h3:first-child': {
      marginTop: 0,
    },
  },
  llmChat: {
    ...commentBodyStyles(theme),
    fontSize: '1.0rem',
    '& blockquote, & li': {
      fontSize: '1.0rem'
    }
  },
  ultraFeed: {
    ...commentBodyStyles(theme),
    marginTop: 0,
    marginBottom: 0,
    '& p:first-child': {
      marginTop: '0 !important',
    },
    '& p:last-child': {
      marginBottom: '0 !important',
    },
    // Hide a single leading br in first paragraph, unless it's a br pair
    '& p:first-child:not(:has(> br:first-child + br)) > br:first-child': {
      display: 'none !important',
    },
    // Hide a single trailing br in last paragraph, unless it's a br pair
    '& p:last-child:not(:has(> br + br:last-child)) > br:last-child': {
      display: 'none !important',
    },
    [theme.breakpoints.down('sm')]: {
      '& h1, & h2, & h3, & h4': {
        marginBlockStart: "0 !important",
        fontFamily: theme.palette.fonts.sansSerifStack,
      },
      '& img, & iframe': {
        maxWidth: '100%',
        height: 'auto',
      },
      '& blockquote, & li': {
      }
    },
  },
  ultraFeedPost: {
    marginTop: 0,
    marginBottom: 0,
    '& p:first-child': {
      marginTop: '0 !important',
    },
    '& p:last-child': {
      marginBottom: '0 !important',
    },
    // Hide a single leading br in first paragraph, unless it's a br pair
    '& p:first-child:not(:has(> br:first-child + br)) > br:first-child': {
      display: 'none !important',
    },
    // Hide a single trailing br in last paragraph, unless it's a br pair
    '& p:last-child:not(:has(> br + br:last-child)) > br:last-child': {
      display: 'none !important',
    },
    [theme.breakpoints.down('sm')]: {
      '& h1, & h2, & h3, & h4': {
        marginBlockStart: "0 !important",
      },
      '& img, & iframe': {
        maxWidth: '100%',
        height: 'auto',
      },
      '& blockquote, & li': {
      }
    },
  },
  // Composed from `researchDocumentBodyStyles`, which itself spreads
  // `postBodyStyles` for full coverage (spoilers, footnotes, embeds, code,
  // tables, etc.) and then overrides editor-specific typography under
  // `[data-lexical-editor]`. Combined with `contentStylesClassnames`
  // skipping `base` for this type, that gives the editor exactly one source
  // of post-body styling — its own — instead of stacking post-rendering
  // defaults underneath and fighting them with overrides.
  researchDocumentBody: researchDocumentBodyStyles(theme),
}), { stylePriority: -1 });

export type ContentStyleType = "post"|"postHighlight"|"comment"|"commentExceptPointerEvents"|"answer"|"tag"|"debateResponse"|"llmChat"|"ultraFeed"|"ultraFeedPost"|"researchDocument";

export function contentStylesClassnames(classes: ReturnType<typeof styles.styles>, contentType: ContentStyleType) {
  // The research-document editor opts out of the shared `base` (postBodyStyles)
  // so its self-contained rule set isn't fighting post-rendering defaults like
  // serif typography on `& li`. Every other content type still inherits base.
  const includeBase = contentType !== "researchDocument";
  return classNames(
    includeBase && classes.base, "content",
    contentType==="post" && classes.postBody,
    contentType==="postHighlight" && classes.postHighlight,
    contentType==="comment" && classes.commentBody,
    contentType==="commentExceptPointerEvents" && classes.commentBodyExceptPointerEvents,
    contentType==="answer" && classes.answerBody,
    contentType==="tag" && classes.tagBody,
    contentType==="debateResponse" && classes.debateResponseBody,
    contentType==="llmChat" && classes.llmChat,
    contentType==="ultraFeed" && classes.ultraFeed,
    contentType==="ultraFeedPost" && classes.ultraFeedPost,
    contentType==="researchDocument" && classes.researchDocumentBody,
  );
}
