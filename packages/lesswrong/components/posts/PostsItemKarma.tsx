import { registerComponent, Components } from '../../lib/vulcan-lib';
import React from 'react';
import { forumTypeSetting } from '../../lib/instanceSettings';
import type { PopperPlacementType } from '@material-ui/core/Popper';

const PostsItemKarma = ({post, placement="left"}: {
  post: PostsBase,
  placement?: PopperPlacementType
}) => {
  const baseScore = forumTypeSetting.get() === 'AlignmentForum' ? post.afBaseScore : post.baseScore
  const afBaseScore = forumTypeSetting.get() !== 'AlignmentForum' && post.af ? post.afBaseScore : null

  return (
    <Components.KarmaDisplay
      baseScore={baseScore}
      voteCount={post.voteCount}
      afBaseScore={afBaseScore ?? undefined}
      placement={placement}
    />
  );
};

const PostsItemKarmaComponent = registerComponent('PostsItemKarma', PostsItemKarma);

declare global {
  interface ComponentTypes {
    PostsItemKarma: typeof PostsItemKarmaComponent,
  }
}
