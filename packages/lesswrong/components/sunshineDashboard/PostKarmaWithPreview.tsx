import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { useHover } from '../common/withHover';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { Link } from '../../lib/reactRouterWrapper';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginRight: 8,
    whiteSpace: "nowrap"
  },
  draft: {
    color: theme.palette.grey[400]
  },
  default: {
    color: theme.palette.grey[900],
  }
})


const PostKarmaWithPreview = ({ post, classes }: {
  post: SunshinePostsList,
  classes: ClassesType
}) => {
  const { hover, anchorEl, eventHandlers } = useHover();
  const { LWPopper, PostsPreviewTooltip } = Components

  if (!post) return null 

  return <span className={classes.root} {...eventHandlers}>
    <Link className={post.draft ? classes.draft : classes.default} to={postGetPageUrl(post)}>{post.baseScore}</Link>
    <LWPopper
        open={hover}
        anchorEl={anchorEl}
        placement="bottom-start"
      >
      <div>
        <PostsPreviewTooltip post={post}/>
      </div>
    </LWPopper>
  </span>
}

const PostKarmaWithPreviewComponent = registerComponent('PostKarmaWithPreview', PostKarmaWithPreview, {styles});

declare global {
  interface ComponentTypes {
    PostKarmaWithPreview: typeof PostKarmaWithPreviewComponent
  }
}

