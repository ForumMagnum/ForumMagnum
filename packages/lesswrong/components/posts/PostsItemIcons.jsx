import React from 'react';
import { registerComponent, Components, getSetting } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles'

const styles = theme => ({
  postIcon: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
  }
});

const PostsItemIcons = ({post, classes}) => {
  const { PostsItemCuratedIcon, PostsItemAlignmentIcon, PostsItemPersonalIcon } = Components;
  
  return <React.Fragment>
    {post.curatedDate && <span className={classes.postIcon}><PostsItemCuratedIcon /></span>}
    {!post.frontpageDate && <span className={classes.postIcon}><PostsItemPersonalIcon /></span>}
    
    {getSetting('forumType') !== 'AlignmentForum' && post.af &&
      <span className={classes.postIcon}>
        <PostsItemAlignmentIcon />
      </span>
    }
  </React.Fragment>
}

registerComponent('PostsItemIcons', PostsItemIcons, withStyles(styles, { name: "PostsItemIcons" }));