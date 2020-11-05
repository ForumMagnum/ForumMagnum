import { registerComponent } from '../../lib/vulcan-lib';
import { postGetLink, postGetLinkTarget } from '../../lib/collections/posts/helpers';
import React from 'react';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.contentNotice,
    ...theme.typography.postStyle
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
