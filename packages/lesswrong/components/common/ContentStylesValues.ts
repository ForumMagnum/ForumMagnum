import { defineStyles } from '../hooks/defineStyles';
import { isFriendlyUI } from '../../themes/forumTheme';
import { postBodyStyles, smallPostStyles, commentBodyStyles } from '../../themes/stylePiping'
import classNames from 'classnames';
import { JssStyles } from '@/lib/jssStyles';

export const styles = defineStyles("ContentStyles", (theme: ThemeType) => ({
  base: {
    ...postBodyStyles(theme)
  },
  postBody: {
  },
  postHighlight: {
    ...smallPostStyles(theme),
    '& h1, & h2, & h3': {
      fontSize: isFriendlyUI ? "1.1rem" : "1.6rem",
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
    '& p:first-child > br:first-child': {
      display: 'none !important',
    },
    '& p:last-child > br:last-child': {
      display: 'none !important',
    },
    [theme.breakpoints.down('sm')]: {
      fontSize: 17,
      '& h1, & h2, & h3, & h4': {
        fontSize: 20.5,
        marginBlockStart: "0 !important",
        fontFamily: theme.palette.fonts.sansSerifStack,
      },
      '& img, & iframe': {
        maxWidth: '100%',
        height: 'auto',
      },
      '& blockquote, & li': {
        fontSize: 17
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
    '& p:first-child > br:first-child': {
      display: 'none !important',
    },
    '& p:last-child > br:last-child': {
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
  }
}), { stylePriority: -1 });

export type ContentStyleType = "post"|"postHighlight"|"comment"|"commentExceptPointerEvents"|"answer"|"tag"|"debateResponse"|"llmChat"|"ultraFeed"|"ultraFeedPost";

export function contentStylesClassnames(classes: ReturnType<typeof styles.styles>, contentType: ContentStyleType) {
  return classNames(
    classes.base, "content",
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
  );
}
