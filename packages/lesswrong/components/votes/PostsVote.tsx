import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { getVotingSystemByName } from '../../lib/voting/getVotingSystem';

const PostsVoteInner = ({post, useHorizontalLayout, isFooter}: {
  post: PostsWithVotes,
  /** if true, display the vote arrows to the left & right of the score */
  useHorizontalLayout?: boolean,
  /** if true, this vote is in the footer underneath the post */
  isFooter?: boolean,
}) => {
  const votingSystemName = post.votingSystem || "default";
  const votingSystem = getVotingSystemByName(votingSystemName);
  const {PostsVoteDefault} = Components;
  const Component = votingSystem?.getPostBottomVotingComponent?.();
  return Component
    ? (
      <Component
        document={post}
        votingSystem={votingSystem}
        isFooter={isFooter}
      />
    )
    : (
      <PostsVoteDefault
        post={post}
        useHorizontalLayout={useHorizontalLayout}
        votingSystem={votingSystem}
        isFooter={isFooter}
      />
    );
}

export const PostsVote = registerComponent('PostsVote', PostsVoteInner);

declare global {
  interface ComponentTypes {
    PostsVote: typeof PostsVote
  }
}
