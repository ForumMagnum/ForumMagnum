import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useHover } from '../common/withHover';
import { KARMA_WIDTH } from './PostsItem2';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    marginBottom: 2,
  },
  karma: {
    width: KARMA_WIDTH,
    marginRight: 8
  }
});

const PostFooterPostLink = ({classes, post}: {
  classes: ClassesType,
  post: PostsList,
}) => {
  const { LWPopper, PostsItem2MetaInfo, PostsItemKarma, PostsTitle, PostsPreviewTooltip } = Components
  const {eventHandlers, hover, anchorEl } = useHover();

  return <span {...eventHandlers}>
    <div className={classes.root}>
      <LWPopper 
        open={hover} 
        anchorEl={anchorEl} 
        placement="bottom-end"
      >
        <PostsPreviewTooltip post={post}/>
      </LWPopper>
      <PostsItem2MetaInfo className={classes.karma}>
        <PostsItemKarma post={post} />
      </PostsItem2MetaInfo>
      <PostsTitle post={post} read={!!post.lastVisitedAt} showIcons={false} wrap/>
    </div>
  </span>
}

const PostFooterPostLinkComponent = registerComponent("PostFooterPostLink", PostFooterPostLink, {styles});

declare global {
  interface ComponentTypes {
    PostFooterPostLink: typeof PostFooterPostLinkComponent
  }
}

