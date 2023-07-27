import { registerComponent } from '../../lib/vulcan-lib';
import { postGetLink, postGetLinkTarget } from '../../lib/collections/posts/helpers';
import React from 'react';
import classNames from 'classnames';
import { isEAForum } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  root: isEAForum ? {
    fontFamily: theme.palette.fonts.sansSerifStack,
    wordBreak: 'break-word',
    width: '100%',
    padding: 16,
    margin: "-14px 0 18px 0",
    backgroundColor: theme.palette.grey[100],
    color: theme.palette.grey[1000],
    boxSizing: 'border-box',
    borderRadius: theme.borderRadius.default,
    fontSize: 14,
    lineHeight: "21px",
  } : {
    ...theme.typography.contentNotice,
    ...theme.typography.postStyle,
  },
  noMargin: {
    marginBottom: 0
  }
})

const LinkPostMessage = ({post, classes, noMargin}: {
  post: PostsBase,
  classes: ClassesType,
  noMargin?: boolean
}) => {
  if (!post.url)
    return null;

  return (
    <div className={classNames(classes.root, {[classes.noMargin]:noMargin})}>
      This is a linkpost for <a href={postGetLink(post)} target={postGetLinkTarget(post)}>{post.url}</a>
    </div>
  );
}

const LinkPostMessageComponent = registerComponent('LinkPostMessage', LinkPostMessage, {styles});

declare global {
  interface ComponentTypes {
    LinkPostMessage: typeof LinkPostMessageComponent
  }
}
