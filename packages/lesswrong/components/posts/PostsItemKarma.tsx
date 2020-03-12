import { registerComponent, getSetting, Components } from '../../lib/vulcan-lib';
import React from 'react';
import withHover from '../common/withHover';

const PostsItemKarma = ({post, hover, anchorEl}: {
  post: PostsBase,
  read?: boolean,
  hover?: any,
  anchorEl?: any,
}) => {
  const baseScore = getSetting('forumType') === 'AlignmentForum' ? post.afBaseScore : post.baseScore
  const afBaseScore = getSetting('forumType') !== 'AlignmentForum' && post.af ? post.afBaseScore : null
  const { LWPopper } = Components
  return (
    <span>
      <LWPopper open={hover} anchorEl={anchorEl} tooltip placement="left">
        <div>
          <div>{ baseScore || 0 } karma</div>
          <div>({ post.voteCount} votes)</div>
          {afBaseScore && <div><em>({afBaseScore} karma on AlignmentForum.org)</em></div>}
        </div>
      </LWPopper>
      { baseScore || 0 }
    </span>
  )
};

const PostsItemKarmaComponent = registerComponent('PostsItemKarma', PostsItemKarma, {
  hocs: [withHover()]
});

declare global {
  interface ComponentTypes {
    PostsItemKarma: typeof PostsItemKarmaComponent,
  }
}
