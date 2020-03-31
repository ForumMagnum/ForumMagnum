import { registerComponent } from '../../lib/vulcan-lib';
import { Posts } from '../../lib/collections/posts';
import React from 'react';

const styles = theme => ({
  root: {
    ...theme.typography.contentNotice,
    ...theme.typography.postStyle
  },
})

const LinkPostMessage = ({post, classes}: {
  post: PostsBase,
  classes: ClassesType
}) => {
  if (!post.url)
    return null;

  return (
    <div className={classes.root}>
      This is a linkpost for <a href={Posts.getLink(post)} target={Posts.getLinkTarget(post)}>{post.url}</a>
    </div>
  );
}

const LinkPostMessageComponent = registerComponent('LinkPostMessage', LinkPostMessage, {styles});

declare global {
  interface ComponentTypes {
    LinkPostMessage: typeof LinkPostMessageComponent
  }
}
