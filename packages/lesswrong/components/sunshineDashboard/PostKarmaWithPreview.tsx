import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { useHover } from '../common/withHover';
import Posts from '../../lib/collections/posts/collection';
import { Link } from '../../lib/reactRouterWrapper';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginRight: 8,
  }
})


const PostKarmaWithPreview = ({ post, classes }: {
  post: PostsList,
  classes: ClassesType
}) => {
  const { hover, anchorEl, eventHandlers } = useHover();
  const { LWPopper, PostsPreviewTooltip } = Components

  if (!post) return null 

  return <span className={classes.root} {...eventHandlers}>
    <Link to={Posts.getPageUrl(post)}>{post.baseScore}</Link>
    <LWPopper
        open={hover}
        anchorEl={anchorEl}
        placement="bottom-start"
        modifiers={{
          flip: {
            behavior: ["bottom-start", "top-end", "bottom-start"],
            boundariesElement: 'viewport'
          }
        }}
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

