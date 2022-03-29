import React from 'react';
import { postBodyStyles, postHighlightStyles, commentBodyStyles, answerStyles, tagBodyStyles } from '../../themes/stylePiping'
import { registerComponent } from '../../lib/vulcan-lib';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  postBody: {
    ...postBodyStyles(theme)
  },
  postHighlight: {
    ...postHighlightStyles(theme)
  },
  commentBody: {
    ...commentBodyStyles(theme)
  },
  answerBody: {
    ...answerStyles(theme)
  },
  tagBody: {
    ...tagBodyStyles(theme)
  },
});

// Styling wrapper for user-provided content. This includes descendent
// selectors for all the various things that might show up in a
// post/comment/tag, like headings, editor plugins, spoiler blocks, etc.
//
// This component is replacing a previous way of managing those styles, which
// was for many components to all import the JSS for posts/comments/etc from
// `stylePiping.ts` and object-spread them into their own classes. This caused
// a lot of stylesheet bloat.
const ContentStyles = ({contentType="post", className, children, classes}: {
  contentType: "post"|"postHighlight"|"comment"|"answer"|"tag",
  className?: string,
  children: React.ReactNode,
  classes: ClassesType,
}) => {
  return <div className={classNames(
    className, {
      [classes.postBody]: contentType==="post",
      [classes.postHighlight]: contentType==="postHighlight",
      [classes.commentBody]: contentType==="comment",
      [classes.answerBody]: contentType==="answer",
      [classes.tagBody]: contentType==="tag",
    }
  )}>
    {children}
  </div>;
}

const ContentStylesComponent = registerComponent('ContentStyles', ContentStyles, {styles});

declare global {
  interface ComponentTypes {
    ContentStyles: typeof ContentStylesComponent
  }
}
