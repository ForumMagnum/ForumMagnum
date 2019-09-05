import { registerComponent, getSetting, Components } from 'meteor/vulcan:core';
import React from 'react';
import withHover from '../common/withHover';

const PostsItemKarma = ({post, hover, anchorEl}) => {
  const baseScore = getSetting('forumType') === 'AlignmentForum' ? post.afBaseScore : post.baseScore
  const afBaseScore = getSetting('forumType') !== 'AlignmentForum' && post.af ? post.afBaseScore : null
  const { LWPopper } = Components
  return (
    <span>
      <LWPopper open={hover} anchorEl={anchorEl} tooltip placement="top-start">
        <div>
          <div>
            This post has { baseScore || 0 } karma ({ post.voteCount} votes)
          </div>
          {afBaseScore && <div><em>({afBaseScore} karma on AlignmentForum.org)</em></div>}
        </div>
      </LWPopper>
      { baseScore || 0 }
    </span>
  )
};

registerComponent('PostsItemKarma', PostsItemKarma, withHover);
