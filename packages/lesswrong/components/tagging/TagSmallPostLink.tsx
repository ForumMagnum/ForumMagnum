import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useHover } from '../common/withHover';
import { Link } from '../../lib/reactRouterWrapper';
import { Posts } from '../../lib/collections/posts';

const styles = theme => ({
  root: {
    display: "flex",
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    color: theme.palette.grey[700], 
    lineHeight: "1.1em",
    marginTop: 8,
    marginBottom: 8
  },
});

const TagSmallPostLink = ({classes, post}: {
  classes: ClassesType,
  post: PostsList,
}) => {
  const { LWPopper, PostsPreviewTooltip } = Components
  const { eventHandlers, hover, anchorEl } = useHover();

  return <span {...eventHandlers}>
    <div className={classes.root}>
      <LWPopper 
        open={hover} 
        anchorEl={anchorEl} 
        placement="left-start"
        modifiers={{
          flip: {
            behavior: ["bottom-end", "top", "bottom-end"],
            boundariesElement: 'viewport'
          } 
        }}
      >
        <PostsPreviewTooltip post={post}/>
      </LWPopper>
      <Link to={Posts.getPageUrl(post)}>{post.title}</Link>
    </div>
  </span>
}

const TagSmallPostLinkComponent = registerComponent("TagSmallPostLink", TagSmallPostLink, {styles});

declare global {
  interface ComponentTypes {
    TagSmallPostLink: typeof TagSmallPostLinkComponent
  }
}

