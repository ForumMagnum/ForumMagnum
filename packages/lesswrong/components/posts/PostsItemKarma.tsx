import { registerComponent, getSetting, Components } from '../../lib/vulcan-lib';
import Posts from '../../lib/collections/posts/collection';
import React from 'react';
import withHover from '../common/withHover';

const PostsItemKarma = ({post, hover, anchorEl}: {
  post: any,
  read?: boolean,
  hover?: any,
  anchorEl?: any,
}) => {
  const afBaseScore = getSetting('forumType') !== 'AlignmentForum' && post.af ? post.afBaseScore : null
  const { LWTooltip } = Components

  return (
    <LWTooltip placement="top-start" title={
      <div>
        <div>
          This post has { Posts.getKarma(post) } karma ({ Posts.getVoteCountStr(post) })
        </div>
        {afBaseScore && <div><em>({afBaseScore} karma on AlignmentForum.org)</em></div>}
      </div>
    }>
      { Posts.getKarma(post) }
    </LWTooltip>
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
