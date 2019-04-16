import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';

const styles = (theme) => ({
  root: {
    width: 42,
    justifyContent: "center",
    [theme.breakpoints.down('sm')]:{
      width: "unset",
      justifyContent: "flex-start",
      marginLeft: 2
    }
  },
})

const PostsItemKarma = ({classes, post}) => {
  const { PostsItemMetaInfo} = Components
  const baseScore = getSetting('forumType') === 'AlignmentForum' ? post.afBaseScore : post.baseScore
  const afBaseScore = getSetting('forumType') !== 'AlignmentForum' && post.af ? post.afBaseScore : null

  return (
    <PostsItemMetaInfo className={classes.root}>
      <Tooltip title={<div>
        <div>
          This post has { baseScore || 0 } karma ({ post.voteCount} votes)
        </div>
        {afBaseScore && <div><em>({afBaseScore} karma on AlignmentForum.org)</em></div>}
      </div>}>
        <span className={classes.karma}>
          { baseScore || 0 }
        </span>
      </Tooltip>
    </PostsItemMetaInfo>
  )
};

registerComponent('PostsItemKarma', PostsItemKarma, withStyles(styles, { name: 'PostsItemKarma'}));
