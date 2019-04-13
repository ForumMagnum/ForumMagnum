import { registerComponent, getSetting } from 'meteor/vulcan:core';
import React from 'react';
import Tooltip from '@material-ui/core/Tooltip';

const PostsItemKarma = ({post}) => {
  const baseScore = getSetting('forumType') === 'AlignmentForum' ? post.afBaseScore : post.baseScore
  const afBaseScore = getSetting('forumType') !== 'AlignmentForum' && post.af ? post.afBaseScore : null

  return (
    <Tooltip title={<div>
      <div>
        This post has { baseScore || 0 } karma ({ post.voteCount} votes)
      </div>
      {afBaseScore && <div><em>({afBaseScore} karma on AlignmentForum.org)</em></div>}
    </div>}>
      <span>{ baseScore || 0 }</span>
    </Tooltip>
  )
};

registerComponent('PostsItemKarma', PostsItemKarma);
