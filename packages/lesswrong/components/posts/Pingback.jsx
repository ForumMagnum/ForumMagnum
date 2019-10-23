import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import withHover from '../common/withHover';
import { withStyles } from '@material-ui/core/styles';
import { KARMA_WIDTH } from './PostsItem2';

const styles = theme => ({
  root: {
    display: "flex",
    marginBottom: 2,
  },
  karma: {
    width: KARMA_WIDTH
  }
});

const Pingback = ({classes, post, hover, anchorEl, stopHover}) => {
  const { LWPopper, PostsItem2MetaInfo, PostsItemKarma, PostsTitle, PostsPreviewTooltip } = Components

  return <div className={classes.root}>
      <LWPopper 
        open={hover} 
        anchorEl={anchorEl} 
        placement="bottom-end"
        modifiers={{
          flip: {
            behavior: ["bottom-end", "top", "bottom-end"],
            boundariesElement: 'viewport'
          } 
        }}
      >
        <PostsPreviewTooltip post={post} showAllInfo truncateLimit={900}/>
      </LWPopper>
      <PostsItem2MetaInfo className={classes.karma}>
        <PostsItemKarma post={post} />
      </PostsItem2MetaInfo>
      <PostsTitle post={post} read={post.lastVisitedAt} showIcons={false}/>
  </div>
}

registerComponent("Pingback", Pingback, withStyles(styles, {name: "Pingback"}), withHover);
