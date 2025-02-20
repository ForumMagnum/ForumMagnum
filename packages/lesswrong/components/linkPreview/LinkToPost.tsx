import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { linkStyle } from './PostLinkPreview';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import classNames from 'classnames';

const styles = (theme: ThemeType) => ({
  ...linkStyle(theme),
  linkColor: {
    color: theme.palette.primary.main,
  },
});

// A link to a post. Differs from the stuff in PostLinkPreview in that it's a
// provided post object, rather than integrating with user-provided markup.
const LinkToPost = ({post, classes}: {
  post: PostsList|null,
  classes: ClassesType<typeof styles>,
}) => {
  if (!post) {
    return <span>[Deleted]</span>
  }

  const {PostsTooltip} = Components;
  const visited = post?.isRead;
  return (
    <PostsTooltip post={post} placement="bottom-start" clickable>
      <Link className={classNames(classes.link, classes.linkColor, visited && "visited")} to={postGetPageUrl(post)}>
        {post.title}
      </Link>
    </PostsTooltip>
  );
}

const LinkToPostComponent = registerComponent("LinkToPost", LinkToPost, {styles});

declare global {
  interface ComponentTypes {
    LinkToPost: typeof LinkToPostComponent
  }
}
