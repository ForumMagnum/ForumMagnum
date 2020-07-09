import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useHover } from '../common/withHover';
import { Link } from '../../lib/reactRouterWrapper';
import { Posts } from '../../lib/collections/posts';
import classNames from 'classnames';

const styles = theme => ({
  root: {
    display: "flex",
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    color: theme.palette.grey[900],
  },
  post: {
    display: "flex",
    width: "100%",
    justifyContent: "space-between",
    marginTop: 2,
    marginBottom: 2,
  },
  title: {
    position: "relative",
    top: 2,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  wrap: {
    whiteSpace: "unset",
    lineHeight: "1.1em"
  },
  author: {
    marginRight: 0,
    marginLeft: 20
  }
});

const TagSmallPostLink = ({classes, post, hideAuthor, wrap}: {
  classes: ClassesType,
  post: PostsList,
  hideAuthor?: boolean,
  wrap?: boolean
}) => {
  const { LWPopper, PostsPreviewTooltip, UsersName, MetaInfo } = Components
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
      <div className={classes.post}>
        <Link to={Posts.getPageUrl(post)} className={classNames(classes.title, {[classes.wrap]:wrap})}>{post.title}</Link>
        {!hideAuthor && <MetaInfo className={classes.author}>
          <UsersName user={post.user} />
        </MetaInfo>}
      </div>
    </div>
  </span>
}

const TagSmallPostLinkComponent = registerComponent("TagSmallPostLink", TagSmallPostLink, {styles});

declare global {
  interface ComponentTypes {
    TagSmallPostLink: typeof TagSmallPostLinkComponent
  }
}

