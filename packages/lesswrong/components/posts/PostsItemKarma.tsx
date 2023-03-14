import { registerComponent, Components } from '../../lib/vulcan-lib';
import React from 'react';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { PopperPlacementType } from '@material-ui/core/Popper'

const PostsItemKarma = ({post, placement="left"}: {
  post: PostsBase,
  placement?: PopperPlacementType
}) => {
  const baseScore = forumTypeSetting.get() === 'AlignmentForum' ? post.afBaseScore : post.baseScore
  const debugScore = post.debugScore
  const afBaseScore = forumTypeSetting.get() !== 'AlignmentForum' && post.af ? post.afBaseScore : null
  const { LWTooltip } = Components

  return (
    <LWTooltip
      placement={placement}
      title={<div>
        <div>{ debugScore || 0 } debug karma</div>
        <div>{ baseScore || 0 } karma</div>
        <div>({ post.voteCount} votes)</div>
        {afBaseScore && <div><em>({afBaseScore} karma on AlignmentForum.org)</em></div>}
      </div>}
    >
      { debugScore || 0 }
    </LWTooltip>
  );
};

const PostsItemKarmaComponent = registerComponent('PostsItemKarma', PostsItemKarma);

declare global {
  interface ComponentTypes {
    PostsItemKarma: typeof PostsItemKarmaComponent,
  }
}
