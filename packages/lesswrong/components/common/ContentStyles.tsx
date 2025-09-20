import React, { CSSProperties } from 'react';
import classNames from 'classnames';
import { useStyles } from '../hooks/useStyles';
import { contentStylesClassnames, type ContentStyleType, styles } from './ContentStylesValues';

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
const ContentStyles = ({contentType, className, style, children}: {
  contentType: ContentStyleType,
  className?: string,
  style?: CSSProperties,
  children: React.ReactNode,
}) => {
  const classes = useStyles(styles);

  return <div style={style} className={classNames(
    className,
    contentStylesClassnames(classes, contentType),
  )}>
    {children}
  </div>;
}

export default ContentStyles;
