import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { linkStyles } from './linkStyles';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import classNames from 'classnames';
import PostsTooltip from "../posts/PostsPreviewTooltip/PostsTooltip";
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles("LinkToPost", (theme: ThemeType) => ({
  linkColor: {
    color: theme.palette.primary.main,
  },
}));

// A link to a post. Differs from the stuff in PostLinkPreview in that it's a
// provided post object, rather than integrating with user-provided markup.
const LinkToPost = ({post}: {
  post: PostsList|null,
}) => {
  const classes = useStyles(styles);
  const linkClasses = useStyles(linkStyles);

  if (!post) {
    return <span>[Deleted]</span>
  }
  const visited = post?.isRead;
  return (
    <PostsTooltip post={post} placement="bottom-start" clickable>
      <Link className={classNames(linkClasses.link, classes.linkColor, visited && "visited")} to={postGetPageUrl(post)}>
        {post.title}
      </Link>
    </PostsTooltip>
  );
}

export default registerComponent("LinkToPost", LinkToPost);


