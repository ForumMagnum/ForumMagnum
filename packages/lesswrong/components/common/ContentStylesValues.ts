import { defineStyles } from '../hooks/defineStyles';
import { postBodyStyles, smallPostStyles, commentBodyStyles } from '../../themes/stylePiping'
import classNames from 'classnames';

/**
 * Research-document editor styling. Inherits the full postBodyStyles surface
 * (so spoilers, footnotes, embeds, tables, code blocks, etc. all look right),
 * then narrows the editor's own typography under `[data-lexical-editor]`:
 * compact sans-serif sizing for paragraphs / headings / lists / blockquotes,
 * a fixed content column, and placeholder positioning that lines up with
 * where the user's first paragraph would actually sit.
 *
 * Keep editor-specific rules scoped to the editor root so they don't leak
 * onto floating menus, toolbars, or popovers that share the wrapper. Scope
 * on `[data-lexical-editor]`, which Lexical sets permanently on the editor
 * root and which keeps matching when Viewing mode makes the editor
 * non-editable. The query-input content node sets its own `contenteditable`
 * but not `data-lexical-editor`, so it stays excluded.
 */
const researchDocumentBodyStyles = (theme: ThemeType) => ({
  ...postBodyStyles(theme),
  '& [data-lexical-editor]': {
    minHeight: 'calc(100vh - var(--header-height, 56px))',
    fontSize: 14,
    lineHeight: 1.55,
    fontFamily: theme.palette.fonts.sansSerifStack,
    maxWidth: 960,
    padding: '20px 18px 40px',
  },
  '& [data-lexical-editor] p': {
    margin: '0 0 0.75em',
  },
  '& [data-lexical-editor] h1': {
    fontSize: 24,
    lineHeight: 1.25,
    margin: '1em 0 0.5em',
    fontWeight: 600,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  '& [data-lexical-editor] h2': {
    fontSize: 20,
    lineHeight: 1.3,
    margin: '1em 0 0.5em',
    fontWeight: 600,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  '& [data-lexical-editor] h3': {
    fontSize: 17,
    lineHeight: 1.35,
    margin: '1em 0 0.5em',
    fontWeight: 600,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  '& [data-lexical-editor] h4': {
    fontSize: 14,
    lineHeight: 1.4,
    margin: '1em 0 0.5em',
    fontWeight: 600,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  '& [data-lexical-editor] li': {
    fontSize: 14,
    lineHeight: 1.55,
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.text.primary,
  },
  '& [data-lexical-editor] blockquote': {
    fontSize: 14,
    lineHeight: 1.55,
    fontFamily: theme.palette.fonts.sansSerifStack,
    margin: '0.5em 0',
    padding: '0.25em 0.75em',
    borderLeft: `3px solid ${theme.palette.greyAlpha(0.15)}`,
    color: theme.palette.text.primary,
    fontStyle: 'normal',
  },
  // Placeholder is a sibling of the contenteditable, absolutely positioned
  // at the top-left of the editor shell, so it doesn't pick up the
  // contenteditable's padding via inheritance — match offsets explicitly so
  // the empty-state text lines up with where the first paragraph would.
  '& .LexicalContentEditable-placeholder': {
    top: 20,
    left: 18,
    fontSize: 14,
    lineHeight: 1.55,
    fontFamily: theme.palette.fonts.sansSerifStack,
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
