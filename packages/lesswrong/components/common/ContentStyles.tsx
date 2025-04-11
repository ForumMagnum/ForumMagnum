import React, { CSSProperties } from 'react';
import { postBodyStyles, smallPostStyles, commentBodyStyles } from '../../themes/stylePiping'
import { registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType) => ({
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
    fontSize: '1.3rem',
    '& h1, & h2, & h3, & h4': {
      fontSize: "1.6rem",
      marginBlockStart: "0 !important",
      fontFamily: theme.palette.fonts.sansSerifStack,
    },
    '& img, & iframe': {
      maxWidth: '100%',
      height: 'auto',
    },
    '& blockquote, & li': {
      fontSize: '1.3rem'
    }
  }
});

export type ContentStyleType = "post"|"postHighlight"|"comment"|"commentExceptPointerEvents"|"answer"|"tag"|"debateResponse"|"llmChat"|"ultraFeed";

// Styling wrapper for user-provided content. This includes descendent
// selectors for all the various things that might show up in a
// post/comment/tag, like headings, editor plugins, spoiler blocks, etc.
//
// This component is replacing a previous way of managing those styles, which
// was for many components to all import the JSS for posts/comments/etc from
// `stylePiping.ts` and object-spread them into their own classes. This caused
// a lot of stylesheet bloat.
//
// This component (or rather, its predecessor) has sometimes been used for
// things that have nothing to do with the content type, other than wanting
// to copy the font used by posts/comments. This should be harmless. Sometimes
// the content type is wrong, generally in a way where the main font matches
// but there are some subtle differences, eg answer vs post or post vs tag.
// In these cases it's worth fixing.
//
// The commentBodyExceptPointerEvents type comes from the fact that there's a
// crazy hack in the comment styles which sets pointer-events to 'none',
// then puts it back with an "& *" selector, which breaks all kinds of stuff,
// so some things want to inherit all of the comment styles *except* for that.
// (This hack exists to support spoiler blocks and we should probably clean it
// up.)
const ContentStyles = ({contentType, className, style, children, classes}: {
  contentType: ContentStyleType,
  className?: string,
  style?: CSSProperties,
  children: React.ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
  return <div style={style} className={classNames(
    className, classes.base, "content",
    contentType==="post" && classes.postBody,
    contentType==="postHighlight" && classes.postHighlight,
    contentType==="comment" && classes.commentBody,
    contentType==="commentExceptPointerEvents" && classes.commentBodyExceptPointerEvents,
    contentType==="answer" && classes.answerBody,
    contentType==="tag" && classes.tagBody,
    contentType==="debateResponse" && classes.debateResponseBody,
    contentType==="llmChat" && classes.llmChat,
    contentType==="ultraFeed" && classes.ultraFeed,
  )}>
    {children}
  </div>;
}

const ContentStylesComponent = registerComponent('ContentStyles', ContentStyles, {
  styles,
  stylePriority: -1,
});

declare global {
  interface ComponentTypes {
    ContentStyles: typeof ContentStylesComponent
  }
}
